import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import { HttpError } from "../utils/httpError";
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from "../schemas/auth.schema";
import { generateResetToken, hashResetToken } from "../utils/tokens";

const SALT_ROUNDS = 10;

export async function register(req: Request, res: Response): Promise<void> {
  const body = registerSchema.parse(req.body);

  const existing = await prisma.user.findUnique({
    where: { correo: body.correo },
  });
  if (existing) {
    throw new HttpError(409, "CONFLICT", "El correo ya está registrado");
  }

  const hashed = await bcrypt.hash(body.contraseña, SALT_ROUNDS);

  // Registration always creates a STUDENT; any client-supplied role is ignored
  // (and stripped by the zod schema).
  const user = await prisma.user.create({
    data: {
      nombre: body.nombre,
      apellidos: body.apellidos,
      profesion: body.profesion ?? null,
      edad: body.edad ?? null,
      correo: body.correo,
      contraseña: hashed,
      role: "STUDENT",
    },
  });

  res.status(201).json({
    user: {
      id: user.id,
      nombre: user.nombre,
      apellidos: user.apellidos,
      profesion: user.profesion,
      edad: user.edad,
      correo: user.correo,
      role: user.role,
      createdAt: user.createdAt,
    },
  });
}

export async function login(req: Request, res: Response): Promise<void> {
  const body = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { correo: body.correo } });
  if (!user) {
    throw new HttpError(401, "UNAUTHORIZED", "Correo o contraseña incorrectos");
  }

  const valid = await bcrypt.compare(body.contraseña, user.contraseña);
  if (!valid) {
    throw new HttpError(401, "UNAUTHORIZED", "Correo o contraseña incorrectos");
  }

  // Payload carries subject id, current role, and token version so a password
  // reset (which bumps tokenVersion) invalidates prior sessions.
  const token = jwt.sign(
    { sub: user.id, role: user.role, ver: user.tokenVersion },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn as SignOptions["expiresIn"] },
  );

  res.json({
    token,
    user: {
      id: user.id,
      nombre: user.nombre,
      correo: user.correo,
      role: user.role,
    },
  });
}

export function logout(_req: Request, res: Response): void {
  res.status(204).end();
}

export async function me(req: Request, res: Response): Promise<void> {
  const userId = req.userId;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new HttpError(404, "NOT_FOUND", "Usuario no encontrado");
  }

  res.json({
    user: {
      id: user.id,
      nombre: user.nombre,
      apellidos: user.apellidos,
      profesion: user.profesion,
      edad: user.edad,
      correo: user.correo,
      role: user.role,
    },
  });
}

export async function forgotPassword(
  req: Request,
  res: Response,
): Promise<void> {
  const body = forgotPasswordSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { correo: body.correo } });

  if (user) {
    const raw = generateResetToken();
    const tokenHash = hashResetToken(raw);
    const expiresAt = new Date(
      Date.now() + env.resetTokenTtlMinutes * 60 * 1000,
    );

    await prisma.passwordResetToken.create({
      data: { userId: user.id, tokenHash, expiresAt, consumed: false },
    });

    deliverResetToken(user.correo, raw);
  }

  // Enumeration-safe: identical response whether or not the email exists.
  res.json({ message: "Si el correo existe, recibirás instrucciones" });
}

export async function resetPassword(
  req: Request,
  res: Response,
): Promise<void> {
  const body = resetPasswordSchema.parse(req.body);

  const tokenHash = hashResetToken(body.token);

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
  });

  if (!resetToken || resetToken.consumed || resetToken.expiresAt <= new Date()) {
    throw new HttpError(400, "VALIDATION_ERROR", "Token inválido o expirado");
  }

  const hashed = await bcrypt.hash(body.contraseña, SALT_ROUNDS);

  await prisma.$transaction([
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { consumed: true },
    }),
    prisma.user.update({
      where: { id: resetToken.userId },
      data: {
        contraseña: hashed,
        tokenVersion: { increment: 1 },
      },
    }),
  ]);

  res.json({ message: "Contraseña actualizada" });
}

// Delivers the raw reset token via the configured channel.
function deliverResetToken(correo: string, raw: string): void {
  if (env.emailMode === "smtp") {
    // Production path: SMTP transport is a deferred open question (see design).
    console.warn(
      `[forgot-password] SMTP delivery not wired; token for ${correo} not sent`,
    );
    return;
  }
  // Development path: surface the token in the server log.
  console.log(`[forgot-password] reset token for ${correo}: ${raw}`);
}

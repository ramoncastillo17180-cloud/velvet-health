import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { env } from "../config/env";
import { HttpError } from "../utils/httpError";
import { registerSchema, loginSchema } from "../schemas/auth.schema";

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

  const user = await prisma.user.create({
    data: {
      nombre: body.nombre,
      apellidos: body.apellidos,
      profesion: body.profesion ?? null,
      edad: body.edad ?? null,
      correo: body.correo,
      contraseña: hashed,
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

  const token = jwt.sign({ sub: user.id }, env.jwtSecret, { expiresIn: "7d" });

  res.json({
    token,
    user: { id: user.id, nombre: user.nombre, correo: user.correo },
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
    user: { id: user.id, nombre: user.nombre, correo: user.correo },
  });
}

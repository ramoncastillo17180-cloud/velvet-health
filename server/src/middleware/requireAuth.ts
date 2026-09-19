import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import type { JwtPayload } from "jsonwebtoken";
import { env } from "../config/env";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/httpError";

// Verifies a bearer token and returns its decoded payload, or null when the
// token is malformed, tampered, or expired.
function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, env.jwtSecret);
    if (typeof decoded === "string") {
      return null;
    }
    return decoded;
  } catch {
    return null;
  }
}

// Middleware that verifies the bearer token, confirms the session is still
// valid against the stored token version, and attaches the authenticated user
// id plus their current role (refreshed from the DB so a role change takes
// effect without a re-login).
export async function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    next(new HttpError(401, "UNAUTHORIZED", "Token de autenticación faltante"));
    return;
  }

  const token = header.slice("Bearer ".length);

  const decoded = verifyToken(token);
  if (!decoded) {
    next(new HttpError(401, "UNAUTHORIZED", "Token inválido o expirado"));
    return;
  }

  const userId = Number(decoded.sub);
  const tokenVersion = Number(decoded.ver);
  if (!Number.isInteger(userId) || !Number.isInteger(tokenVersion)) {
    next(new HttpError(401, "UNAUTHORIZED", "Token inválido o expirado"));
    return;
  }

  // One PK-indexed read; also refreshes the current role from the DB.
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, role: true, tokenVersion: true },
  });

  if (!user) {
    next(new HttpError(401, "UNAUTHORIZED", "Usuario no encontrado"));
    return;
  }

  if (tokenVersion !== user.tokenVersion) {
    next(new HttpError(401, "UNAUTHORIZED", "Sesión inválida"));
    return;
  }

  req.userId = user.id;
  req.userRole = user.role;
  next();
}

// Returns the authenticated user id, throwing 401 if the middleware did not run.
export function authenticatedUserId(req: Request): number {
  const id = req.userId;
  if (!id) {
    throw new HttpError(401, "UNAUTHORIZED", "Token de autenticación faltante");
  }
  return id;
}

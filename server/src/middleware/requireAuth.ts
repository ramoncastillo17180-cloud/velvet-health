import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { HttpError } from "../utils/httpError";

// Middleware that verifies the bearer token and attaches the user id to the request.
export function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    next(new HttpError(401, "UNAUTHORIZED", "Token de autenticación faltante"));
    return;
  }

  const token = header.slice("Bearer ".length);

  try {
    const decoded = jwt.verify(token, env.jwtSecret);

    if (typeof decoded === "string") {
      throw new Error("Unexpected string token payload");
    }

    const userId = Number(decoded.sub);
    if (!Number.isInteger(userId)) {
      throw new Error("Missing or invalid subject claim");
    }

    req.userId = userId;
    next();
  } catch {
    next(new HttpError(401, "UNAUTHORIZED", "Token inválido o expirado"));
  }
}

// Returns the authenticated user id, throwing 401 if the middleware did not run.
export function authenticatedUserId(req: Request): number {
  const id = req.userId;
  if (!id) {
    throw new HttpError(401, "UNAUTHORIZED", "Token de autenticación faltante");
  }
  return id;
}

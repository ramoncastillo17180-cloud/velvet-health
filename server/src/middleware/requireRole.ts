import { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";
import { HttpError } from "../utils/httpError";

// Middleware factory: allows the request through only when the authenticated
// user's role is in the allow-list. Must run after `requireAuth`.
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (req.userId === undefined || req.userRole === undefined) {
      next(
        new HttpError(401, "UNAUTHORIZED", "Token de autenticación faltante"),
      );
      return;
    }

    if (!roles.includes(req.userRole)) {
      next(
        new HttpError(403, "FORBIDDEN", "No tienes permisos para esta acción"),
      );
      return;
    }

    next();
  };
}

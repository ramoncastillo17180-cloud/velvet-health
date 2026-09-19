import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { HttpError } from "../utils/httpError";

// 404 fallback for unknown routes.
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    error: { code: "NOT_FOUND", message: "Recurso no encontrado" },
  });
}

// Central error handler. Every error is normalized to { error: { code, message } }.
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    const message = err.issues.map((issue) => issue.message).join("; ");
    res.status(400).json({ error: { code: "VALIDATION_ERROR", message } });
    return;
  }

  if (err instanceof HttpError) {
    res
      .status(err.status)
      .json({ error: { code: err.code, message: err.message } });
    return;
  }

  // Prisma unique-constraint violation (e.g. duplicate email on register).
  if (isPrismaUniqueError(err)) {
    res
      .status(409)
      .json({ error: { code: "CONFLICT", message: "El recurso ya existe" } });
    return;
  }

  console.error(err);
  res.status(500).json({
    error: { code: "INTERNAL_ERROR", message: "Error interno del servidor" },
  });
}

function isPrismaUniqueError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as { code?: string }).code === "P2002"
  );
}

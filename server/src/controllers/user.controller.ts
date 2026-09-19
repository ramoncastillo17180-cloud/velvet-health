import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

// Admin-only user list (replaces the removed `GET /api/users`). The router
// enforces `requireRole(ADMIN)`, so the full list — including `role` and
// `createdAt` — is visible only to admins.
export async function listUsers(_req: Request, res: Response): Promise<void> {
  const users = await prisma.user.findMany({
    orderBy: { id: "asc" },
    select: {
      id: true,
      nombre: true,
      apellidos: true,
      profesion: true,
      edad: true,
      correo: true,
      role: true,
      createdAt: true,
    },
  });

  res.json({ users });
}

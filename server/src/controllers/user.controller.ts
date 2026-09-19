import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

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
    },
  });

  res.json({ users });
}

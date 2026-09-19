import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/httpError";
import { courseInstructions } from "../data/courseInstructions";

export async function listCourses(_req: Request, res: Response): Promise<void> {
  const courses = await prisma.course.findMany({
    orderBy: { id: "asc" },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      minutes: true,
      image: true,
      passThreshold: true,
    },
  });

  res.json({ courses });
}

export async function getCourse(req: Request, res: Response): Promise<void> {
  // Express 5 types route params as `string | string[]`; a single `/:slug` segment is always a string.
  const slug = req.params.slug as string;

  const course = await prisma.course.findUnique({ where: { slug } });
  if (!course) {
    throw new HttpError(404, "NOT_FOUND", "Curso no encontrado");
  }

  res.json({
    course: {
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      minutes: course.minutes,
      image: course.image,
      passThreshold: course.passThreshold,
      instructions: courseInstructions[slug] ?? [],
    },
  });
}

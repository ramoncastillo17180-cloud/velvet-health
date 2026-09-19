import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/httpError";

// Select shape for a published course's structured content.
const modulesWithLessons = {
  modules: {
    orderBy: { order: "asc" as const },
    include: { lessons: { orderBy: { order: "asc" as const } } },
  },
};

export async function listCourses(_req: Request, res: Response): Promise<void> {
  const courses = await prisma.course.findMany({
    where: { status: "PUBLISHED" },
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

  const course = await prisma.course.findFirst({
    where: { slug, status: "PUBLISHED" },
    include: modulesWithLessons,
  });
  if (!course) {
    throw new HttpError(404, "NOT_FOUND", "Curso no encontrado");
  }

  // Flatten lesson content into the legacy `instructions` array for v1 backward
  // compatibility (derived from lesson content, ordered module → lesson).
  const instructions = course.modules
    .flatMap((module) =>
      module.lessons.map((lesson) => ({
        moduleOrder: module.order,
        lessonOrder: lesson.order,
        content: lesson.content,
      })),
    )
    .sort(
      (a, b) =>
        a.moduleOrder - b.moduleOrder || a.lessonOrder - b.lessonOrder,
    )
    .map((entry) => entry.content);

  res.json({
    course: {
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      minutes: course.minutes,
      image: course.image,
      passThreshold: course.passThreshold,
      instructions,
      modules: course.modules.map((module) => ({
        id: module.id,
        title: module.title,
        description: module.description,
        order: module.order,
        lessons: module.lessons.map((lesson) => ({
          id: lesson.id,
          title: lesson.title,
          content: lesson.content,
          order: lesson.order,
          durationMinutes: lesson.durationMinutes,
        })),
      })),
    },
  });
}

export async function getLessons(
  req: Request,
  res: Response,
): Promise<void> {
  const slug = req.params.slug as string;

  const course = await prisma.course.findFirst({
    where: { slug, status: "PUBLISHED" },
    select: modulesWithLessons,
  });
  if (!course) {
    throw new HttpError(404, "NOT_FOUND", "Curso no encontrado");
  }

  res.json({
    modules: course.modules.map((module) => ({
      id: module.id,
      title: module.title,
      description: module.description,
      order: module.order,
      lessons: module.lessons.map((lesson) => ({
        id: lesson.id,
        title: lesson.title,
        content: lesson.content,
        order: lesson.order,
        durationMinutes: lesson.durationMinutes,
      })),
    })),
  });
}

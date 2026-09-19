import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/httpError";
import { authenticatedUserId } from "../middleware/requireAuth";
import { getDocumentStorage } from "../lib/storage";
import { generateUniqueSlug } from "../utils/slug";
import {
  courseCreateSchema,
  courseUpdateSchema,
  moduleSchema,
  moduleUpdateSchema,
  lessonSchema,
  lessonUpdateSchema,
  questionSchema,
} from "../schemas/course.schema";
import { instructorApplicationSchema } from "../schemas/instructor.schema";

// Resolves an owned course: 404 when missing, 403 when the caller is not the
// owner. Ownership is enforced server-side on every mutation.
async function requireOwnedCourse(courseId: number, userId: number) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) {
    throw new HttpError(404, "NOT_FOUND", "Curso no encontrado");
  }
  if (course.createdById !== userId) {
    throw new HttpError(
      403,
      "FORBIDDEN",
      "No eres el propietario de este curso",
    );
  }
  return course;
}

async function requireOwnedModule(
  courseId: number,
  moduleId: number,
  userId: number,
) {
  await requireOwnedCourse(courseId, userId);
  const module = await prisma.module.findFirst({
    where: { id: moduleId, courseId },
  });
  if (!module) {
    throw new HttpError(404, "NOT_FOUND", "Módulo no encontrado");
  }
  return module;
}

async function requireOwnedLesson(
  courseId: number,
  moduleId: number,
  lessonId: number,
  userId: number,
) {
  await requireOwnedModule(courseId, moduleId, userId);
  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, moduleId },
  });
  if (!lesson) {
    throw new HttpError(404, "NOT_FOUND", "Lección no encontrada");
  }
  return lesson;
}

// ---- Course CRUD (own courses) ----

export async function listInstructorCourses(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = authenticatedUserId(req);

  const courses = await prisma.course.findMany({
    where: { createdById: userId },
    orderBy: { id: "desc" },
    select: {
      id: true,
      slug: true,
      title: true,
      description: true,
      minutes: true,
      image: true,
      passThreshold: true,
      status: true,
    },
  });

  res.json({ courses });
}

export async function createCourse(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = authenticatedUserId(req);
  const body = courseCreateSchema.parse(req.body);

  // Slug is server-generated (slugified + de-duplicated) from the client hint
  // or the title; the client never controls the final stored value.
  const base = body.slug?.trim() ? body.slug : body.title;
  const slug = await generateUniqueSlug(base);

  const course = await prisma.course.create({
    data: {
      slug,
      title: body.title,
      description: body.description,
      minutes: body.minutes,
      image: body.image,
      passThreshold: body.passThreshold ?? 70,
      status: "DRAFT",
      createdById: userId,
    },
  });

  res.status(201).json({
    course: {
      id: course.id,
      slug: course.slug,
      title: course.title,
      description: course.description,
      minutes: course.minutes,
      image: course.image,
      passThreshold: course.passThreshold,
      status: course.status,
      createdById: course.createdById,
    },
  });
}

export async function getInstructorCourse(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = authenticatedUserId(req);
  const id = Number(req.params.id);

  await requireOwnedCourse(id, userId);

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      modules: {
        orderBy: { order: "asc" },
        include: { lessons: { orderBy: { order: "asc" } } },
      },
      questions: {
        orderBy: { order: "asc" },
        include: { options: { orderBy: { id: "asc" } } },
      },
    },
  });

  res.json({ course });
}

export async function updateCourse(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = authenticatedUserId(req);
  const id = Number(req.params.id);

  await requireOwnedCourse(id, userId);

  const body = courseUpdateSchema.parse(req.body);

  const course = await prisma.course.update({
    where: { id },
    data: {
      ...(body.title !== undefined ? { title: body.title } : {}),
      ...(body.description !== undefined ? { description: body.description } : {}),
      ...(body.minutes !== undefined ? { minutes: body.minutes } : {}),
      ...(body.image !== undefined ? { image: body.image } : {}),
      ...(body.passThreshold !== undefined
        ? { passThreshold: body.passThreshold }
        : {}),
    },
  });

  res.json({ course });
}

export async function deleteCourse(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = authenticatedUserId(req);
  const id = Number(req.params.id);

  await requireOwnedCourse(id, userId);

  await prisma.course.delete({ where: { id } });

  res.status(204).end();
}

// ---- Module CRUD ----

export async function createModule(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = authenticatedUserId(req);
  const courseId = Number(req.params.id);

  await requireOwnedCourse(courseId, userId);

  const body = moduleSchema.parse(req.body);

  const module = await prisma.module.create({
    data: {
      courseId,
      title: body.title,
      description: body.description ?? "",
      order: body.order,
    },
  });

  res.status(201).json({ module });
}

export async function updateModule(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = authenticatedUserId(req);
  const courseId = Number(req.params.id);
  const moduleId = Number(req.params.moduleId);

  await requireOwnedModule(courseId, moduleId, userId);

  const body = moduleUpdateSchema.parse(req.body);

  const module = await prisma.module.update({
    where: { id: moduleId },
    data: { ...body },
  });

  res.json({ module });
}

export async function deleteModule(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = authenticatedUserId(req);
  const courseId = Number(req.params.id);
  const moduleId = Number(req.params.moduleId);

  await requireOwnedModule(courseId, moduleId, userId);

  await prisma.module.delete({ where: { id: moduleId } });

  res.status(204).end();
}

// ---- Lesson CRUD ----

export async function createLesson(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = authenticatedUserId(req);
  const courseId = Number(req.params.id);
  const moduleId = Number(req.params.moduleId);

  await requireOwnedModule(courseId, moduleId, userId);

  const body = lessonSchema.parse(req.body);

  const lesson = await prisma.lesson.create({
    data: {
      moduleId,
      title: body.title,
      content: body.content,
      order: body.order,
      durationMinutes: body.durationMinutes ?? null,
    },
  });

  res.status(201).json({ lesson });
}

export async function updateLesson(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = authenticatedUserId(req);
  const courseId = Number(req.params.id);
  const moduleId = Number(req.params.moduleId);
  const lessonId = Number(req.params.lessonId);

  await requireOwnedLesson(courseId, moduleId, lessonId, userId);

  const body = lessonUpdateSchema.parse(req.body);

  const lesson = await prisma.lesson.update({
    where: { id: lessonId },
    data: { ...body },
  });

  res.json({ lesson });
}

export async function deleteLesson(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = authenticatedUserId(req);
  const courseId = Number(req.params.id);
  const moduleId = Number(req.params.moduleId);
  const lessonId = Number(req.params.lessonId);

  await requireOwnedLesson(courseId, moduleId, lessonId, userId);

  await prisma.lesson.delete({ where: { id: lessonId } });

  res.status(204).end();
}

// ---- Question + options CRUD ----

export async function createQuestion(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = authenticatedUserId(req);
  const courseId = Number(req.params.id);

  await requireOwnedCourse(courseId, userId);

  const body = questionSchema.parse(req.body);

  const question = await prisma.question.create({
    data: {
      courseId,
      prompt: body.prompt,
      order: body.order,
      options: {
        create: body.options.map((option) => ({
          text: option.text,
          isCorrect: option.isCorrect,
        })),
      },
    },
    include: { options: { orderBy: { id: "asc" } } },
  });

  res.status(201).json({ question });
}

export async function updateQuestion(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = authenticatedUserId(req);
  const courseId = Number(req.params.id);
  const questionId = Number(req.params.questionId);

  await requireOwnedCourse(courseId, userId);

  const question = await prisma.question.findFirst({
    where: { id: questionId, courseId },
  });
  if (!question) {
    throw new HttpError(404, "NOT_FOUND", "Pregunta no encontrada");
  }

  const body = questionSchema.parse(req.body);

  // Options are replaced wholesale within a transaction (delete + recreate).
  const updated = await prisma.$transaction(async (tx) => {
    await tx.option.deleteMany({ where: { questionId } });
    return tx.question.update({
      where: { id: questionId },
      data: {
        prompt: body.prompt,
        order: body.order,
        options: {
          create: body.options.map((option) => ({
            text: option.text,
            isCorrect: option.isCorrect,
          })),
        },
      },
      include: { options: { orderBy: { id: "asc" } } },
    });
  });

  res.json({ question: updated });
}

export async function deleteQuestion(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = authenticatedUserId(req);
  const courseId = Number(req.params.id);
  const questionId = Number(req.params.questionId);

  await requireOwnedCourse(courseId, userId);

  const question = await prisma.question.findFirst({
    where: { id: questionId, courseId },
  });
  if (!question) {
    throw new HttpError(404, "NOT_FOUND", "Pregunta no encontrada");
  }

  await prisma.question.delete({ where: { id: questionId } });

  res.status(204).end();
}

// ---- Publish request ----

export async function submitForReview(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = authenticatedUserId(req);
  const id = Number(req.params.id);

  const course = await requireOwnedCourse(id, userId);

  if (course.status !== "DRAFT") {
    throw new HttpError(
      409,
      "CONFLICT",
      "Solo los cursos en borrador pueden enviarse a revisión",
    );
  }

  const updated = await prisma.course.update({
    where: { id },
    data: { status: "PENDING" },
  });

  res.json({ course: { id: updated.id, status: updated.status } });
}

// ---- Instructor application (canonical endpoint) ----

export async function submitInstructorApplication(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = authenticatedUserId(req);
  const role = req.userRole;

  const fields = instructorApplicationSchema.parse(req.body);
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];

  // Lifecycle guard 1: an open application blocks a new one.
  const pending = await prisma.instructorApplication.findFirst({
    where: { userId, status: "PENDING" },
  });
  if (pending) {
    throw new HttpError(409, "CONFLICT", "Ya tienes una solicitud pendiente");
  }

  // Lifecycle guard 2: an approved (terminal) application blocks re-apply.
  // The router already rejects ADMIN (403); an INSTRUCTOR reaches here and is
  // stopped by this check (409), matching the spec's "approved is terminal".
  const approved = await prisma.instructorApplication.findFirst({
    where: { userId, status: "APPROVED" },
  });
  if (role === "INSTRUCTOR" || approved) {
    throw new HttpError(
      409,
      "CONFLICT",
      "Tu solicitud ya fue aprobada y no puede volver a enviarse",
    );
  }

  // Persist files first (side-effect), then record rows transactionally. A
  // rejected or duplicate application never reaches this point, so no orphan
  // files are written for those cases.
  const storage = getDocumentStorage();
  const storedFiles = await Promise.all(
    files.map((file) => storage.save(file.buffer, file.mimetype)),
  );

  const application = await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        profesion: fields.profesion,
        ...(fields.edad !== undefined ? { edad: fields.edad } : {}),
      },
    });

    const app = await tx.instructorApplication.create({
      data: { userId, status: "PENDING" },
    });

    for (let index = 0; index < storedFiles.length; index += 1) {
      const file = files[index];
      const stored = storedFiles[index];
      await tx.document.create({
        data: {
          applicationId: app.id,
          fileName: file.originalname,
          storagePath: stored.storagePath,
          mimeType: stored.mimeType,
          sizeBytes: stored.sizeBytes,
        },
      });
    }

    return app;
  });

  res.status(201).json({
    application: {
      id: application.id,
      status: application.status,
      createdAt: application.createdAt,
    },
  });
}

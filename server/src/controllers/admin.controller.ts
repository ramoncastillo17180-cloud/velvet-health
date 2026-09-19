import { Request, Response } from "express";
import type { CourseStatus, InstructorApplicationStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/httpError";
import { authenticatedUserId } from "../middleware/requireAuth";
import {
  approveApplicationSchema,
  rejectApplicationSchema,
} from "../schemas/admin.schema";

const APPLICATION_STATUSES: InstructorApplicationStatus[] = [
  "PENDING",
  "APPROVED",
  "REJECTED",
];

const COURSE_STATUSES: CourseStatus[] = ["DRAFT", "PENDING", "PUBLISHED"];

// ---- Instructor applications ----

export async function listInstructorApplications(
  req: Request,
  res: Response,
): Promise<void> {
  const raw = req.query.status;
  let status: InstructorApplicationStatus | undefined;
  if (typeof raw === "string") {
    if (!APPLICATION_STATUSES.includes(raw as InstructorApplicationStatus)) {
      throw new HttpError(400, "VALIDATION_ERROR", "Estado de solicitud inválido");
    }
    status = raw as InstructorApplicationStatus;
  }

  const applications = await prisma.instructorApplication.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, nombre: true, apellidos: true, correo: true, profesion: true, edad: true },
      },
      documents: {
        select: { id: true, fileName: true, mimeType: true, sizeBytes: true, uploadedAt: true },
      },
      reviewedBy: { select: { id: true, nombre: true, apellidos: true } },
    },
  });

  // Metadata only — document binary content is never included here.
  res.json({
    applications: applications.map((application) => ({
      id: application.id,
      status: application.status,
      createdAt: application.createdAt,
      applicant: application.user,
      documents: application.documents,
      reviewedBy: application.reviewedBy,
      reviewedAt: application.reviewedAt,
      reviewNotes: application.reviewNotes,
    })),
  });
}

export async function approveInstructorApplication(
  req: Request,
  res: Response,
): Promise<void> {
  const reviewerId = authenticatedUserId(req);
  const id = Number(req.params.id);
  const body = approveApplicationSchema.parse(req.body);

  const application = await prisma.instructorApplication.findUnique({
    where: { id },
  });
  if (!application) {
    throw new HttpError(404, "NOT_FOUND", "Solicitud no encontrada");
  }
  if (application.status !== "PENDING") {
    throw new HttpError(409, "CONFLICT", "La solicitud ya fue resuelta");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const app = await tx.instructorApplication.update({
      where: { id },
      data: {
        status: "APPROVED",
        reviewedById: reviewerId,
        reviewedAt: new Date(),
        reviewNotes: body.reviewNotes ?? null,
      },
    });

    // Promotion is the whole point of approval.
    await tx.user.update({
      where: { id: application.userId },
      data: { role: "INSTRUCTOR" },
    });

    return app;
  });

  res.json({
    application: {
      id: updated.id,
      status: updated.status,
      reviewedAt: updated.reviewedAt,
    },
  });
}

export async function rejectInstructorApplication(
  req: Request,
  res: Response,
): Promise<void> {
  const reviewerId = authenticatedUserId(req);
  const id = Number(req.params.id);
  const body = rejectApplicationSchema.parse(req.body);

  const application = await prisma.instructorApplication.findUnique({
    where: { id },
  });
  if (!application) {
    throw new HttpError(404, "NOT_FOUND", "Solicitud no encontrada");
  }
  if (application.status !== "PENDING") {
    throw new HttpError(409, "CONFLICT", "La solicitud ya fue resuelta");
  }

  // Rejection keeps the applicant's role as STUDENT.
  const updated = await prisma.instructorApplication.update({
    where: { id },
    data: {
      status: "REJECTED",
      reviewedById: reviewerId,
      reviewedAt: new Date(),
      reviewNotes: body.reviewNotes,
    },
  });

  res.json({
    application: { id: updated.id, status: updated.status },
  });
}

// ---- Course moderation ----

export async function listAdminCourses(
  req: Request,
  res: Response,
): Promise<void> {
  const raw = req.query.status;
  // The moderation queue defaults to PENDING courses.
  let status: CourseStatus = "PENDING";
  if (typeof raw === "string") {
    if (!COURSE_STATUSES.includes(raw as CourseStatus)) {
      throw new HttpError(400, "VALIDATION_ERROR", "Estado de curso inválido");
    }
    status = raw as CourseStatus;
  }

  const courses = await prisma.course.findMany({
    where: { status },
    orderBy: { id: "desc" },
    include: {
      createdBy: { select: { id: true, nombre: true, apellidos: true, correo: true } },
    },
  });

  res.json({ courses });
}

export async function approveCourse(
  req: Request,
  res: Response,
): Promise<void> {
  const id = Number(req.params.id);

  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) {
    throw new HttpError(404, "NOT_FOUND", "Curso no encontrado");
  }
  if (course.status !== "PENDING") {
    throw new HttpError(409, "CONFLICT", "Solo los cursos pendientes pueden aprobarse");
  }

  const updated = await prisma.course.update({
    where: { id },
    data: { status: "PUBLISHED" },
  });

  res.json({ course: { id: updated.id, status: updated.status } });
}

export async function rejectCourse(
  req: Request,
  res: Response,
): Promise<void> {
  const id = Number(req.params.id);

  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) {
    throw new HttpError(404, "NOT_FOUND", "Curso no encontrado");
  }
  if (course.status !== "PENDING") {
    throw new HttpError(409, "CONFLICT", "Solo los cursos pendientes pueden rechazarse");
  }

  const updated = await prisma.course.update({
    where: { id },
    data: { status: "DRAFT" },
  });

  res.json({ course: { id: updated.id, status: updated.status } });
}

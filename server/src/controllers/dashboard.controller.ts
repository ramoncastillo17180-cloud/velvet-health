import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/httpError";
import { authenticatedUserId } from "../middleware/requireAuth";

// Select shape shared by the student dashboard's two reads: the student's
// identity and their self-scoped exam results.
const publishedCourseSummary = {
  id: true,
  slug: true,
  title: true,
  image: true,
  minutes: true,
} as const;

// Returns the authenticated student's progress, self-scoped results, and course
// recommendations (published courses the student has not yet passed). The
// router enforces `requireAuth` + `requireRole(STUDENT)`, so a non-student never
// reaches this handler.
export async function getStudentDashboard(
  req: Request,
  res: Response,
): Promise<void> {
  const userId = authenticatedUserId(req);

  const [user, publishedCourses, results] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, nombre: true, role: true },
    }),
    prisma.course.findMany({
      where: { status: "PUBLISHED" },
      orderBy: { id: "asc" },
      select: publishedCourseSummary,
    }),
    prisma.examResult.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        courseId: true,
        course: { select: { slug: true } },
        score: true,
        passed: true,
        createdAt: true,
      },
    }),
  ]);

  // `requireAuth` already re-read the user, so this is a defensive guard against
  // a deletion racing the request.
  if (!user) {
    throw new HttpError(401, "UNAUTHORIZED", "Usuario no encontrado");
  }

  // A course counts as completed when the student has at least one passing
  // result; "started" is any course with at least one result.
  const passedCourseIds = new Set(
    results.filter((result) => result.passed).map((result) => result.courseId),
  );
  const startedCourseIds = new Set(results.map((result) => result.courseId));

  res.json({
    dashboard: {
      student: { id: user.id, nombre: user.nombre, role: user.role },
      progress: {
        coursesStarted: startedCourseIds.size,
        coursesCompleted: passedCourseIds.size,
        totalCourses: publishedCourses.length,
      },
      results: results.map((result) => ({
        id: result.id,
        courseId: result.courseId,
        courseSlug: result.course.slug,
        score: result.score,
        passed: result.passed,
        createdAt: result.createdAt,
      })),
      recommendations: publishedCourses
        .filter((course) => !passedCourseIds.has(course.id))
        .map((course) => ({
          id: course.id,
          slug: course.slug,
          title: course.title,
          image: course.image,
          minutes: course.minutes,
        })),
    },
  });
}

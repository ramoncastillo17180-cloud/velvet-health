import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { authenticatedUserId } from "../middleware/requireAuth";

export async function listResults(req: Request, res: Response): Promise<void> {
  const userId = authenticatedUserId(req);

  const results = await prisma.examResult.findMany({
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
  });

  res.json({
    results: results.map((result) => ({
      id: result.id,
      courseId: result.courseId,
      courseSlug: result.course.slug,
      score: result.score,
      passed: result.passed,
      createdAt: result.createdAt,
    })),
  });
}

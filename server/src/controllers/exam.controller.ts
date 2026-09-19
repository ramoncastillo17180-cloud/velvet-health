import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/httpError";
import { submitExamSchema } from "../schemas/exam.schema";
import { authenticatedUserId } from "../middleware/requireAuth";

// Returns the exam questions WITHOUT any correct-answer signal.
// Grading happens server-side on submit.
export async function getExam(req: Request, res: Response): Promise<void> {
  // Express 5 types route params as `string | string[]`; a single `/:slug` segment is always a string.
  const slug = req.params.slug as string;

  const course = await prisma.course.findUnique({
    where: { slug },
    select: {
      id: true,
      questions: {
        orderBy: { order: "asc" },
        select: {
          id: true,
          prompt: true,
          options: {
            orderBy: { id: "asc" },
            select: { id: true, text: true },
          },
        },
      },
    },
  });

  if (!course) {
    throw new HttpError(404, "NOT_FOUND", "Curso no encontrado");
  }

  res.json({
    exam: {
      courseId: course.id,
      questions: course.questions.map((question) => ({
        id: question.id,
        prompt: question.prompt,
        options: question.options.map((option) => ({
          id: option.id,
          text: option.text,
        })),
      })),
    },
  });
}

export async function submitExam(req: Request, res: Response): Promise<void> {
  const userId = authenticatedUserId(req);
  // Express 5 types route params as `string | string[]`; a single `/:slug` segment is always a string.
  const slug = req.params.slug as string;
  const body = submitExamSchema.parse(req.body);

  const course = await prisma.course.findUnique({
    where: { slug },
    select: {
      id: true,
      passThreshold: true,
      questions: {
        select: {
          id: true,
          options: {
            select: { id: true, isCorrect: true },
          },
        },
      },
    },
  });

  if (!course) {
    throw new HttpError(404, "NOT_FOUND", "Curso no encontrado");
  }

  // Map each question to its correct option id.
  const correctOptionByQuestion = new Map<number, number>();
  for (const question of course.questions) {
    const correct = question.options.find((option) => option.isCorrect);
    if (correct) {
      correctOptionByQuestion.set(question.id, correct.id);
    }
  }

  // Deduplicate submitted answers: the last answer per question wins.
  const submitted = new Map<number, number>();
  for (const answer of body.answers) {
    submitted.set(answer.questionId, answer.optionId);
  }

  const totalQuestions = course.questions.length;
  let correctCount = 0;
  for (const [questionId, optionId] of submitted) {
    const correctOptionId = correctOptionByQuestion.get(questionId);
    if (correctOptionId !== undefined && correctOptionId === optionId) {
      correctCount += 1;
    }
  }

  const score =
    totalQuestions === 0 ? 0 : Math.round((correctCount / totalQuestions) * 100);
  const passed = score >= course.passThreshold;

  const result = await prisma.examResult.create({
    data: {
      userId,
      courseId: course.id,
      score,
      passed,
    },
  });

  res.json({ score, passed, resultId: result.id });
}

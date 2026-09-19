import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import { handleDocumentsUpload } from "../middleware/upload";
import {
  listInstructorCourses,
  createCourse,
  getInstructorCourse,
  updateCourse,
  deleteCourse,
  createModule,
  updateModule,
  deleteModule,
  createLesson,
  updateLesson,
  deleteLesson,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  submitForReview,
  submitInstructorApplication,
} from "../controllers/instructor.controller";

export const instructorRouter = Router();

// Canonical instructor application — the single carve-out on `/api/instructor/*`.
// A STUDENT applies (or re-applies after rejection); ADMIN is rejected 403 here,
// and the controller enforces the lifecycle (duplicate pending → 409, approved
// terminal → 409).
instructorRouter.post(
  "/applications",
  requireAuth,
  requireRole("STUDENT", "INSTRUCTOR"),
  handleDocumentsUpload,
  asyncHandler(submitInstructorApplication),
);

// Everything else under `/api/instructor/*` is INSTRUCTOR + ADMIN only.
instructorRouter.use(requireAuth, requireRole("INSTRUCTOR", "ADMIN"));

instructorRouter.get("/courses", asyncHandler(listInstructorCourses));
instructorRouter.post("/courses", asyncHandler(createCourse));
instructorRouter.get("/courses/:id", asyncHandler(getInstructorCourse));
instructorRouter.put("/courses/:id", asyncHandler(updateCourse));
instructorRouter.delete("/courses/:id", asyncHandler(deleteCourse));

instructorRouter.post("/courses/:id/modules", asyncHandler(createModule));
instructorRouter.put(
  "/courses/:id/modules/:moduleId",
  asyncHandler(updateModule),
);
instructorRouter.delete(
  "/courses/:id/modules/:moduleId",
  asyncHandler(deleteModule),
);

instructorRouter.post(
  "/courses/:id/modules/:moduleId/lessons",
  asyncHandler(createLesson),
);
instructorRouter.put(
  "/courses/:id/modules/:moduleId/lessons/:lessonId",
  asyncHandler(updateLesson),
);
instructorRouter.delete(
  "/courses/:id/modules/:moduleId/lessons/:lessonId",
  asyncHandler(deleteLesson),
);

instructorRouter.post("/courses/:id/questions", asyncHandler(createQuestion));
instructorRouter.put(
  "/courses/:id/questions/:questionId",
  asyncHandler(updateQuestion),
);
instructorRouter.delete(
  "/courses/:id/questions/:questionId",
  asyncHandler(deleteQuestion),
);

instructorRouter.post("/courses/:id/submit", asyncHandler(submitForReview));

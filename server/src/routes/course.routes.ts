import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { listCourses, getCourse } from "../controllers/course.controller";
import { getExam, submitExam } from "../controllers/exam.controller";
import { requireAuth } from "../middleware/requireAuth";

export const courseRouter = Router();

courseRouter.get("/", asyncHandler(listCourses));
courseRouter.get("/:slug", asyncHandler(getCourse));
courseRouter.get("/:slug/exam", asyncHandler(getExam));
courseRouter.post("/:slug/exam/submit", requireAuth, asyncHandler(submitExam));

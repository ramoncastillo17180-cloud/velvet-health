import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { listResults } from "../controllers/me.controller";
import { getStudentDashboard } from "../controllers/dashboard.controller";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";

export const meRouter = Router();

meRouter.get("/results", requireAuth, asyncHandler(listResults));
meRouter.get(
  "/dashboard",
  requireAuth,
  requireRole("STUDENT"),
  asyncHandler(getStudentDashboard),
);

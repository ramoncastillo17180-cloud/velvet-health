import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { requireAuth } from "../middleware/requireAuth";
import { requireRole } from "../middleware/requireRole";
import {
  listInstructorApplications,
  approveInstructorApplication,
  rejectInstructorApplication,
  listAdminCourses,
  approveCourse,
  rejectCourse,
  getAdminDashboard,
} from "../controllers/admin.controller";
import { listUsers } from "../controllers/user.controller";
import { downloadDocument } from "../controllers/document.controller";

export const adminRouter = Router();

// Every route under `/api/admin/*` is ADMIN-only.
adminRouter.use(requireAuth, requireRole("ADMIN"));

adminRouter.get("/dashboard", asyncHandler(getAdminDashboard));
adminRouter.get("/users", asyncHandler(listUsers));

adminRouter.get(
  "/instructor-applications",
  asyncHandler(listInstructorApplications),
);
adminRouter.post(
  "/instructor-applications/:id/approve",
  asyncHandler(approveInstructorApplication),
);
adminRouter.post(
  "/instructor-applications/:id/reject",
  asyncHandler(rejectInstructorApplication),
);

adminRouter.get("/courses", asyncHandler(listAdminCourses));
adminRouter.post("/courses/:id/approve", asyncHandler(approveCourse));
adminRouter.post("/courses/:id/reject", asyncHandler(rejectCourse));

adminRouter.get("/documents/:id", asyncHandler(downloadDocument));

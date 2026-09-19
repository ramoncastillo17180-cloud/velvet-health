import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import {
  register,
  login,
  logout,
  me,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller";
import { requireAuth } from "../middleware/requireAuth";

export const authRouter = Router();

authRouter.post("/register", asyncHandler(register));
authRouter.post("/login", asyncHandler(login));
authRouter.post("/logout", logout);
authRouter.post("/forgot-password", asyncHandler(forgotPassword));
authRouter.post("/reset-password", asyncHandler(resetPassword));
authRouter.get("/me", requireAuth, asyncHandler(me));

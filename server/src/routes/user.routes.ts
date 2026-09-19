import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { listUsers } from "../controllers/user.controller";
import { requireAuth } from "../middleware/requireAuth";

export const userRouter = Router();

userRouter.get("/", requireAuth, asyncHandler(listUsers));

import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { listResults } from "../controllers/me.controller";
import { requireAuth } from "../middleware/requireAuth";

export const meRouter = Router();

meRouter.get("/results", requireAuth, asyncHandler(listResults));

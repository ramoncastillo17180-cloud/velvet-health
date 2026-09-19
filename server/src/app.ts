import express from "express";
import cors from "cors";
import helmet from "helmet";
import { authRouter } from "./routes/auth.routes";
import { courseRouter } from "./routes/course.routes";
import { meRouter } from "./routes/me.routes";
import { userRouter } from "./routes/user.routes";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";

export function createApp(): express.Express {
  const app = express();

  app.use(helmet());
  app.use(cors());
  app.use(express.json());

  app.use("/api/auth", authRouter);
  app.use("/api/courses", courseRouter);
  app.use("/api/me", meRouter);
  app.use("/api/users", userRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

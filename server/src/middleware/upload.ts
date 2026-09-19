import { NextFunction, Request, Response } from "express";
import multer from "multer";
import { env } from "../config/env";
import { HttpError } from "../utils/httpError";

// Credential-document MIME allowlist. Anything else is rejected before storage.
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
]);

// multer uses memory storage: the `DocumentStorage` layer persists each buffer
// under a server-generated UUID name, so the S3 adapter can be swapped in
// without changing the HTTP layer. Validation (type + size) happens here.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.maxUploadBytes },
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(
        new HttpError(
          400,
          "VALIDATION_ERROR",
          "Tipo de archivo no permitido. Solo se admiten PDF, JPG y PNG.",
        ),
      );
      return;
    }
    cb(null, true);
  },
});

const uploadDocuments = upload.array("documents");

// Wraps multer so its own errors (e.g. LIMIT_FILE_SIZE) are normalized to the
// `VALIDATION_ERROR` shape instead of leaking a 500. Nothing is stored when an
// upload is rejected.
export function handleDocumentsUpload(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  uploadDocuments(req, res, (err: unknown) => {
    if (!err) {
      next();
      return;
    }
    if (err instanceof HttpError) {
      next(err);
      return;
    }
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        next(
          new HttpError(
            400,
            "VALIDATION_ERROR",
            "El archivo excede el tamaño máximo permitido",
          ),
        );
        return;
      }
      next(new HttpError(400, "VALIDATION_ERROR", err.message));
      return;
    }
    next(err);
  });
}

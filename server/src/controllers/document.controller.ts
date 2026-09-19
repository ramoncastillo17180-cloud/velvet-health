import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { HttpError } from "../utils/httpError";
import { getDocumentStorage } from "../lib/storage";

// Streams a stored credential document to an admin. The 401/403 gate is applied
// by `requireRole(ADMIN)` at the router; this handler only resolves the record
// and streams the bytes (never a public URL).
export async function downloadDocument(
  req: Request,
  res: Response,
): Promise<void> {
  const id = Number(req.params.id);

  const document = await prisma.document.findUnique({ where: { id } });
  if (!document) {
    throw new HttpError(404, "NOT_FOUND", "Documento no encontrado");
  }

  const storage = getDocumentStorage();
  // `open` enforces containment within the upload dir (path-traversal defense)
  // and throws 404 when the file is missing or resolves outside it.
  const stream = storage.open(document.storagePath);

  res.setHeader("Content-Type", document.mimeType);
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${document.fileName}"`,
  );

  stream.pipe(res);
}

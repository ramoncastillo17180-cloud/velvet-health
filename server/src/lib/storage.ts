import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import type { Readable } from "stream";
import { env } from "../config/env";
import { HttpError } from "../utils/httpError";

export interface StoredFile {
  storagePath: string;
  mimeType: string;
  sizeBytes: number;
}

// Storage seam for credential documents. `save` persists a buffer and returns
// its server-generated storage path; `open` returns a readable stream for a
// stored path. The local implementation ships now; an S3 adapter can be dropped
// in behind `DOCUMENT_STORAGE=s3` for production (Render's filesystem is
// ephemeral).
export interface DocumentStorage {
  save(buffer: Buffer, mimeType: string): Promise<StoredFile>;
  open(storagePath: string): Readable;
}

// Extension is derived from the MIME allowlist, never from user input. This
// keeps stored names predictable and prevents extension-based confusion.
const EXTENSION_BY_MIME: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
};

function mimeToExtension(mimeType: string): string {
  return EXTENSION_BY_MIME[mimeType] ?? "bin";
}

// Stores documents on local disk under the configured upload directory
// (default `./uploads/documents`, outside the web root and gitignored).
export class LocalStorage implements DocumentStorage {
  private readonly root: string;

  constructor(root: string = env.uploadDir) {
    this.root = path.resolve(root);
  }

  async save(buffer: Buffer, mimeType: string): Promise<StoredFile> {
    fs.mkdirSync(this.root, { recursive: true });
    const fileName = `${randomUUID()}.${mimeToExtension(mimeType)}`;
    const absolute = path.join(this.root, fileName);
    await fs.promises.writeFile(absolute, buffer);
    return {
      storagePath: fileName,
      mimeType,
      sizeBytes: buffer.length,
    };
  }

  open(storagePath: string): Readable {
    const absolute = path.resolve(this.root, storagePath);
    const rootPrefix = this.root.endsWith(path.sep)
      ? this.root
      : this.root + path.sep;

    // Path-traversal defense: the resolved path must stay inside the upload
    // directory, and the file must actually exist.
    if (!absolute.startsWith(rootPrefix) || !fs.existsSync(absolute)) {
      throw new HttpError(404, "NOT_FOUND", "Documento no encontrado");
    }

    return fs.createReadStream(absolute);
  }
}

// Scaffold adapter for object storage. Not wired in this change — selecting
// `DOCUMENT_STORAGE=s3` surfaces an explicit error rather than silently
// falling back to local disk.
export class S3Storage implements DocumentStorage {
  async save(_buffer: Buffer, _mimeType: string): Promise<StoredFile> {
    throw new Error("S3 document storage is not implemented in this change");
  }

  open(_storagePath: string): Readable {
    throw new Error("S3 document storage is not implemented in this change");
  }
}

// Returns the configured storage backend for the process.
export function getDocumentStorage(): DocumentStorage {
  if (env.docStorage === "s3") {
    return new S3Storage();
  }
  return new LocalStorage();
}

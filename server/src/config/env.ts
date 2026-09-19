import dotenv from "dotenv";

dotenv.config();

function readRequired(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function readInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") {
    return fallback;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = {
  port: Number(process.env.PORT ?? 3001),
  jwtSecret: readRequired("JWT_SECRET"),
  // Access token expiry (JWT `expiresIn` value, e.g. "7d").
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  // Password reset token TTL, in minutes.
  resetTokenTtlMinutes: readInt("RESET_TOKEN_TTL_MINUTES", 15),
  // "console" (dev, logs the reset token) or "smtp" (production email).
  emailMode: process.env.EMAIL_MODE ?? "console",
  smtp: {
    host: process.env.SMTP_HOST,
    port: readInt("SMTP_PORT", 587),
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD,
    from: process.env.SMTP_FROM,
  },
  // Credential document upload directory (outside the web root).
  uploadDir: process.env.UPLOAD_DIR ?? "./uploads/documents",
  // Maximum upload size, in bytes (default 5 MB).
  maxUploadBytes: readInt("MAX_UPLOAD_BYTES", 5 * 1024 * 1024),
  // "local" (built-in) or "s3" (adapter, deferred).
  docStorage: process.env.DOCUMENT_STORAGE ?? "local",
  s3: {
    bucket: process.env.S3_BUCKET,
    region: process.env.S3_REGION,
    accessKeyId: process.env.S3_ACCESS_KEY_ID,
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  },
};

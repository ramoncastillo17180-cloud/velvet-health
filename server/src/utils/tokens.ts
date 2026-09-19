import { createHash, randomBytes } from "crypto";

// Generates a cryptographically random password-reset token (~256 bits).
export function generateResetToken(): string {
  return randomBytes(32).toString("hex");
}

// Hashes a raw reset token with SHA-256 so a database leak cannot be replayed
// into a password reset.
export function hashResetToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

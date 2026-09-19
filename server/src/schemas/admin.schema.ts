import { z } from "zod";

// Approving an application carries optional review notes.
export const approveApplicationSchema = z.object({
  reviewNotes: z.string().optional(),
});

// Rejecting an application requires review notes (a rejection must justify itself).
export const rejectApplicationSchema = z.object({
  reviewNotes: z.string().trim().min(1, "Las notas de revisión son obligatorias"),
});

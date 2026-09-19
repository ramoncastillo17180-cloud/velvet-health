import { z } from "zod";

// Validates the parsed multipart form fields of `POST /api/instructor/applications`.
// Multipart text fields arrive as strings, so `edad` is coerced from a string
// (and an empty string is treated as absent).
export const instructorApplicationSchema = z.object({
  profesion: z.string().trim().min(1, "La profesión es obligatoria"),
  edad: z.preprocess(
    (value) => (value === "" || value === undefined ? undefined : Number(value)),
    z
      .number()
      .int("La edad debe ser un número entero")
      .positive("La edad debe ser un número positivo")
      .optional(),
  ),
});

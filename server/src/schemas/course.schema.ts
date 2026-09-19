import { z } from "zod";

// Course create/update. `slug` is only accepted on create (and even then it is
// slugified + de-duplicated server-side); updates never change the slug.
export const courseCreateSchema = z.object({
  title: z.string().trim().min(1, "El título es obligatorio"),
  description: z.string().trim().min(1, "La descripción es obligatoria"),
  minutes: z.number().int().positive("La duración debe ser un número positivo"),
  image: z.string().trim().min(1, "La imagen es obligatoria"),
  passThreshold: z.number().int().min(0).max(100).optional(),
  slug: z.string().trim().min(1).optional(),
});

export const courseUpdateSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().trim().min(1).optional(),
  minutes: z.number().int().positive().optional(),
  image: z.string().trim().min(1).optional(),
  passThreshold: z.number().int().min(0).max(100).optional(),
});

export const moduleSchema = z.object({
  title: z.string().trim().min(1, "El título del módulo es obligatorio"),
  description: z.string().optional(),
  order: z.number().int(),
});

export const moduleUpdateSchema = moduleSchema.partial();

export const lessonSchema = z.object({
  title: z.string().trim().min(1, "El título de la lección es obligatorio"),
  content: z.string().min(1, "El contenido es obligatorio"),
  order: z.number().int(),
  durationMinutes: z.number().int().positive().nullable().optional(),
});

export const lessonUpdateSchema = lessonSchema.partial();

export const optionSchema = z.object({
  text: z.string().trim().min(1, "El texto de la opción es obligatorio"),
  isCorrect: z.boolean(),
});

// A question must carry at least two options and exactly one correct answer.
// This guarantee is what keeps server-side grading deterministic.
export const questionSchema = z.object({
  prompt: z.string().trim().min(1, "El enunciado es obligatorio"),
  order: z.number().int(),
  options: z
    .array(optionSchema)
    .min(2, "Cada pregunta requiere al menos 2 opciones")
    .refine((options) => options.filter((option) => option.isCorrect).length === 1, {
      message: "Debe haber exactamente una opción correcta",
    }),
});

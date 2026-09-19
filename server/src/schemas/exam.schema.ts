import { z } from "zod";

export const submitExamSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.number().int(),
      optionId: z.number().int(),
    }),
  ),
});

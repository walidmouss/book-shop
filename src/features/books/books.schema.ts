import { z } from "zod";

export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .default("1")
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 1, "Page must be greater than 0"),
  limit: z
    .string()
    .optional()
    .default("10")
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 1 && val <= 100, "Limit must be between 1 and 100"),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

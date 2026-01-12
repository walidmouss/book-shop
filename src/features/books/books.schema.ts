import { z } from "zod";

export const paginationSchema = z
  .object({
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
      .refine(
        (val) => val >= 1 && val <= 100,
        "Limit must be between 1 and 100"
      ),
    title: z
      .string()
      .optional()
      .transform((val) => val?.trim() || ""),
    sortOrder: z
      .enum(["asc", "desc"])
      .optional()
      .transform((val) => val || "desc"),
    category: z
      .string()
      .optional()
      .transform((val) => val?.trim() || ""),
    minPrice: z
      .string()
      .optional()
      .transform((val) => (val ? parseFloat(val) : undefined))
      .refine(
        (val) => val === undefined || val >= 0,
        "Minimum price must be non-negative"
      ),
    maxPrice: z
      .string()
      .optional()
      .transform((val) => (val ? parseFloat(val) : undefined))
      .refine(
        (val) => val === undefined || val >= 0,
        "Maximum price must be non-negative"
      ),
  } as const)
  .refine(
    (data) => {
      if (data.minPrice !== undefined && data.maxPrice !== undefined) {
        return data.maxPrice >= data.minPrice;
      }
      return true;
    },
    {
      message: "Maximum price must be greater than or equal to minimum price",
      path: ["maxPrice"],
    }
  );

export type PaginationInput = z.infer<typeof paginationSchema>;

export const bookIdSchema = z.object({
  id: z
    .string()
    .transform((val) => parseInt(val, 10))
    .refine((val) => val >= 1, "Book ID must be a positive number"),
});

export type BookIdInput = z.infer<typeof bookIdSchema>;

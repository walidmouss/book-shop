import { z } from "zod";

export const createBookSchema = z.object({
  title: z
    .string({ message: "Title is required" })
    .min(1, "Title is required")
    .max(255, "Title must not exceed 255 characters"),
  description: z
    .string({ message: "Description is required" })
    .min(1, "Description is required"),
  price: z
    .number({ message: "Price is required" })
    .positive("Price must be greater than 0"),
  category: z
    .string({ message: "Category is required" })
    .min(1, "Category is required")
    .max(100, "Category must not exceed 100 characters"),
  author: z
    .string({ message: "Author name is required" })
    .min(1, "Author name is required")
    .max(100, "Author name must not exceed 100 characters"),
  thumbnail: z
    .string({ message: "Thumbnail is required" })
    .url("Thumbnail must be a valid URL")
    .max(255, "Thumbnail must not exceed 255 characters"),
  tags: z
    .array(
      z
        .string()
        .min(1, "Tag cannot be empty")
        .max(50, "Tag must not exceed 50 characters")
    )
    .optional(),
});

export type CreateBookInput = z.infer<typeof createBookSchema>;

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
  title: z
    .string()
    .optional()
    .default("")
    .transform((val) => val.trim()),
  sort: z
    .enum(["asc", "desc"])
    .optional()
    .default("asc")
    .describe("Sort order: 'asc' for A-Z, 'desc' for Z-A"),
});

export type PaginationInput = z.infer<typeof paginationSchema>;

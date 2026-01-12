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

export const updateBookSchema = z.object({
  title: z
    .string({ message: "Title is required" })
    .min(1, "Title is required")
    .max(255, "Title must not exceed 255 characters")
    .optional(),
  description: z
    .string({ message: "Description is required" })
    .min(1, "Description is required")
    .optional(),
  price: z
    .number({ message: "Price is required" })
    .positive("Price must be greater than 0")
    .optional(),
  category: z
    .string({ message: "Category is required" })
    .min(1, "Category is required")
    .max(100, "Category must not exceed 100 characters")
    .optional(),
  author: z
    .string({ message: "Author name is required" })
    .min(1, "Author name is required")
    .max(100, "Author name must not exceed 100 characters")
    .optional(),
  thumbnail: z
    .string({ message: "Thumbnail is required" })
    .url("Thumbnail must be a valid URL")
    .max(255, "Thumbnail must not exceed 255 characters")
    .optional(),
  tags: z
    .array(
      z
        .string()
        .min(1, "Tag cannot be empty")
        .max(50, "Tag must not exceed 50 characters")
    )
    .optional(),
});

export type UpdateBookInput = z.infer<typeof updateBookSchema>;

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
      .default("")
      .transform((val) => val.trim()),
    sort: z
      .enum(["asc", "desc"])
      .optional()
      .default("asc")
      .describe("Sort order: 'asc' for A-Z, 'desc' for Z-A"),
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
  })
  .refine(
    (data) =>
      data.minPrice === undefined ||
      data.maxPrice === undefined ||
      data.maxPrice >= data.minPrice,
    {
      message: "Maximum price must be greater than or equal to minimum price",
      path: ["maxPrice"],
    }
  );

export type PaginationInput = z.infer<typeof paginationSchema>;

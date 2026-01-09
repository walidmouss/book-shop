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
});

export type CreateBookInput = z.infer<typeof createBookSchema>;

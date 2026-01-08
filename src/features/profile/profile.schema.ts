import { z } from "zod";

export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must not exceed 50 characters")
    .optional(),
  email: z.string().email("Invalid email format").optional(),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string({ message: "Current password is required" })
      .min(1, "Current password is required"),
    newPassword: z
      .string({ message: "New password is required" })
      .min(6, "New password must be at least 6 characters")
      .max(100, "New password must not exceed 100 characters"),
    confirmPassword: z
      .string({ message: "Confirm password is required" })
      .min(6, "Confirm password must be at least 6 characters")
      .max(100, "Confirm password must not exceed 100 characters"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const profileResponseSchema = z.object({
  id: z.number(),
  username: z.string(),
  email: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ProfileResponse = z.infer<typeof profileResponseSchema>;

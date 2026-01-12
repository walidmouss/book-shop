import { z } from "zod";

export const registerSchema = z.object({
  username: z
    .string({ message: "Username is required" })
    .min(3, "Username must be at least 3 characters")
    .max(50, "Username must not exceed 50 characters"),
  email: z
    .string({ message: "Email is required" })
    .email("Invalid email format")
    .max(100, "Email must not exceed 100 characters"),
  password: z
    .string({ message: "Password is required" })
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password must not exceed 100 characters"),
});

export const loginSchema = z.object({
  usernameOrEmail: z
    .string({ message: "Username or email is required" })
    .min(1, "Username or email is required")
    .refine(
      (value) => {
        // Check if it's a valid email format OR a valid username (3-50 chars)
        const isEmail = z.string().email().safeParse(value).success;
        const isUsername = value.length >= 3 && value.length <= 50;
        return isEmail || isUsername;
      },
      {
        message: "Must be a valid email or username (3-50 characters)",
      }
    ),
  password: z
    .string({ message: "Password is required" })
    .min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string({ message: "Email is required" })
    .email("Invalid email format"),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordWithOtpSchema = z
  .object({
    email: z
      .string({ message: "Email is required" })
      .email("Invalid email format"),
    otp: z.coerce
      .string({ message: "OTP is required" })
      .transform((val) => val.trim())
      .refine((val) => /^\d{6}$/.test(val), "OTP must be a 6-digit code"),
    newPassword: z
      .string({ message: "New password is required" })
      .min(6, "Password must be at least 6 characters")
      .max(100, "Password must not exceed 100 characters"),
    confirmPassword: z
      .string({ message: "Confirm password is required" })
      .min(6, "Password must be at least 6 characters")
      .max(100, "Password must not exceed 100 characters"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export type ResetPasswordWithOtpInput = z.infer<
  typeof resetPasswordWithOtpSchema
>;

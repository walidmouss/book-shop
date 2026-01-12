import { Hono } from "hono";
import { authController } from "./auth.controller.js";
import { authMiddleware } from "./auth.middleware.js";

export const authRoutes = new Hono();

// Public routes
authRoutes.post("/register", authController.register);
authRoutes.post("/login", authController.login);
authRoutes.post("/forgot-password", authController.forgotPassword);
authRoutes.post("/reset-password", authController.resetPassword);

// Protected routes
authRoutes.post("/logout", authMiddleware, authController.logout);

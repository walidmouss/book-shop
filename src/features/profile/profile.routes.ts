import { Hono } from "hono";
import { profileController } from "./profile.controller.js";
import { authMiddleware } from "../auth/auth.middleware.js";

export const profileRoutes = new Hono();

// this passes all the requests incoming by the authentication middleware
profileRoutes.use("*", authMiddleware);

// GET /profile - Get current user profile details
profileRoutes.get("/", profileController.getProfile);

// PUT /profile - Edit current user details
profileRoutes.put("/", profileController.updateProfile);

// PATCH /profile/changePassword - Change current user password
profileRoutes.patch("/changePassword", profileController.changePassword);

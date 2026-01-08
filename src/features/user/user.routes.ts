import { Hono } from "hono";
import { userController } from "./user.controller.js";

export const userRoutes = new Hono();

// POST /users - Create a new user
userRoutes.post("/", userController.createUser);

// GET /users - Get all users
userRoutes.get("/", userController.getAllUsers);

// GET /users/:id - Get a specific user
userRoutes.get("/:id", userController.getUserById);

// PUT /users/:id - Update a user
userRoutes.put("/:id", userController.updateUser);

// DELETE /users/:id - Delete a user
userRoutes.delete("/:id", userController.deleteUser);

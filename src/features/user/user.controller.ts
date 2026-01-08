// Imports
import { Context } from "hono";
import { userService } from "./user.service.js";
import { createUserSchema, updateUserSchema } from "./user.schema.js";

// User Controller: Handles HTTP requests and responses for user routes
export const userController = {
  // Create a new user
  async createUser(c: Context) {
    try {
      const body = await c.req.json();
      const validatedData = createUserSchema.parse(body);
      const user = await userService.createUser(validatedData);
      return c.json(
        {
          success: true,
          data: user,
        },
        201
      );
    } catch (error: any) {
      return c.json(
        {
          success: false,
          error: error.message,
        },
        400
      );
    }
  },

  // Get all users
  async getAllUsers(c: Context) {
    try {
      const users = await userService.getAllUsers();
      return c.json({
        success: true,
        data: users,
      });
    } catch (error: any) {
      return c.json(
        {
          success: false,
          error: error.message,
        },
        500
      );
    }
  },

  // Get a user by ID
  async getUserById(c: Context) {
    try {
      const id = parseInt(c.req.param("id"));
      if (isNaN(id)) {
        return c.json(
          {
            success: false,
            error: "Invalid user ID",
          },
          400
        );
      }
      const user = await userService.getUserById(id);
      if (!user) {
        return c.json(
          {
            success: false,
            error: "User not found",
          },
          404
        );
      }
      return c.json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      return c.json(
        {
          success: false,
          error: error.message,
        },
        500
      );
    }
  },

  // Update a user by ID
  async updateUser(c: Context) {
    try {
      const id = parseInt(c.req.param("id"));
      if (isNaN(id)) {
        return c.json(
          {
            success: false,
            error: "Invalid user ID",
          },
          400
        );
      }
      const body = await c.req.json();
      const validatedData = updateUserSchema.parse(body);
      const user = await userService.updateUser(id, validatedData);
      if (!user) {
        return c.json(
          {
            success: false,
            error: "User not found",
          },
          404
        );
      }
      return c.json({
        success: true,
        data: user,
      });
    } catch (error: any) {
      return c.json(
        {
          success: false,
          error: error.message,
        },
        400
      );
    }
  },

  // Delete a user by ID
  async deleteUser(c: Context) {
    try {
      const id = parseInt(c.req.param("id"));
      if (isNaN(id)) {
        return c.json(
          {
            success: false,
            error: "Invalid user ID",
          },
          400
        );
      }
      const deletedId = await userService.deleteUser(id);
      if (!deletedId) {
        return c.json(
          {
            success: false,
            error: "User not found",
          },
          404
        );
      }
      return c.json({
        success: true,
        message: "User deleted successfully",
        data: { id: deletedId },
      });
    } catch (error: any) {
      return c.json(
        {
          success: false,
          error: error.message,
        },
        500
      );
    }
  },
};

import { Context } from "hono";
import { profileService } from "./profile.service.js";
import { updateProfileSchema, changePasswordSchema } from "./profile.schema.js";
import { ZodError } from "zod";

// Helper function to format Zod validation errors
function formatZodError(error: ZodError): string {
  return error.issues
    .map((err) => {
      const field = err.path.join(".");
      return field ? `${field}: ${err.message}` : err.message;
    })
    .join(", ");
}

// Profile Controller: Handles HTTP requests and responses for profile routes
export const profileController = {
  // Get current user profile details
  async getProfile(c: Context) {
    try {
      const userId = c.get("userId");
      const profile = await profileService.getProfile(userId);
      if (!profile) {
        return c.json(
          {
            success: false,
            error: "Profile not found",
          },
          404
        );
      }
      return c.json({
        success: true,
        data: profile,
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

  // Update current user profile details
  async updateProfile(c: Context) {
    try {
      const userId = c.get("userId");
      const body = await c.req.json();
      const validatedData = updateProfileSchema.parse(body);
      const profile = await profileService.updateProfile(userId, validatedData);
      if (!profile) {
        return c.json(
          {
            success: false,
            error: "Profile not found",
          },
          404
        );
      }
      return c.json({
        success: true,
        data: profile,
      });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return c.json({ error: formatZodError(error) }, 400);
      }
      return c.json(
        {
          success: false,
          error: error.message,
        },
        400
      );
    }
  },

  // Change current user password
  async changePassword(c: Context) {
    try {
      const userId = c.get("userId");
      const body = await c.req.json();
      const validatedData = changePasswordSchema.parse(body);
      const result = await profileService.changePassword(userId, validatedData);
      return c.json({
        success: true,
        message: result.message,
      });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return c.json({ error: formatZodError(error) }, 400);
      }
      return c.json(
        {
          success: false,
          error: error.message,
        },
        400
      );
    }
  },
};

import { Context } from "hono";
import { AuthService } from "./auth.service.js";
import {
  registerSchema,
  loginSchema,
  resetPasswordSchema,
} from "./auth.schema.js";
import { ZodError } from "zod";

const authService = new AuthService();

// Helper function to format Zod validation errors
function formatZodError(error: ZodError): string {
  return error.issues
    .map((err) => {
      const field = err.path.join(".");
      return field ? `${field}: ${err.message}` : err.message;
    })
    .join(", ");
}

class AuthController {
  async register(c: Context) {
    try {
      const body = await c.req.json();
      const data = registerSchema.parse(body);
      const result = await authService.register(data);
      return c.json(result, 201);
    } catch (error) {
      if (error instanceof ZodError) {
        return c.json({ error: formatZodError(error) }, 400);
      }
      if (error instanceof Error) {
        return c.json({ error: error.message }, 400);
      }
      return c.json({ error: "Internal server error" }, 500);
    }
  }

  async login(c: Context) {
    try {
      const body = await c.req.json();
      const data = loginSchema.parse(body);
      const result = await authService.login(data);
      return c.json(result, 200);
    } catch (error) {
      if (error instanceof ZodError) {
        return c.json({ error: formatZodError(error) }, 400);
      }
      if (error instanceof Error) {
        return c.json({ error: error.message }, 401);
      }
      return c.json({ error: "Internal server error" }, 500);
    }
  }

  async resetPassword(c: Context) {
    try {
      const body = await c.req.json();
      const data = resetPasswordSchema.parse(body);
      const result = await authService.resetPassword(data);
      return c.json(result, 200);
    } catch (error) {
      if (error instanceof ZodError) {
        return c.json({ error: formatZodError(error) }, 400);
      }
      if (error instanceof Error) {
        return c.json({ error: error.message }, 400);
      }
      return c.json({ error: "Internal server error" }, 500);
    }
  }

  async logout(c: Context) {
    try {
      const authHeader = c.req.header("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return c.json({ error: "No token provided" }, 401);
      }

      const token = authHeader.substring(7);
      const result = await authService.logout(token);
      return c.json(result, 200);
    } catch (error) {
      if (error instanceof Error) {
        return c.json({ error: error.message }, 400);
      } else {
        return c.json({ error: "Internal server error" }, 500);
      }
    }
  }
}

export const authController = new AuthController();

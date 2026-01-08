import { Context, Next } from "hono";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { getTokenUserId } from "../../config/redis.js";

export const authMiddleware = async (c: Context, next: Next) => {
  try {
    // Get token from Authorization header
    const authHeader = c.req.header("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return c.json({ error: "No token provided" }, 401);
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix

    // Verify token with JWT
    const decoded = jwt.verify(token, env.JWT_SECRET) as { userId: number };

    // Verify token exists in Redis
    const userId = await getTokenUserId(token);
    if (!userId || userId !== decoded.userId) {
      return c.json({ error: "Invalid or expired token" }, 401);
    }

    // Attach userId to context
    c.set("userId", userId);
    await next();
  } catch (error) {
    return c.json({ error: "Invalid token" }, 401);
  }
};

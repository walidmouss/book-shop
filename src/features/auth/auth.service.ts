import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { db } from "../../config/db.js";
import { users } from "../../db/users.js";
import { eq, or } from "drizzle-orm";
import { env } from "../../config/env.js";
import { storeToken, deleteToken, storeOTP } from "../../config/redis.js";
import { sendOTPEmail } from "../../config/email.js";
import type {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
} from "./auth.schema.js";

const SALT_ROUNDS = 10;

export class AuthService {
  async register(data: RegisterInput) {
    // Check if username or email already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(or(eq(users.username, data.username), eq(users.email, data.email)))
      .limit(1);

    if (existingUser.length > 0) {
      throw new Error("Username or email already exists");
    }

    // Hash password
    const password_hash = await bcrypt.hash(data.password, SALT_ROUNDS);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        username: data.username,
        email: data.email,
        password_hash,
      })
      .returning();

    // Generate token
    const token = jwt.sign(
      { userId: newUser.id, nonce: Math.random().toString(36) },
      env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // Store token in Redis
    await storeToken(newUser.id, token);

    return {
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        createdAt: newUser.createdAt,
      },
      token,
    };
  }

  async login(data: LoginInput) {
    // Find user by username or email
    const [user] = await db
      .select()
      .from(users)
      .where(
        or(
          eq(users.username, data.usernameOrEmail),
          eq(users.email, data.usernameOrEmail)
        )
      )
      .limit(1);

    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(
      data.password,
      user.password_hash
    );

    if (!isValidPassword) {
      throw new Error("Invalid credentials");
    }

    // Generate token
    const token = jwt.sign(
      { userId: user.id, nonce: Math.random().toString(36) },
      env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    // Store token in Redis
    await storeToken(user.id, token);

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    };
  }

  async forgotPassword(data: ForgotPasswordInput) {
    // Check if user exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, data.email))
      .limit(1);

    if (!user) {
      // For security, don't reveal if user exists
      return {
        message: "If an account exists with this email, an OTP has been sent",
      };
    }

    const otp = "123456";

    // Store OTP in Redis with 10 minutes expiration
    await storeOTP(user.id, otp);

    // Send OTP via email
    try {
      await sendOTPEmail(data.email, otp);
    } catch (error) {
      console.error("Failed to send OTP email:", error);
      // Continue execution - OTP is still stored in Redis
      // In production, you might want to handle this differently
    }

    return {
      message: "If an account exists with this email, an OTP has been sent",
    };
  }

  async logout(token: string) {
    // Remove token from Redis
    await deleteToken(token);
    return { message: "Logged out successfully" };
  }
}

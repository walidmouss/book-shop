import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { AuthService } from "./auth.service.js";
import { db } from "../../config/db.js";
import { users } from "../../db/users.js";
import { books } from "../../db/books.js";
import { book_tags } from "../../db/tags.js";
import { redis, getTokenUserId, getOTP } from "../../config/redis.js";
import jwt from "jsonwebtoken";
import { env } from "../../config/env.js";
import { eq } from "drizzle-orm";

const authService = new AuthService();

// Helper to clear users table before each test
async function clearUsers() {
  // Delete books first (they have foreign key to users)
  await db.delete(book_tags);
  await db.delete(books);
  await db.delete(users);
}

// Helper to clear all Redis test tokens and OTPs
async function clearRedisTokens() {
  const tokenKeys = await redis.keys("auth:token:*");
  const otpKeys = await redis.keys("auth:otp:*");
  const allKeys = [...tokenKeys, ...otpKeys];
  if (allKeys.length > 0) {
    await redis.del(...allKeys);
  }
}

describe("Auth Service", () => {
  beforeAll(async () => {
    await clearUsers();
    await clearRedisTokens();
  });

  afterAll(async () => {
    await clearUsers();
    await clearRedisTokens();
  });

  beforeEach(async () => {
    await clearUsers();
    await clearRedisTokens();
  });

  describe("register", () => {
    it("should register a new user", async () => {
      const result = await authService.register({
        username: "testuser",
        email: "test@example.com",
        password: "password123",
      });

      expect(result).toHaveProperty("user");
      expect(result).toHaveProperty("token");
      expect(result.user.username).toBe("testuser");
      expect(result.user.email).toBe("test@example.com");
      expect(result.user).toHaveProperty("id");
      expect(result.user).not.toHaveProperty("password_hash");
      expect(typeof result.token).toBe("string");
    });

    it("should store token in Redis after registration", async () => {
      const result = await authService.register({
        username: "redisuser",
        email: "redis@example.com",
        password: "password123",
      });

      const userId = await getTokenUserId(result.token);
      expect(userId).toBe(result.user.id);
    });

    it("should hash the password", async () => {
      const result = await authService.register({
        username: "hashtest",
        email: "hash@example.com",
        password: "mypassword",
      });

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, result.user.id));

      expect(user.password_hash).not.toBe("mypassword");
      expect(user.password_hash.length).toBeGreaterThan(20);
    });

    it("should not allow duplicate username", async () => {
      await authService.register({
        username: "duplicate",
        email: "dup1@example.com",
        password: "password123",
      });

      await expect(
        authService.register({
          username: "duplicate",
          email: "dup2@example.com",
          password: "password123",
        })
      ).rejects.toThrow("Username or email already exists");
    });

    it("should not allow duplicate email", async () => {
      await authService.register({
        username: "user1",
        email: "same@example.com",
        password: "password123",
      });

      await expect(
        authService.register({
          username: "user2",
          email: "same@example.com",
          password: "password123",
        })
      ).rejects.toThrow("Username or email already exists");
    });

    it("should generate valid JWT token", async () => {
      const result = await authService.register({
        username: "jwttest",
        email: "jwt@example.com",
        password: "password123",
      });

      const decoded = jwt.verify(result.token, env.JWT_SECRET) as {
        userId: number;
      };
      expect(decoded.userId).toBe(result.user.id);
    });
  });

  describe("login", () => {
    beforeEach(async () => {
      // Create a test user for login tests
      await authService.register({
        username: "loginuser",
        email: "login@example.com",
        password: "password123",
      });
    });

    it("should login with username", async () => {
      const result = await authService.login({
        usernameOrEmail: "loginuser",
        password: "password123",
      });

      expect(result).toHaveProperty("user");
      expect(result).toHaveProperty("token");
      expect(result.user.username).toBe("loginuser");
      expect(typeof result.token).toBe("string");
    });

    it("should login with email", async () => {
      const result = await authService.login({
        usernameOrEmail: "login@example.com",
        password: "password123",
      });

      expect(result).toHaveProperty("user");
      expect(result).toHaveProperty("token");
      expect(result.user.email).toBe("login@example.com");
      expect(typeof result.token).toBe("string");
    });

    it("should store token in Redis after login", async () => {
      const result = await authService.login({
        usernameOrEmail: "loginuser",
        password: "password123",
      });

      const userId = await getTokenUserId(result.token);
      expect(userId).toBe(result.user.id);
    });

    it("should fail with wrong password", async () => {
      await expect(
        authService.login({
          usernameOrEmail: "loginuser",
          password: "wrongpassword",
        })
      ).rejects.toThrow("Invalid credentials");
    });

    it("should fail with non-existent username", async () => {
      await expect(
        authService.login({
          usernameOrEmail: "nonexistent",
          password: "password123",
        })
      ).rejects.toThrow("Invalid credentials");
    });

    it("should fail with non-existent email", async () => {
      await expect(
        authService.login({
          usernameOrEmail: "nonexistent@example.com",
          password: "password123",
        })
      ).rejects.toThrow("Invalid credentials");
    });

    it("should generate new token each login", async () => {
      const result1 = await authService.login({
        usernameOrEmail: "loginuser",
        password: "password123",
      });

      const result2 = await authService.login({
        usernameOrEmail: "loginuser",
        password: "password123",
      });

      expect(result1.token).not.toBe(result2.token);
    });
  });

  describe("logout", () => {
    it("should remove token from Redis", async () => {
      const registerResult = await authService.register({
        username: "logoutuser",
        email: "logout@example.com",
        password: "password123",
      });

      // Verify token exists in Redis
      let userId = await getTokenUserId(registerResult.token);
      expect(userId).toBe(registerResult.user.id);

      // Logout
      const result = await authService.logout(registerResult.token);
      expect(result.message).toBe("Logged out successfully");

      // Verify token no longer exists in Redis
      userId = await getTokenUserId(registerResult.token);
      expect(userId).toBeNull();
    });

    it("should handle logout with non-existent token gracefully", async () => {
      const result = await authService.logout("nonexistent-token");
      expect(result.message).toBe("Logged out successfully");
    });

    it("should invalidate multiple tokens independently", async () => {
      const user1 = await authService.register({
        username: "multi1",
        email: "multi1@example.com",
        password: "password123",
      });

      const user2 = await authService.register({
        username: "multi2",
        email: "multi2@example.com",
        password: "password123",
      });

      // Logout user1
      await authService.logout(user1.token);

      // Verify user1 token is invalid
      const userId1 = await getTokenUserId(user1.token);
      expect(userId1).toBeNull();

      // Verify user2 token is still valid
      const userId2 = await getTokenUserId(user2.token);
      expect(userId2).toBe(user2.user.id);
    });
  });

  describe("forgotPassword", () => {
    it("should return success message for valid email", async () => {
      await authService.register({
        username: "forgottest",
        email: "forgot@example.com",
        password: "password123",
      });

      const result = await authService.forgotPassword({
        email: "forgot@example.com",
      });

      expect(result.message).toContain("OTP has been sent");
    });

    it("should return success message for non-existent email (security)", async () => {
      const result = await authService.forgotPassword({
        email: "nonexistent@example.com",
      });

      expect(result.message).toContain("OTP has been sent");
    });

    it("should store OTP in Redis for valid user", async () => {
      const registerResult = await authService.register({
        username: "otptest",
        email: "otp@example.com",
        password: "password123",
      });

      await authService.forgotPassword({
        email: "otp@example.com",
      });

      const storedOTP = await getOTP(registerResult.user.id);
      expect(storedOTP).toBe("123456");
    });

    it("should use static OTP 123456", async () => {
      const registerResult = await authService.register({
        username: "staticotp",
        email: "static@example.com",
        password: "password123",
      });

      await authService.forgotPassword({
        email: "static@example.com",
      });

      const storedOTP = await getOTP(registerResult.user.id);
      expect(storedOTP).toBe("123456");
    });
  });

  describe("resetPassword", () => {
    beforeEach(async () => {
      // Register and request OTP
      await authService.register({
        username: "otpreset",
        email: "otpreset@example.com",
        password: "password123",
      });
      await authService.forgotPassword({ email: "otpreset@example.com" });
    });

    it("should reset password with valid OTP", async () => {
      const result = await authService.resetPassword({
        email: "otpreset@example.com",
        otp: "123456",
        newPassword: "newpassword123",
        confirmPassword: "newpassword123",
      });
      expect(result.message).toBe("Password reset successfully");

      // Can login with new password
      const login = await authService.login({
        usernameOrEmail: "otpreset@example.com",
        password: "newpassword123",
      });
      expect(login).toHaveProperty("token");
    });

    it("should fail with wrong OTP", async () => {
      await expect(
        authService.resetPassword({
          email: "otpreset@example.com",
          otp: "000000",
          newPassword: "newpassword123",
          confirmPassword: "newpassword123",
        })
      ).rejects.toThrow("Invalid or expired OTP");
    });

    it("should invalidate OTP after successful reset", async () => {
      await authService.resetPassword({
        email: "otpreset@example.com",
        otp: "123456",
        newPassword: "newpassword123",
        confirmPassword: "newpassword123",
      });

      // Attempt to reuse OTP
      await expect(
        authService.resetPassword({
          email: "otpreset@example.com",
          otp: "123456",
          newPassword: "anotherpassword",
          confirmPassword: "anotherpassword",
        })
      ).rejects.toThrow("Invalid or expired OTP");
    });
  });

  describe("integration", () => {
    it("should complete full user lifecycle", async () => {
      // Register
      const registerResult = await authService.register({
        username: "lifecycle",
        email: "lifecycle@example.com",
        password: "password123",
      });
      expect(registerResult.user.username).toBe("lifecycle");

      // Login
      const loginResult = await authService.login({
        usernameOrEmail: "lifecycle",
        password: "password123",
      });
      expect(loginResult.token).not.toBe(registerResult.token);

      // Logout
      await authService.logout(loginResult.token);
      const userId = await getTokenUserId(loginResult.token);
      expect(userId).toBeNull();
    });
  });
});

/*test coverage:

        Register Tests
        ---------------
Successfully registers new users
Stores tokens in Redis
Hashes passwords securely
Prevents duplicate usernames
Prevents duplicate emails
Generates valid JWT tokens

        Login Tests
        -----------
Logs in with username
Logs in with email
Stores tokens in Redis after login
Fails with wrong password
Fails with non-existent username/email
Generates new token each login

        Forgot Password Tests
        ---------------------
Returns success message for valid email
Returns success message for non-existent email (security)
Stores OTP in Redis for valid user
Uses static OTP 123456

        Logout Tests
        ------------
Removes token from Redis
Handles non-existent tokens gracefully
Invalidates tokens independently

        Integration Test
        ----------------
Complete user lifecycle: register → login → logout
All tests follow the same pattern as user.test.ts with proper setup/cleanup and isolation between tests.




*/

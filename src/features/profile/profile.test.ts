import { describe, it, expect, beforeEach } from "vitest";
import { profileService } from "./profile.service.js";
import { AuthService } from "../auth/auth.service.js";
import { db } from "../../config/db.js";
import { users } from "../../db/users.js";
import { eq } from "drizzle-orm";

// Helper to clear all users
async function clearUsers() {
  await db.delete(users);
}

describe("Profile Service", () => {
  let testUserId: number;
  const authService = new AuthService();

  beforeEach(async () => {
    await clearUsers();
    // Create a test user using auth service
    const result = await authService.register({
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    });
    testUserId = result.user.id;
  });

  describe("getProfile", () => {
    it("should return user profile by user ID", async () => {
      const profile = await profileService.getProfile(testUserId);
      expect(profile).toBeDefined();
      expect(profile?.username).toBe("testuser");
      expect(profile?.email).toBe("test@example.com");
    });

    it("should return null for non-existent user", async () => {
      const profile = await profileService.getProfile(99999);
      expect(profile).toBeNull();
    });
  });

  describe("updateProfile", () => {
    it("should update username", async () => {
      const updated = await profileService.updateProfile(testUserId, {
        username: "newusername",
      });
      expect(updated).toBeDefined();
      expect(updated?.username).toBe("newusername");
      expect(updated?.email).toBe("test@example.com");
    });

    it("should update email", async () => {
      const updated = await profileService.updateProfile(testUserId, {
        email: "newemail@example.com",
      });
      expect(updated).toBeDefined();
      expect(updated?.email).toBe("newemail@example.com");
      expect(updated?.username).toBe("testuser");
    });

    it("should update both username and email", async () => {
      const updated = await profileService.updateProfile(testUserId, {
        username: "newusername",
        email: "newemail@example.com",
      });
      expect(updated).toBeDefined();
      expect(updated?.username).toBe("newusername");
      expect(updated?.email).toBe("newemail@example.com");
    });

    it("should return null for non-existent user", async () => {
      const updated = await profileService.updateProfile(99999, {
        username: "newusername",
      });
      expect(updated).toBeNull();
    });

    it("should throw error for duplicate username or email", async () => {
      // Create another user
      await authService.register({
        username: "otheruser",
        email: "other@example.com",
        password: "password123",
      });

      // Try to update to existing username
      await expect(
        profileService.updateProfile(testUserId, {
          username: "otheruser",
        })
      ).rejects.toThrow("Email or username already exists");
    });
  });

  describe("changePassword", () => {
    it("should change password successfully", async () => {
      const result = await profileService.changePassword(testUserId, {
        currentPassword: "password123",
        newPassword: "newpassword123",
        confirmPassword: "newpassword123",
      });
      expect(result.message).toBe("Password changed successfully");

      // Verify the password was actually changed by trying to login with new password
      const loginResult = await authService.login({
        usernameOrEmail: "testuser",
        password: "newpassword123",
      });
      expect(loginResult).toBeDefined();
      expect(loginResult.user.username).toBe("testuser");
    });

    it("should throw error for incorrect current password", async () => {
      await expect(
        profileService.changePassword(testUserId, {
          currentPassword: "wrongpassword",
          newPassword: "newpassword123",
          confirmPassword: "newpassword123",
        })
      ).rejects.toThrow("Current password is incorrect");
    });

    it("should throw error for non-existent user", async () => {
      await expect(
        profileService.changePassword(99999, {
          currentPassword: "password123",
          newPassword: "newpassword123",
          confirmPassword: "newpassword123",
        })
      ).rejects.toThrow("User not found");
    });
  });
});

// Imports
import { eq } from "drizzle-orm";
import { db } from "../../config/db.js";
import { users } from "../../db/users.js";
import { UpdateProfileInput, ChangePasswordInput } from "./profile.schema.js";
import bcrypt from "bcrypt";

// Profile Service: Handles all profile-related database operations
export const profileService = {
  ////////////////////// Get profile by user ID //////////////////////
  async getProfile(userId: number) {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    if (!result.length) {
      return null;
    }
    const user = result[0];
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  },

  ///////////////////////// Update profile by user ID /////////////////////////
  async updateProfile(userId: number, data: UpdateProfileInput) {
    const updateData: any = {};
    if (data.username) {
      updateData.username = data.username;
    }
    if (data.email) {
      updateData.email = data.email;
    }
    updateData.updatedAt = new Date();

    try {
      const result = await db
        .update(users)
        .set(updateData)
        .where(eq(users.id, userId))
        .returning();
      if (!result.length) {
        return null;
      }
      const user = result[0];
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (err: any) {
      // Check for unique constraint violation
      if (
        (err.code && err.code === "23505") ||
        (err.cause && err.cause.code === "23505") ||
        (err.message && err.message.includes("duplicate")) ||
        (err.cause &&
          err.cause.message &&
          err.cause.message.includes("duplicate"))
      ) {
        throw new Error("Email or username already exists");
      }
      throw err;
    }
  },

  ///////////////////////// Change password /////////////////////////
  async changePassword(userId: number, data: ChangePasswordInput) {
    // Get current user
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!result.length) {
      throw new Error("User not found");
    }

    const user = result[0];

    // Verify current password
    const isValidPassword = await bcrypt.compare(
      data.currentPassword,
      user.password_hash
    );

    if (!isValidPassword) {
      throw new Error("Current password is incorrect");
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(data.newPassword, 10);

    // Update password
    await db
      .update(users)
      .set({ password_hash: newPasswordHash, updatedAt: new Date() })
      .where(eq(users.id, userId));

    return { message: "Password changed successfully" };
  },
};

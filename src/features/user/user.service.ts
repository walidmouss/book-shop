// Imports
import { eq } from "drizzle-orm";
import { db } from "../../config/db.js";
import { users } from "../../db/users.js";
import { CreateUserInput, UpdateUserInput } from "./user.schema.js";
import bcrypt from "bcrypt";

// User Service: Handles all user-related database operations
export const userService = {
  ////////////////////// Create a new user //////////////////////
  async createUser(data: CreateUserInput) {
    const hashedPassword = await bcrypt.hash(data.password, 10);
    try {
      const result = await db
        .insert(users)
        .values({
          username: data.username,
          email: data.email,
          password_hash: hashedPassword,
        })
        .returning();
      const user = result[0];
      return {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };
    } catch (err: any) {
      // Accept Drizzle/PG error messages for unique constraint
      // Check for PG error code '23505' (unique_violation) in both err and err.cause
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

  ////////////////////// Get a user by ID //////////////////////
  async getUserById(id: number) {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.id, id))
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

  //////////////////////// Get all users ////////////////////////
  async getAllUsers() {
    const result = await db.select().from(users);
    return result.map((user) => ({
      id: user.id,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));
  },

  ///////////////////////// Update a user by ID /////////////////////////
  async updateUser(id: number, data: UpdateUserInput) {
    const updateData: any = {};
    if (data.username) {
      updateData.username = data.username;
    }
    if (data.email) {
      updateData.email = data.email;
    }
    if (data.password) {
      updateData.password_hash = await bcrypt.hash(data.password, 10);
    }
    updateData.updatedAt = new Date();
    const result = await db
      .update(users)
      .set(updateData)
      .where(eq(users.id, id))
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
  },

  ///////////////////////// Delete a user by ID /////////////////////////
  async deleteUser(id: number) {
    const result = await db.delete(users).where(eq(users.id, id)).returning();
    if (!result.length) {
      return null;
    }
    return result[0].id;
  },

  /////////////////////////// Get a user by email ///////////////////////////
  async getUserByEmail(email: string) {
    const result = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    return result.length ? result[0] : null;
  },
};

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { userService } from "./user.service.js";
import { db } from "../../config/db.js";
import { users } from "../../db/users.js";

// Helper to clear users table before each test
async function clearUsers() {
  await db.delete(users);
}

describe("User Service", () => {
  beforeAll(async () => {
    await clearUsers();
  });

  afterAll(async () => {
    await clearUsers();
  });

  beforeEach(async () => {
    await clearUsers();
  });

  it("should create a user", async () => {
    const user = await userService.createUser({
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    });
    expect(user).toHaveProperty("id");
    expect(user.username).toBe("testuser");
    expect(user.email).toBe("test@example.com");
    expect(user).not.toHaveProperty("password_hash");
  });

  it("should not allow duplicate emails", async () => {
    await userService.createUser({
      username: "dup",
      email: "dup@e.com",
      password: "pass",
    });
    await expect(
      userService.createUser({
        username: "dup2",
        email: "dup@e.com",
        password: "pass",
      })
    ).rejects.toThrow("Email or username already exists");
  });

  it("should get a user by id", async () => {
    const created = await userService.createUser({
      username: "user2",
      email: "user2@example.com",
      password: "password123",
    });
    const user = await userService.getUserById(created.id);
    expect(user).not.toBeNull();
    expect(user?.username).toBe("user2");
  });

  it("should get all users", async () => {
    await userService.createUser({
      username: "a",
      email: "a@a.com",
      password: "pass",
    });
    await userService.createUser({
      username: "b",
      email: "b@b.com",
      password: "pass",
    });
    const all = await userService.getAllUsers();
    expect(all.length).toBe(2);
    expect(all.map((u) => u.username)).toContain("a");
    expect(all.map((u) => u.username)).toContain("b");
  });

  it("should update a user", async () => {
    const created = await userService.createUser({
      username: "old",
      email: "old@e.com",
      password: "pass",
    });
    const updated = await userService.updateUser(created.id, {
      username: "new",
    });
    expect(updated).not.toBeNull();
    expect(updated?.username).toBe("new");
  });

  it("should delete a user", async () => {
    const created = await userService.createUser({
      username: "del",
      email: "del@e.com",
      password: "pass",
    });
    const deletedId = await userService.deleteUser(created.id);
    expect(deletedId).toBe(created.id);
    const user = await userService.getUserById(created.id);
    expect(user).toBeNull();
  });

  it("should return null for non-existent user", async () => {
    const user = await userService.getUserById(99999);
    expect(user).toBeNull();
  });

  it("should get user by email", async () => {
    await userService.createUser({
      username: "em",
      email: "em@e.com",
      password: "pass",
    });
    const user = await userService.getUserByEmail("em@e.com");
    expect(user).not.toBeNull();
    expect(user?.email).toBe("em@e.com");
  });
});

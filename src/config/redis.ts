import Redis from "ioredis";
import { env } from "./env.js";

export const redis = new Redis(env.REDIS_URL);

redis.on("connect", () => {
  console.log("Redis connected");
});

redis.on("error", (err) => {
  console.error("Redis error", err);
});

// Token storage utilities
const TOKEN_PREFIX = "auth:token:";
const TOKEN_EXPIRY = 60 * 60 * 24 * 7; // 7 days in seconds

export const storeToken = async (
  userId: number,
  token: string
): Promise<void> => {
  const key = `${TOKEN_PREFIX}${token}`;
  await redis.setex(key, TOKEN_EXPIRY, userId.toString());
};

export const getTokenUserId = async (token: string): Promise<number | null> => {
  const key = `${TOKEN_PREFIX}${token}`;
  const userId = await redis.get(key);
  return userId ? parseInt(userId, 10) : null;
};

export const deleteToken = async (token: string): Promise<void> => {
  const key = `${TOKEN_PREFIX}${token}`;
  await redis.del(key);
};

import dotenv from "dotenv";
// Load .env.test during test runs; otherwise load .env
if (process.env.NODE_ENV === "test") {
  dotenv.config({ path: ".env.test" });
} else {
  dotenv.config();
}

import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  PORT: z.string().optional(),
  JWT_SECRET: z.string(),
});

export const env = envSchema.parse(process.env);

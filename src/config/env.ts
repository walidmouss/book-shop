import dotenv from "dotenv";
dotenv.config(); // loads .env into process.env

import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string(),
  REDIS_URL: z.string(),
  PORT: z.string().optional(),
  JWT_SECRET: z.string(),
});

export const env = envSchema.parse(process.env);

import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./dist/db",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});

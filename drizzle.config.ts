import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/models",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});

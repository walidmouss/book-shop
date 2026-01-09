import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  timestamp,
  numeric,
} from "drizzle-orm/pg-core";
import { authors } from "./authors.js";
import { categories } from "./categories.js";
import { users } from "./users.js";
import { int } from "zod";

export const books = pgTable("books", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 255 }).notNull().unique(),
  description: text("description").notNull(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  thumbnail: varchar("thumbnail", { length: 255 }),
  author_id: integer("author_id")
    .notNull()
    .references(() => authors.id),
  category_id: integer("category_id")
    .notNull()
    .references(() => categories.id),

  creator_id: integer("creator_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

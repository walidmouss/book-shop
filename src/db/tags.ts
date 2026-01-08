import { pgTable, serial, varchar, timestamp } from "drizzle-orm/pg-core";
import { integer } from "drizzle-orm/pg-core";
import { books } from "./books";

export const tags = pgTable("tags", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 50 }).notNull().unique(),
});

export const book_tags = pgTable("book_tags", {
  book_id: integer("book_id")
    .notNull()
    .references(() => books.id),
  tag_id: integer("tag_id")
    .notNull()
    .references(() => tags.id),
});

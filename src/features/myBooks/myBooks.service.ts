import { eq } from "drizzle-orm";
import { db } from "../../config/db.js";
import { authors } from "../../db/authors.js";
import { books } from "../../db/books.js";
import { categories } from "../../db/categories.js";
import { users } from "../../db/users.js";
import { CreateBookInput } from "./myBooks.schema.js";

export const myBooksService = {
  async createBook(userId: number, data: CreateBookInput) {
    // Ensure the user exists
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      throw new Error("User not found");
    }

    // Find or create category by name
    const categoryName = data.category.trim();
    let [category] = await db
      .select()
      .from(categories)
      .where(eq(categories.name, categoryName))
      .limit(1);

    if (!category) {
      [category] = await db
        .insert(categories)
        .values({ name: categoryName })
        .returning();
    }

    // Find or create author using the provided author name
    const authorName = data.author.trim();
    let [author] = await db
      .select()
      .from(authors)
      .where(eq(authors.name, authorName))
      .limit(1);

    if (!author) {
      [author] = await db
        .insert(authors)
        .values({ name: authorName })
        .returning();
    }

    // Insert the new book
    try {
      const [book] = await db
        .insert(books)
        .values({
          title: data.title,
          description: data.description,
          price: data.price.toString(),
          thumbnail: data.thumbnail,
          author_id: author.id,
          category_id: category.id,
          creator_id: userId,
        })
        .returning();

      return {
        id: book.id,
        title: book.title,
        description: book.description,
        price: book.price,
        thumbnail: book.thumbnail,
        category: category.name,
        author: author.name,
        creatorId: book.creator_id,
        createdAt: book.createdAt,
        updatedAt: book.updatedAt,
      };
    } catch (err: any) {
      // Handle unique constraint violation (e.g., duplicate title)
      if (
        (err.code && err.code === "23505") ||
        (err.cause && err.cause.code === "23505") ||
        (err.message && err.message.includes("duplicate")) ||
        (err.cause &&
          err.cause.message &&
          err.cause.message.includes("duplicate"))
      ) {
        throw new Error("A book with this title already exists");
      }
      throw err;
    }
  },
};

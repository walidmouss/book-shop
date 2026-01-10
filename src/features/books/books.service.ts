import { count, desc, eq } from "drizzle-orm";
import { db } from "../../config/db.js";
import { authors } from "../../db/authors.js";
import { books } from "../../db/books.js";
import { categories } from "../../db/categories.js";
import { PaginationInput } from "./books.schema.js";

export const booksService = {
  async listBooks(pagination: PaginationInput) {
    const offset = (pagination.page - 1) * pagination.limit;

    // Total count
    const countResult = await db.select({ count: count() }).from(books);
    const totalBooks = countResult[0]?.count || 0;

    // Fetch paginated books with author and category
    const rows = await db
      .select({
        id: books.id,
        title: books.title,
        description: books.description,
        price: books.price,
        thumbnail: books.thumbnail,
        authorName: authors.name,
        categoryName: categories.name,
        createdAt: books.createdAt,
        updatedAt: books.updatedAt,
      })
      .from(books)
      .innerJoin(authors, eq(books.author_id, authors.id))
      .innerJoin(categories, eq(books.category_id, categories.id))
      .orderBy(desc(books.createdAt))
      .limit(pagination.limit)
      .offset(offset);

    return {
      data: rows.map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        price: row.price,
        thumbnail: row.thumbnail,
        author: row.authorName,
        category: row.categoryName,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })),
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: totalBooks,
        totalPages: Math.ceil(totalBooks / pagination.limit),
      },
    };
  },
};

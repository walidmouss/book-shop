import { count, desc, eq } from "drizzle-orm";
import { db } from "../../config/db.js";
import { authors } from "../../db/authors.js";
import { books } from "../../db/books.js";
import { categories } from "../../db/categories.js";
import { tags, book_tags } from "../../db/tags.js";
import { PaginationInput, BookIdInput } from "./books.schema.js";

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

    // Get tags for each book
    const booksWithTags = await Promise.all(
      rows.map(async (row) => {
        const bookTagsResult = await db
          .select({ tagName: tags.name })
          .from(book_tags)
          .innerJoin(tags, eq(book_tags.tag_id, tags.id))
          .where(eq(book_tags.book_id, row.id));

        return {
          id: row.id,
          title: row.title,
          description: row.description,
          price: row.price,
          thumbnail: row.thumbnail,
          author: row.authorName,
          category: row.categoryName,
          tags: bookTagsResult.map((t) => t.tagName),
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        };
      })
    );

    return {
      data: booksWithTags,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: totalBooks,
        totalPages: Math.ceil(totalBooks / pagination.limit),
      },
    };
  },

  async getBookDetails(bookId: BookIdInput) {
    const result = await db
      .select({
        id: books.id,
        title: books.title,
        description: books.description,
        price: books.price,
        thumbnail: books.thumbnail,
        author: authors.name,
        category: categories.name,
        createdAt: books.createdAt,
        updatedAt: books.updatedAt,
      })
      .from(books)
      .innerJoin(authors, eq(books.author_id, authors.id))
      .innerJoin(categories, eq(books.category_id, categories.id))
      .where(eq(books.id, bookId.id))
      .limit(1);

    if (!result[0]) return null;

    // Get tags for this book
    const bookTagsResult = await db
      .select({ tagName: tags.name })
      .from(book_tags)
      .innerJoin(tags, eq(book_tags.tag_id, tags.id))
      .where(eq(book_tags.book_id, bookId.id));

    return {
      ...result[0],
      tags: bookTagsResult.map((t) => t.tagName),
    };
  },
};

import {
  eq,
  count,
  ilike,
  and,
  asc,
  desc,
  inArray,
  gte,
  lte,
} from "drizzle-orm";
import { db } from "../../config/db.js";
import { authors } from "../../db/authors.js";
import { books } from "../../db/books.js";
import { categories } from "../../db/categories.js";
import { users } from "../../db/users.js";
import { tags, book_tags } from "../../db/tags.js";
import {
  CreateBookInput,
  UpdateBookInput,
  PaginationInput,
} from "./myBooks.schema.js";

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

      // Handle tags if provided
      const bookTags: string[] = [];
      if (data.tags && data.tags.length > 0) {
        const tagIds: number[] = [];

        for (const tagName of data.tags) {
          const trimmedTag = tagName.trim();
          if (!trimmedTag) continue;

          // Find or create tag
          let [tag] = await db
            .select()
            .from(tags)
            .where(eq(tags.name, trimmedTag))
            .limit(1);

          if (!tag) {
            [tag] = await db
              .insert(tags)
              .values({ name: trimmedTag })
              .returning();
          }

          tagIds.push(tag.id);
          bookTags.push(tag.name);
        }

        // Create book-tag associations
        if (tagIds.length > 0) {
          await db
            .insert(book_tags)
            .values(
              tagIds.map((tagId) => ({ book_id: book.id, tag_id: tagId }))
            );
        }
      }

      return {
        id: book.id,
        title: book.title,
        description: book.description,
        price: book.price,
        thumbnail: book.thumbnail,
        category: category.name,
        author: author.name,
        tags: bookTags,
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

  async getMyBooks(userId: number, pagination: PaginationInput) {
    const offset = (pagination.page - 1) * pagination.limit;

    // Build where conditions
    const whereConditions = [eq(books.creator_id, userId)];
    const trimmedTitle = pagination.title.trim();
    if (trimmedTitle) {
      whereConditions.push(ilike(books.title, `%${trimmedTitle}%`));
    }

    const trimmedCategory = pagination.category.trim();
    if (trimmedCategory) {
      whereConditions.push(ilike(categories.name, `%${trimmedCategory}%`));
    }

    if (pagination.minPrice !== undefined) {
      whereConditions.push(gte(books.price, pagination.minPrice.toString()));
    }

    if (pagination.maxPrice !== undefined) {
      whereConditions.push(lte(books.price, pagination.maxPrice.toString()));
    }

    // Get total count of user's books
    const countResult = await db
      .select({ count: count() })
      .from(books)
      .innerJoin(categories, eq(books.category_id, categories.id))
      .where(and(...whereConditions));
    const totalBooks = countResult[0]?.count || 0;

    // Get paginated books with related data
    const orderBy =
      pagination.sort === "desc" ? desc(books.title) : asc(books.title);
    const userBooks = await db
      .select({
        id: books.id,
        title: books.title,
        description: books.description,
        price: books.price,
        thumbnail: books.thumbnail,
        author_id: books.author_id,
        category_id: books.category_id,
        createdAt: books.createdAt,
        updatedAt: books.updatedAt,
      })
      .from(books)
      .innerJoin(categories, eq(books.category_id, categories.id))
      .where(and(...whereConditions))
      .orderBy(orderBy)
      .limit(pagination.limit)
      .offset(offset);

    // Get author and category names for each book
    const booksWithDetails = await Promise.all(
      userBooks.map(async (book) => {
        const [author] = await db
          .select()
          .from(authors)
          .where(eq(authors.id, book.author_id))
          .limit(1);

        const [category] = await db
          .select()
          .from(categories)
          .where(eq(categories.id, book.category_id))
          .limit(1);

        // Get tags for this book
        const bookTagsResult = await db
          .select({ tagName: tags.name })
          .from(book_tags)
          .innerJoin(tags, eq(book_tags.tag_id, tags.id))
          .where(eq(book_tags.book_id, book.id));

        const bookTagNames = bookTagsResult.map((t) => t.tagName);

        return {
          id: book.id,
          title: book.title,
          description: book.description,
          price: book.price,
          thumbnail: book.thumbnail,
          author: author?.name,
          category: category?.name,
          tags: bookTagNames,
          createdAt: book.createdAt,
          updatedAt: book.updatedAt,
        };
      })
    );

    return {
      data: booksWithDetails,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: totalBooks,
        totalPages: Math.ceil(totalBooks / pagination.limit),
      },
    };
  },

  async updateBook(userId: number, bookId: number, data: UpdateBookInput) {
    // Verify the book exists and belongs to the user
    const [book] = await db
      .select()
      .from(books)
      .where(and(eq(books.id, bookId), eq(books.creator_id, userId)))
      .limit(1);

    if (!book) {
      throw new Error(
        "Book not found or you do not have permission to edit it"
      );
    }

    // Prepare update values
    const updateValues: any = {};

    // Handle category if provided
    let categoryId = book.category_id;
    if (data.category) {
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
      categoryId = category.id;
      updateValues.category_id = categoryId;
    }

    // Handle author if provided
    let authorId = book.author_id;
    if (data.author) {
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
      authorId = author.id;
      updateValues.author_id = authorId;
    }

    // Handle other fields
    if (data.title !== undefined) {
      updateValues.title = data.title;
    }
    if (data.description !== undefined) {
      updateValues.description = data.description;
    }
    if (data.price !== undefined) {
      updateValues.price = data.price.toString();
    }
    if (data.thumbnail !== undefined) {
      updateValues.thumbnail = data.thumbnail;
    }

    // Update the book
    try {
      let updatedBook;

      // Only update if there are values to update
      if (Object.keys(updateValues).length > 0) {
        const result = await db
          .update(books)
          .set(updateValues)
          .where(eq(books.id, bookId))
          .returning();
        updatedBook = result[0];
      } else {
        // If no fields to update, fetch the existing book
        const result = await db
          .select()
          .from(books)
          .where(eq(books.id, bookId))
          .limit(1);
        updatedBook = result[0];
      }

      // Handle tags if provided
      const bookTags: string[] = [];
      if (data.tags !== undefined) {
        // Delete existing tags for this book
        await db.delete(book_tags).where(eq(book_tags.book_id, bookId));

        // Add new tags
        if (data.tags.length > 0) {
          const tagIds: number[] = [];

          for (const tagName of data.tags) {
            const trimmedTag = tagName.trim();
            if (!trimmedTag) continue;

            // Find or create tag
            let [tag] = await db
              .select()
              .from(tags)
              .where(eq(tags.name, trimmedTag))
              .limit(1);

            if (!tag) {
              [tag] = await db
                .insert(tags)
                .values({ name: trimmedTag })
                .returning();
            }

            tagIds.push(tag.id);
            bookTags.push(tag.name);
          }

          // Create book-tag associations
          if (tagIds.length > 0) {
            await db
              .insert(book_tags)
              .values(
                tagIds.map((tagId) => ({ book_id: bookId, tag_id: tagId }))
              );
          }
        }
      } else {
        // Get existing tags if not updating them
        const existingTags = await db
          .select({ tagName: tags.name })
          .from(book_tags)
          .innerJoin(tags, eq(book_tags.tag_id, tags.id))
          .where(eq(book_tags.book_id, bookId));

        existingTags.forEach((t) => bookTags.push(t.tagName));
      }

      // Get author and category names
      const [author] = await db
        .select()
        .from(authors)
        .where(eq(authors.id, updatedBook.author_id))
        .limit(1);

      const [category] = await db
        .select()
        .from(categories)
        .where(eq(categories.id, updatedBook.category_id))
        .limit(1);

      return {
        id: updatedBook.id,
        title: updatedBook.title,
        description: updatedBook.description,
        price: updatedBook.price,
        thumbnail: updatedBook.thumbnail,
        category: category?.name,
        author: author?.name,
        tags: bookTags,
        creatorId: updatedBook.creator_id,
        createdAt: updatedBook.createdAt,
        updatedAt: updatedBook.updatedAt,
      };
    } catch (err: any) {
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

  async deleteBook(userId: number, bookId: number) {
    // Verify the book exists and belongs to the user
    const [book] = await db
      .select()
      .from(books)
      .where(and(eq(books.id, bookId), eq(books.creator_id, userId)))
      .limit(1);

    if (!book) {
      throw new Error(
        "Book not found or you do not have permission to delete it"
      );
    }

    // Delete book-tag associations first (foreign key constraint)
    await db.delete(book_tags).where(eq(book_tags.book_id, bookId));

    // Delete the book
    await db.delete(books).where(eq(books.id, bookId));

    return { success: true, message: "Book deleted successfully" };
  },
};

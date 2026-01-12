import { Context } from "hono";
import { ZodError } from "zod";
import { myBooksService } from "./myBooks.service.js";
import {
  createBookSchema,
  updateBookSchema,
  paginationSchema,
} from "./myBooks.schema.js";

// Helper to format Zod validation errors
function formatZodError(error: ZodError): string {
  return error.issues
    .map((err) => {
      const field = err.path.join(".");
      return field ? `${field}: ${err.message}` : err.message;
    })
    .join(", ");
}

export const myBooksController = {
  async createBook(c: Context) {
    try {
      const userId = c.get("userId");
      const body = await c.req.json();
      const validatedData = createBookSchema.parse(body);
      const book = await myBooksService.createBook(userId, validatedData);

      return c.json({
        success: true,
        data: book,
      });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return c.json({ error: formatZodError(error) }, 400);
      }
      return c.json(
        {
          success: false,
          error: error.message,
        },
        400
      );
    }
  },

  async getMyBooks(c: Context) {
    try {
      const userId = c.get("userId");
      const query = c.req.query();

      const paginationData = paginationSchema.parse({
        page: query.page || "1",
        limit: query.limit || "10",
        title: query.title || "",
        sort: query.sort || "asc",
      });

      const result = await myBooksService.getMyBooks(userId, paginationData);

      return c.json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return c.json({ error: formatZodError(error) }, 400);
      }
      return c.json(
        {
          success: false,
          error: error.message,
        },
        500
      );
    }
  },

  async updateBook(c: Context) {
    try {
      const userId = c.get("userId");
      const bookId = parseInt(c.req.param("id"), 10);

      if (isNaN(bookId)) {
        return c.json({ error: "Invalid book ID" }, 400);
      }

      const body = await c.req.json();
      const validatedData = updateBookSchema.parse(body);
      const book = await myBooksService.updateBook(
        userId,
        bookId,
        validatedData
      );

      return c.json({
        success: true,
        data: book,
      });
    } catch (error: any) {
      if (error instanceof ZodError) {
        return c.json({ error: formatZodError(error) }, 400);
      }
      return c.json(
        {
          success: false,
          error: error.message,
        },
        error.message.includes("not found") ? 404 : 400
      );
    }
  },

  async deleteBook(c: Context) {
    try {
      const userId = c.get("userId");
      const bookId = parseInt(c.req.param("id"), 10);

      if (isNaN(bookId)) {
        return c.json({ error: "Invalid book ID" }, 400);
      }

      const result = await myBooksService.deleteBook(userId, bookId);

      return c.json(result);
    } catch (error: any) {
      return c.json(
        {
          success: false,
          error: error.message,
        },
        error.message.includes("not found") ? 404 : 400
      );
    }
  },
};

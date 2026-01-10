import { Context } from "hono";
import { ZodError } from "zod";
import { booksService } from "./books.service.js";
import { paginationSchema } from "./books.schema.js";

function formatZodError(error: ZodError): string {
  return error.issues
    .map((err) => {
      const field = err.path.join(".");
      return field ? `${field}: ${err.message}` : err.message;
    })
    .join(", ");
}

export const booksController = {
  async list(c: Context) {
    try {
      const query = c.req.query();
      const paginationData = paginationSchema.parse({
        page: query.page || "1",
        limit: query.limit || "10",
      });

      const result = await booksService.listBooks(paginationData);

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
};

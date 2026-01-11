import { Hono } from "hono";
import { booksController } from "./books.controller.js";

export const booksRoutes = new Hono();

// GET /books - List all books with pagination
booksRoutes.get("/", booksController.list);

// GET /books/:id - Get book details by ID
booksRoutes.get("/:id", booksController.getDetails);

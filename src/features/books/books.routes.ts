import { Hono } from "hono";
import { booksController } from "./books.controller.js";

export const booksRoutes = new Hono();

// GET /books - List all books with pagination
booksRoutes.get("/", booksController.list);

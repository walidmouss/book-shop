import { Hono } from "hono";
import { authMiddleware } from "../auth/auth.middleware.js";
import { myBooksController } from "./myBooks.controller.js";

export const myBooksRoutes = new Hono();

// Protect all routes
myBooksRoutes.use("*", authMiddleware);

// POST /my-books - Create a new book
myBooksRoutes.post("/", myBooksController.createBook);

// GET /my-books - Get user's books with pagination
myBooksRoutes.get("/", myBooksController.getMyBooks);

// PUT /my-books/:id - Update a book
myBooksRoutes.put("/:id", myBooksController.updateBook);

// DELETE /my-books/:id - Delete a book
myBooksRoutes.delete("/:id", myBooksController.deleteBook);

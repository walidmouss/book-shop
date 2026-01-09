import { Hono } from "hono";
import { authMiddleware } from "../auth/auth.middleware.js";
import { myBooksController } from "./myBooks.controller.js";

export const myBooksRoutes = new Hono();

// Protect all routes
myBooksRoutes.use("*", authMiddleware);

// POST /my-books - Create a new book
myBooksRoutes.post("/", myBooksController.createBook);

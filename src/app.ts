import { Hono } from "hono";
import { profileRoutes } from "./features/profile/profile.routes.js";
import { authRoutes } from "./features/auth/auth.routes.js";
import { myBooksRoutes } from "./features/myBooks/myBooks.routes.js";
import { booksRoutes } from "./features/books/books.routes.js";

export const app = new Hono();

app.get("/", (c) => {
  return c.json({ status: "ok" });
});

app.route("/auth", authRoutes);
app.route("/profile", profileRoutes);
app.route("/myBooks", myBooksRoutes);
app.route("/books", booksRoutes);

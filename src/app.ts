import { Hono } from "hono";
import { userRoutes } from "./features/user/user.routes.js";

export const app = new Hono();

app.get("/", (c) => {
  return c.json({ status: "ok" });
});

app.route("/users", userRoutes);


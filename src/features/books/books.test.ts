import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { booksService } from "./books.service.js";
import { myBooksService } from "../myBooks/myBooks.service.js";
import { AuthService } from "../auth/auth.service.js";
import { db } from "../../config/db.js";
import { users } from "../../db/users.js";
import { books } from "../../db/books.js";
import { categories } from "../../db/categories.js";
import { authors } from "../../db/authors.js";

async function clearAllTables() {
  await db.delete(books);
  await db.delete(authors);
  await db.delete(categories);
  await db.delete(users);
}

describe("Books listing", () => {
  let authService: AuthService;
  let userId: number;

  beforeAll(() => {
    if (!process.env.NODE_ENV?.includes("test")) {
      throw new Error("Tests must run with NODE_ENV=test to avoid data loss");
    }
  });

  beforeEach(async () => {
    await clearAllTables();
    authService = new AuthService();

    const result = await authService.register({
      username: "bookuser",
      email: "book@example.com",
      password: "password123",
    });
    userId = result.user.id;
  });

  it("should list books with pagination defaults", async () => {
    await myBooksService.createBook(userId, {
      title: "Book A",
      description: "Desc A",
      price: 10,
      category: "Cat1",
      author: "Author1",
      thumbnail: "https://example.com/a.jpg",
    });
    await myBooksService.createBook(userId, {
      title: "Book B",
      description: "Desc B",
      price: 20,
      category: "Cat2",
      author: "Author2",
      thumbnail: "https://example.com/b.jpg",
    });
    await myBooksService.createBook(userId, {
      title: "Book C",
      description: "Desc C",
      price: 30,
      category: "Cat3",
      author: "Author3",
      thumbnail: "https://example.com/c.jpg",
    });

    const result = await booksService.listBooks({ page: 1, limit: 10 });

    expect(result.data.length).toBe(3);
    expect(result.pagination.total).toBe(3);
    expect(result.pagination.page).toBe(1);
    expect(result.pagination.limit).toBe(10);

    // Sorted by createdAt desc, so last inserted comes first
    expect(result.data[0].title).toBe("Book C");
  });

  it("should paginate results", async () => {
    for (let i = 1; i <= 5; i++) {
      await myBooksService.createBook(userId, {
        title: `Paged Book ${i}`,
        description: `Desc ${i}`,
        price: i * 5,
        category: "PagedCat",
        author: "PagedAuthor",
        thumbnail: `https://example.com/p${i}.jpg`,
      });
    }

    const page1 = await booksService.listBooks({ page: 1, limit: 2 });
    const page2 = await booksService.listBooks({ page: 2, limit: 2 });

    expect(page1.data.length).toBe(2);
    expect(page2.data.length).toBe(2);
    expect(page1.pagination.total).toBe(5);
    expect(page1.pagination.totalPages).toBe(3);

    // Ensure different items across pages
    const titlesPage1 = page1.data.map((b) => b.title);
    const titlesPage2 = page2.data.map((b) => b.title);
    expect(titlesPage1.some((t) => titlesPage2.includes(t))).toBe(false);
  });

  it("should include author and category names", async () => {
    const book = await myBooksService.createBook(userId, {
      title: "Meta Book",
      description: "Meta Desc",
      price: 15,
      category: "MetaCat",
      author: "MetaAuthor",
      thumbnail: "https://example.com/meta.jpg",
    });

    const result = await booksService.listBooks({ page: 1, limit: 5 });
    const found = result.data.find((b) => b.id === book.id);

    expect(found).toBeDefined();
    expect(found?.author).toBe("MetaAuthor");
    expect(found?.category).toBe("MetaCat");
  });
});

describe("Book details", () => {
  let authService: AuthService;
  let userId: number;

  beforeAll(() => {
    if (!process.env.NODE_ENV?.includes("test")) {
      throw new Error("Tests must run with NODE_ENV=test to avoid data loss");
    }
  });

  beforeEach(async () => {
    await clearAllTables();
    authService = new AuthService();

    const result = await authService.register({
      username: "detailsuser",
      email: "details@example.com",
      password: "password123",
    });
    userId = result.user.id;
  });

  it("should return book details by ID", async () => {
    const book = await myBooksService.createBook(userId, {
      title: "Detailed Book",
      description: "This is a detailed description",
      price: 25,
      category: "Fiction",
      author: "John Doe",
      thumbnail: "https://example.com/detailed.jpg",
    });

    const result = await booksService.getBookDetails({ id: book.id });

    expect(result).toBeDefined();
    expect(result?.id).toBe(book.id);
    expect(result?.title).toBe("Detailed Book");
    expect(result?.description).toBe("This is a detailed description");
    expect(result?.price).toBe("25.00");
    expect(result?.author).toBe("John Doe");
    expect(result?.category).toBe("Fiction");
    expect(result?.thumbnail).toBe("https://example.com/detailed.jpg");
    expect(result?.createdAt).toBeDefined();
    expect(result?.updatedAt).toBeDefined();
  });

  it("should return null for non-existent book ID", async () => {
    const result = await booksService.getBookDetails({ id: 999999 });

    expect(result).toBeNull();
  });

  it("should include author and category names", async () => {
    const book = await myBooksService.createBook(userId, {
      title: "Complete Book",
      description: "Complete description",
      price: 30,
      category: "Science",
      author: "Jane Smith",
      thumbnail: "https://example.com/complete.jpg",
    });

    const result = await booksService.getBookDetails({ id: book.id });

    expect(result).toBeDefined();
    expect(result?.author).toBe("Jane Smith");
    expect(result?.category).toBe("Science");
  });

  it("should return correct data structure", async () => {
    const book = await myBooksService.createBook(userId, {
      title: "Structure Test",
      description: "Testing structure",
      price: 15,
      category: "Tech",
      author: "Test Author",
      thumbnail: "https://example.com/structure.jpg",
    });

    const result = await booksService.getBookDetails({ id: book.id });

    expect(result).toBeDefined();
    expect(result).toHaveProperty("id");
    expect(result).toHaveProperty("title");
    expect(result).toHaveProperty("description");
    expect(result).toHaveProperty("price");
    expect(result).toHaveProperty("thumbnail");
    expect(result).toHaveProperty("author");
    expect(result).toHaveProperty("category");
    expect(result).toHaveProperty("createdAt");
    expect(result).toHaveProperty("updatedAt");
  });
});

import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { booksService } from "./books.service.js";
import { myBooksService } from "../myBooks/myBooks.service.js";
import { AuthService } from "../auth/auth.service.js";
import { db } from "../../config/db.js";
import { users } from "../../db/users.js";
import { books } from "../../db/books.js";
import { categories } from "../../db/categories.js";
import { authors } from "../../db/authors.js";
import { tags, book_tags } from "../../db/tags.js";

async function clearAllTables() {
  await db.delete(book_tags);
  await db.delete(books);
  await db.delete(authors);
  await db.delete(categories);
  await db.delete(tags);
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

    const result = await booksService.listBooks({
      page: 1,
      limit: 10,
      title: "",
    });

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

    const page1 = await booksService.listBooks({
      page: 1,
      limit: 2,
      title: "",
    });
    const page2 = await booksService.listBooks({
      page: 2,
      limit: 2,
      title: "",
    });

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

    const result = await booksService.listBooks({
      page: 1,
      limit: 5,
      title: "",
    });
    const found = result.data.find((b) => b.id === book.id);

    expect(found).toBeDefined();
    expect(found?.author).toBe("MetaAuthor");
    expect(found?.category).toBe("MetaCat");
  });

  it("should search by title exact match", async () => {
    await myBooksService.createBook(userId, {
      title: "The Great Adventure",
      description: "An adventure story",
      price: 20,
      category: "Fiction",
      author: "Author A",
      thumbnail: "https://example.com/adventure.jpg",
    });

    await myBooksService.createBook(userId, {
      title: "Another Book",
      description: "Different book",
      price: 15,
      category: "Drama",
      author: "Author B",
      thumbnail: "https://example.com/another.jpg",
    });

    const result = await booksService.listBooks({
      page: 1,
      limit: 10,
      title: "The Great Adventure",
    });

    expect(result.data.length).toBe(1);
    expect(result.data[0].title).toBe("The Great Adventure");
  });

  it("should search by title partial match", async () => {
    await myBooksService.createBook(userId, {
      title: "Mystery House",
      description: "Mystery story",
      price: 18,
      category: "Mystery",
      author: "Author C",
      thumbnail: "https://example.com/mystery.jpg",
    });

    await myBooksService.createBook(userId, {
      title: "House of Cards",
      description: "Political thriller",
      price: 22,
      category: "Thriller",
      author: "Author D",
      thumbnail: "https://example.com/cards.jpg",
    });

    const result = await booksService.listBooks({
      page: 1,
      limit: 10,
      title: "House",
    });

    expect(result.data.length).toBe(2);
    expect(result.data.some((b) => b.title === "Mystery House")).toBe(true);
    expect(result.data.some((b) => b.title === "House of Cards")).toBe(true);
  });

  it("should search case-insensitively", async () => {
    await myBooksService.createBook(userId, {
      title: "JavaScript Guide",
      description: "JS tutorial",
      price: 30,
      category: "Programming",
      author: "Tech Author",
      thumbnail: "https://example.com/js.jpg",
    });

    const result = await booksService.listBooks({
      page: 1,
      limit: 10,
      title: "javascript",
    });

    expect(result.data.length).toBe(1);
    expect(result.data[0].title).toBe("JavaScript Guide");
  });

  it("should return empty array for non-matching title", async () => {
    await myBooksService.createBook(userId, {
      title: "Some Book",
      description: "Description",
      price: 10,
      category: "Fiction",
      author: "Author",
      thumbnail: "https://example.com/some.jpg",
    });

    const result = await booksService.listBooks({
      page: 1,
      limit: 10,
      title: "NonExistent",
    });

    expect(result.data.length).toBe(0);
    expect(result.pagination.total).toBe(0);
  });

  it("should apply pagination with title filter", async () => {
    for (let i = 1; i <= 5; i++) {
      await myBooksService.createBook(userId, {
        title: `Search Book ${i}`,
        description: `Desc ${i}`,
        price: i * 5,
        category: "Cat",
        author: "Author",
        thumbnail: `https://example.com/search${i}.jpg`,
      });
    }

    const result = await booksService.listBooks({
      page: 1,
      limit: 2,
      title: "Search",
    });

    expect(result.data.length).toBe(2);
    expect(result.pagination.total).toBe(5);
    expect(result.pagination.totalPages).toBe(3);
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

  it("should include tags in book details", async () => {
    const book = await myBooksService.createBook(userId, {
      title: "Book With Tags",
      description: "A book with tags",
      price: 25,
      category: "Fiction",
      author: "Tagged Author",
      thumbnail: "https://example.com/tagged.jpg",
      tags: ["adventure", "fantasy"],
    });

    const result = await booksService.getBookDetails({ id: book.id });

    expect(result).toBeDefined();
    expect(result?.tags).toBeDefined();
    expect(result?.tags?.length).toBe(2);
    expect(result?.tags).toContain("adventure");
    expect(result?.tags).toContain("fantasy");
  });

  it("should return empty tags array for books without tags", async () => {
    const book = await myBooksService.createBook(userId, {
      title: "Book Without Tags",
      description: "A book without tags",
      price: 20,
      category: "Drama",
      author: "No Tags Author",
      thumbnail: "https://example.com/notags.jpg",
    });

    const result = await booksService.getBookDetails({ id: book.id });

    expect(result).toBeDefined();
    expect(result?.tags).toBeDefined();
    expect(result?.tags?.length).toBe(0);
  });
});

describe("Books listing with tags", () => {
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
      username: "booksuser",
      email: "books@example.com",
      password: "password123",
    });
    userId = result.user.id;
  });

  it("should include tags in book listing", async () => {
    await myBooksService.createBook(userId, {
      title: "Tagged Book A",
      description: "First tagged book",
      price: 18,
      category: "Sci-Fi",
      author: "Author A",
      thumbnail: "https://example.com/scifi.jpg",
      tags: ["space", "futuristic"],
    });

    const result = await booksService.listBooks({
      page: 1,
      limit: 10,
      title: "",
    });

    expect(result.data.length).toBe(1);
    expect(result.data[0].tags).toBeDefined();
    expect(result.data[0].tags?.length).toBe(2);
    expect(result.data[0].tags).toContain("space");
    expect(result.data[0].tags).toContain("futuristic");
  });

  it("should return correct tags for multiple books in listing", async () => {
    await myBooksService.createBook(userId, {
      title: "Book One",
      description: "First book",
      price: 15,
      category: "Fiction",
      author: "Author One",
      thumbnail: "https://example.com/one.jpg",
      tags: ["tag1", "tag2"],
    });

    await myBooksService.createBook(userId, {
      title: "Book Two",
      description: "Second book",
      price: 20,
      category: "Mystery",
      author: "Author Two",
      thumbnail: "https://example.com/two.jpg",
      tags: ["tag3"],
    });

    const result = await booksService.listBooks({
      page: 1,
      limit: 10,
      title: "",
    });

    expect(result.data.length).toBe(2);
    const bookOne = result.data.find((b) => b.title === "Book One");
    const bookTwo = result.data.find((b) => b.title === "Book Two");

    expect(bookOne?.tags?.length).toBe(2);
    expect(bookTwo?.tags?.length).toBe(1);
  });

  it("should include tags property for all books in listing", async () => {
    await myBooksService.createBook(userId, {
      title: "Tagged Book",
      description: "Has tags",
      price: 25,
      category: "Fiction",
      author: "Author",
      thumbnail: "https://example.com/tagged.jpg",
      tags: ["recommended"],
    });

    await myBooksService.createBook(userId, {
      title: "Untagged Book",
      description: "No tags",
      price: 22,
      category: "Drama",
      author: "Another Author",
      thumbnail: "https://example.com/untagged.jpg",
    });

    const result = await booksService.listBooks({
      page: 1,
      limit: 10,
      title: "",
    });

    expect(result.data.length).toBe(2);
    result.data.forEach((book) => {
      expect(book).toHaveProperty("tags");
      expect(Array.isArray(book.tags)).toBe(true);
    });
  });
});

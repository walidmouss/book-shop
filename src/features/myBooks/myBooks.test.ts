import { describe, it, expect, beforeEach, beforeAll, afterAll } from "vitest";
import { myBooksService } from "./myBooks.service.js";
import { AuthService } from "../auth/auth.service.js";
import { db } from "../../config/db.js";
import { users } from "../../db/users.js";
import { books } from "../../db/books.js";
import { categories } from "../../db/categories.js";
import { authors } from "../../db/authors.js";
import { eq } from "drizzle-orm";

// Helper functions
async function clearAllTables() {
  await db.delete(books);
  await db.delete(authors);
  await db.delete(categories);
  await db.delete(users);
}

describe("MyBooks Service", () => {
  let testUserId: number;
  let authService: AuthService;

  beforeAll(() => {
    // Ensure tests only run in test environment
    if (!process.env.NODE_ENV?.includes("test")) {
      throw new Error("Tests must run with NODE_ENV=test to avoid data loss");
    }
  });

  beforeEach(async () => {
    await clearAllTables();
    authService = new AuthService();

    // Create a test user
    const result = await authService.register({
      username: "testuser",
      email: "test@example.com",
      password: "password123",
    });
    testUserId = result.user.id;
  });

  describe("createBook", () => {
    it("should create a book with valid data", async () => {
      const bookData = {
        title: "Test Book",
        description: "This is a test book description",
        price: 19.99,
        category: "Fiction",
        author: "John Doe",
        thumbnail: "https://example.com/book.jpg",
      };

      const book = await myBooksService.createBook(testUserId, bookData);

      expect(book).toBeDefined();
      expect(book.id).toBeDefined();
      expect(book.title).toBe("Test Book");
      expect(book.description).toBe("This is a test book description");
      expect(book.price).toBe("19.99");
      expect(book.category).toBe("Fiction");
      expect(book.author).toBe("John Doe");
      expect(book.creatorId).toBe(testUserId);
    });

    it("should create a book with thumbnail", async () => {
      const bookData = {
        title: "Book With Thumbnail",
        description: "A book with a thumbnail",
        price: 9.99,
        category: "Mystery",
        author: "Jane Smith",
        thumbnail: "https://example.com/mystery.jpg",
      };

      const book = await myBooksService.createBook(testUserId, bookData);

      expect(book).toBeDefined();
      expect(book.title).toBe("Book With Thumbnail");
      expect(book.thumbnail).toBe("https://example.com/mystery.jpg");
    });

    it("should reuse existing category", async () => {
      const bookData1 = {
        title: "Book 1",
        description: "First book",
        price: 15.99,
        category: "Science Fiction",
        author: "Author 1",
        thumbnail: "https://example.com/book1.jpg",
      };

      const bookData2 = {
        title: "Book 2",
        description: "Second book",
        price: 16.99,
        category: "Science Fiction",
        author: "Author 2",
        thumbnail: "https://example.com/book2.jpg",
      };

      const book1 = await myBooksService.createBook(testUserId, bookData1);
      const book2 = await myBooksService.createBook(testUserId, bookData2);

      expect(book1.category).toBe("Science Fiction");
      expect(book2.category).toBe("Science Fiction");

      // Verify only one category was created
      const categories_list = await db.select().from(categories);
      const scifiCount = categories_list.filter(
        (c) => c.name === "Science Fiction"
      ).length;
      expect(scifiCount).toBe(1);
    });

    it("should create new author if not exists", async () => {
      const bookData = {
        title: "New Author Book",
        description: "A book by a new author",
        price: 12.99,
        category: "Biography",
        author: "Completely New Author",
        thumbnail: "https://example.com/bio.jpg",
      };

      await myBooksService.createBook(testUserId, bookData);

      const author_list = await db.select().from(authors);
      const newAuthor = author_list.find(
        (a) => a.name === "Completely New Author"
      );
      expect(newAuthor).toBeDefined();
    });

    it("should reuse existing author", async () => {
      const bookData1 = {
        title: "Book by Author A",
        description: "First book",
        price: 14.99,
        category: "History",
        author: "Author A",
        thumbnail: "https://example.com/hist1.jpg",
      };

      const bookData2 = {
        title: "Another Book by Author A",
        description: "Second book",
        price: 14.99,
        category: "History",
        author: "Author A",
        thumbnail: "https://example.com/hist2.jpg",
      };

      await myBooksService.createBook(testUserId, bookData1);
      await myBooksService.createBook(testUserId, bookData2);

      // Verify only one author was created
      const author_list = await db.select().from(authors);
      const authorACount = author_list.filter(
        (a) => a.name === "Author A"
      ).length;
      expect(authorACount).toBe(1);
    });

    it("should throw error for duplicate title", async () => {
      const bookData = {
        title: "Duplicate Title",
        description: "First book with this title",
        price: 10.99,
        category: "Drama",
        author: "Author X",
        thumbnail: "https://example.com/drama.jpg",
      };

      await myBooksService.createBook(testUserId, bookData);

      // Try to create another book with same title
      await expect(
        myBooksService.createBook(testUserId, bookData)
      ).rejects.toThrow("A book with this title already exists");
    });

    it("should throw error for non-existent user", async () => {
      const bookData = {
        title: "Test Book",
        description: "Test description",
        price: 15.99,
        category: "Fiction",
        author: "Test Author",
        thumbnail: "https://example.com/test.jpg",
      };

      await expect(myBooksService.createBook(99999, bookData)).rejects.toThrow(
        "User not found"
      );
    });

    it("should properly format price as string", async () => {
      const bookData = {
        title: "Price Format Test",
        description: "Testing price formatting",
        price: 99.99,
        category: "Romance",
        author: "Author Y",
        thumbnail: "https://example.com/romance.jpg",
      };

      const book = await myBooksService.createBook(testUserId, bookData);

      expect(typeof book.price).toBe("string");
      expect(book.price).toBe("99.99");
    });

    it("should trim whitespace from category and author names", async () => {
      const bookData = {
        title: "Whitespace Test",
        description: "Testing whitespace trimming",
        price: 11.99,
        category: "  Fantasy  ",
        author: "  Author Z  ",
        thumbnail: "https://example.com/fantasy.jpg",
      };

      const book = await myBooksService.createBook(testUserId, bookData);

      expect(book.category).toBe("Fantasy");
      expect(book.author).toBe("Author Z");
    });

    it("should set creator_id to the authenticated user", async () => {
      const bookData = {
        title: "Creator Test",
        description: "Testing creator assignment",
        price: 13.99,
        category: "Thriller",
        author: "Author T",
        thumbnail: "https://example.com/thriller.jpg",
      };

      const book = await myBooksService.createBook(testUserId, bookData);

      expect(book.creatorId).toBe(testUserId);
    });

    it("should handle multiple books by different authors in same category", async () => {
      const categoryName = "Science";

      const book1Data = {
        title: "Science Book 1",
        description: "Book 1",
        price: 20.0,
        category: categoryName,
        author: "Scientist 1",
        thumbnail: "https://example.com/science1.jpg",
      };

      const book2Data = {
        title: "Science Book 2",
        description: "Book 2",
        price: 21.0,
        category: categoryName,
        author: "Scientist 2",
        thumbnail: "https://example.com/science2.jpg",
      };

      const book1 = await myBooksService.createBook(testUserId, book1Data);
      const book2 = await myBooksService.createBook(testUserId, book2Data);

      expect(book1.category).toBe(categoryName);
      expect(book2.category).toBe(categoryName);
      expect(book1.author).not.toBe(book2.author);

      // Verify only one category but two authors
      const categories_list = await db.select().from(categories);
      const scienceCount = categories_list.filter(
        (c) => c.name === categoryName
      ).length;
      expect(scienceCount).toBe(1);

      const author_list = await db.select().from(authors);
      expect(author_list.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("getMyBooks", () => {
    beforeEach(async () => {
      // Create multiple books for testing
      await myBooksService.createBook(testUserId, {
        title: "House of Horror",
        description: "A scary book",
        price: 15.99,
        category: "Horror",
        author: "Stephen King",
        thumbnail: "https://example.com/horror.jpg",
      });

      await myBooksService.createBook(testUserId, {
        title: "The Great Gatsby",
        description: "A classic novel",
        price: 12.99,
        category: "Fiction",
        author: "F. Scott Fitzgerald",
        thumbnail: "https://example.com/gatsby.jpg",
      });

      await myBooksService.createBook(testUserId, {
        title: "House of the Dragon",
        description: "A fantasy epic",
        price: 18.99,
        category: "Fantasy",
        author: "George R. R. Martin",
        thumbnail: "https://example.com/dragon.jpg",
      });

      await myBooksService.createBook(testUserId, {
        title: "1984",
        description: "A dystopian novel",
        price: 14.99,
        category: "Science Fiction",
        author: "George Orwell",
        thumbnail: "https://example.com/1984.jpg",
      });
    });

    it("should return all books without title filter", async () => {
      const result = await myBooksService.getMyBooks(testUserId, {
        page: 1,
        limit: 10,
        title: "",
        sort: "asc",
      });

      expect(result.data.length).toBe(4);
      expect(result.pagination.total).toBe(4);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(10);
    });

    it("should search by exact title match", async () => {
      const result = await myBooksService.getMyBooks(testUserId, {
        page: 1,
        limit: 10,
        title: "House of Horror",
        sort: "asc",
      });

      expect(result.data.length).toBe(1);
      expect(result.data[0].title).toBe("House of Horror");
      expect(result.pagination.total).toBe(1);
    });

    it("should search by partial title match", async () => {
      const result = await myBooksService.getMyBooks(testUserId, {
        page: 1,
        limit: 10,
        title: "House",
        sort: "asc",
      });

      expect(result.data.length).toBe(2);
      expect(result.data.some((b) => b.title === "House of Horror")).toBe(true);
      expect(result.data.some((b) => b.title === "House of the Dragon")).toBe(
        true
      );
      expect(result.pagination.total).toBe(2);
    });

    it("should search case-insensitively", async () => {
      const result1 = await myBooksService.getMyBooks(testUserId, {
        page: 1,
        limit: 10,
        title: "house",
        sort: "asc",
      });

      const result2 = await myBooksService.getMyBooks(testUserId, {
        page: 1,
        limit: 10,
        title: "HOUSE",
        sort: "asc",
      });

      const result3 = await myBooksService.getMyBooks(testUserId, {
        page: 1,
        limit: 10,
        title: "HoUsE",
        sort: "asc",
      });

      expect(result1.data.length).toBe(2);
      expect(result2.data.length).toBe(2);
      expect(result3.data.length).toBe(2);
    });

    it("should return empty array for non-matching title", async () => {
      const result = await myBooksService.getMyBooks(testUserId, {
        page: 1,
        limit: 10,
        title: "NonexistentBook",
        sort: "asc",
      });

      expect(result.data.length).toBe(0);
      expect(result.pagination.total).toBe(0);
    });

    it("should apply pagination with title filter", async () => {
      const result = await myBooksService.getMyBooks(testUserId, {
        page: 1,
        limit: 2,
        title: "",
        sort: "asc",
      });

      expect(result.data.length).toBe(2);
      expect(result.pagination.total).toBe(4);
      expect(result.pagination.totalPages).toBe(2);
    });

    it("should return correct pagination data with title filter", async () => {
      const result = await myBooksService.getMyBooks(testUserId, {
        page: 1,
        limit: 3,
        title: "House",
        sort: "asc",
      });

      expect(result.data.length).toBe(2);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.totalPages).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.limit).toBe(3);
    });

    it("should trim whitespace from search title", async () => {
      const result = await myBooksService.getMyBooks(testUserId, {
        page: 1,
        limit: 10,
        title: "  House  ",
        sort: "asc",
      });

      expect(result.data.length).toBe(2);
    });

    it("should return books only for current user", async () => {
      // Create another user
      const result2 = await authService.register({
        username: "testuser2",
        email: "test2@example.com",
        password: "password123",
      });
      const testUserId2 = result2.user.id;

      // Create a book for the second user
      await myBooksService.createBook(testUserId2, {
        title: "House of Cards",
        description: "A thriller",
        price: 16.99,
        category: "Thriller",
        author: "Other Author",
        thumbnail: "https://example.com/cards.jpg",
      });

      // Search for "House" with first user
      const result = await myBooksService.getMyBooks(testUserId, {
        page: 1,
        limit: 10,
        title: "House",
        sort: "asc",
      });

      // Should only find 2 books (Horror and Dragon), not Cards
      expect(result.data.length).toBe(2);
      expect(result.data.every((b) => b.id !== undefined)).toBe(true);
    });

    it("should sort books A-Z by default", async () => {
      const result = await myBooksService.getMyBooks(testUserId, {
        page: 1,
        limit: 10,
        title: "",
        sort: "asc",
      });

      expect(result.data.length).toBe(4);
      expect(result.data[0].title).toBe("1984");
      expect(result.data[1].title).toBe("House of Horror");
      expect(result.data[2].title).toBe("House of the Dragon");
      expect(result.data[3].title).toBe("The Great Gatsby");
    });

    it("should sort books Z-A in descending order", async () => {
      const result = await myBooksService.getMyBooks(testUserId, {
        page: 1,
        limit: 10,
        title: "",
        sort: "desc",
      });

      expect(result.data.length).toBe(4);
      expect(result.data[0].title).toBe("The Great Gatsby");
      expect(result.data[1].title).toBe("House of the Dragon");
      expect(result.data[2].title).toBe("House of Horror");
      expect(result.data[3].title).toBe("1984");
    });

    it("should apply sorting with title filter", async () => {
      const result = await myBooksService.getMyBooks(testUserId, {
        page: 1,
        limit: 10,
        title: "House",
        sort: "desc",
      });

      expect(result.data.length).toBe(2);
      expect(result.data[0].title).toBe("House of the Dragon");
      expect(result.data[1].title).toBe("House of Horror");
    });

    it("should apply sorting with pagination", async () => {
      const result = await myBooksService.getMyBooks(testUserId, {
        page: 1,
        limit: 2,
        title: "",
        sort: "asc",
      });

      expect(result.data.length).toBe(2);
      expect(result.data[0].title).toBe("1984");
      expect(result.data[1].title).toBe("House of Horror");
    });
  });
});

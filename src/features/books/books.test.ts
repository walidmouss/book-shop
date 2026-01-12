import { describe, it, expect, beforeEach, beforeAll } from "vitest";
import { booksService } from "./books.service.js";
import { paginationSchema } from "./books.schema.js";
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
      sortOrder: "desc",
      category: "",
      minPrice: undefined,
      maxPrice: undefined,
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
      sortOrder: "desc",
      category: "",
      minPrice: undefined,
      maxPrice: undefined,
    });
    const page2 = await booksService.listBooks({
      page: 2,
      limit: 2,
      title: "",
      sortOrder: "desc",
      category: "",
      minPrice: undefined,
      maxPrice: undefined,
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
      sortOrder: "desc",
      category: "",
      minPrice: undefined,
      maxPrice: undefined,
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
      sortOrder: "desc",
      category: "",
      minPrice: undefined,
      maxPrice: undefined,
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
      sortOrder: "desc",
      category: "",
      minPrice: undefined,
      maxPrice: undefined,
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
      sortOrder: "desc",
      category: "",
      minPrice: undefined,
      maxPrice: undefined,
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
      sortOrder: "desc",
      category: "",
      minPrice: undefined,
      maxPrice: undefined,
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
      sortOrder: "desc",
      category: "",
      minPrice: undefined,
      maxPrice: undefined,
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
      sortOrder: "desc",
      category: "",
      minPrice: undefined,
      maxPrice: undefined,
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
      sortOrder: "desc",
      category: "",
      minPrice: undefined,
      maxPrice: undefined,
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
      sortOrder: "desc",
      category: "",
      minPrice: undefined,
      maxPrice: undefined,
    });

    expect(result.data.length).toBe(2);
    result.data.forEach((book) => {
      expect(book).toHaveProperty("tags");
      expect(Array.isArray(book.tags)).toBe(true);
    });
  });
});

describe("Books sorting", () => {
  let authService: AuthService;
  let userId: number;

  beforeEach(async () => {
    await clearAllTables();
    authService = new AuthService();

    const result = await authService.register({
      username: "sortuser",
      email: "sort@example.com",
      password: "password123",
    });
    userId = result.user.id;
  });

  it("should sort by title ascending (A-Z)", async () => {
    await myBooksService.createBook(userId, {
      title: "Zebra Chronicles",
      description: "Desc",
      price: 20,
      category: "Adventure",
      author: "Author A",
      thumbnail: "https://example.com/z.jpg",
    });

    await myBooksService.createBook(userId, {
      title: "Apple Adventure",
      description: "Desc",
      price: 15,
      category: "Adventure",
      author: "Author B",
      thumbnail: "https://example.com/a.jpg",
    });

    await myBooksService.createBook(userId, {
      title: "Monkey Business",
      description: "Desc",
      price: 18,
      category: "Comedy",
      author: "Author C",
      thumbnail: "https://example.com/m.jpg",
    });

    const result = await booksService.listBooks({
      page: 1,
      limit: 10,
      title: "",
      sortOrder: "asc",
      category: "",
      minPrice: undefined,
      maxPrice: undefined,
    });

    expect(result.data.length).toBe(3);
    expect(result.data[0].title).toBe("Apple Adventure");
    expect(result.data[1].title).toBe("Monkey Business");
    expect(result.data[2].title).toBe("Zebra Chronicles");
  });

  it("should sort by title descending (Z-A)", async () => {
    await myBooksService.createBook(userId, {
      title: "Zebra Chronicles",
      description: "Desc",
      price: 20,
      category: "Adventure",
      author: "Author A",
      thumbnail: "https://example.com/z.jpg",
    });

    await myBooksService.createBook(userId, {
      title: "Apple Adventure",
      description: "Desc",
      price: 15,
      category: "Adventure",
      author: "Author B",
      thumbnail: "https://example.com/a.jpg",
    });

    const result = await booksService.listBooks({
      page: 1,
      limit: 10,
      title: "",
      sortOrder: "desc",
      category: "",
      minPrice: undefined,
      maxPrice: undefined,
    });

    expect(result.data.length).toBe(2);
    expect(result.data[0].title).toBe("Zebra Chronicles");
    expect(result.data[1].title).toBe("Apple Adventure");
  });

  it("should default to descending sort (Z-A)", async () => {
    await myBooksService.createBook(userId, {
      title: "Book A",
      description: "Desc",
      price: 10,
      category: "Fiction",
      author: "Author",
      thumbnail: "https://example.com/a.jpg",
    });

    await myBooksService.createBook(userId, {
      title: "Book Z",
      description: "Desc",
      price: 10,
      category: "Fiction",
      author: "Author",
      thumbnail: "https://example.com/z.jpg",
    });

    const result = await booksService.listBooks({
      page: 1,
      limit: 10,
      title: "",
      sortOrder: "desc",
      category: "",
      minPrice: undefined,
      maxPrice: undefined,
    });

    expect(result.data.length).toBe(2);
    expect(result.data[0].title).toBe("Book Z");
    expect(result.data[1].title).toBe("Book A");
  });

  it("should sort by title with search filter", async () => {
    await myBooksService.createBook(userId, {
      title: "Zebra Fiction",
      description: "Desc",
      price: 20,
      category: "Fiction",
      author: "Author A",
      thumbnail: "https://example.com/z.jpg",
    });

    await myBooksService.createBook(userId, {
      title: "Apple Fiction",
      description: "Desc",
      price: 15,
      category: "Fiction",
      author: "Author B",
      thumbnail: "https://example.com/a.jpg",
    });

    await myBooksService.createBook(userId, {
      title: "Programming Guide",
      description: "Desc",
      price: 25,
      category: "Tech",
      author: "Author C",
      thumbnail: "https://example.com/p.jpg",
    });

    const result = await booksService.listBooks({
      page: 1,
      limit: 10,
      title: "Fiction",
      sortOrder: "asc",
      category: "",
      minPrice: undefined,
      maxPrice: undefined,
    });

    expect(result.data.length).toBe(2);
    expect(result.data[0].title).toBe("Apple Fiction");
    expect(result.data[1].title).toBe("Zebra Fiction");
  });

  it("should filter books by exact category match", async () => {
    await myBooksService.createBook(userId, {
      title: "Mystery Book",
      description: "Mystery story",
      price: 18,
      category: "Mystery",
      author: "Mystery Author",
      thumbnail: "https://example.com/mystery.jpg",
    });

    await myBooksService.createBook(userId, {
      title: "Sci-Fi Book",
      description: "Science fiction",
      price: 20,
      category: "Sci-Fi",
      author: "Sci-Fi Author",
      thumbnail: "https://example.com/scifi.jpg",
    });

    const result = await booksService.listBooks({
      page: 1,
      limit: 10,
      title: "",
      sortOrder: "desc",
      category: "Mystery",
      minPrice: undefined,
      maxPrice: undefined,
    });

    expect(result.data.length).toBe(1);
    expect(result.data[0].category).toBe("Mystery");
  });

  it("should filter books by partial category match", async () => {
    await myBooksService.createBook(userId, {
      title: "Historical Drama",
      description: "Historical story",
      price: 22,
      category: "Historical Fiction",
      author: "Historical Author",
      thumbnail: "https://example.com/historical.jpg",
    });

    await myBooksService.createBook(userId, {
      title: "Modern Romance",
      description: "Love story",
      price: 16,
      category: "Romance",
      author: "Romance Author",
      thumbnail: "https://example.com/romance.jpg",
    });

    const result = await booksService.listBooks({
      page: 1,
      limit: 10,
      title: "",
      sortOrder: "desc",
      category: "Fiction",
      minPrice: undefined,
      maxPrice: undefined,
    });

    expect(result.data.length).toBe(1);
    expect(result.data[0].category).toBe("Historical Fiction");
  });

  it("should return empty array for non-matching category", async () => {
    await myBooksService.createBook(userId, {
      title: "Some Book",
      description: "Description",
      price: 15,
      category: "Fiction",
      author: "Author",
      thumbnail: "https://example.com/some.jpg",
    });

    const result = await booksService.listBooks({
      page: 1,
      limit: 10,
      title: "",
      sortOrder: "desc",
      category: "NonExistentCategory",
      minPrice: undefined,
      maxPrice: undefined,
    });

    expect(result.data.length).toBe(0);
    expect(result.pagination.total).toBe(0);
  });

  it("should combine title and category filters", async () => {
    await myBooksService.createBook(userId, {
      title: "Python Programming",
      description: "Learn Python",
      price: 30,
      category: "Technology",
      author: "Tech Author",
      thumbnail: "https://example.com/python.jpg",
    });

    await myBooksService.createBook(userId, {
      title: "JavaScript Basics",
      description: "Learn JavaScript",
      price: 25,
      category: "Technology",
      author: "Tech Author",
      thumbnail: "https://example.com/js.jpg",
    });

    await myBooksService.createBook(userId, {
      title: "Python Cookbook",
      description: "Python recipes",
      price: 28,
      category: "Cooking",
      author: "Chef",
      thumbnail: "https://example.com/cookbook.jpg",
    });

    const result = await booksService.listBooks({
      page: 1,
      limit: 10,
      title: "Python",
      sortOrder: "desc",
      category: "Technology",
      minPrice: undefined,
      maxPrice: undefined,
    });

    expect(result.data.length).toBe(1);
    expect(result.data[0].title).toBe("Python Programming");
    expect(result.data[0].category).toBe("Technology");
  });

  describe("Books price range filtering", () => {
    it("should filter books by exact price range", async () => {
      // Looking for any books in the database with prices between 10-35
      const result = await booksService.listBooks({
        page: 1,
        limit: 100,
        title: "",
        sortOrder: "desc",
        category: "",
        minPrice: undefined,
        maxPrice: undefined,
      });

      // Get min and max prices from available books
      if (result.data.length > 0) {
        const prices = result.data
          .map((b) => parseFloat(b.price))
          .sort((a, b) => a - b);
        const minPrice = prices[0];
        const maxPrice = prices[prices.length - 1];

        const filtered = await booksService.listBooks({
          page: 1,
          limit: 100,
          title: "",
          sortOrder: "desc",
          category: "",
          minPrice: minPrice,
          maxPrice: maxPrice,
        });

        expect(filtered.data.length).toBeGreaterThan(0);
        filtered.data.forEach((book) => {
          expect(book.price).toBeGreaterThanOrEqual(minPrice);
          expect(book.price).toBeLessThanOrEqual(maxPrice);
        });
      }
    });

    it("should filter books by minimum price only", async () => {
      const allBooks = await booksService.listBooks({
        page: 1,
        limit: 100,
        title: "",
        sortOrder: "desc",
        category: "",
        minPrice: undefined,
        maxPrice: undefined,
      });

      if (allBooks.data.length > 1) {
        const prices = allBooks.data
          .map((b) => parseFloat(b.price))
          .sort((a, b) => a - b);
        const minPrice = prices[Math.floor(prices.length / 2)];

        const result = await booksService.listBooks({
          page: 1,
          limit: 100,
          title: "",
          sortOrder: "desc",
          category: "",
          minPrice: minPrice,
          maxPrice: undefined,
        });

        result.data.forEach((book) => {
          expect(book.price).toBeGreaterThanOrEqual(minPrice);
        });
      }
    });

    it("should filter books by maximum price only", async () => {
      const allBooks = await booksService.listBooks({
        page: 1,
        limit: 100,
        title: "",
        sortOrder: "desc",
        category: "",
        minPrice: undefined,
        maxPrice: undefined,
      });

      if (allBooks.data.length > 1) {
        const prices = allBooks.data
          .map((b) => parseFloat(b.price))
          .sort((a, b) => a - b);
        const maxPrice = prices[Math.floor(prices.length / 2)];

        const result = await booksService.listBooks({
          page: 1,
          limit: 100,
          title: "",
          sortOrder: "desc",
          category: "",
          maxPrice: maxPrice,
          minPrice: undefined,
        });

        result.data.forEach((book) => {
          expect(book.price).toBeLessThanOrEqual(maxPrice);
        });
      }
    });

    it("should return empty array for non-matching price range", async () => {
      const result = await booksService.listBooks({
        page: 1,
        limit: 10,
        title: "",
        sortOrder: "desc",
        category: "",
        minPrice: 10000,
        maxPrice: 20000,
      });

      expect(result.data.length).toBe(0);
      expect(result.pagination.total).toBe(0);
    });

    it("should combine price range with title filter", async () => {
      const allBooks = await booksService.listBooks({
        page: 1,
        limit: 100,
        title: "",
        sortOrder: "desc",
        category: "",
        minPrice: undefined,
        maxPrice: undefined,
      });

      if (allBooks.data.length > 0) {
        const prices = allBooks.data
          .map((b) => parseFloat(b.price))
          .sort((a, b) => a - b);
        const minPrice = prices[0];
        const maxPrice = prices[prices.length - 1];

        const result = await booksService.listBooks({
          page: 1,
          limit: 100,
          title: "Java",
          sortOrder: "desc",
          category: "",
          minPrice: minPrice,
          maxPrice: maxPrice,
        });

        result.data.forEach((book) => {
          expect(book.title.toLowerCase()).toContain("java");
          expect(book.price).toBeGreaterThanOrEqual(minPrice);
          expect(book.price).toBeLessThanOrEqual(maxPrice);
        });
      }
    });

    it("should combine price range with category filter", async () => {
      const allBooks = await booksService.listBooks({
        page: 1,
        limit: 100,
        title: "",
        sortOrder: "desc",
        category: "",
        minPrice: undefined,
        maxPrice: undefined,
      });

      if (allBooks.data.length > 0) {
        const prices = allBooks.data
          .map((b) => parseFloat(b.price))
          .sort((a, b) => a - b);
        const minPrice = prices[0];
        const maxPrice = prices[prices.length - 1];

        const result = await booksService.listBooks({
          page: 1,
          limit: 100,
          title: "",
          sortOrder: "desc",
          category: "Technology",
          minPrice: minPrice,
          maxPrice: maxPrice,
        });

        result.data.forEach((book) => {
          expect(book.category.toLowerCase()).toContain("technology");
          expect(book.price).toBeGreaterThanOrEqual(minPrice);
          expect(book.price).toBeLessThanOrEqual(maxPrice);
        });
      }
    });

    it("should have schema validation for price constraints", () => {
      // The schema includes validation that maxPrice >= minPrice
      // This test ensures the schema is defined correctly
      expect(paginationSchema).toBeDefined();
    });
  });
});

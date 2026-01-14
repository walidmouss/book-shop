# Book Shop API

A RESTful API for managing a book shop with user authentication, book listings, and personal book collections.

## Features

- 🔐 User authentication (register, login, forgot password, reset password)
- 📚 Public book browsing with advanced filtering
- ✍️ Personal book collection management
- 🏷️ Category and tag support
- 👤 User profile management
- 🔍 Search and filter capabilities (title, category, price range)
- 📄 Pagination and sorting
- 🔄 Redis caching for sessions and OTP

## Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Hono
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Cache**: Redis
- **Validation**: Zod
- **Testing**: Vitest
- **Authentication**: JWT & bcrypt

## Prerequisites

Before you begin, ensure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or higher)
- [PostgreSQL](https://www.postgresql.org/) (v14 or higher)
- [Redis](https://redis.io/) (v6 or higher)
- npm or yarn package manager

## Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/walidmouss/book-shop.git
   cd book-shop
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env` file in the root directory:

   ```env
   # Server Configuration
   PORT=3000

   # Database Configuration
   DATABASE_URL=postgresql://username:password@localhost:5432/bookshop

   # Redis Configuration
   REDIS_HOST=localhost
   REDIS_PORT=6379

   # JWT Configuration
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   JWT_EXPIRES_IN=7d

   # Environment
   NODE_ENV=development
   ```

   Create a `.env.test` file for testing:

   ```env
   # Test Database Configuration
   DATABASE_URL=postgresql://username:password@localhost:5432/bookshop_test

   # Redis Configuration
   REDIS_HOST=localhost
   REDIS_PORT=6379

   # JWT Configuration
   JWT_SECRET=test-jwt-secret
   JWT_EXPIRES_IN=7d

   # Environment
   NODE_ENV=test
   ```

4. **Set up the database**

   Create the databases:

   ```bash
   # For development
   createdb bookshop

   # For testing
   createdb bookshop_test
   ```

5. **Run database migrations**

   ```bash
   npm run db:push
   ```

   Or use Drizzle Studio to manage your database:

   ```bash
   npm run db:studio
   ```

## Running the Application

### Development Mode

```bash
npm run dev
```

The server will start at `http://localhost:3000`

### Production Mode

```bash
# Build the TypeScript code
npm run build

# Start the production server
npm start
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## API Endpoints

### Authentication (`/api/auth`)

- `POST /register` - Register a new user
- `POST /login` - Login user
- `POST /forgot-password` - Request password reset OTP
- `POST /reset-password` - Reset password with OTP

### Public Books (`/api/books`)

- `GET /` - List all books (with pagination, search, category filter, price range)
- `GET /:id` - Get book details
- `GET /:id/tags` - Get book tags

### My Books (`/api/my-books`) - Requires Authentication

- `GET /` - List user's books (with pagination, search, category filter, price range)
- `POST /` - Create a new book
- `GET /:id` - Get user's book details
- `PUT /:id` - Update user's book
- `DELETE /:id` - Delete user's book

### Profile (`/api/profile`) - Requires Authentication

- `GET /` - Get user profile
- `PUT /` - Update user profile
- `POST /change-password` - Change user password

## Query Parameters

### Pagination & Filtering

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)
- `title` - Search by book title (case-insensitive partial match)
- `category` - Filter by category (case-insensitive partial match)
- `minPrice` - Minimum price filter
- `maxPrice` - Maximum price filter
- `sort` - Sort order: `asc` or `desc` (default: `asc`)

Example:

```bash
GET /api/books?page=1&limit=20&category=Fiction&minPrice=10&maxPrice=50&sort=desc
```

## Project Structure

```
book_shop/
├── src/
│   ├── config/          # Configuration files
│   │   ├── db.ts        # Database connection
│   │   ├── env.ts       # Environment variables
│   │   └── redis.ts     # Redis connection
│   ├── db/              # Database schemas
│   │   ├── authors.ts
│   │   ├── books.ts
│   │   ├── categories.ts
│   │   ├── tags.ts
│   │   └── users.ts
│   ├── features/        # Feature modules
│   │   ├── auth/        # Authentication
│   │   ├── books/       # Public books
│   │   ├── myBooks/     # User's books
│   │   └── profile/     # User profile
│   ├── app.ts           # Express app configuration
│   └── server.ts        # Server entry point
├── drizzle/             # Database migrations
├── .env                 # Environment variables
├── .env.test            # Test environment variables
├── drizzle.config.ts    # Drizzle configuration
├── tsconfig.json        # TypeScript configuration
└── vitest.config.ts     # Vitest configuration
```

## Database Schema

here is the database ERD used 


![WhatsApp Image 2026-01-14 at 8 32 42 AM](https://github.com/user-attachments/assets/33bbde6d-c83f-44cc-a6a1-b3232b2f1f2a)


### Users

- id, username, email, password, createdAt, updatedAt

### Books

- id, title, description, price, thumbnail, author_id, category_id, creator_id, createdAt, updatedAt

### Authors

- id, name

### Categories

- id, name

### Tags

- id, name

### Book_Tags (Junction Table)

- book_id, tag_id

## Development Scripts

```bash
# Development
npm run dev              # Start development server with hot reload

# Building
npm run build           # Compile TypeScript to JavaScript

# Database
npm run db:push         # Push schema changes to database
npm run db:studio       # Open Drizzle Studio
npm run db:generate     # Generate migrations

# Testing
npm test               # Run all tests
npm run test:watch     # Run tests in watch mode

# Production
npm start              # Start production server
```

## Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Error Handling

The API returns consistent error responses:

```json
{
  "success": false,
  "error": "Error message"
}
```

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.

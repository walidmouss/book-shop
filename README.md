# Book Shop

A book management system built with TypeScript, Hono, PostgreSQL, and Redis.

## Features

- User authentication (register, login, logout)
- Password reset with OTP via email
- Book management
- Redis-based session management

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/bookshop

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-secret-key-here

# Server
PORT=3000

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
SMTP_FROM=noreply@bookshop.com
```

### Email Configuration

The application uses SMTP to send OTP emails for password reset. You can use any SMTP service:

#### Gmail Example
- `SMTP_HOST=smtp.gmail.com`
- `SMTP_PORT=587`
- `SMTP_SECURE=false`
- `SMTP_USER=your-email@gmail.com`
- `SMTP_PASS=your-app-password` (use [App Password](https://support.google.com/accounts/answer/185833))

#### Other SMTP Providers
- **SendGrid**: `smtp.sendgrid.net` (port 587)
- **Mailgun**: `smtp.mailgun.org` (port 587)
- **AWS SES**: `email-smtp.us-east-1.amazonaws.com` (port 587)
- **Outlook**: `smtp-mail.outlook.com` (port 587)

Set `SMTP_SECURE=true` for port 465, or `false` for ports 587/25.

## Installation

```bash
npm install
```

## Scripts

```bash
# Development
npm run dev

# Build
npm run build

# Start production server
npm start

# Run tests
npm test

# Lint
npm run lint
```

## Testing

For testing, create a `.env.test` file with test database and Redis credentials. The email service is mocked in tests, so you can use dummy SMTP credentials.

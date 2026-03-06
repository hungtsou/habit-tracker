# Habit Tracker API

A RESTful API for tracking daily habits. Users register, curate a personal habit list (from defaults or custom), and check off completions each day.

**Architecture:** Backend-only REST API — `Client → Express API → PostgreSQL`. No frontend; designed to be consumed by any client.

**Tech stack:** Node.js, TypeScript (strict), Express, PostgreSQL, JWT, Zod, bcrypt.

---

## Prerequisites

- **Node.js** 18+ (LTS recommended)
- **PostgreSQL** 14+
- **npm** 9+

---

## Installation

```bash
git clone <repo-url>
cd habit-tracker
npm install
```

---

## Environment Setup

1. Copy the example env file:

   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your local values:

   | Variable       | Description                          |
   | -------------- | ------------------------------------ |
   | `PORT`         | Server port (default: 3000)          |
   | `NODE_ENV`     | `development` or `production`         |
   | `DATABASE_URL` | PostgreSQL connection string         |
   | `JWT_SECRET`   | Secret for signing JWT tokens         |

   Example `DATABASE_URL`:
   ```
   postgres://postgres:password@localhost:5432/habit_tracker
   ```

---

## Running

| Command       | Description                          |
| ------------- | ------------------------------------ |
| `npm run dev` | Start dev server with hot reload      |
| `npm run build` | Compile TypeScript to `dist/`       |
| `npm start`   | Run compiled app (`node dist/server.js`) |

**Development:**

```bash
npm run dev
```

Server listens at `http://localhost:3000` (or your `PORT`). Health check: `GET /api/health`.

---

## Testing

| Command                 | Description                    |
| ----------------------- | ------------------------------ |
| `npm test`              | Run all tests                  |
| `npm run test:unit`     | Unit tests only                |
| `npm run test:integration` | Integration tests only      |

**Test database:** Set `TEST_DATABASE_URL` in `.env` for integration tests, or use the default `postgres://localhost:5432/habit_tracker_test`.

---

## Linting & Formatting

```bash
npm run lint      # ESLint
npm run format    # Prettier
```

---

## Project Structure

```
src/
├── routes/       # Route definitions
├── controllers/  # Request handlers
├── middleware/   # Auth, validation, error handling
├── db/           # Connection pool, queries
├── utils/        # Helpers (e.g. response)
├── types/        # Shared interfaces
├── app.ts        # Express app
└── server.ts     # Entry point
tests/
├── unit/
├── integration/
└── helpers/
```

---

## API Routes (Planned)

| Method | Route                     | Auth |
| ------ | ------------------------- | ---- |
| GET    | /api/health               | No   |
| POST   | /api/auth/register        | No   |
| POST   | /api/auth/login           | No   |
| GET    | /api/habits/defaults      | Yes  |
| POST   | /api/habits               | Yes  |
| GET    | /api/habits               | Yes  |
| ...    | (see docs/project-overview.md) | |

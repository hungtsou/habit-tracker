# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev              # Start dev server with hot reload
npm run build            # Compile TypeScript to dist/
npm start                # Run compiled app

npm test                 # All tests
npm run test:unit        # Unit tests only (tests/unit/)
npm run test:integration # Integration tests only (tests/integration/)
npx jest tests/unit/path/to/file.test.ts  # Run a single test file

npm run lint             # ESLint
npm run format           # Prettier
```

## Architecture

Backend-only REST API: `Client → Express API → PostgreSQL`. No frontend.

**Request flow:** `routes/ → middleware chain → controllers/ → db/`

Each layer only imports from the layer below it. Controllers must stay thin — business logic belongs in the `db/` layer (query functions).

**Key files:**
- `src/server.ts` — entry point; imports `config/env` first to validate env before anything else
- `src/app.ts` — Express app setup; mounts all routes under `/api`, registers global error handler last
- `src/config/env.ts` — Zod-validated env config; the `env` object is the single source of truth for all config values; app exits on invalid env
- `src/db/pool.ts` — singleton `pg.Pool`; import this in query files, never create new Pool instances
- `src/middleware/error.ts` — defines `AppError` (throw this for all expected errors) and the global `errorHandler`
- `src/utils/response.ts` — `sendSuccess` / `sendError` helpers; all controllers must use these for consistent JSON shape

## Response Shape

All responses use a consistent envelope:
- Success: `{ data: T }` — use `sendSuccess(res, data, statusCode)`
- Error: `{ error: string, statusCode: number }` — use `sendError` or throw `AppError`

## Validation

Zod schemas belong in `src/schemas/` (one file per resource). The `validate(schema)` middleware (in `src/middleware/validate.ts`) validates `req.body` before the controller runs — never validate inside controllers or the db layer. The `validate` middleware only surfaces the first Zod error message as a 400 `AppError`.

## Authentication

`authenticate` middleware verifies the Bearer JWT and attaches `req.user: AuthPayload` (`{ userId: string }`). The `AuthRequest` type (in `src/types/express.d.ts`) extends `Request` with this field — use it in controllers that require auth.

## Testing

**Unit tests** (`tests/unit/`) — mock all external dependencies (db pool, bcrypt, jwt) with `jest.mock()`.

**Integration tests** (`tests/integration/`) — use a real test database; never mock the db layer. Requires `TEST_DATABASE_URL` in `.env` (defaults to `postgres://localhost:5432/habit_tracker_test`).

`tests/helpers/factories.ts` — add builder functions here when features are implemented; use factories instead of hardcoded objects in tests.

`tests/setup.ts` runs before all tests and sets `NODE_ENV=test`, a fixed `JWT_SECRET`, and the test database URL.

## Naming & Style

- DB columns: `snake_case` — TypeScript variables: `camelCase`
- All PKs are UUIDs
- Named exports only (no default exports except router files and `app`/`server`)
- No `any` — use `unknown` and narrow with type guards
- Interfaces for object shapes, `type` for unions/intersections; no `I` prefix on interfaces

## Database Migrations

SQL files go in `src/db/migrations/` with numeric prefixes (`001_create_users.sql`). Each file has `-- UP` and `-- DOWN` sections. Never modify an existing migration — create a new one.

## Commits

Follow conventional commits: `<type>(<scope>): <short description>`

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `perf`

Scopes: `auth`, `habits`, `tracking`, `db`, `middleware`, `config`, `deps`

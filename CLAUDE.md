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
npx vitest run tests/unit/path/to/file.test.ts  # Run a single test file

npm run lint             # ESLint
npm run format           # Prettier
```

## Architecture

Backend-only REST API: `Client → Express API → PostgreSQL`. No frontend.

**Request flow:** `routes/ → middleware chain → controllers/ → db/`

Each layer only imports from the layer below it. Controllers must stay thin — business logic belongs in the `db/` layer (query functions).

**Middleware order on a route:** `authenticate → validate(schema) → controller`

**HTTP status codes:**
- `200` OK · `201` Created · `204` No Content (delete) · `400` Validation error · `401` Unauthorized · `404` Not found · `500` Server error

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

Always export the inferred TypeScript type alongside the schema:

```ts
export const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});
export type RegisterInput = z.infer<typeof registerSchema>;
```

Use `.transform()` to sanitize inputs (trim whitespace, lowercase emails). Include user-friendly error messages in every schema field — never leave a field as bare `.string()`.

## Authentication

`authenticate` middleware verifies the Bearer JWT and attaches `req.user: AuthPayload` (`{ userId: string }`). The `AuthRequest` type (in `src/types/express.d.ts`) extends `Request` with this field — use it in controllers that require auth.

## Testing

Target test framework is **Vitest** (`vi.mock()`, `vi.fn()`, `vi.mocked()`). Vitest globals are enabled — no framework imports needed in test files.

**Unit tests** (`tests/unit/`) — mock all external dependencies (db pool, bcrypt, jwt) with `vi.mock()`.

**Integration tests** (`tests/integration/`) — use a real test database; never mock the db layer. Requires `TEST_DATABASE_URL` in `.env` (defaults to `postgres://localhost:5432/habit_tracker_test`).

`tests/helpers/factories.ts` — add builder functions here when features are implemented; use factories instead of hardcoded objects in tests.

`tests/setup.ts` runs before all tests and sets `NODE_ENV=test`, a fixed `JWT_SECRET`, and the test database URL.

**Naming and structure:**
- Test files: `<module>.test.ts` (e.g., `habit.controller.test.ts`)
- `describe` block name matches the function or module under test
- Test names: `it('should <behavior> when <condition>')`
- One concept per test — multiple `expect` calls are fine if they test one behavior
- State cleanup in `beforeEach`/`afterEach`, not between assertions
- Test inputs and outputs only — never assert on internal method calls

## Naming & Style

- DB columns: `snake_case` — TypeScript variables: `camelCase` — constants: `UPPER_SNAKE_CASE`
- All PKs are UUIDs
- Named exports only (no default exports except router files and `app`/`server`)
- No `any` — use `unknown` and narrow with type guards
- Interfaces for object shapes, `type` for unions/intersections; no `I` prefix on interfaces
- `Readonly<T>` for data that must not be mutated
- Import order: Node built-ins → third-party packages → project modules

## Database Migrations

SQL files go in `src/db/migrations/` with numeric prefixes (`001_create_users.sql`). Each file has `-- UP` and `-- DOWN` sections. Never modify an existing migration — create a new one.

**Query rules:**
- Parameterized queries only (`$1, $2` syntax) — never interpolate user input into SQL strings
- Use `RETURNING *` on INSERT/UPDATE to avoid a follow-up SELECT
- Wrap multi-table operations in a transaction

**Table conventions:** every table requires `id UUID PRIMARY KEY DEFAULT gen_random_uuid()` and `created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`.

## Commits

Follow conventional commits: `<type>(<scope>): <short description>`

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `ci`, `perf`

Scopes: `auth`, `habits`, `tracking`, `db`, `middleware`, `config`, `deps`

**Rules:**
- Subject line: imperative mood, lowercase, no trailing period, max 72 chars
- Body (optional): wrap at 80 chars; explain **why**, not what
- Breaking changes: `BREAKING CHANGE:` in footer, or `!` after type (e.g., `feat!(auth): ...`)

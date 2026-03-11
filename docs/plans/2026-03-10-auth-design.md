# Auth Feature Design

## Scope

Register and login endpoints with JWT authentication.

- `POST /api/auth/register` — create account, return token
- `POST /api/auth/login` — authenticate, return token

## Architecture

Thin Controller pattern following project conventions:

```
Request → Route → Validate (Zod) → Controller → DB Queries → Response
```

## Database Schema

```sql
CREATE TABLE users (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email      VARCHAR(255) UNIQUE NOT NULL,
  name       VARCHAR(100) NOT NULL,
  password   VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_users_email ON users (email);
```

Programmatic migration system: `src/db/migrate.ts` runner tracking applied
migrations in a `migrations` table, individual migrations export `up()`/`down()`.

## API Endpoints

### POST /api/auth/register

- **Body:** `{ email: string, name: string, password: string }`
- **Validation:** email format, name 1-100 chars, password min 8 chars
- **Success (201):** `{ data: { id, email, name, token } }`
- **Errors:** 400 (validation), 409 (email already exists)

### POST /api/auth/login

- **Body:** `{ email: string, password: string }`
- **Validation:** email format, password required
- **Success (200):** `{ data: { id, email, name, token } }`
- **Errors:** 400 (validation), 401 (invalid credentials)

### JWT Details

- Payload: `{ userId: string }` (matches existing `AuthPayload`)
- Expiry: configurable via `JWT_EXPIRES_IN` env variable, default `"24h"`
- Signing secret: existing `JWT_SECRET` env variable

## File Structure

### New Files

| File | Purpose |
|------|---------|
| `src/db/migrations/001_create_users.ts` | Users table up/down migration |
| `src/db/migrate.ts` | Migration runner script |
| `src/db/queries/users.ts` | `createUser()`, `findUserByEmail()` |
| `src/controllers/auth.ts` | `register()`, `login()` handlers |
| `src/middleware/schemas/auth.ts` | Zod schemas: `registerSchema`, `loginSchema` |

### Modified Files

| File | Change |
|------|--------|
| `src/routes/auth.ts` | Wire up POST register + login with validation and controller |
| `src/config/env.ts` | Add `JWT_EXPIRES_IN` to env schema |
| `src/types/index.ts` | Add `User` interface |
| `package.json` | Add `migrate` script |

## Testing

| Test File | Coverage |
|-----------|----------|
| `tests/unit/controllers/auth.test.ts` | Register/login controller logic with mocked DB queries |
| `tests/unit/db/queries/users.test.ts` | Query functions with mocked pool |
| `tests/integration/auth.test.ts` | Full register/login flow via supertest against test DB |

## Error Handling

Uses existing `AppError` + `errorHandler` middleware. Controller throws
`AppError(message, statusCode)` for business logic errors (duplicate email,
invalid credentials).

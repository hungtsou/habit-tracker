# Environment Configuration — Implementation Spec

> **For Claude:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task.

**Goal:** Centralise all environment variable access behind a single validated module (`src/config/env.ts`). Every file that currently reads `process.env` directly will be updated to import from this module instead.

**Why:** Scattered `process.env` reads are untyped, unvalidated, and can fail silently at runtime. A centralised config module validates all required variables at startup (fail-fast), provides typed access throughout the codebase, and exposes environment-state helpers (`isProd`, `isDev`, `isTest`).

**Tech:** `zod` for schema validation · `custom-env` for per-environment `.env` file loading (both already installed).

---

## Environment Variables

Sourced from `.env.example`:

| Variable           | Type     | Required | Default       | Notes                                    |
|--------------------|----------|----------|---------------|------------------------------------------|
| `NODE_ENV`         | `string` | No       | `development` | One of `development`, `test`, `production` |
| `PORT`             | `number` | No       | `3000`        | Coerced from string                      |
| `DATABASE_URL`     | `string` | **Yes**  | —             | Must be a valid URL                      |
| `JWT_SECRET`       | `string` | **Yes**  | —             | Minimum 16 characters                    |

---

## Final File Tree (changes only)

```
src/
├── config/
│   └── env.ts          ← NEW: central env config module
├── db/
│   └── pool.ts         ← EDIT: import DATABASE_URL from env
├── middleware/
│   └── auth.ts         ← EDIT: import JWT_SECRET from env
└── server.ts           ← EDIT: remove customEnv call, import PORT from env
tests/
└── setup.ts            ← EDIT: keep process.env assignments (no change needed)
```

---

## Task 1: Create `src/config/env.ts`

**Files:**
- Create: `src/config/env.ts`

**Step 1: Create the module**

```typescript
import customEnv from 'custom-env';
import { z } from 'zod';

customEnv.env(process.env.NODE_ENV ?? 'development');

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url({ message: 'DATABASE_URL must be a valid URL' }),
  JWT_SECRET: z.string().min(16, { message: 'JWT_SECRET must be at least 16 characters' }),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('[env] Invalid environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const isProd = (): boolean => env.NODE_ENV === 'production';
export const isDev  = (): boolean => env.NODE_ENV === 'development';
export const isTest = (): boolean => env.NODE_ENV === 'test';
```

**How it works:**

1. `customEnv.env()` is called once at module load time — it reads `.env.<NODE_ENV>` (e.g. `.env.development`) and populates `process.env`. Because `env.ts` is the first module imported in any entry point, this call replaces the one previously in `server.ts`.
2. Zod parses and validates `process.env`. On failure the process exits immediately with a clear message (fail-fast).
3. `env` is a fully typed, readonly object — no `!` non-null assertions anywhere else in the codebase.

**Test environment note:** Jest's `setupFiles` runs `tests/setup.ts` before any module is evaluated. That file sets `process.env.NODE_ENV = 'test'`, `JWT_SECRET`, and `DATABASE_URL` directly. When `env.ts` is later imported by a test module:
- `customEnv.env('test')` is called — if no `.env.test` file exists, it silently no-ops, leaving the values from `setup.ts` in place.
- Zod validates those values successfully.

No changes to `tests/setup.ts` are required.

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

**Step 3: Commit**

```bash
git add src/config/env.ts
git commit -m "chore(config): add centralised env config module with zod validation"
```

---

## Task 2: Update `src/server.ts`

**Files:**
- Edit: `src/server.ts`

**Step 1: Remove `custom-env` import and direct `process.env` access**

Replace the entire file content:

```typescript
import './config/env';   // load and validate env before anything else
import app from './app';
import { env } from './config/env';

app.listen(env.PORT, () => {
  console.log(`[server] Listening on http://localhost:${env.PORT}`);
});
```

> The `import './config/env'` at the top is a side-effect import that ensures env is loaded and validated before `app` is imported. The named import on the next line is then safe to use.

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

**Step 3: Commit**

```bash
git add src/server.ts
git commit -m "chore(config): migrate server.ts to use central env module"
```

---

## Task 3: Update `src/db/pool.ts`

**Files:**
- Edit: `src/db/pool.ts`

**Step 1: Replace `process.env.DATABASE_URL` with `env.DATABASE_URL`**

```typescript
import { Pool } from 'pg';
import { env } from '../config/env';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
});
```

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

**Step 3: Commit**

```bash
git add src/db/pool.ts
git commit -m "chore(config): migrate db pool to use central env module"
```

---

## Task 4: Update `src/middleware/auth.ts`

**Files:**
- Edit: `src/middleware/auth.ts`

**Step 1: Replace `process.env.JWT_SECRET!` with `env.JWT_SECRET`**

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error';
import { AuthPayload } from '../types';
import { env } from '../config/env';

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next(new AppError('Missing or invalid authorization header', 401));
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    next(new AppError('Invalid or expired token', 401));
  }
};
```

The `!` non-null assertion is removed — `env.JWT_SECRET` is guaranteed to be a string by Zod.

**Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

**Step 3: Commit**

```bash
git add src/middleware/auth.ts
git commit -m "chore(config): migrate auth middleware to use central env module"
```

---

## Task 5: Unit Tests for `src/config/env.ts`

**Files:**
- Create: `tests/unit/config/env.test.ts`

**Step 1: Create tests**

```typescript
describe('env config', () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    process.env = { ...ORIGINAL_ENV };
    jest.resetModules();
  });

  afterAll(() => {
    process.env = ORIGINAL_ENV;
  });

  it('exports a valid env object when all required variables are set', async () => {
    process.env.NODE_ENV    = 'development';
    process.env.DATABASE_URL = 'postgres://localhost:5432/habit_tracker';
    process.env.JWT_SECRET   = 'a-sufficiently-long-secret-key';

    const { env } = await import('../../../src/config/env');

    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(3000);
    expect(env.DATABASE_URL).toBe('postgres://localhost:5432/habit_tracker');
    expect(env.JWT_SECRET).toBe('a-sufficiently-long-secret-key');
  });

  it('coerces PORT from string to number', async () => {
    process.env.DATABASE_URL = 'postgres://localhost:5432/habit_tracker';
    process.env.JWT_SECRET   = 'a-sufficiently-long-secret-key';
    process.env.PORT         = '8080';

    const { env } = await import('../../../src/config/env');

    expect(env.PORT).toBe(8080);
    expect(typeof env.PORT).toBe('number');
  });

  it('applies default PORT of 3000 when PORT is not set', async () => {
    process.env.DATABASE_URL = 'postgres://localhost:5432/habit_tracker';
    process.env.JWT_SECRET   = 'a-sufficiently-long-secret-key';
    delete process.env.PORT;

    const { env } = await import('../../../src/config/env');

    expect(env.PORT).toBe(3000);
  });

  it('isProd returns true only in production', async () => {
    process.env.NODE_ENV     = 'production';
    process.env.DATABASE_URL = 'postgres://localhost:5432/habit_tracker';
    process.env.JWT_SECRET   = 'a-sufficiently-long-secret-key';

    const { isProd, isDev, isTest } = await import('../../../src/config/env');

    expect(isProd()).toBe(true);
    expect(isDev()).toBe(false);
    expect(isTest()).toBe(false);
  });

  it('isDev returns true only in development', async () => {
    process.env.NODE_ENV     = 'development';
    process.env.DATABASE_URL = 'postgres://localhost:5432/habit_tracker';
    process.env.JWT_SECRET   = 'a-sufficiently-long-secret-key';

    const { isProd, isDev, isTest } = await import('../../../src/config/env');

    expect(isDev()).toBe(true);
    expect(isProd()).toBe(false);
    expect(isTest()).toBe(false);
  });

  it('isTest returns true only in test', async () => {
    process.env.NODE_ENV     = 'test';
    process.env.DATABASE_URL = 'postgres://localhost:5432/habit_tracker';
    process.env.JWT_SECRET   = 'a-sufficiently-long-secret-key';

    const { isProd, isDev, isTest } = await import('../../../src/config/env');

    expect(isTest()).toBe(true);
    expect(isProd()).toBe(false);
    expect(isDev()).toBe(false);
  });

  it('calls process.exit(1) when a required variable is missing', async () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    delete process.env.DATABASE_URL;
    delete process.env.JWT_SECRET;

    await expect(import('../../../src/config/env')).rejects.toThrow('process.exit called');

    mockExit.mockRestore();
  });

  it('calls process.exit(1) when JWT_SECRET is shorter than 16 characters', async () => {
    const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {
      throw new Error('process.exit called');
    });

    process.env.DATABASE_URL = 'postgres://localhost:5432/habit_tracker';
    process.env.JWT_SECRET   = 'short';

    await expect(import('../../../src/config/env')).rejects.toThrow('process.exit called');

    mockExit.mockRestore();
  });
});
```

**Step 2: Run tests**

```bash
npm run test:unit -- --testPathPattern=config/env
```

Expected: All tests pass.

**Step 3: Commit**

```bash
git add tests/unit/config/env.test.ts
git commit -m "test(config): add unit tests for env config module"
```

---

## Task 6: Final Verification

**Step 1: Full test suite**

```bash
npm test
```

Expected: All existing tests still pass. New env tests pass.

**Step 2: Zero `process.env` reads in `src/`**

```bash
grep -rn "process\.env" src/
```

Expected: No matches (only `src/config/env.ts` itself uses `process.env`).

**Step 3: TypeScript clean build**

```bash
npx tsc --noEmit
```

Expected: No errors.

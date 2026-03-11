# Auth Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement register and login endpoints (`POST /api/auth/register`, `POST /api/auth/login`) with JWT authentication, bcrypt password hashing, and a programmatic migration system for the users table.

**Architecture:** Thin Controller pattern — routes delegate to controllers which call DB query functions. Zod validates request bodies. Existing `AppError` + `errorHandler` provides error responses. JWT tokens are signed/verified with the existing `JWT_SECRET` env var.

**Tech Stack:** Express 4, PostgreSQL (pg), bcrypt, jsonwebtoken, Zod, Jest + supertest

---

## Task 0: Install missing dev dependency

**Step 1: Install @types/bcrypt**

Run: `npm install --save-dev @types/bcrypt`
Expected: package.json devDependencies includes `@types/bcrypt`

**Step 2: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): add @types/bcrypt"
```

---

## Task 1: Add `JWT_EXPIRES_IN` to env config

**Files:**
- Modify: `src/config/env.ts`
- Modify: `tests/setup.ts`
- Modify: `tests/unit/config/env.test.ts`
- Modify: `.env.example`

**Step 1: Write the failing test**

Add a test to `tests/unit/config/env.test.ts` (within the existing describe block) that verifies `JWT_EXPIRES_IN` defaults to `"24h"` when not set:

```typescript
it('defaults JWT_EXPIRES_IN to "24h"', () => {
  expect(env.JWT_EXPIRES_IN).toBe('24h');
});
```

**Step 2: Run test to verify it fails**

Run: `npx jest tests/unit/config/env.test.ts --testNamePattern="JWT_EXPIRES_IN" -v`
Expected: FAIL — `env.JWT_EXPIRES_IN` is `undefined`

**Step 3: Implement — update env schema**

In `src/config/env.ts`, add `JWT_EXPIRES_IN` to the Zod schema:

```typescript
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().url({ message: 'DATABASE_URL must be a valid URL' }),
  JWT_SECRET: z.string().min(16, { message: 'JWT_SECRET must be at least 16 characters' }),
  JWT_EXPIRES_IN: z.string().default('24h'),
});
```

**Step 4: Update test setup**

In `tests/setup.ts`, add after the existing env vars:

```typescript
process.env.JWT_EXPIRES_IN = '24h';
```

**Step 5: Update `.env.example`**

Add under the `# Auth` section:

```
JWT_EXPIRES_IN=24h
```

**Step 6: Run test to verify it passes**

Run: `npx jest tests/unit/config/env.test.ts -v`
Expected: ALL PASS

**Step 7: Commit**

```bash
git add src/config/env.ts tests/setup.ts tests/unit/config/env.test.ts .env.example
git commit -m "feat(config): add JWT_EXPIRES_IN env variable with 24h default"
```

---

## Task 2: Add `User` type

**Files:**
- Modify: `src/types/index.ts`

**Step 1: Add User interface**

Append to `src/types/index.ts`:

```typescript
export interface User {
  id: string;
  email: string;
  name: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}
```

Note: `camelCase` in TypeScript; DB columns are `snake_case`. Query functions handle the mapping.

**Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat(auth): add User type definition"
```

---

## Task 3: Programmatic migration system

**Files:**
- Create: `src/db/migrate.ts`
- Create: `src/db/migrations/001_create_users.ts`
- Modify: `package.json`

**Step 1: Create the migration runner**

Create `src/db/migrate.ts`:

```typescript
import { pool } from './pool';

interface Migration {
  name: string;
  up: (client: typeof pool) => Promise<void>;
  down: (client: typeof pool) => Promise<void>;
}

const migrations: Migration[] = [];

async function loadMigrations(): Promise<void> {
  const mod = await import('./migrations/001_create_users');
  migrations.push({ name: '001_create_users', ...mod });
}

async function ensureMigrationsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) UNIQUE NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);
}

async function getAppliedMigrations(): Promise<string[]> {
  const result = await pool.query('SELECT name FROM migrations ORDER BY id');
  return result.rows.map((row: { name: string }) => row.name);
}

async function migrate(): Promise<void> {
  try {
    await loadMigrations();
    await ensureMigrationsTable();
    const applied = await getAppliedMigrations();

    for (const migration of migrations) {
      if (applied.includes(migration.name)) {
        console.log(`[migrate] Skipping ${migration.name} (already applied)`);
        continue;
      }
      console.log(`[migrate] Applying ${migration.name}...`);
      await migration.up(pool);
      await pool.query('INSERT INTO migrations (name) VALUES ($1)', [migration.name]);
      console.log(`[migrate] Applied ${migration.name}`);
    }

    console.log('[migrate] All migrations applied');
  } catch (err) {
    console.error('[migrate] Migration failed:', err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
```

**Step 2: Create the users migration**

Create `src/db/migrations/001_create_users.ts`:

```typescript
import { Pool } from 'pg';

export async function up(pool: Pool): Promise<void> {
  await pool.query(`
    CREATE TABLE users (
      id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email      VARCHAR(255) UNIQUE NOT NULL,
      name       VARCHAR(100) NOT NULL,
      password   VARCHAR(255) NOT NULL,
      created_at TIMESTAMPTZ  NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ  NOT NULL DEFAULT now()
    )
  `);
  await pool.query('CREATE UNIQUE INDEX idx_users_email ON users (email)');
}

export async function down(pool: Pool): Promise<void> {
  await pool.query('DROP TABLE IF EXISTS users');
}
```

**Step 3: Add migrate script to package.json**

Add to `package.json` scripts:

```json
"migrate": "ts-node-dev src/db/migrate.ts"
```

**Step 4: Verify migration runs**

Run: `npm run migrate`
Expected: Output shows "Applying 001_create_users..." and "All migrations applied". Run again to verify it skips already-applied migration.

**Step 5: Commit**

```bash
git add src/db/migrate.ts src/db/migrations/001_create_users.ts package.json
git commit -m "feat(db): add programmatic migration system and users table"
```

---

## Task 4: User DB query functions (TDD)

**Files:**
- Create: `src/db/queries/users.ts`
- Create: `tests/unit/db/queries/users.test.ts`

**Step 1: Write the failing tests**

Create `tests/unit/db/queries/users.test.ts`:

```typescript
import { createUser, findUserByEmail } from '../../../../src/db/queries/users';
import { pool } from '../../../../src/db/pool';

jest.mock('../../../../src/db/pool', () => ({
  pool: { query: jest.fn() },
}));

const mockQuery = pool.query as jest.Mock;

describe('user queries', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('createUser', () => {
    it('inserts a user and returns the created row', async () => {
      const mockUser = {
        id: 'uuid-1',
        email: 'test@example.com',
        name: 'Test User',
        password: 'hashed',
        created_at: new Date(),
        updated_at: new Date(),
      };
      mockQuery.mockResolvedValue({ rows: [mockUser] });

      const result = await createUser('test@example.com', 'Test User', 'hashed');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO users'),
        ['test@example.com', 'Test User', 'hashed'],
      );
      expect(result).toEqual(mockUser);
    });
  });

  describe('findUserByEmail', () => {
    it('returns the user when found', async () => {
      const mockUser = { id: 'uuid-1', email: 'test@example.com', name: 'Test', password: 'hashed' };
      mockQuery.mockResolvedValue({ rows: [mockUser] });

      const result = await findUserByEmail('test@example.com');

      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('SELECT'),
        ['test@example.com'],
      );
      expect(result).toEqual(mockUser);
    });

    it('returns undefined when user not found', async () => {
      mockQuery.mockResolvedValue({ rows: [] });

      const result = await findUserByEmail('nobody@example.com');

      expect(result).toBeUndefined();
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx jest tests/unit/db/queries/users.test.ts -v`
Expected: FAIL — cannot find module `src/db/queries/users`

**Step 3: Implement user query functions**

Create `src/db/queries/users.ts`:

```typescript
import { pool } from '../pool';

export interface UserRow {
  id: string;
  email: string;
  name: string;
  password: string;
  created_at: Date;
  updated_at: Date;
}

export async function createUser(
  email: string,
  name: string,
  hashedPassword: string,
): Promise<UserRow> {
  const result = await pool.query(
    'INSERT INTO users (email, name, password) VALUES ($1, $2, $3) RETURNING *',
    [email, name, hashedPassword],
  );
  return result.rows[0];
}

export async function findUserByEmail(email: string): Promise<UserRow | undefined> {
  const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return result.rows[0];
}
```

**Step 4: Run tests to verify they pass**

Run: `npx jest tests/unit/db/queries/users.test.ts -v`
Expected: ALL PASS (3 tests)

**Step 5: Commit**

```bash
git add src/db/queries/users.ts tests/unit/db/queries/users.test.ts
git commit -m "feat(auth): add user DB query functions with unit tests"
```

---

## Task 5: Zod validation schemas

**Files:**
- Create: `src/middleware/schemas/auth.ts`

**Step 1: Create auth validation schemas**

Create `src/middleware/schemas/auth.ts`:

```typescript
import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});
```

**Step 2: Commit**

```bash
git add src/middleware/schemas/auth.ts
git commit -m "feat(auth): add Zod validation schemas for register and login"
```

---

## Task 6: Auth controller (TDD)

**Files:**
- Create: `src/controllers/auth.ts`
- Create: `tests/unit/controllers/auth.test.ts`

**Step 1: Write the failing tests**

Create `tests/unit/controllers/auth.test.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { register, login } from '../../../src/controllers/auth';
import * as userQueries from '../../../src/db/queries/users';

jest.mock('../../../src/db/queries/users');
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

const mockReq = (body: Record<string, unknown> = {}) => ({ body }) as Request;

const mockRes = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('auth controller', () => {
  const next = jest.fn() as unknown as NextFunction;

  beforeEach(() => jest.clearAllMocks());

  describe('register', () => {
    it('creates a user and returns 201 with token', async () => {
      (userQueries.findUserByEmail as jest.Mock).mockResolvedValue(undefined);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-pw');
      (userQueries.createUser as jest.Mock).mockResolvedValue({
        id: 'uuid-1',
        email: 'new@example.com',
        name: 'New User',
      });
      (jwt.sign as jest.Mock).mockReturnValue('mock-token');

      const req = mockReq({ email: 'new@example.com', name: 'New User', password: 'password123' });
      const res = mockRes();

      await register(req, res, next);

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(userQueries.createUser).toHaveBeenCalledWith('new@example.com', 'New User', 'hashed-pw');
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        data: { id: 'uuid-1', email: 'new@example.com', name: 'New User', token: 'mock-token' },
      });
    });

    it('calls next with 409 AppError if email already exists', async () => {
      (userQueries.findUserByEmail as jest.Mock).mockResolvedValue({ id: 'existing' });

      const req = mockReq({ email: 'taken@example.com', name: 'User', password: 'password123' });
      const res = mockRes();

      await register(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 409, message: 'Email already registered' }),
      );
    });

    it('calls next with error on unexpected failure', async () => {
      const err = new Error('db down');
      (userQueries.findUserByEmail as jest.Mock).mockRejectedValue(err);

      const req = mockReq({ email: 'a@b.com', name: 'Test', password: 'password123' });
      const res = mockRes();

      await register(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });

  describe('login', () => {
    it('returns 200 with token for valid credentials', async () => {
      (userQueries.findUserByEmail as jest.Mock).mockResolvedValue({
        id: 'uuid-1',
        email: 'user@example.com',
        name: 'User',
        password: 'hashed-pw',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('mock-token');

      const req = mockReq({ email: 'user@example.com', password: 'password123' });
      const res = mockRes();

      await login(req, res, next);

      expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'hashed-pw');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        data: { id: 'uuid-1', email: 'user@example.com', name: 'User', token: 'mock-token' },
      });
    });

    it('calls next with 401 AppError if user not found', async () => {
      (userQueries.findUserByEmail as jest.Mock).mockResolvedValue(undefined);

      const req = mockReq({ email: 'nobody@example.com', password: 'password123' });
      const res = mockRes();

      await login(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401, message: 'Invalid email or password' }),
      );
    });

    it('calls next with 401 AppError if password does not match', async () => {
      (userQueries.findUserByEmail as jest.Mock).mockResolvedValue({
        id: 'uuid-1',
        email: 'user@example.com',
        name: 'User',
        password: 'hashed-pw',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const req = mockReq({ email: 'user@example.com', password: 'wrong' });
      const res = mockRes();

      await login(req, res, next);

      expect(next).toHaveBeenCalledWith(
        expect.objectContaining({ statusCode: 401, message: 'Invalid email or password' }),
      );
    });

    it('calls next with error on unexpected failure', async () => {
      const err = new Error('db down');
      (userQueries.findUserByEmail as jest.Mock).mockRejectedValue(err);

      const req = mockReq({ email: 'a@b.com', password: 'password123' });
      const res = mockRes();

      await login(req, res, next);

      expect(next).toHaveBeenCalledWith(err);
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npx jest tests/unit/controllers/auth.test.ts -v`
Expected: FAIL — cannot find module `src/controllers/auth`

**Step 3: Implement auth controller**

Create `src/controllers/auth.ts`:

```typescript
import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { createUser, findUserByEmail } from '../db/queries/users';
import { AppError } from '../middleware/error';
import { env } from '../config/env';

const SALT_ROUNDS = 10;

function signToken(userId: string): string {
  return jwt.sign({ userId }, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN });
}

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, name, password } = req.body;

    const existing = await findUserByEmail(email);
    if (existing) {
      next(new AppError('Email already registered', 409));
      return;
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await createUser(email, name, hashedPassword);
    const token = signToken(user.id);

    res.status(201).json({
      data: { id: user.id, email: user.email, name: user.name, token },
    });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;

    const user = await findUserByEmail(email);
    if (!user) {
      next(new AppError('Invalid email or password', 401));
      return;
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      next(new AppError('Invalid email or password', 401));
      return;
    }

    const token = signToken(user.id);

    res.status(200).json({
      data: { id: user.id, email: user.email, name: user.name, token },
    });
  } catch (err) {
    next(err);
  }
}
```

**Step 4: Run tests to verify they pass**

Run: `npx jest tests/unit/controllers/auth.test.ts -v`
Expected: ALL PASS (7 tests)

**Step 5: Commit**

```bash
git add src/controllers/auth.ts tests/unit/controllers/auth.test.ts
git commit -m "feat(auth): add register and login controller with unit tests"
```

---

## Task 7: Wire up auth routes

**Files:**
- Modify: `src/routes/auth.ts`

**Step 1: Update auth route file**

Replace entire contents of `src/routes/auth.ts`:

```typescript
import { Router } from 'express';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema } from '../middleware/schemas/auth';
import { register, login } from '../controllers/auth';

const router = Router();

router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);

export default router;
```

**Step 2: Run all unit tests**

Run: `npx jest tests/unit -v`
Expected: ALL PASS

**Step 3: Commit**

```bash
git add src/routes/auth.ts
git commit -m "feat(auth): wire up register and login routes with validation"
```

---

## Task 8: Integration tests

**Files:**
- Create: `tests/integration/auth.test.ts`

> **Note:** Integration tests require a running test database. Ensure `TEST_DATABASE_URL` env var is set or the default `postgres://localhost:5432/habit_tracker_test` is accessible. Run `npm run migrate` against the test database first.

**Step 1: Write integration tests**

Create `tests/integration/auth.test.ts`:

```typescript
import request from 'supertest';
import app from '../../src/app';
import { pool } from '../../src/db/pool';

describe('Auth endpoints', () => {
  beforeEach(async () => {
    await pool.query('DELETE FROM users');
  });

  afterAll(async () => {
    await pool.query('DELETE FROM users');
    await pool.end();
  });

  describe('POST /api/auth/register', () => {
    it('returns 201 with user data and token', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'new@example.com',
        name: 'New User',
        password: 'password123',
      });

      expect(res.status).toBe(201);
      expect(res.body.data).toMatchObject({
        email: 'new@example.com',
        name: 'New User',
      });
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.token).toBeDefined();
    });

    it('returns 400 for invalid email', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'not-an-email',
        name: 'Test',
        password: 'password123',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('returns 400 for short password', async () => {
      const res = await request(app).post('/api/auth/register').send({
        email: 'user@example.com',
        name: 'Test',
        password: 'short',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });

    it('returns 409 when email is already registered', async () => {
      await request(app).post('/api/auth/register').send({
        email: 'dup@example.com',
        name: 'First',
        password: 'password123',
      });

      const res = await request(app).post('/api/auth/register').send({
        email: 'dup@example.com',
        name: 'Second',
        password: 'password456',
      });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Email already registered');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await request(app).post('/api/auth/register').send({
        email: 'login@example.com',
        name: 'Login User',
        password: 'password123',
      });
    });

    it('returns 200 with user data and token for valid credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'login@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({
        email: 'login@example.com',
        name: 'Login User',
      });
      expect(res.body.data.id).toBeDefined();
      expect(res.body.data.token).toBeDefined();
    });

    it('returns 401 for wrong password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'login@example.com',
        password: 'wrong-password',
      });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid email or password');
    });

    it('returns 401 for non-existent email', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'nobody@example.com',
        password: 'password123',
      });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid email or password');
    });

    it('returns 400 for missing password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'login@example.com',
      });

      expect(res.status).toBe(400);
      expect(res.body.error).toBeDefined();
    });
  });
});
```

**Step 2: Run integration tests**

Run: `npx jest tests/integration/auth.test.ts -v`
Expected: ALL PASS (8 tests)

**Step 3: Commit**

```bash
git add tests/integration/auth.test.ts
git commit -m "test(auth): add integration tests for register and login endpoints"
```

---

## Task 9: Clean up debug code

**Files:**
- Modify: `src/routes/index.ts`

**Step 1: Remove console.log and unused import from routes/index.ts**

In `src/routes/index.ts`, remove the `console.log('env', env)` line and the `import { env }` import that is no longer needed:

```typescript
import { Router } from 'express';
import authRouter from './auth';
import habitsRouter from './habits';

const router = Router();

router.get('/health', (_req, res) => {
  res.json({ data: { status: 'ok' } });
});

router.use('/auth', authRouter);
router.use('/habits', habitsRouter);

export default router;
```

Note: The auth route is mounted at `/auth` (not `/api/auth`) because `app.ts` already mounts the main router at `/api`. So the full path is `POST /api/auth/register`.

**Step 2: Run all tests**

Run: `npx jest -v`
Expected: ALL PASS

**Step 3: Commit**

```bash
git add src/routes/index.ts
git commit -m "refactor(routes): remove debug console.log from health endpoint"
```

---

## Summary

| Task | Description | Tests |
|------|-------------|-------|
| 0 | Install @types/bcrypt | — |
| 1 | JWT_EXPIRES_IN env config | 1 unit test |
| 2 | User type definition | — |
| 3 | Migration system + users table | Manual verification |
| 4 | User DB query functions | 3 unit tests |
| 5 | Zod validation schemas | — |
| 6 | Auth controller | 7 unit tests |
| 7 | Wire up auth routes | — |
| 8 | Integration tests | 8 integration tests |
| 9 | Clean up debug code | — |

**Total: 10 tasks, 19 tests (11 unit + 8 integration)**

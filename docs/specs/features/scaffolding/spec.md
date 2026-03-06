# Project Scaffold Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Scaffold the full project structure — no business logic, just wiring: packages, config, Express app, DB pool, middleware skeletons, route stubs, and test setup.

**Architecture:** Backend-only REST API using Express + TypeScript + PostgreSQL. All layers (routes → controllers → db) are created as empty stubs so every future feature has a home and nothing needs to be restructured. Tests use Jest + Supertest with a separate test database.

**Tech Stack:** Node.js, TypeScript (strict), Express, PostgreSQL (`pg`), Zod, JWT (`jsonwebtoken`), bcrypt, dotenv, custom-env, ESLint (typescript-eslint), Prettier, Jest, ts-jest, Supertest

---

## Final File Tree

```
habit-tracker/
├── src/
│   ├── routes/
│   │   ├── index.ts          ← aggregator + /health
│   │   ├── auth.ts           ← stub router
│   │   └── habits.ts         ← stub router
│   ├── controllers/          ← empty dir (populated in feature tasks)
│   ├── middleware/
│   │   ├── auth.ts           ← JWT verification
│   │   ├── validate.ts       ← Zod body validation factory
│   │   └── error.ts          ← global error handler + AppError class
│   ├── db/
│   │   └── pool.ts           ← pg Pool singleton
│   ├── utils/
│   │   └── response.ts       ← sendSuccess / sendError helpers
│   ├── types/
│   │   └── index.ts          ← shared interfaces
│   ├── app.ts                ← Express app (no listen)
│   └── server.ts             ← entry point (calls listen)
├── tests/
│   ├── unit/
│   │   ├── middleware/
│   │   │   ├── auth.test.ts
│   │   │   ├── validate.test.ts
│   │   │   └── error.test.ts
│   │   └── utils/
│   │       └── response.test.ts
│   ├── integration/
│   │   └── health.test.ts
│   ├── helpers/
│   │   └── factories.ts      ← placeholder for test data builders
│   └── setup.ts
├── .env.example
├── .env                      ← gitignored
├── .gitignore
├── .eslintrc.json
├── .prettierrc
├── jest.config.ts
├── package.json
└── tsconfig.json
```

---

## Task 1: Initialize package.json

**Files:**
- Create: `package.json`

**Step 1: Create package.json**

```json
{
  "name": "habit-tracker",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "build": "tsc",
    "start": "node dist/server.js",
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "test": "jest",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration",
    "lint": "eslint src --ext .ts",
    "format": "prettier --write \"src/**/*.ts\" \"tests/**/*.ts\""
  },
  "dependencies": {
    "bcrypt": "^5.1.1",
    "custom-env": "^2.0.1",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "jsonwebtoken": "^9.0.2",
    "pg": "^8.12.0",
    "uuid": "^10.0.0",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "@types/express": "^4.17.21",
    "@types/jest": "^29.5.12",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/node": "^20.14.10",
    "@types/pg": "^8.11.6",
    "@types/supertest": "^6.0.2",
    "@types/uuid": "^10.0.0",
    "@typescript-eslint/eslint-plugin": "^7.16.0",
    "@typescript-eslint/parser": "^7.16.0",
    "eslint": "^8.57.0",
    "jest": "^29.7.0",
    "prettier": "^3.3.3",
    "supertest": "^7.0.0",
    "ts-jest": "^29.2.2",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.5.3"
  }
}
```

**Step 2: Install dependencies**

```bash
npm install
```

Expected: `node_modules/` created, `package-lock.json` generated, no errors.

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(deps): initialize package.json with all dependencies"
```

---

## Task 2: TypeScript Configuration

**Files:**
- Create: `tsconfig.json`

**Step 1: Create tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

**Step 2: Verify TypeScript can be invoked**

```bash
npx tsc --version
```

Expected: `Version 5.x.x`

**Step 3: Commit**

```bash
git add tsconfig.json
git commit -m "chore(config): add tsconfig.json with strict mode"
```

---

## Task 3: Linting and Formatting

**Files:**
- Create: `.eslintrc.json`
- Create: `.prettierrc`
- Create: `.gitignore`

**Step 1: Create .eslintrc.json**

```json
{
  "root": true,
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": "./tsconfig.json"
  },
  "plugins": ["@typescript-eslint"],
  "extends": [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:@typescript-eslint/recommended-requiring-type-checking"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-explicit-any": "error"
  },
  "env": {
    "node": true,
    "es2020": true
  }
}
```

**Step 2: Create .prettierrc**

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2
}
```

**Step 3: Create .gitignore**

```
node_modules/
dist/
.env
.env.*
!.env.example
*.js.map
```

**Step 4: Commit**

```bash
git add .eslintrc.json .prettierrc .gitignore
git commit -m "chore(config): add ESLint, Prettier, and gitignore"
```

---

## Task 4: Jest Test Setup

**Files:**
- Create: `jest.config.ts`
- Create: `tests/setup.ts`
- Create: `tests/helpers/factories.ts`

**Step 1: Create jest.config.ts**

```typescript
import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  setupFilesAfterFramework: ['<rootDir>/tests/setup.ts'],
  testMatch: ['**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: ['src/**/*.ts'],
};

export default config;
```

**Step 2: Create tests/setup.ts**

```typescript
// Global setup that runs before all tests.
// Add database teardown, global mocks, etc. here as features are built.

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-do-not-use-in-prod';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgres://localhost:5432/habit_tracker_test';
```

**Step 3: Create tests/helpers/factories.ts**

```typescript
// Placeholder for test data factories.
// Populate with builder functions as features are implemented.
// Example pattern:
//
// export const buildUser = (overrides = {}) => ({
//   id: randomUUID(),
//   email: 'test@example.com',
//   password: 'hashed',
//   created_at: new Date(),
//   ...overrides,
// });

export {};
```

**Step 4: Verify Jest runs (no tests yet)**

```bash
npm test -- --passWithNoTests
```

Expected: `Test Suites: 0 skipped` or similar, exit code 0.

**Step 5: Commit**

```bash
git add jest.config.ts tests/setup.ts tests/helpers/factories.ts
git commit -m "test: initialize jest with ts-jest and global setup"
```

---

## Task 5: Environment Configuration

**Files:**
- Create: `.env.example`
- Create: `.env` (never commit this)

**Step 1: Create .env.example**

```bash
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgres://postgres:password@localhost:5432/habit_tracker

# Auth
JWT_SECRET=change-this-to-a-long-random-secret
```

**Step 2: Create .env by copying the example**

```bash
cp .env.example .env
```

Then edit `.env` with real local values (Postgres credentials, a real JWT secret).

**Step 3: Verify .env is gitignored**

```bash
git status
```

Expected: `.env` does NOT appear in untracked files (it is gitignored).

**Step 4: Commit**

```bash
git add .env.example
git commit -m "chore(config): add environment variable template"
```

---

## Task 6: Shared Types

**Files:**
- Create: `src/types/index.ts`

**Step 1: Create src/types/index.ts**

```typescript
export interface ApiSuccess<T> {
  data: T;
}

export interface ApiError {
  error: string;
  statusCode: number;
}

// Attached to req.user by the auth middleware after JWT verification.
export interface AuthPayload {
  userId: string;
}
```

**Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat(types): add shared API response and auth payload interfaces"
```

---

## Task 7: Response Utility

**Files:**
- Create: `src/utils/response.ts`
- Create: `tests/unit/utils/response.test.ts`

**Step 1: Write the failing test first**

```typescript
// tests/unit/utils/response.test.ts
import { Response } from 'express';
import { sendSuccess, sendError } from '../../../src/utils/response';

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('sendSuccess', () => {
  it('sends 200 with { data } wrapper by default', () => {
    const res = mockResponse();
    sendSuccess(res, { id: '1' });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ data: { id: '1' } });
  });

  it('accepts a custom status code', () => {
    const res = mockResponse();
    sendSuccess(res, { id: '1' }, 201);
    expect(res.status).toHaveBeenCalledWith(201);
  });
});

describe('sendError', () => {
  it('sends error with statusCode in body', () => {
    const res = mockResponse();
    sendError(res, 'Not found', 404);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not found', statusCode: 404 });
  });
});
```

**Step 2: Run test — expect FAIL**

```bash
npm test -- tests/unit/utils/response.test.ts
```

Expected: `Cannot find module '../../../src/utils/response'`

**Step 3: Create src/utils/response.ts**

```typescript
import { Response } from 'express';
import { ApiSuccess, ApiError } from '../types';

export const sendSuccess = <T>(res: Response, data: T, status = 200): void => {
  res.status(status).json({ data } satisfies ApiSuccess<T>);
};

export const sendError = (res: Response, error: string, statusCode: number): void => {
  res.status(statusCode).json({ error, statusCode } satisfies ApiError);
};
```

**Step 4: Run test — expect PASS**

```bash
npm test -- tests/unit/utils/response.test.ts
```

Expected: `Tests: 3 passed`

**Step 5: Commit**

```bash
git add src/utils/response.ts tests/unit/utils/response.test.ts
git commit -m "feat(utils): add sendSuccess and sendError response helpers"
```

---

## Task 8: Database Connection Pool

**Files:**
- Create: `src/db/pool.ts`

**Note:** No unit test for the pool itself — it's a thin wrapper around `pg`. It is exercised by integration tests in later feature tasks when real DB queries are made.

**Step 1: Create src/db/pool.ts**

```typescript
import { Pool } from 'pg';

// Exported as a singleton. Import this in query files, never create new Pool instances.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
```

**Step 2: Commit**

```bash
git add src/db/pool.ts
git commit -m "feat(db): add pg connection pool singleton"
```

---

## Task 9: Error Handling Middleware

**Files:**
- Create: `src/middleware/error.ts`
- Create: `tests/unit/middleware/error.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/unit/middleware/error.test.ts
import { Request, Response, NextFunction } from 'express';
import { errorHandler, AppError } from '../../../src/middleware/error';

const mockRes = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('errorHandler', () => {
  const req = {} as Request;
  const next = jest.fn() as NextFunction;

  it('handles AppError with its own statusCode and message', () => {
    const res = mockRes();
    const err = new AppError('Not found', 404);
    errorHandler(err, req, res, next);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not found', statusCode: 404 });
  });

  it('falls back to 500 for unknown errors', () => {
    const res = mockRes();
    errorHandler(new Error('boom'), req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error', statusCode: 500 });
  });
});
```

**Step 2: Run test — expect FAIL**

```bash
npm test -- tests/unit/middleware/error.test.ts
```

Expected: `Cannot find module '../../../src/middleware/error'`

**Step 3: Create src/middleware/error.ts**

```typescript
import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

// Express recognizes 4-arg middleware as error handlers. All 4 params are required.
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof AppError) {
    sendError(res, err.message, err.statusCode);
    return;
  }
  sendError(res, 'Internal server error', 500);
};
```

**Step 4: Run test — expect PASS**

```bash
npm test -- tests/unit/middleware/error.test.ts
```

Expected: `Tests: 2 passed`

**Step 5: Commit**

```bash
git add src/middleware/error.ts tests/unit/middleware/error.test.ts
git commit -m "feat(middleware): add AppError class and global error handler"
```

---

## Task 10: Auth Middleware

**Files:**
- Create: `src/middleware/auth.ts`
- Create: `tests/unit/middleware/auth.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/unit/middleware/auth.test.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authenticate } from '../../../src/middleware/auth';

const mockReq = (authHeader?: string) =>
  ({ headers: { authorization: authHeader } }) as Request;

const mockRes = () => ({}) as Response;

describe('authenticate middleware', () => {
  const next = jest.fn() as unknown as NextFunction;

  beforeEach(() => jest.clearAllMocks());

  it('calls next with AppError 401 if no Authorization header', () => {
    authenticate(mockReq(), mockRes(), next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('calls next with AppError 401 if header does not start with Bearer', () => {
    authenticate(mockReq('Token abc123'), mockRes(), next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });

  it('attaches decoded payload to req.user and calls next() on valid token', () => {
    const token = jwt.sign({ userId: 'user-1' }, 'test-secret-do-not-use-in-prod');
    const req = mockReq(`Bearer ${token}`);
    authenticate(req, mockRes(), next);
    expect(next).toHaveBeenCalledWith();
    expect(req.user).toEqual(expect.objectContaining({ userId: 'user-1' }));
  });

  it('calls next with AppError 401 if token is invalid', () => {
    authenticate(mockReq('Bearer bad.token.here'), mockRes(), next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401 }));
  });
});
```

**Step 2: Run test — expect FAIL**

```bash
npm test -- tests/unit/middleware/auth.test.ts
```

Expected: `Cannot find module '../../../src/middleware/auth'`

**Step 3: Create src/middleware/auth.ts**

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from './error';
import { AuthPayload } from '../types';

// Augment Express Request so TypeScript knows about req.user downstream.
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export const authenticate = (req: Request, _res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    next(new AppError('Missing or invalid authorization header', 401));
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as AuthPayload;
    req.user = payload;
    next();
  } catch {
    next(new AppError('Invalid or expired token', 401));
  }
};
```

**Step 4: Run test — expect PASS**

```bash
npm test -- tests/unit/middleware/auth.test.ts
```

Expected: `Tests: 4 passed`

**Step 5: Commit**

```bash
git add src/middleware/auth.ts tests/unit/middleware/auth.test.ts
git commit -m "feat(middleware): add JWT authentication middleware"
```

---

## Task 11: Validation Middleware

**Files:**
- Create: `src/middleware/validate.ts`
- Create: `tests/unit/middleware/validate.test.ts`

**Step 1: Write the failing test**

```typescript
// tests/unit/middleware/validate.test.ts
import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { validate } from '../../../src/middleware/validate';

const mockReq = (body: unknown) => ({ body }) as Request;
const mockRes = () => ({}) as Response;

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

describe('validate middleware', () => {
  const next = jest.fn() as unknown as NextFunction;

  beforeEach(() => jest.clearAllMocks());

  it('calls next() with no args when body is valid', () => {
    validate(schema)(mockReq({ email: 'a@b.com', password: '12345678' }), mockRes(), next);
    expect(next).toHaveBeenCalledWith();
  });

  it('calls next with AppError 400 when body fails validation', () => {
    validate(schema)(mockReq({ email: 'not-an-email', password: '123' }), mockRes(), next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
  });

  it('passes the first Zod error message to AppError', () => {
    validate(schema)(mockReq({}), mockRes(), next);
    const error = (next as jest.Mock).mock.calls[0][0] as Error & { statusCode: number };
    expect(error.message).toBeTruthy();
    expect(error.statusCode).toBe(400);
  });
});
```

**Step 2: Run test — expect FAIL**

```bash
npm test -- tests/unit/middleware/validate.test.ts
```

Expected: `Cannot find module '../../../src/middleware/validate'`

**Step 3: Create src/middleware/validate.ts**

```typescript
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from './error';

// Returns an Express middleware that validates req.body against the given Zod schema.
// On failure, passes an AppError(400) to next so the global error handler formats it.
export const validate =
  (schema: AnyZodObject) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    try {
      schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(new AppError(err.errors[0].message, 400));
        return;
      }
      next(err);
    }
  };
```

**Step 4: Run test — expect PASS**

```bash
npm test -- tests/unit/middleware/validate.test.ts
```

Expected: `Tests: 3 passed`

**Step 5: Commit**

```bash
git add src/middleware/validate.ts tests/unit/middleware/validate.test.ts
git commit -m "feat(middleware): add Zod request body validation factory"
```

---

## Task 12: Route Stubs

**Files:**
- Create: `src/routes/auth.ts`
- Create: `src/routes/habits.ts`
- Create: `src/routes/index.ts`

**Step 1: Create src/routes/auth.ts**

```typescript
import { Router } from 'express';

const router = Router();

// Routes populated in: feat(auth) tasks
// POST /api/auth/register
// POST /api/auth/login

export default router;
```

**Step 2: Create src/routes/habits.ts**

```typescript
import { Router } from 'express';

const router = Router();

// Routes populated in: feat(habits) and feat(tracking) tasks
// GET    /api/habits/defaults
// POST   /api/habits/defaults/:id/adopt
// POST   /api/habits
// GET    /api/habits
// DELETE /api/habits/:id
// POST   /api/habits/:id/complete
// DELETE /api/habits/:id/complete
// GET    /api/habits/today

export default router;
```

**Step 3: Create src/routes/index.ts**

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

**Step 4: Commit**

```bash
git add src/routes/
git commit -m "feat(habits): add route stubs for auth, habits, and health check"
```

---

## Task 13: Express App and Server Entry Point

**Files:**
- Create: `src/app.ts`
- Create: `src/server.ts`
- Create: `tests/integration/health.test.ts`

**Step 1: Write the failing integration test**

```typescript
// tests/integration/health.test.ts
import request from 'supertest';
import app from '../../src/app';

describe('GET /api/health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: { status: 'ok' } });
  });

  it('returns 404 for unknown routes', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
  });
});
```

**Step 2: Run test — expect FAIL**

```bash
npm test -- tests/integration/health.test.ts
```

Expected: `Cannot find module '../../src/app'`

**Step 3: Create src/app.ts**

```typescript
import express from 'express';
import router from './routes';
import { errorHandler } from './middleware/error';

const app = express();

app.use(express.json());
app.use('/api', router);

// Must be registered after all routes. Express identifies error handlers by arity (4 args).
app.use(errorHandler);

export default app;
```

**Step 4: Create src/server.ts**

```typescript
import customEnv from 'custom-env';

// Load .env.<NODE_ENV> before anything else touches process.env
customEnv.env(process.env.NODE_ENV ?? 'development');

import app from './app';

const PORT = process.env.PORT ?? '3000';

app.listen(PORT, () => {
  console.log(`[server] Listening on http://localhost:${PORT}`);
});
```

**Step 5: Run test — expect PASS**

```bash
npm test -- tests/integration/health.test.ts
```

Expected: `Tests: 2 passed`

**Step 6: Commit**

```bash
git add src/app.ts src/server.ts tests/integration/health.test.ts
git commit -m "feat: wire Express app, server entry point, and health check route"
```

---

## Task 14: Full Test Suite Pass

**Step 1: Run all tests**

```bash
npm test
```

Expected output:
```
Test Suites: 5 passed, 5 total
Tests:       12 passed, 12 total
```

All test files: `response.test.ts`, `error.test.ts`, `auth.test.ts`, `validate.test.ts`, `health.test.ts`

**Step 2: Run linter**

```bash
npm run lint
```

Expected: no errors.

**Step 3: Verify build compiles cleanly**

```bash
npm run build
```

Expected: `dist/` created, exit code 0, no TypeScript errors.

**Step 4: Final commit**

```bash
git add -A
git commit -m "chore: verify scaffold — all tests pass, lint clean, build succeeds"
```

---

## Done — Scaffold Is Complete

The project is fully scaffolded. Each future feature task (auth, habits, tracking) works within this structure:

1. Add a query function in `src/db/`
2. Add a controller in `src/controllers/`
3. Wire the route in the relevant `src/routes/*.ts`
4. Middleware (`authenticate`, `validate`) is already available
5. Response format (`sendSuccess` / `sendError`) is consistent

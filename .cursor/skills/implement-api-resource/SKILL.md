---
name: api-resource
description: Full workflow for adding a new REST API resource to the habit-tracker project. Use when implementing a new endpoint, adding a route, creating a controller, adding DB queries, or building a new API feature. Covers unit tests → DB queries → controller → route, with optional auth and Zod validation.
---

# Implement API Resource

Workflow for adding a new resource to the Express/PostgreSQL API. Follow all steps in order.

## Checklist

Copy and track progress:

```
- [ ] 1. Plan the resource
- [ ] 2. Write unit tests (controller + db mocks)
- [ ] 3. Write DB query functions (+ migration if needed)
- [ ] 4. Write controller
- [ ] 5. Write route (+ auth/validate middleware)
- [ ] 6. Register route in router
- [ ] 7. Write integration test
- [ ] 8. Run tests
```

---

## Step 1 — Plan the resource

Determine before writing any code:

- **Endpoints**: method, path, description (check `docs/project-overview.md` for the route table)
- **Auth required?** Most routes require `authenticate`. Only `POST /auth/register` and `POST /auth/login` are public.
- **Request body?** If yes, define a Zod schema for `validate()` middleware.
- **DB changes?** New table or column → write a migration SQL file in `src/db/migrations/`.

---

## Step 2 — Unit tests

Location: `tests/unit/<layer>/<resource>.test.ts`

Write tests **before** the implementation. Mock the DB layer; never use a real DB in unit tests.

**Controller unit test pattern:**

```typescript
import { Request, Response, NextFunction } from 'express';
import * as db from '../../../src/db/<resource>';
import { <handlerFn> } from '../../../src/controllers/<resource>';

jest.mock('../../../src/db/<resource>');

const mockReq = (overrides = {}) =>
  ({ body: {}, params: {}, user: { userId: 'user-uuid' }, ...overrides }) as Request;

const mockRes = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('<handlerFn>', () => {
  const next = jest.fn() as unknown as NextFunction;
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with data on success', async () => {
    (db.<queryFn> as jest.Mock).mockResolvedValue(<mockResult>);
    const req = mockReq();
    const res = mockRes();
    await <handlerFn>(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ data: <mockResult> });
  });

  it('calls next with AppError on failure', async () => {
    (db.<queryFn> as jest.Mock).mockRejectedValue(new Error('db error'));
    await <handlerFn>(mockReq(), mockRes(), next);
    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: expect.any(Number) }));
  });
});
```

Add a factory in `tests/helpers/factories.ts` if building complex test objects:

```typescript
export const build<Resource> = (overrides = {}) => ({
  id: randomUUID(),
  user_id: 'user-uuid',
  // ... default fields
  ...overrides,
});
```

---

## Step 3 — DB query functions

Location: `src/db/<resource>.ts`

Use the exported `pool` singleton. Never create new Pool instances.

```typescript
import { pool } from './pool';

export async function get<Resources>(userId: string): Promise<<ResourceRow>[]> {
  const { rows } = await pool.query(
    'SELECT * FROM <table> WHERE user_id = $1 ORDER BY created_at DESC',
    [userId],
  );
  return rows;
}

export async function create<Resource>(
  userId: string,
  data: { name: string },
): Promise<<ResourceRow>> {
  const { rows } = await pool.query(
    'INSERT INTO <table> (id, user_id, name, created_at) VALUES (gen_random_uuid(), $1, $2, NOW()) RETURNING *',
    [userId, data.name],
  );
  return rows[0];
}
```

**If a new table is needed**, create `src/db/migrations/<timestamp>_create_<table>.sql`:

```sql
CREATE TABLE <table> (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

Rules: UUID PKs, snake_case columns, `created_at` on every table, FK with `ON DELETE CASCADE` where appropriate.

---

## Step 4 — Controller

Location: `src/controllers/<resource>.ts`

- Accept `(req, res, next)` — never access `req`/`res` in business logic; delegate to db functions.
- Use `sendSuccess` / `AppError` for all responses.
- Get the authenticated user from `req.user.userId` (populated by `authenticate` middleware).

```typescript
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../middleware/error';
import { sendSuccess } from '../utils/response';
import * as db from '../db/<resource>';

export const get<Resources> = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const items = await db.get<Resources>(req.user!.userId);
    sendSuccess(res, items);
  } catch (err) {
    next(err);
  }
};

export const create<Resource> = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const item = await db.create<Resource>(req.user!.userId, req.body);
    sendSuccess(res, item, 201);
  } catch (err) {
    next(err);
  }
};
```

Throw `AppError` for expected failures (not-found, forbidden):

```typescript
const item = await db.get<Resource>ById(id);
if (!item) next(new AppError('<Resource> not found', 404));
```

---

## Step 5 — Route

Location: `src/routes/<resource>.ts`

Import `authenticate` for protected endpoints. Import `validate` + a Zod schema for body validation.

```typescript
import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { get<Resources>, create<Resource> } from '../controllers/<resource>';
import { z } from 'zod';

const router = Router();

const create<Resource>Schema = z.object({
  name: z.string().min(1, 'name is required'),
});

// Protected routes
router.get('/', authenticate, get<Resources>);
router.post('/', authenticate, validate(create<Resource>Schema), create<Resource>);

export default router;
```

**Auth decision:**
- Protected resource → always add `authenticate` as the first middleware on the route.
- Public endpoint (register/login only) → omit `authenticate`.

**Middleware order on a route:** `authenticate` → `validate(schema)` → controller handler.

---

## Step 6 — Register in router

Add the new router to `src/routes/index.ts`:

```typescript
import <resource>Router from './<resource>';
router.use('/<resource>', <resource>Router);
```

---

## Step 7 — Integration test

Location: `tests/integration/<resource>.test.ts`

Uses `supertest` against the real Express app with a test DB (`TEST_DATABASE_URL`).

```typescript
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../../src/app';

const authHeader = (userId = 'user-uuid') =>
  `Bearer ${jwt.sign({ userId }, process.env.JWT_SECRET!)}`;

describe('GET /api/<resource>', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/<resource>');
    expect(res.status).toBe(401);
  });

  it('returns 200 with data', async () => {
    const res = await request(app)
      .get('/api/<resource>')
      .set('Authorization', authHeader());
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('data');
  });
});
```

---

## Step 8 — Run tests

```bash
npm run test:unit       # fast, no DB needed
npm run test:integration  # requires TEST_DATABASE_URL
npm test                # all tests
```

Fix any failures before considering the resource complete.

---

## Quick reference

| Concern | Location | Key import |
|---------|----------|------------|
| DB pool | `src/db/pool.ts` | `pool` |
| Auth middleware | `src/middleware/auth.ts` | `authenticate` |
| Validation middleware | `src/middleware/validate.ts` | `validate` |
| Error class | `src/middleware/error.ts` | `AppError` |
| Response helpers | `src/utils/response.ts` | `sendSuccess`, `sendError` |
| Types | `src/types/index.ts` | `AuthPayload`, `ApiSuccess`, `ApiError` |

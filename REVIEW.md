# Review instructions

## What Important (🔴) means here

Flag as Important only when the code would break in production or introduces a security vulnerability:

- **SQL injection**: any variable interpolated into a template literal or concatenated into a string passed to `pool.query(...)`. Only `$1, $2` parameterized placeholders are safe.
- **Auth bypass**: a route that reads or writes user data but has no `authenticate` middleware as its first handler. Expected order: `authenticate → validate(schema) → controller`.
- **Data loss or incorrect mutations**: logic errors that corrupt state, delete the wrong row, or skip required DB operations.
- **Secrets in code**: hardcoded API keys, tokens, or passwords.

## What High (🟠) means here

Clear violations of project conventions that would fail review:

- **Wrong response shape**: a controller calling `res.json(...)` or `res.status(...).json(...)` directly instead of `sendSuccess(res, data, statusCode)` or `sendError(res, message, statusCode)`.
- **Wrong HTTP status on resource creation**: a POST endpoint that creates a new resource but returns `200` instead of `201`.
- **Business logic in controllers**: filtering, transformation, or computation that belongs in a `db/` query function, not the controller.
- **`any` type**: use `unknown` and narrow with a type guard instead.

## Test coverage

Flag as High if a new controller file is added but the corresponding test file covers fewer than half the exported functions, or covers only the happy path of a single function with no error cases tested.

## Do not report

- Anything already enforced by the ESLint or TypeScript compiler (type errors, unused imports, formatting).
- `node_modules/`, `dist/`, `*.lock`, `package-lock.json`.
- Missing JSDoc or inline comments (the project standard is no unnecessary comments).

## Cap nits

Post at most four 🟡 Nit comments per review. If more exist, summarize them as a count in the review body.

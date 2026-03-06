# Habit Tracker API

A RESTful API for tracking daily habits. Users register, curate a personal habit list (from defaults or custom), and check off completions each day.

## Architecture

Backend-only REST API. No frontend — designed to be consumed by any client.

```
Client (any) → Express API → PostgreSQL
```

**Layers:**

- **Routes** — route definitions, endpoint mapping
- **Controllers** — request handling, response formatting
- **Middleware** — auth verification, validation (Zod), error handling
- **DB** — database connection, queries, migrations
- **Utils** — shared helpers, constants, type definitions

## Tech Stack

| Category       | Technology                          |
| -------------- | ----------------------------------- |
| Runtime        | Node.js                             |
| Language       | TypeScript                          |
| Framework      | Express                             |
| Database       | PostgreSQL                          |
| Authentication | JWT (access tokens)                 |
| Validation     | Zod                                 |
| Config         | dotenv, custom-env                  |
| Tooling        | ESLint (typescript plugin), Prettier|

## Data Model

### User

| Column      | Type      | Notes              |
| ----------- | --------- | ------------------ |
| id          | UUID      | PK                 |
| email       | string    | unique, required   |
| password    | string    | hashed             |
| created_at  | timestamp | default now        |

### Habit

| Column      | Type      | Notes                          |
| ----------- | --------- | ------------------------------ |
| id          | UUID      | PK                             |
| user_id     | UUID      | FK → User                      |
| name        | string    | required                       |
| is_default  | boolean   | true if adopted from seed list |
| created_at  | timestamp | default now                    |

### Habit Log

| Column       | Type      | Notes                              |
| ------------ | --------- | ---------------------------------- |
| id           | UUID      | PK                                 |
| habit_id     | UUID      | FK → Habit                         |
| completed_at | date      | the day the habit was checked off  |
| created_at   | timestamp | default now                        |

Unique constraint on `(habit_id, completed_at)` — one check-off per habit per day.

### Default Habit (seed table)

| Column | Type   | Notes            |
| ------ | ------ | ---------------- |
| id     | UUID   | PK               |
| name   | string | e.g. "Exercise"  |

Pre-seeded with common habits: Exercise, Read, Meditate, Drink Water, Sleep 8 Hours.

## Functional Requirements

### Auth

- Register with email and password
- Login and receive a JWT access token
- Protected routes require a valid token

### Habits

- Browse the list of default (seed) habits
- Adopt a default habit into personal list
- Create a custom habit
- View personal habit list
- Delete a habit (and its logs)

### Tracking

- Mark a habit as complete for today
- Undo a completion for today
- View today's habits with completion status

## Non-Functional Requirements

- All input validated with Zod schemas before reaching business logic
- Passwords hashed with bcrypt, never stored or returned in plaintext
- Consistent JSON error responses: `{ error: string, statusCode: number }`
- Environment-based config (dev/prod) via dotenv and custom-env
- TypeScript strict mode enabled

## API Routes

| Method | Route                          | Description                     | Auth     |
| ------ | ------------------------------ | ------------------------------- | -------- |
| POST   | /api/auth/register             | Create account                  | No       |
| POST   | /api/auth/login                | Login, receive token            | No       |
| GET    | /api/habits/defaults           | List seed habits                | Yes      |
| POST   | /api/habits/defaults/:id/adopt | Add a default habit to own list | Yes      |
| POST   | /api/habits                    | Create custom habit             | Yes      |
| GET    | /api/habits                    | List own habits                 | Yes      |
| DELETE | /api/habits/:id                | Delete a habit                  | Yes      |
| POST   | /api/habits/:id/complete       | Mark habit done for today       | Yes      |
| DELETE | /api/habits/:id/complete       | Undo today's completion         | Yes      |
| GET    | /api/habits/today              | Today's habits + status         | Yes      |

## Out of Scope (v1)

These are explicitly **not** part of the initial version:

- Streak tracking or analytics
- Reminders / notifications
- Habit frequency settings (everything is daily)
- Frontend / UI
- OAuth or social login
- Token refresh flow

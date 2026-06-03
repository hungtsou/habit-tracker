# AI PR Review Setup

This repo uses [Claude Code Action](https://github.com/anthropics/claude-code-action) to automatically review pull requests using Claude (Sonnet).

## One-time setup

1. Go to your repo on GitHub → **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Name: `ANTHROPIC_API_KEY`
4. Value: your Anthropic API key from [console.anthropic.com](https://console.anthropic.com)

## How it works

- Runs automatically on every PR (opened, reopened, or when new commits are pushed)
- Uses `claude-sonnet-4-6` for cost-effective, high-quality reviews
- Posts a structured review comment directly on the PR
- Reviews only the PR diff — skips lock files, `dist/`, and `node_modules/`

## Review format

Each review is organized by severity:

| Tier | Meaning |
|------|---------|
| 🔴 Critical | Must fix before merge (security holes, data loss) |
| 🟠 High | Likely bugs or clear standard violations |
| 🟡 Medium | Standard violations that reduce maintainability |
| 🟢 Low | Minor style or nitpicks |
| ✅ Looks Good | What's well done |

## What Claude checks

1. **Security** — SQL injection, auth bypass, exposed secrets, OWASP Top 10
2. **Project standards** — response shape, thin controllers, middleware order, Zod schemas, parameterized queries, named exports, no `any`
3. **Logic bugs** — wrong behavior, missing edge cases, incorrect status codes
4. **Test coverage** — missing tests for changed logic

---
name: create-tasks
description: Generate a tasks.md implementation plan for a feature/spec in the house format — decomposed, dependency-ordered tasks, each with a copy-paste Agent prompt and an enforced implementer↔reviewer (review-agent) loop. On-demand only; never auto-invoked.
disable-model-invocation: true
argument-hint: '[spec: path to a spec file/dir, or a short feature description]'
allowed-tools:
  - Read
  - Grep
  - Glob
  - Write
  - Edit
  - Bash
  - Agent
---

# Create Tasks

Turn a feature spec into a **`tasks.md`** implementation plan in this skill's
house format: small, dependency-ordered tasks that each ship as one commit, each
with a self-contained **Agent prompt**, and each gated behind the mandatory **🔁
implementer↔reviewer loop** (the `review-agent` subagent). The complete format —
including the reusable blocks to keep verbatim and a worked example task — is
embedded under "Required output format" below; this skill is self-contained.

This skill is **project-agnostic**. It does not bake in a stack, style guide,
test runner, or env/DB rules. Those are sourced from the **target repo** at
generation time (see step 3) and written into that plan's Conventions section.

`$ARGUMENTS` is the **spec**: a path to a spec file (`spec.md`), a feature
directory (containing `spec.md` / `system.md`), or a short feature description.

## Steps

### 1. Resolve the spec and the target location

- **If `$ARGUMENTS` is a path** to a file or directory: read it and any companion
  docs beside it (`spec.md`, `system.md`, `spike-findings.md`, design notes).
  Write the plan to `tasks.md` **in that directory** (co-located with the spec).
- **If `$ARGUMENTS` is a directory that doesn't exist yet, or a description:**
  choose a repo-root folder `feature-<kebab-name>/` and write
  `feature-<kebab-name>/tasks.md`.
- **If a `tasks.md` already exists at the target:** stop and ask the user whether
  to overwrite, before writing anything.
- If the spec is thin (a one-line description with no doc), ask the user 2–4
  sharp scoping questions before decomposing — don't invent requirements.

### 2. Confirm the review loop's dependency exists

The generated plan requires the `review-agent` subagent. Look for it in the
target repo (typical homes: `.claude/agents/review-agent.md`,
`.cursor/agents/review-agent.md`). If it's missing, tell the user the plan will
reference a `review-agent` they still need to create, and continue — the 🔁
block still belongs in the file.

### 3. Source project conventions from the target repo

Read the target repo's agent/dev guide **before** writing the plan. Prefer, in
order: `AGENTS.md`, then `CLAUDE.md`, then `CONTRIBUTING.md` / a root README
development section. Extract only rules that would bind an implementer:

- stack / language / style non-negotiables
- how to run tests, lint, and typecheck (commands, workspaces, parallelism or
  memory limits)
- git extras (required commit trailer, signing)
- data / env safety (what may be mutated locally vs never touched)

Write those into the generated plan's **Conventions** section as that repo's
rules. Do **not** invent conventions, and do **not** carry conventions from a
different project (including whatever repo this skill was copied from). If the
target repo has no agent guide, use a short generic set (read existing patterns;
run the repo's documented validate commands; don't mutate shared/prod data) and
note the gap in your report to the user.

### 4. Understand the codebase enough to write accurate Repository context

Each task's **Repository context** must cite real files and line ranges the
implementer will touch (e.g. `path/to/file.ts:120-140` — the pattern to copy).
Explore with `Grep`/`Glob`/`Read`, or — for a broad sweep — delegate to one or
more `Explore` agents and keep only their conclusions. Never fabricate a path or
line number; if you can't verify one, describe the location in words and flag it
as "verify at implementation time."

### 5. Decompose into tasks

Principles (match the reference):

- **One concern per task.** A task edits a coherent slice (a migration + its
  schema/types; one endpoint; one page). Prefer more small tasks over few large
  ones.
- **Order for independent execution.** Each task must be landable on its own once
  its dependencies are committed. Sequence so early tasks are inert/behaviour-
  preserving and later tasks wire them up; note when a task is inert until a
  later one lands.
- **Explicit dependencies** by task ID, and a **release grouping** note when a set
  of tasks must ship together to avoid a broken intermediate state.
- **Flag risk and security.** Mark the riskiest task (⚠️) and any security-
  sensitive task (🔒) in its heading, as the reference does.
- **Human-only tasks** (spikes needing live infra/credentials, manual QA) are
  allowed — mark them clearly, assign a human owner, and note they're exempt from
  the 🔁 loop (no repo changes to review).
- Record any **product/scope decisions already made** so future agents don't
  reopen them.

### 6. Write `tasks.md` using the format in "Required output format" below

Fill every section. Keep the reusable blocks (Status legend, Running a single
task, the skill-owned Conventions bullets, and the entire 🔁 block) **verbatim**
— they're feature- and project-agnostic. Fill the **project-conventions** slot
from step 3 with this repo's actual rules. Add feature-specific constraint
blocks (🔒/🧪/🚫 style) only when the feature actually has such constraints.
Do not leave `‹slots›` in the output file.

### 7. Verify and report

- If the repo formats Markdown (Prettier, dprint, etc.), run that check on the
  new file and fix if it complains; otherwise skip.
- Sanity-check the mermaid dependency graph node/edge names against the task IDs.
- Report to the user: the file path, the task count, the dependency ordering, and
  any open questions or human-only tasks you left in.

## Required output format

Produce a file with these sections in order. `‹…›` marks fill-ins.

````markdown
# ‹Feature name› — Implementation Tasks

**Feature:** `‹feature-slug›`
**Companions:** ‹`spec.md` / `system.md` if they exist, else omit›

## Status legend

- `[ ]` Not started
- `[~]` In progress
- `[x]` Done
- `[!]` Blocked

## Running a single task (one agent per task)

These tasks are built to be executed **one at a time**, each by its own agent.
To dispatch task `Tn`:

1. **Check preconditions.** Confirm every task in `Tn`'s **Dependencies** (and the
   Summary checklist's "Depends on" column) is already committed on the feature
   branch — its migration/file/symbol should be present in the tree. Don't start a
   task on an incomplete base; if a dependency is missing, stop and say so.
2. **Hand the agent that task's `Agent prompt` block, verbatim.** Each prompt
   opens with an ⚙️ execution-rules reminder pointing back to the conventions
   below (including the 🔁 review cycle). Make the project's agent guide
   (`AGENTS.md` / `CLAUDE.md` / equivalent) and this file available.
3. **The agent owns the whole loop for its task:** implement → validate → invoke
   `review-agent` → resolve findings → re-review → only then complete. See 🔁.

**Status + branch mechanics (every task):**

- All task work lands on the **feature branch** — one logical commit per task,
  staged by explicit path. No new branches unless told otherwise.
- The implementing agent updates its **own** task's **Status** line in this file
  as part of the task's commit: `[ ]` → `[~]` on start, → `[x]` only when the 🔁
  Completion Rules are met (or `[!]` Blocked, with an escalation note).
- On completion the agent records the result in the task's `### Review outcome`
  subsection (one-line PASS summary + any deferred findings).
- The agent reports the branch and commit hash in its final report.

## Conventions for every task

‹Optional feature-specific constraint blocks go here first — add one only if the
feature actually has such a constraint. Format each as a `>` blockquote led by an
emoji + ALL-CAPS label, e.g.:›

> **🔒 HARD CONSTRAINT — ‹short label› (‹owner directive, date›).** ‹The rule, then
> concrete do/don't bullets — what the agent must never reach, run, or change, and
> the one allowed path instead.›

> **🧪 TESTING SCOPE.** ‹New code → full unit coverage. Modified code → test the
> change + a regression guard. Untouched code → do not backfill. Name the validate
> command that is the bar for "done".›

‹PROJECT CONVENTIONS — write the target repo's real non-negotiables here, sourced
in step 3. Typical bullets: read the agent guide first; style/type/ID rules; how
to run tests safely; data/env safety; required commit trailer. Omit any bullet
the project does not actually require. Then the skill-owned bullets below.›

- Read the project agent guide (`AGENTS.md` / `CLAUDE.md` / equivalent) first and
  honor its non-negotiables.
- ‹project-specific conventions from step 3 — one bullet per distinct rule, or a
  short clustered bullet. Delete this placeholder.›
- Stage by explicit path (`git add path/to/file`). Never `git add -A` / `.` / `-u`.
- Do not touch the remote, do not change branches, do not `--amend`, do not
  `--no-verify`. One logical commit per task. Add a commit trailer only if the
  project agent guide requires one.
- Report the branch name and commit hash verbatim in your final report.

> **🔁 IMPLEMENTATION ↔ REVIEW CYCLE (required for every implementation task).**
> No implementation task may be marked `[x]` until it has passed an independent
> review by the on-demand **`review-agent`** subagent
> (`.claude/agents/review-agent.md` or `.cursor/agents/review-agent.md`).
> `review-agent` never activates on its own — the implementer must invoke it.
> (Any human-only spike/research task that makes no repository changes is
> exempt.) The loop is mandatory and runs as follows:
>
> 1. **Implement + validate.** Complete the task and run every relevant validation
>    — the project's tests for the touched area, plus typecheck, lint, and any
>    build — subject to any project- or feature-specific constraint blocks above.
> 2. **Spawn `review-agent` before marking the task complete.** Invoke it
>    **read-only** — do **not** ask it to apply fixes; the _implementer_ owns all
>    edits — and hand it the full context list below.
> 3. **Reviewer returns a structured report** (verdict + severity-classified
>    findings) to the implementer. It independently re-verifies the work; it does
>    not merge, edit, or contact anyone.
> 4. **Resolve every confirmed, actionable finding** that can be fixed within the
>    task's scope, then re-run the relevant validations.
> 5. **Re-review.** Ask `review-agent` to review the updated implementation,
>    passing the previous report and a summary of how each finding was addressed.
>    Each pass is a fresh independent review, **not** a confirm-my-fixes check.
> 6. **Repeat steps 4–5** until either the reviewer reports no remaining
>    confirmed, actionable findings, **or** the only findings left cannot be safely
>    resolved within the task's scope (see deferral criteria).
> 7. Mark the task `[x]` only after one of those exit conditions holds **and** all
>    Completion Rules below are met. Never loop indefinitely — if a blocking issue
>    survives repeated attempts, mark the task `[!]` Blocked and escalate (below).
>
> **Context to hand the reviewer on each invocation** (include every item that
> applies): the original task description; all acceptance criteria; the current
> task status; a summary of the implementation; the files, components, and
> business processes changed; the relevant diff / commit / branch; applicable
> project rules, guardrails, architecture, and coding conventions (the project
> agent guide plus the convention blocks above and this task's own Constraints);
> important technical or business decisions; known constraints and assumptions;
> tests added or updated; results from tests, lint, typecheck, build, and other
> validations; known risks, uncertainties, or areas needing special attention;
> and — for follow-up reviews — the previous review report plus a summary of how
> each finding was addressed.
>
> **Every finding gets one recorded outcome — never silently ignored or skipped:**
>
> - **Resolved** — the issue was fixed and verified.
> - **Rejected** — the finding was determined invalid, with evidence and reasoning.
> - **Deferred** — valid, but not safely resolvable within this task. A finding may
>   be deferred **only** when it: is outside the task's authorized scope; requires a
>   product, architecture, or business decision; depends on unavailable information
>   or external work; conflicts with an explicit project requirement; cannot be
>   fixed safely without introducing disproportionate risk; or is a pre-existing
>   issue unrelated to this implementation.
>
> **Record the review outcome in the task entry.** Append a `### Review outcome`
> subsection to the task holding **(a)** a one-line final summary — the review
> verdict and the highest remaining severity — and **(b)** every Deferred finding,
> each with: title + severity; description + impact; reason it could not be
> resolved; evidence / relevant file locations; recommended follow-up action; and
> any required owner, dependency, or decision.
>
> **Completion Rules — mark `[x]` only when ALL of these hold:**
>
> - Every acceptance criterion has been verified.
> - Required validations pass, or any exception is explicitly documented.
> - The final review contains **no unresolved Critical, High, or Medium findings.**
> - Every remaining Low finding or Suggestion is resolved, rejected with evidence,
>   or explicitly deferred.
> - All deferred findings are recorded in the task per above.
> - The task entry carries a concise summary of the final review outcome.
>
> **No infinite review loops — escalate instead.** If the same issue remains
> unresolved after repeated attempts, stop retrying, document the blocker
> (what it is, why it resists resolution, and the decision or owner it needs),
> mark the task `[!]` Blocked (**not** `[x]`), and escalate for a human, product,
> security, or architecture decision.
>
> **Do not undermine reviewer independence.** Never tell the reviewer to approve
> the work, and never limit it to confirming previous fixes. Every review must
> independently verify acceptance criteria, code correctness, business logic,
> security and privacy, project conventions and guardrails, test coverage, and
> regression / edge-case risk.

## Dependency graph

```mermaid
graph LR
    ‹T1["T1 …"] --> T2["T2 …"]  — one node per task, edges = dependencies›
```

**Release grouping:** ‹which tasks can ship inertly; which must ship together and
why.›

**Product decisions already made — do not reopen:** ‹list, or omit if none.›

---

## T1 — `[ ]` ‹Task title› ‹⚠️ / 🔒 marker if applicable›

**Objective.** ‹One or two sentences: the outcome, and whether it's meant to be
behaviour-preserving.›

**Status.** `[ ]`

**Dependencies.** ‹task IDs, or "None".›

**Repository context.**

- ‹`path/to/file.ts:120-140` — what it is / the pattern to copy.›

**Instructions.**

1. ‹Concrete, ordered steps. Name exact files, symbols, and the shape to mirror.›

**Constraints / non-goals.**

- ‹What NOT to touch; scope fences.›

**AC covered.** ‹acceptance-criteria IDs from the spec, or "supports …".›

**Tests and verification.** ‹what to test — new code gets full unit coverage;
modified code gets a change test + a regression guard.›

```bash
‹the target repo's actual validate commands for the touched area — typecheck,
lint, and tests as documented in its agent guide / package scripts.›
```

**Deliverables.** ‹the files changed.› One commit.

**Agent prompt.**

> ⚙️ **Execution rules first.** Before you start, and before you mark this task
> `[x]`, follow the conventions at the top of `tasks.md` — including 🔁 the
> implement↔review cycle: you must invoke the `review-agent` subagent (read-only)
> and clear its findings before completing, and update this task's Status line and
> its `### Review outcome` in your commit. (Also honor any 🔒/🧪/🚫 constraint
> blocks if this plan has them.) Then:
>
> ‹Self-contained instructions: what repo/dir to work in, what to read first, the
> ordered steps, what NOT to touch, the tests to add, the verify commands, and
> "Commit by explicit path; report branch and commit hash."›

---

‹…repeat per task…›

## Summary checklist

| ID  | Task    | Status | Depends on | Primary ACs |
| --- | ------- | ------ | ---------- | ----------- |
| T1  | ‹title› | `[ ]`  | —          | ‹ACs›       |
````

## Rules

- **Never auto-run.** This skill only runs when the user invokes it.
- **Don't implement anything.** This skill writes the plan file only — it does not
  write feature code, run migrations, or touch app source.
- **Don't commit** unless the user explicitly asks. Writing `tasks.md` is the
  deliverable; leave git to the user.
- **Every implementation task carries the ⚙️ preamble** in its Agent prompt and is
  bound by the 🔁 loop. Keep the 🔁 block verbatim; it is the point of this skill.
- **Accuracy over completeness.** A cited `file:line` you couldn't verify is worse
  than an honest "verify at implementation time." Don't invent repo details.
- **Ask, don't guess, on scope.** If the spec leaves a real product/architecture
  decision open, surface it (as an open question in the plan and, if it blocks
  decomposition, to the user) rather than silently deciding it.
- **Stay in the target repo.** Conventions, paths, and validate commands come
  from the repo you are planning in — never from muscle memory of another
  project.

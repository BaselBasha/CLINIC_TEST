# Backend Developer Assessment

Welcome! This take-home assessment evaluates your backend development skills. Please read this entire document before you start writing any code.

---

## Overview

This assessment has **two independent parts**:

| Part | What You'll Do | Where to Work |
|------|---------------|---------------|
| **Part 1 — Build an API** | Build a Clinic Appointment System REST API from scratch | `part-1-build/` |
| **Part 2 — Security Code Review** | Find and fix security vulnerabilities in an existing API | `part-2-review/` |

Both parts are **required**. You can work on them in any order.

---

## Time Limit

You have **24 hours** from the moment you receive this assessment.

> **Suggested time allocation:**
> - Part 1 (Build): ~60–70% of your time
> - Part 2 (Review): ~30–40% of your time
>
> If you're running out of time, a well-built Part 1 with a partial but high-quality Part 2 is better than rushing both.

---

## Part 1 — Build an API

Build the REST API described in [`part-1-build/API_SPEC.md`](part-1-build/API_SPEC.md) **from scratch**.

**Tech stack (required):**
- Node.js + Express.js
- TypeScript (strict mode)
- PostgreSQL + Prisma ORM
- JWT authentication

**What you need to deliver:**
1. A fully working API inside the `part-1-build/` folder
2. A `docker-compose.yml` that starts both the API and PostgreSQL with a single `docker compose up` command — **OR** clear step-by-step setup instructions in a README inside `part-1-build/`
3. We must be able to start your API and test every endpoint. If we can't run it, we can't evaluate it.

Read the full specification here: [`part-1-build/API_SPEC.md`](part-1-build/API_SPEC.md)

---

## Part 2 — Security Code Review

The code in [`part-2-review/src/`](part-2-review/src/) is a small Medical Records API. It runs and handles requests, but it was intentionally written with **multiple security vulnerabilities**.

**What you need to deliver:**
1. A file called `part-2-review/SECURITY_REVIEW.md` documenting every vulnerability you find
2. A fixed version of the code in `part-2-review/src/` with all vulnerabilities patched

For each vulnerability, document:
- **What** the vulnerability is
- **Where** it is (file + line number or function name)
- **Why** it's dangerous (what could an attacker do?)
- **How** to fix it (and apply the fix in the code)

Read the full instructions here: [`part-2-review/REVIEW_INSTRUCTIONS.md`](part-2-review/REVIEW_INSTRUCTIONS.md)

---

## What We Evaluate

See [`EVALUATION_CRITERIA.md`](EVALUATION_CRITERIA.md) for the full rubric. In short, we care about:

- **Does it work?** — All endpoints function correctly with proper business logic
- **Is it well-built?** — Clean code, good structure, proper TypeScript usage
- **Is it secure?** — Passwords hashed, inputs validated, no data leaks, proper access control
- **Is it production-ready?** — Error handling, edge cases, documentation, easy setup
- **Security review quality** — Thoroughness, understanding, correct fixes

---

## Submission

When you're done:

1. Push your work to a **private GitHub repository**
2. Invite **Mohammad-soqar** as a collaborator
3. Make sure both `part-1-build/` and `part-2-review/` are included

**Alternative:** Email a zip file to **mnsoqar1@gmail.com** with both parts included.

---

## Rules & Expectations

- You may use any libraries or packages you want (just add them to your `package.json`)
- You may reference documentation, Stack Overflow, etc.
- Write code you'd be comfortable explaining in a follow-up interview
- If anything in the spec is unclear, make a reasonable assumption, document it in your README, and move on — we value good judgment

---

## Folder Structure

Your final submission should look something like this:

```
Backend_Test/
├── part-1-build/
│   ├── src/                    ← your API code
│   ├── prisma/                 ← your Prisma schema + migrations
│   ├── docker-compose.yml      ← so we can run it
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example            ← environment variables template (no real secrets)
│   └── README.md               ← setup instructions + any assumptions you made
│
├── part-2-review/
│   ├── src/                    ← the fixed code
│   ├── SECURITY_REVIEW.md      ← your vulnerability documentation
│   └── REVIEW_INSTRUCTIONS.md  ← (original, do not modify)
│
├── README.md                   ← this file
└── EVALUATION_CRITERIA.md      ← evaluation rubric
```

---

## Questions?

If something is genuinely blocking (not just ambiguous), reach out to **+905388782103**. For ambiguity, use your best judgment and document your reasoning.

Good luck!

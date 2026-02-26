# Part 2: Security Code Review

## What You're Looking At

The code in `src/` is a small **Medical Records API** built with Express, TypeScript, and Prisma. It allows users to register, log in, manage patient records, and download files.

**The API works.** It runs, connects to a database, and handles requests successfully. However, it was written **without security in mind** and contains **multiple real security vulnerabilities** across different categories.

---

## Your Task

### Step 1 — Find Vulnerabilities

Read through every file in `src/` carefully. Look for security issues in areas like:
- Authentication & authorization
- Data handling & storage
- Input validation & injection
- File operations
- Error handling & information leakage
- Configuration & secrets management
- Missing security controls

### Step 2 — Document Your Findings

Create a file called **`SECURITY_REVIEW.md`** in this folder (`part-2-review/`).

For **each vulnerability**, document:

| Field | What to Write |
|-------|--------------|
| **Vulnerability** | A clear name/title for the issue |
| **Severity** | Critical / High / Medium / Low |
| **Location** | File path + line number or function name |
| **Description** | What the vulnerability is |
| **Impact** | What could an attacker do? Be specific. |
| **Fix** | How to fix it (explain the approach) |

Organize your findings from **most critical to least critical**.

**Example entry:**
```markdown
### 1. [CRITICAL] Plaintext Password Storage

**Location:** `src/routes/auth.routes.ts`, line 30

**Description:** User passwords are stored in the database as plaintext strings without any hashing.

**Impact:** If the database is compromised (SQL injection, backup leak, insider threat), every user's password is immediately exposed in readable form. Since users often reuse passwords across services, this could compromise their accounts on other platforms.

**Fix:** Hash passwords using bcrypt (with a cost factor of 10+) before storing them, and compare hashed values during login using bcrypt.compare().
```

### Step 3 — Fix the Code

Apply your fixes directly to the code in `src/`. The fixed code should:
- Patch all the vulnerabilities you documented
- Still be functional (don't break the API while fixing it)
- Follow security best practices

You may add new dependencies to `package.json` if needed (e.g., `bcrypt`, `helmet`, `zod`).

---

## Files to Review

```
src/
├── index.ts                  ← Main Express application
├── .env                      ← Environment configuration
├── package.json              ← Dependencies
├── tsconfig.json             ← TypeScript configuration
├── middleware/
│   └── auth.middleware.ts    ← JWT authentication middleware
├── routes/
│   ├── auth.routes.ts        ← Registration & login endpoints
│   ├── records.routes.ts     ← Medical records endpoints
│   └── files.routes.ts       ← File download endpoint
├── prisma/
│   └── schema.prisma         ← Database schema
└── utils/
    └── helpers.ts            ← Response helper functions
```

---

## How to Run (Optional)

You don't need to run the API to review it — reading the code is sufficient. But if you want to:

```bash
cd part-2-review/src
npm install
# Set up a PostgreSQL database and update .env with the connection string
npx prisma migrate dev
npm run dev
```

---

## What We're Evaluating

| Criteria | What We Look For |
|----------|-----------------|
| **Thoroughness** | How many real issues did you find? Did you check all files? |
| **Understanding** | Do you explain *why* each issue matters, not just *what* it is? |
| **Fixes** | Are your fixes correct, complete, and following best practices? |
| **Prioritization** | Can you tell the difference between a critical vulnerability and a minor improvement? |

There are no trick questions. Every vulnerability in this code is a **real security concern** that would be unacceptable in a production system.

---

## Deliverables Checklist

- [ ] `SECURITY_REVIEW.md` with all vulnerabilities documented
- [ ] Fixed code in `src/` with all vulnerabilities patched
- [ ] Any new dependencies added to `package.json`

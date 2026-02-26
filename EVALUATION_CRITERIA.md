# Evaluation Criteria

Your submission will be evaluated across the following dimensions. Each area is scored from 1 (poor) to 5 (excellent).

---

## Part 1 — Build an API

### 1. Functional Correctness (High Weight)
- All endpoints work as specified in the API spec
- Business rules are implemented correctly (role-based access, conflict detection, etc.)
- Edge cases are handled (invalid IDs, duplicate emails, overlapping appointments)

### 2. Code Quality & Structure
- Clean folder structure with clear separation of concerns (routes, controllers, middleware, services, etc.)
- Consistent naming conventions and coding patterns throughout
- Code is readable — another developer can understand it without excessive comments

### 3. TypeScript Usage
- Proper use of types and interfaces for requests, responses, and data models
- No excessive use of `any` — types should be meaningful, not just decorative
- Type-safe error handling and middleware

### 4. Database Design
- Well-designed Prisma schema with proper relations, constraints, and indexes
- Appropriate use of enums, defaults, and required fields
- Working migrations that can be applied cleanly

### 5. Security
- Passwords are hashed (bcrypt, argon2, or equivalent)
- JWT is configured securely (expiration, strong secret handling)
- No sensitive data leaked in responses or error messages
- Input is sanitized and validated at the API boundary

### 6. Error Handling
- Consistent error response format across all endpoints
- Appropriate HTTP status codes (400, 401, 403, 404, 409, 500)
- No stack traces or internal details leaked in error responses
- Graceful handling of unexpected situations

### 7. Input Validation
- All request bodies and query parameters are validated before processing
- Malformed requests are rejected with clear, helpful error messages
- Validation happens at the route level, not deep inside business logic

### 8. Documentation & Setup
- Clear README with setup instructions
- We can start and test your API with minimal effort (ideally `docker compose up`)
- Any assumptions you made are documented

---

## Part 2 — Security Code Review

### 9. Vulnerability Detection
- How many real security issues did you find?
- Did you catch the critical ones (there are several)?
- Did you identify issues across different categories (authentication, injection, access control, data exposure, etc.)?

### 10. Quality of Explanations
- Do you clearly explain **what** each vulnerability is?
- Do you explain **why** it matters (realistic attack scenario)?
- Are your explanations accurate and specific (not generic copy-paste)?

### 11. Quality of Fixes
- Are the fixes correct and complete?
- Do the fixes follow security best practices?
- Does the fixed code still work (you didn't break functionality while fixing security)?

### 12. Prioritization
- Can you distinguish between critical vulnerabilities and nice-to-have improvements?
- Is your review organized from most severe to least severe?

---

## What Sets Great Submissions Apart

- The API "just works" — we run it and everything behaves as expected
- The code looks like it belongs in a real production codebase
- The security review is thorough AND well-organized — not just a dump of issues
- Attention to detail without over-engineering

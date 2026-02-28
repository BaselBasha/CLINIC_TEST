# Clinic Appointment System API

A REST API for managing clinic appointments, built with **Node.js**, **Express**, **TypeScript**, **PostgreSQL**, and **Prisma ORM**.

---

## Quick Start (Docker)

The easiest way to run the project — starts both PostgreSQL and the API:

```bash
docker compose up --build
```

The API will be available at **http://localhost:3000**.

> The container automatically runs Prisma migrations on startup, so the database is ready as soon as the service starts.

---

## Manual Setup (Without Docker)

### Prerequisites
- Node.js 18+
- PostgreSQL 14+ running locally

### Steps

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your PostgreSQL connection string
   ```

3. **Run database migrations**
   ```bash
   npx prisma migrate dev
   ```

4. **Start the server**
   ```bash
   npm run dev
   ```

The API will be available at **http://localhost:3000**.

---

## API Endpoints

| Method  | Endpoint                      | Auth Required | Description                          |
|---------|-------------------------------|:---:|--------------------------------------|
| `POST`  | `/auth/register`             | ✗   | Register a new user                  |
| `POST`  | `/auth/login`                | ✗   | Login and receive JWT token          |
| `GET`   | `/appointments`              | ✓   | List appointments (role-filtered)    |
| `POST`  | `/appointments`              | ✓   | Book an appointment (PATIENT only)   |
| `GET`   | `/appointments/:id`          | ✓   | Get appointment details              |
| `PATCH` | `/appointments/:id/cancel`   | ✓   | Cancel an appointment                |
| `GET`   | `/health`                    | ✗   | Health check                         |

### Authentication
All protected endpoints require: `Authorization: Bearer <token>`

### Roles
- **PATIENT** — Can book and view/cancel their own appointments
- **DOCTOR** — Can view/cancel their own appointments
- **ADMIN** — Can view/cancel all appointments

---

## Project Structure

```
src/
├── index.ts                       # Express app entry point
├── config/
│   └── env.ts                     # Environment configuration
├── lib/
│   └── prisma.ts                  # Prisma client singleton
├── middleware/
│   ├── auth.middleware.ts         # JWT verification
│   ├── roles.middleware.ts        # Role-based access control
│   ├── validate.middleware.ts     # Zod request validation
│   └── error.middleware.ts        # Global error handler
├── controllers/
│   ├── auth.controller.ts
│   └── appointment.controller.ts
├── services/
│   ├── auth.service.ts            # Registration & login logic
│   └── appointment.service.ts     # Appointment CRUD + conflict detection
├── validators/
│   ├── auth.validators.ts         # Zod schemas for auth
│   └── appointment.validators.ts  # Zod schemas for appointments
├── routes/
│   ├── auth.routes.ts
│   └── appointment.routes.ts
└── types/
    └── index.ts                   # Shared TypeScript interfaces
```

---

## Design Decisions & Assumptions

1. **Password hashing**: bcryptjs with 12 salt rounds for strong security.
2. **JWT expiration**: Tokens expire in 24 hours by default (configurable via `JWT_EXPIRES_IN`).
3. **Conflict detection**: Uses a parameterized raw SQL query to accurately detect overlapping appointment time ranges for a given doctor.
4. **UUID primary keys**: Used for all entities as specified, providing non-sequential identifiers.
5. **Input validation**: Zod schemas validate all request bodies at the route level before reaching business logic.
6. **No password leaks**: User passwords are never returned in any API response — all user selections explicitly exclude the password field.
7. **Duration default**: If `duration` is not provided when creating an appointment, it defaults to 30 minutes.
8. **Date filtering**: The `date` query parameter on `GET /appointments` filters by the full day (00:00:00 to 23:59:59 UTC).

---

## Environment Variables

| Variable        | Description                    | Default                           |
|-----------------|--------------------------------|-----------------------------------|
| `DATABASE_URL`  | PostgreSQL connection string   | *(required)*                      |
| `JWT_SECRET`    | Secret key for JWT signing     | *(required)*                      |
| `JWT_EXPIRES_IN`| Token expiration duration      | `24h`                             |
| `PORT`          | Server port                    | `3000`                            |
| `NODE_ENV`      | Environment                    | `development`                     |

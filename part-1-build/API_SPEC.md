# Part 1: Clinic Appointment System — API Specification

Build a REST API for a simplified clinic appointment management system. Read this entire spec before writing any code.

---

## Tech Stack (Required)

| Component | Requirement |
|-----------|------------|
| **Runtime** | Node.js with Express.js |
| **Language** | TypeScript (strict mode) |
| **Database** | PostgreSQL |
| **ORM** | Prisma |
| **Authentication** | JWT (JSON Web Tokens) |
| **Validation** | Your choice — Zod is recommended but not required |

You may use any additional libraries you need (helmet, cors, bcrypt, etc.).

---

## Data Models

Design your Prisma schema to support these two entities:

### User

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID or auto-increment | Unique identifier |
| `email` | String | Unique, required |
| `password` | String | Required — **must be stored securely (hashed)** |
| `name` | String | Required |
| `role` | Enum | One of: `PATIENT`, `DOCTOR`, `ADMIN` |
| `createdAt` | DateTime | Auto-set on creation |
| `updatedAt` | DateTime | Auto-updated on modification |

### Appointment

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID or auto-increment | Unique identifier |
| `patientId` | Foreign key → User | Must reference a user with role `PATIENT` |
| `doctorId` | Foreign key → User | Must reference a user with role `DOCTOR` |
| `dateTime` | DateTime | The appointment date and time |
| `duration` | Integer | Duration in minutes (default: 30) |
| `status` | Enum | One of: `SCHEDULED`, `CANCELLED` |
| `notes` | String (optional) | Free text |
| `createdAt` | DateTime | Auto-set on creation |
| `updatedAt` | DateTime | Auto-updated on modification |

> You may add additional fields, indexes, or models if they improve your design.

---

## Response Format

**All endpoints** must use this consistent response envelope:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": "Human-readable error message"
}
```

Use appropriate HTTP status codes: `200`, `201`, `400`, `401`, `403`, `404`, `409`, `500`.

---

## Endpoints

### Authentication

---

#### `POST /auth/register`

Register a new user.

**Request body:**
```json
{
  "email": "doctor@clinic.com",
  "password": "securePassword123",
  "name": "Dr. Sarah Ahmed",
  "role": "DOCTOR"
}
```

**Success response (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "doctor@clinic.com",
    "name": "Dr. Sarah Ahmed",
    "role": "DOCTOR"
  }
}
```

**Business rules:**
- All fields are required — return `400` if any are missing
- `email` must be a valid email format
- `email` must be unique — return `409` if already registered
- `role` must be one of: `PATIENT`, `DOCTOR`, `ADMIN`
- Password must **never** be returned in any response

---

#### `POST /auth/login`

Authenticate a user and return a JWT token.

**Request body:**
```json
{
  "email": "doctor@clinic.com",
  "password": "securePassword123"
}
```

**Success response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "uuid",
      "email": "doctor@clinic.com",
      "name": "Dr. Sarah Ahmed",
      "role": "DOCTOR"
    }
  }
}
```

**Business rules:**
- Return `401` for invalid email or password
- Password must **never** be included in the response
- The JWT should include enough information to identify the user and their role

---

### Appointments

> All appointment endpoints require a valid JWT in the `Authorization: Bearer <token>` header.
> Return `401` if the token is missing or invalid.

---

#### `GET /appointments`

List appointments. What the user sees depends on their role.

**Role-based filtering:**
| Role | What they see |
|------|--------------|
| `PATIENT` | Only appointments where they are the patient |
| `DOCTOR` | Only appointments where they are the doctor |
| `ADMIN` | All appointments |

**Optional query parameters:**
- `status` — filter by `SCHEDULED` or `CANCELLED`
- `date` — filter by a specific date (`YYYY-MM-DD`)

**Success response (`200 OK`):**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "patientId": "uuid",
      "doctorId": "uuid",
      "dateTime": "2025-03-15T09:00:00Z",
      "duration": 30,
      "status": "SCHEDULED",
      "notes": "Regular checkup",
      "patient": { "id": "uuid", "name": "Ali Hassan", "email": "ali@email.com" },
      "doctor": { "id": "uuid", "name": "Dr. Sarah Ahmed", "email": "sarah@clinic.com" }
    }
  ]
}
```

> Note: Each appointment should include nested `patient` and `doctor` objects with basic info (id, name, email). **Never include passwords.**

---

#### `POST /appointments`

Book a new appointment. **Only users with role `PATIENT` can create appointments.**

**Request body:**
```json
{
  "doctorId": "uuid",
  "dateTime": "2025-03-15T09:00:00Z",
  "duration": 30,
  "notes": "Regular checkup"
}
```

**Success response (`201 Created`):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "patientId": "uuid",
    "doctorId": "uuid",
    "dateTime": "2025-03-15T09:00:00Z",
    "duration": 30,
    "status": "SCHEDULED",
    "notes": "Regular checkup"
  }
}
```

**Business rules:**
- Return `403` if the authenticated user is not a `PATIENT`
- The `patientId` is automatically set from the JWT — **do not accept it from the request body**
- The `doctorId` must reference a real user with role `DOCTOR` — return `404` if invalid
- **Conflict detection:** Reject the booking if it overlaps with an existing `SCHEDULED` appointment for the same doctor. Two appointments overlap if their time ranges intersect (based on `dateTime` and `duration`). Return `409` for conflicts.
- `dateTime` must be in the future
- `duration` must be a positive number (if provided)

---

#### `GET /appointments/:id`

Get a single appointment by ID.

**Success response (`200 OK`):** Same shape as a single item from `GET /appointments`.

**Business rules:**
- `PATIENT` can only view appointments where they are the patient
- `DOCTOR` can only view appointments where they are the doctor
- `ADMIN` can view any appointment
- Return `403` if unauthorized
- Return `404` if the appointment doesn't exist

---

#### `PATCH /appointments/:id/cancel`

Cancel an appointment (sets status to `CANCELLED`).

**Success response (`200 OK`):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "CANCELLED",
    "...": "rest of appointment fields"
  }
}
```

**Business rules:**
- `PATIENT` can only cancel their own appointments
- `DOCTOR` can only cancel appointments where they are the doctor
- `ADMIN` can cancel any appointment
- Can only cancel appointments with status `SCHEDULED` — return `400` if already cancelled
- Return `403` if unauthorized
- Return `404` if not found

---

## Setup Requirements

Your submission **must** include one of:

1. **Option A (preferred):** A `docker-compose.yml` that starts both the API and PostgreSQL:
   ```bash
   docker compose up
   ```

2. **Option B:** A clear, step-by-step README explaining how to set up and run the project locally (including PostgreSQL setup and running migrations).

**We must be able to start your API and test every endpoint. If we can't run it, we can't evaluate it.**

---

## Tips

- Secure your API — hash passwords, validate inputs, handle errors properly
- Handle edge cases — what happens with invalid IDs, duplicate data, malformed requests?
- Write code you'd be comfortable explaining in a follow-up technical interview
- Don't over-engineer — a clean, working solution beats a complex, half-finished one

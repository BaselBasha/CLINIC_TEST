import swaggerJsdoc from "swagger-jsdoc";

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "Clinic Appointment System API",
      version: "1.0.0",
      description:
        "REST API for a simplified clinic appointment management system. Supports user registration/login with JWT authentication, and full appointment CRUD with role-based access control.",
      contact: {
        name: "API Support",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token",
        },
      },
      schemas: {
        // ── Enums ────────────────────────────────────
        Role: {
          type: "string",
          enum: ["PATIENT", "DOCTOR", "ADMIN"],
        },
        AppointmentStatus: {
          type: "string",
          enum: ["SCHEDULED", "CANCELLED"],
        },

        // ── User ─────────────────────────────────────
        UserResponse: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            email: { type: "string", format: "email" },
            name: { type: "string" },
            role: { $ref: "#/components/schemas/Role" },
          },
        },

        // ── Auth ─────────────────────────────────────
        RegisterRequest: {
          type: "object",
          required: ["email", "password", "name", "role"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "doctor@clinic.com",
            },
            password: {
              type: "string",
              minLength: 8,
              example: "securePassword123",
            },
            name: { type: "string", example: "Dr. Sarah Ahmed" },
            role: { $ref: "#/components/schemas/Role", example: "DOCTOR" },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              example: "doctor@clinic.com",
            },
            password: { type: "string", example: "securePassword123" },
          },
        },
        LoginResponse: {
          type: "object",
          properties: {
            token: { type: "string", example: "eyJhbGciOiJIUzI1NiIs..." },
            user: { $ref: "#/components/schemas/UserResponse" },
          },
        },

        // ── Appointment ──────────────────────────────
        CreateAppointmentRequest: {
          type: "object",
          required: ["doctorId", "dateTime"],
          properties: {
            doctorId: { type: "string", format: "uuid" },
            dateTime: {
              type: "string",
              format: "date-time",
              example: "2025-03-15T09:00:00Z",
            },
            duration: {
              type: "integer",
              minimum: 1,
              default: 30,
              example: 30,
            },
            notes: { type: "string", example: "Regular checkup" },
          },
        },
        AppointmentResponse: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            patientId: { type: "string", format: "uuid" },
            doctorId: { type: "string", format: "uuid" },
            dateTime: { type: "string", format: "date-time" },
            duration: { type: "integer" },
            status: { $ref: "#/components/schemas/AppointmentStatus" },
            notes: { type: "string", nullable: true },
            createdAt: { type: "string", format: "date-time" },
            updatedAt: { type: "string", format: "date-time" },
            patient: { $ref: "#/components/schemas/UserResponse" },
            doctor: { $ref: "#/components/schemas/UserResponse" },
          },
        },

        // ── Response Envelopes ───────────────────────
        SuccessResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: {},
          },
        },
        ErrorResponse: {
          type: "object",
          properties: {
            success: { type: "boolean", example: false },
            error: { type: "string" },
          },
        },
      },
    },

    // ── Paths ──────────────────────────────────────────
    paths: {
      // ── Auth ─────────────────────────────────────
      "/auth/register": {
        post: {
          tags: ["Authentication"],
          summary: "Register a new user",
          description:
            "Create a new user account. All fields are required. The password is hashed before storage and never returned in responses.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RegisterRequest" },
              },
            },
          },
          responses: {
            201: {
              description: "User registered successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: { $ref: "#/components/schemas/UserResponse" },
                    },
                  },
                },
              },
            },
            400: {
              description: "Validation error — missing or invalid fields",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            409: {
              description: "Email already registered",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },

      "/auth/login": {
        post: {
          tags: ["Authentication"],
          summary: "Login and get JWT token",
          description:
            "Authenticate with email and password. Returns a JWT token valid for 24 hours.",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginRequest" },
              },
            },
          },
          responses: {
            200: {
              description: "Login successful",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: { $ref: "#/components/schemas/LoginResponse" },
                    },
                  },
                },
              },
            },
            401: {
              description: "Invalid email or password",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },

      // ── Appointments ─────────────────────────────
      "/appointments": {
        get: {
          tags: ["Appointments"],
          summary: "List appointments",
          description:
            "Returns appointments filtered by the authenticated user's role: PATIENT sees only their own, DOCTOR sees only their own, ADMIN sees all.",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "status",
              in: "query",
              schema: { $ref: "#/components/schemas/AppointmentStatus" },
              description: "Filter by appointment status",
            },
            {
              name: "date",
              in: "query",
              schema: { type: "string", format: "date", example: "2025-03-15" },
              description: "Filter by specific date (YYYY-MM-DD)",
            },
          ],
          responses: {
            200: {
              description: "List of appointments",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: {
                        type: "array",
                        items: {
                          $ref: "#/components/schemas/AppointmentResponse",
                        },
                      },
                    },
                  },
                },
              },
            },
            401: {
              description: "Authentication required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
        post: {
          tags: ["Appointments"],
          summary: "Book a new appointment",
          description:
            "Only PATIENT users can create appointments. The patientId is automatically set from the JWT token. The doctorId must reference a user with the DOCTOR role. Appointments cannot overlap with existing scheduled appointments for the same doctor.",
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CreateAppointmentRequest",
                },
              },
            },
          },
          responses: {
            201: {
              description: "Appointment created successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: {
                        $ref: "#/components/schemas/AppointmentResponse",
                      },
                    },
                  },
                },
              },
            },
            400: {
              description:
                "Validation error — dateTime must be in the future, duration must be positive",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            401: {
              description: "Authentication required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            403: {
              description: "Only patients can create appointments",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            404: {
              description: "Doctor not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            409: {
              description:
                "Time slot conflicts with an existing appointment",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },

      "/appointments/{id}": {
        get: {
          tags: ["Appointments"],
          summary: "Get appointment by ID",
          description:
            "Retrieve a single appointment. PATIENT can only view their own, DOCTOR can only view their own, ADMIN can view any.",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
              description: "Appointment UUID",
            },
          ],
          responses: {
            200: {
              description: "Appointment details",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: {
                        $ref: "#/components/schemas/AppointmentResponse",
                      },
                    },
                  },
                },
              },
            },
            401: {
              description: "Authentication required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            403: {
              description: "Not authorized to view this appointment",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            404: {
              description: "Appointment not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },

      "/appointments/{id}/cancel": {
        patch: {
          tags: ["Appointments"],
          summary: "Cancel an appointment",
          description:
            "Sets the appointment status to CANCELLED. PATIENT can only cancel their own, DOCTOR can only cancel their own, ADMIN can cancel any. Only SCHEDULED appointments can be cancelled.",
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
              description: "Appointment UUID",
            },
          ],
          responses: {
            200: {
              description: "Appointment cancelled successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: {
                        $ref: "#/components/schemas/AppointmentResponse",
                      },
                    },
                  },
                },
              },
            },
            400: {
              description: "Appointment is already cancelled",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            401: {
              description: "Authentication required",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            403: {
              description: "Not authorized to cancel this appointment",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
            404: {
              description: "Appointment not found",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/ErrorResponse" },
                },
              },
            },
          },
        },
      },

      // ── Health ────────────────────────────────────
      "/health": {
        get: {
          tags: ["System"],
          summary: "Health check",
          description: "Returns the API health status and current timestamp.",
          responses: {
            200: {
              description: "API is healthy",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: { type: "boolean", example: true },
                      data: {
                        type: "object",
                        properties: {
                          status: { type: "string", example: "ok" },
                          timestamp: {
                            type: "string",
                            format: "date-time",
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [], // We defined everything inline above
};

export const swaggerSpec = swaggerJsdoc(options);

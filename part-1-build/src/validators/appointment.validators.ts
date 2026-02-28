import { z } from "zod";

export const createAppointmentSchema = z.object({
  doctorId: z
    .string({ required_error: "doctorId is required" })
    .uuid("doctorId must be a valid UUID"),
  dateTime: z
    .string({ required_error: "dateTime is required" })
    .datetime("dateTime must be a valid ISO 8601 datetime"),
  duration: z
    .number()
    .int("Duration must be a whole number")
    .positive("Duration must be a positive number")
    .optional()
    .default(30),
  notes: z.string().trim().optional(),
});

export const appointmentQuerySchema = z.object({
  status: z.enum(["SCHEDULED", "CANCELLED", "COMPLETED"]).optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format")
    .optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().positive().max(100).optional().default(20),
  sortBy: z.enum(["dateTime", "createdAt", "status"]).optional().default("dateTime"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
});

export const doctorAvailabilitySchema = z.object({
  date: z
    .string({ required_error: "date is required" })
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
});

export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>;
export type AppointmentQuery = z.infer<typeof appointmentQuerySchema>;
export type DoctorAvailabilityQuery = z.infer<typeof doctorAvailabilitySchema>;

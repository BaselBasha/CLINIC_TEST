import { Router } from "express";
import { appointmentController } from "../controllers/appointment.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import { createAppointmentSchema } from "../validators/appointment.validators";

const router = Router();

// All appointment routes require authentication
router.use(authMiddleware);

/**
 * GET /appointments
 * List appointments (role-based filtering) with pagination & sorting.
 * Query: ?status=SCHEDULED&date=2026-03-15&page=1&limit=20&sortBy=dateTime&sortOrder=asc
 */
router.get("/", (req, res) => appointmentController.list(req, res));

/**
 * POST /appointments
 * Book a new appointment (PATIENT only).
 */
router.post(
  "/",
  validate(createAppointmentSchema),
  (req, res) => appointmentController.create(req, res)
);

/**
 * GET /appointments/:id
 * Get a single appointment by ID.
 */
router.get("/:id", (req, res) => appointmentController.getById(req, res));

/**
 * PATCH /appointments/:id/cancel
 * Cancel an appointment.
 */
router.patch("/:id/cancel", (req, res) =>
  appointmentController.cancel(req, res)
);

/**
 * PATCH /appointments/:id/complete
 * Mark appointment as COMPLETED (DOCTOR or ADMIN only).
 */
router.patch("/:id/complete", (req, res) =>
  appointmentController.complete(req, res)
);

export default router;

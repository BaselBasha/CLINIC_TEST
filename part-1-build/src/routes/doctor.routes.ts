import { Router } from "express";
import { appointmentController } from "../controllers/appointment.controller";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

/**
 * GET /doctors/:id/availability?date=2026-03-15
 * Get available time slots for a doctor on a given date.
 * Requires authentication.
 */
router.get(
  "/:id/availability",
  authMiddleware,
  (req, res) => appointmentController.doctorAvailability(req, res)
);

export default router;

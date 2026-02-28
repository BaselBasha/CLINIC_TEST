import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
} from "../validators/auth.validators";

const router = Router();

/**
 * POST /auth/register
 * Register a new user.
 */
router.post(
  "/register",
  validate(registerSchema),
  (req, res) => authController.register(req, res)
);

/**
 * POST /auth/login
 * Authenticate and receive access + refresh tokens.
 */
router.post(
  "/login",
  validate(loginSchema),
  (req, res) => authController.login(req, res)
);

/**
 * POST /auth/refresh
 * Exchange a valid refresh token for a new access + refresh token pair.
 */
router.post(
  "/refresh",
  validate(refreshTokenSchema),
  (req, res) => authController.refresh(req, res)
);

/**
 * POST /auth/logout
 * Invalidate a specific refresh token (single session).
 */
router.post(
  "/logout",
  authMiddleware,
  validate(refreshTokenSchema),
  (req, res) => authController.logout(req, res)
);

/**
 * POST /auth/logout-all
 * Revoke all refresh tokens for the authenticated user (all sessions).
 */
router.post(
  "/logout-all",
  authMiddleware,
  (req, res) => authController.logoutAll(req, res)
);

export default router;

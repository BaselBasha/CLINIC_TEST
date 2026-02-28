import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { z } from "zod";
import prisma from "../lib/prisma";

const router = Router();

// FIX: Read JWT secret from environment variable
const JWT_SECRET = process.env.JWT_SECRET!;

const SALT_ROUNDS = 12;

// FIX: Allowed roles whitelist
const ALLOWED_ROLES = ["STAFF", "DOCTOR", "ADMIN"] as const;

// FIX: Input validation schemas
const registerSchema = z.object({
  email: z.string().email("Must be a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1, "Name is required"),
  role: z.enum(ALLOWED_ROLES).optional().default("STAFF"),
});

const loginSchema = z.object({
  email: z.string().email("Must be a valid email"),
  password: z.string().min(1, "Password is required"),
});

/**
 * POST /auth/register
 * Register a new user account
 */
router.post("/register", async (req: Request, res: Response) => {
  try {
    // FIX: Validate input
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.errors.map((e) => e.message).join("; "),
      });
    }

    const { email, password, name, role } = parsed.data;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "A user with this email already exists",
      });
    }

    // FIX: Hash password before storing
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create the user
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, name, role },
    });

    return res.status(201).json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error: any) {
    // FIX: Do not leak stack traces or internal error details
    console.error("Registration error:", error.message);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * POST /auth/login
 * Authenticate user and return JWT token
 */
router.post("/login", async (req: Request, res: Response) => {
  try {
    // FIX: Validate input
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.errors.map((e) => e.message).join("; "),
      });
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });

    // FIX: Use bcrypt.compare instead of plaintext comparison
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    // FIX: Add token expiration
    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET,
      { expiresIn: 86400, algorithm: "HS256" } // 24 hours
    );

    return res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    });
  } catch (error: any) {
    // FIX: Do not leak stack traces or internal error details
    console.error("Login error:", error.message);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

export default router;

import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const router = Router();
const prisma = new PrismaClient();

// JWT configuration
const JWT_SECRET = "clinic-portal-secret-2024";

/**
 * POST /auth/register
 * Register a new user account
 */
router.post("/register", async (req: Request, res: Response) => {
  try {
    const { email, password, name, role } = req.body;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: "A user with this email already exists",
      });
    }

    // Create the user
    const user = await prisma.user.create({
      data: { email, password, name, role: role || "STAFF" },
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
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
      stack: error.stack,
    });
  }
});

/**
 * POST /auth/login
 * Authenticate user and return JWT token
 */
router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || user.password !== password) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password",
      });
    }

    // Generate authentication token
    const token = jwt.sign(
      { id: user.id, role: user.role },
      JWT_SECRET
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
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
      stack: error.stack,
    });
  }
});

export default router;

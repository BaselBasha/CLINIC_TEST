import express, { Request, Response } from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./routes/auth.routes";
import recordsRoutes from "./routes/records.routes";
import filesRoutes from "./routes/files.routes";
import { authMiddleware } from "./middleware/auth.middleware";
import prisma from "./lib/prisma";

const app = express();
const PORT = process.env.PORT || 3000;

// FIX: Add security headers
app.use(helmet());

// Body parsing
app.use(express.json());

// FIX: Rate limiting on auth endpoints to prevent brute-force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // max 10 requests per window per IP
  message: { success: false, error: "Too many requests, please try again later" },
  standardHeaders: true,
  legacyHeaders: false,
});

// Routes
app.use("/auth", authLimiter, authRoutes);
app.use("/records", recordsRoutes);
app.use("/files", filesRoutes);

/**
 * GET /users/me
 * Get the current authenticated user's profile
 */
app.get("/users/me", authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      // FIX: Explicitly select fields — never return the password
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: "User not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error: any) {
    // FIX: Do not leak stack traces or internal error details
    console.error("Get user error:", error.message);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404 handler for undefined routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Medical Records API running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});

export default app;

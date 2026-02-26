import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import authRoutes from "./routes/auth.routes";
import recordsRoutes from "./routes/records.routes";
import filesRoutes from "./routes/files.routes";
import { authMiddleware } from "./middleware/auth.middleware";

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Routes
app.use("/auth", authRoutes);
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
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
      stack: error.stack,
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

import "./config/env"; // Load env variables first

import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env";
import { swaggerSpec } from "./config/swagger";
import { errorHandler } from "./middleware/error.middleware";
import { requestId } from "./middleware/requestId.middleware";
import { authLimiter, apiLimiter } from "./middleware/rateLimiter.middleware";
import authRoutes from "./routes/auth.routes";
import appointmentRoutes from "./routes/appointment.routes";
import doctorRoutes from "./routes/doctor.routes";

const app = express();

// ─── Security Middleware ──────────────────────────────
app.use(helmet());
app.use(cors());

// ─── Request ID ───────────────────────────────────────
app.use(requestId);

// ─── Request Logging ──────────────────────────────────
app.use(
  morgan(":method :url :status :res[content-length] - :response-time ms", {
    skip: (_req, _res) => env.NODE_ENV === "test",
  })
);

// ─── Body Parsing ─────────────────────────────────────
app.use(express.json());

// ─── General Rate Limiter ─────────────────────────────
app.use(apiLimiter);

// ─── API Documentation ───────────────────────────────
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ─── Routes ───────────────────────────────────────────
app.use("/auth", authLimiter, authRoutes);
app.use("/appointments", appointmentRoutes);
app.use("/doctors", doctorRoutes);

// ─── Health Check ─────────────────────────────────────
app.get("/health", (_req, res) => {
  res.status(200).json({
    success: true,
    data: { status: "ok", timestamp: new Date().toISOString() },
  });
});

// ─── 404 Handler ──────────────────────────────────────
app.use((_req, res) => {
  res
    .status(404)
    .json({ success: false, error: "Route not found", code: "ROUTE_NOT_FOUND" });
});

// ─── Global Error Handler ─────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────
app.listen(env.PORT, () => {
  console.log(`🏥 Clinic API running on http://localhost:${env.PORT}`);
  console.log(`   Environment: ${env.NODE_ENV}`);
  console.log(`   Swagger docs: http://localhost:${env.PORT}/api-docs`);
});

export default app;

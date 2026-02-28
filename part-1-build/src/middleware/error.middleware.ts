import { Request, Response, NextFunction } from "express";
import { AppError } from "../lib/errors";

/**
 * Global error handler.
 * Returns structured error responses with error codes.
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      code: err.code,
    });
    return;
  }

  console.error("Unhandled error:", err.message);

  res.status(500).json({
    success: false,
    error: "Internal server error",
    code: "INTERNAL_ERROR",
  });
}

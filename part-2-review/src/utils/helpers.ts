import { Response } from "express";

/**
 * Standard success response helper
 */
export function sendSuccess(res: Response, data: unknown, statusCode: number = 200): void {
  res.status(statusCode).json({
    success: true,
    data,
  });
}

/**
 * Standard error response helper
 */
export function sendError(res: Response, message: string, statusCode: number = 400): void {
  res.status(statusCode).json({
    success: false,
    error: message,
  });
}

/**
 * Format date for display purposes
 */
export function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/**
 * Generate a simple request ID for logging
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

import { Request, Response, NextFunction } from "express";
import crypto from "crypto";

/**
 * Request ID middleware.
 * Attaches a unique X-Request-Id header to every response.
 * If the client sends one, it is preserved; otherwise a new UUID is generated.
 */
export function requestId(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const id =
    (req.headers["x-request-id"] as string) || crypto.randomUUID();
  res.setHeader("X-Request-Id", id);
  next();
}

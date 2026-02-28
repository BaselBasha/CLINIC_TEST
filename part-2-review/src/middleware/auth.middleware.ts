import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

// FIX: Read JWT secret from environment variable instead of hardcoding
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("FATAL: JWT_SECRET environment variable is not set.");
  process.exit(1);
}

interface JwtPayload {
  id: string;
  role: string;
}

// Extend Express Request to include user information
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * Authentication middleware
 * Verifies the JWT token from the Authorization header
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ success: false, error: "Authentication required" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    // FIX: Restrict to HS256 algorithm to prevent algorithm confusion attacks
    const decoded = jwt.verify(token, JWT_SECRET as string, {
      algorithms: ["HS256"],
    }) as unknown as JwtPayload;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, error: "Invalid or expired token" });
  }
}

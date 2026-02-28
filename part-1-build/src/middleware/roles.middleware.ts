import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";

/**
 * Role-based access control middleware factory.
 * Restricts access to users with specific roles.
 */
export function authorize(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res
        .status(401)
        .json({ success: false, error: "Authentication required" });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: "You do not have permission to perform this action",
      });
      return;
    }

    next();
  };
}

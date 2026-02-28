import { Request, Response } from "express";
import { authService } from "../services/auth.service";

export class AuthController {
  async register(req: Request, res: Response): Promise<void> {
    try {
      const result = await authService.register(req.body);
      res.status(201).json({ success: true, data: result.user });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: statusCode === 500 ? "Internal server error" : error.message,
        code: error.code || "INTERNAL_ERROR",
      });
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const result = await authService.login(req.body);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: statusCode === 500 ? "Internal server error" : error.message,
        code: error.code || "INTERNAL_ERROR",
      });
    }
  }

  async refresh(req: Request, res: Response): Promise<void> {
    try {
      const result = await authService.refreshTokens(req.body.refreshToken);
      res.status(200).json({ success: true, data: result });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: statusCode === 500 ? "Internal server error" : error.message,
        code: error.code || "INTERNAL_ERROR",
      });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      await authService.logout(req.body.refreshToken);
      res
        .status(200)
        .json({ success: true, data: { message: "Logged out successfully" } });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: statusCode === 500 ? "Internal server error" : error.message,
        code: error.code || "INTERNAL_ERROR",
      });
    }
  }

  async logoutAll(req: Request, res: Response): Promise<void> {
    try {
      const result = await authService.logoutAll(req.user!.id);
      res.status(200).json({
        success: true,
        data: {
          message: "All sessions revoked",
          sessionsRevoked: result.count,
        },
      });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: statusCode === 500 ? "Internal server error" : error.message,
        code: error.code || "INTERNAL_ERROR",
      });
    }
  }
}

export const authController = new AuthController();

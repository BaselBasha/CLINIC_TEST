import { Request, Response } from "express";
import { AppointmentStatus } from "@prisma/client";
import { appointmentService } from "../services/appointment.service";
import { appointmentQuerySchema } from "../validators/appointment.validators";
import { JwtPayload } from "../types";

export class AppointmentController {
  async list(req: Request, res: Response): Promise<void> {
    try {
      // Parse and validate query params
      const parsed = appointmentQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        const messages = parsed.error.errors.map(
          (e) => `${e.path.join(".")}: ${e.message}`
        );
        res.status(400).json({
          success: false,
          error: messages.join("; "),
          code: "VALIDATION_ERROR",
        });
        return;
      }

      const result = await appointmentService.list(
        req.user as JwtPayload,
        parsed.data
      );

      res.status(200).json({ success: true, data: result.appointments, meta: result.meta });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: statusCode === 500 ? "Internal server error" : error.message,
        code: error.code || "INTERNAL_ERROR",
      });
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const appointment = await appointmentService.getById(
        req.params.id,
        req.user as JwtPayload
      );

      res.status(200).json({ success: true, data: appointment });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: statusCode === 500 ? "Internal server error" : error.message,
        code: error.code || "INTERNAL_ERROR",
      });
    }
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const appointment = await appointmentService.create(
        req.body,
        req.user as JwtPayload
      );

      res.status(201).json({ success: true, data: appointment });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: statusCode === 500 ? "Internal server error" : error.message,
        code: error.code || "INTERNAL_ERROR",
      });
    }
  }

  async cancel(req: Request, res: Response): Promise<void> {
    try {
      const appointment = await appointmentService.cancel(
        req.params.id,
        req.user as JwtPayload
      );

      res.status(200).json({ success: true, data: appointment });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: statusCode === 500 ? "Internal server error" : error.message,
        code: error.code || "INTERNAL_ERROR",
      });
    }
  }

  async complete(req: Request, res: Response): Promise<void> {
    try {
      const appointment = await appointmentService.complete(
        req.params.id,
        req.user as JwtPayload
      );

      res.status(200).json({ success: true, data: appointment });
    } catch (error: any) {
      const statusCode = error.statusCode || 500;
      res.status(statusCode).json({
        success: false,
        error: statusCode === 500 ? "Internal server error" : error.message,
        code: error.code || "INTERNAL_ERROR",
      });
    }
  }

  async doctorAvailability(req: Request, res: Response): Promise<void> {
    try {
      const result = await appointmentService.getDoctorAvailability(
        req.params.id,
        req.query.date as string
      );

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
}

export const appointmentController = new AppointmentController();

import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();
const prisma = new PrismaClient();

/**
 * GET /records
 * List all medical records
 */
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const records = await prisma.record.findMany({
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json({
      success: true,
      data: records,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
      stack: error.stack,
    });
  }
});

/**
 * GET /records/search
 * Search records by patient name
 * Using raw query for case-insensitive search
 */
router.get("/search", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { name } = req.query;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: "Search parameter 'name' is required",
      });
    }

    // Using raw query for case-insensitive search
    const results = await prisma.$queryRawUnsafe(
      `SELECT * FROM "Record" WHERE "patientName" ILIKE '%${name}%'`
    );

    return res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
      stack: error.stack,
    });
  }
});

/**
 * GET /records/:id
 * Get a specific record by ID
 */
router.get("/:id", authMiddleware, async (req: Request, res: Response) => {
  try {
    const record = await prisma.record.findUnique({
      where: { id: req.params.id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    if (!record) {
      return res.status(404).json({
        success: false,
        error: "Record not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
      stack: error.stack,
    });
  }
});

/**
 * POST /records
 * Create a new medical record
 */
router.post("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { patientName, diagnosis, notes } = req.body;

    const record = await prisma.record.create({
      data: {
        patientName,
        diagnosis,
        notes,
        createdById: req.user!.id,
      },
    });

    return res.status(201).json({
      success: true,
      data: record,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
      stack: error.stack,
    });
  }
});

export default router;

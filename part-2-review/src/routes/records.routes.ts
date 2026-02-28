import { Router, Request, Response } from "express";
import { z } from "zod";
import prisma from "../lib/prisma";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// FIX: Input validation schema for creating records
const createRecordSchema = z.object({
  patientName: z.string().min(1, "Patient name is required"),
  diagnosis: z.string().min(1, "Diagnosis is required"),
  notes: z.string().optional(),
});

/**
 * GET /records
 * List medical records — with role-based access control
 */
router.get("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    // FIX: Role-based access control
    const where: Record<string, unknown> = {};
    if (req.user!.role === "STAFF") {
      // Staff can only see records they created
      where.createdById = req.user!.id;
    }
    // DOCTOR and ADMIN can see all records

    const records = await prisma.record.findMany({
      where,
      include: {
        createdBy: {
          // FIX: Never return password in any response
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
    // FIX: Do not leak stack traces
    console.error("List records error:", error.message);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * GET /records/search
 * Search records by patient name — using parameterized query
 */
router.get("/search", authMiddleware, async (req: Request, res: Response) => {
  try {
    const { name } = req.query;

    if (!name || typeof name !== "string") {
      return res.status(400).json({
        success: false,
        error: "Search parameter 'name' is required",
      });
    }

    // FIX: Use Prisma's safe query methods instead of $queryRawUnsafe
    // This completely eliminates the SQL injection vulnerability
    const results = await prisma.record.findMany({
      where: {
        patientName: {
          contains: name,
          mode: "insensitive",
        },
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    return res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error: any) {
    // FIX: Do not leak stack traces
    console.error("Search records error:", error.message);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
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

    // FIX: Role-based access — staff can only view their own records
    if (req.user!.role === "STAFF" && record.createdById !== req.user!.id) {
      return res.status(403).json({
        success: false,
        error: "You do not have permission to view this record",
      });
    }

    return res.status(200).json({
      success: true,
      data: record,
    });
  } catch (error: any) {
    // FIX: Do not leak stack traces
    console.error("Get record error:", error.message);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

/**
 * POST /records
 * Create a new medical record
 */
router.post("/", authMiddleware, async (req: Request, res: Response) => {
  try {
    // FIX: Validate input
    const parsed = createRecordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        success: false,
        error: parsed.error.errors.map((e) => e.message).join("; "),
      });
    }

    const { patientName, diagnosis, notes } = parsed.data;

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
    // FIX: Do not leak stack traces
    console.error("Create record error:", error.message);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

export default router;

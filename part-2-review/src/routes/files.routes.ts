import { Router, Request, Response } from "express";
import path from "path";
import fs from "fs";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

/**
 * GET /files/:filename
 * Download a file from the uploads directory
 */
router.get("/:filename", authMiddleware, (req: Request, res: Response) => {
  try {
    const filePath = path.join(__dirname, "..", "uploads", req.params.filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: "File not found",
      });
    }

    return res.sendFile(filePath);
  } catch (error: any) {
    return res.status(500).json({
      error: "Internal server error",
      details: error.message,
      stack: error.stack,
    });
  }
});

export default router;

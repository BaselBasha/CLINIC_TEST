import { Router, Request, Response } from "express";
import path from "path";
import fs from "fs";
import { authMiddleware } from "../middleware/auth.middleware";

const router = Router();

// Resolve the uploads directory once at startup
const UPLOADS_DIR = path.resolve(__dirname, "..", "uploads");

/**
 * GET /files/:filename
 * Download a file from the uploads directory
 */
router.get("/:filename", authMiddleware, (req: Request, res: Response) => {
  try {
    const filename = req.params.filename;

    // FIX: Sanitize filename — reject any path traversal attempts
    if (
      filename.includes("..") ||
      filename.includes("/") ||
      filename.includes("\\") ||
      filename.includes("\0")
    ) {
      return res.status(400).json({
        success: false,
        error: "Invalid filename",
      });
    }

    const filePath = path.join(UPLOADS_DIR, filename);

    // FIX: Double-check that the resolved path is within the uploads directory
    const resolvedPath = path.resolve(filePath);
    if (!resolvedPath.startsWith(UPLOADS_DIR)) {
      return res.status(400).json({
        success: false,
        error: "Invalid filename",
      });
    }

    if (!fs.existsSync(resolvedPath)) {
      return res.status(404).json({
        success: false,
        error: "File not found",
      });
    }

    return res.sendFile(resolvedPath);
  } catch (error: any) {
    // FIX: Do not leak stack traces
    console.error("File download error:", error.message);
    return res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
});

export default router;

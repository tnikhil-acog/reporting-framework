import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join, normalize, resolve } from "path";

const REPORTS_DIR =
  process.env.REPORTS_DIR || "/shared/reporting-framework/reports";

/**
 * GET /api/reports/pdf/[...path]
 * Serve PDF report files with proper content type and download headers
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path } = await params;

    if (!path || path.length === 0) {
      return NextResponse.json(
        { error: "File path is required" },
        { status: 400 }
      );
    }

    // Reconstruct the file path from array
    const filePath = path.join("/");

    // Basic validation
    if (filePath.includes("..") || filePath.includes("~")) {
      return NextResponse.json({ error: "Invalid file path" }, { status: 400 });
    }

    // Build full path to the file
    const fullPath = join(REPORTS_DIR, filePath);

    // Enhanced security check: ensure path is within REPORTS_DIR
    const normalizedPath = normalize(resolve(fullPath));
    const normalizedReportsDir = normalize(resolve(REPORTS_DIR));

    if (!normalizedPath.startsWith(normalizedReportsDir)) {
      console.warn("[API] Attempted path traversal:", { filePath, fullPath });
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    console.log("[API] Serving PDF file:", {
      filePath,
      fullPath: normalizedPath,
    });

    // Read the file as binary
    const fileContent = await readFile(normalizedPath);

    // Extract filename for download header
    const filename = path[path.length - 1] || "report.pdf";

    // Return with proper PDF content type and download headers
    return new NextResponse(fileContent, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (error) {
    console.error("[API] Error serving PDF file:", error);

    if (error instanceof Error && error.message.includes("ENOENT")) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    return NextResponse.json(
      {
        error: "Failed to serve file",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}

/**
 * Renderer Interface
 *
 * Defines how to convert report content from one format to another
 */

import type { Report } from "../types";

/**
 * Options for rendering
 */
export interface RenderOptions {
  styles?: string;

  // ✅ NEW: Pre-rendered HTML content (for PDF generation from MDX/HTML)
  htmlContent?: string;

  // PDF-specific options
  pdfFormat?: "A4" | "Letter" | "Legal" | "A3" | "A5";
  pdfMargin?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };
  printBackground?: boolean;
  preferCSSPageSize?: boolean;
  displayHeaderFooter?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
}

/**
 * Renderer interface for converting report formats
 */
export interface Renderer {
  /**
   * The output format this renderer produces
   */
  readonly format: string;

  /**
   * Render a report to the target format
   *
   * @param report - The report to render
   * @param options - Rendering options
   * @returns Buffer containing the rendered content
   */
  render(report: Report, options?: RenderOptions): Promise<Buffer>;
}

/**
 * Error thrown when rendering fails
 */
export class RendererError extends Error {
  constructor(
    message: string,
    public readonly format: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = "RendererError";
  }
}

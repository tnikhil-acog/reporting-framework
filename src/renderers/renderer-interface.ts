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
  /** CSS styles to apply (for HTML/PDF) */
  styles?: string;

  /** Page size for PDF (e.g., 'A4', 'Letter') */
  pageSize?: string;

  /** Page margins */
  margins?: {
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
  };

  /** Include table of contents */
  includeToc?: boolean;

  /** Custom template path */
  templatePath?: string;

  /** Additional options */
  [key: string]: any;
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

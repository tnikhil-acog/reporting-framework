/**
 * MDX Renderer
 *
 * Converts MDX content to HTML with React components.
 * The MDX content comes from Nunjucks-rendered .mdx.njk templates.
 */
import { compile } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import * as components from "../components/index.js";
import React from "react";
import ReactDOMServer from "react-dom/server";
import type { Report } from "../types/index.js";
import type { Renderer, RenderOptions } from "./renderer-interface.js";
import { RendererError } from "./renderer-interface.js";

/**
 * Default CSS styles for MDX reports
 * Includes component styles and Tailwind-like utilities
 */
const DEFAULT_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
  
  :root {
    --color-primary-50: #e3f2fd;
    --color-primary-100: #bbdefb;
    --color-primary-500: #2196f3;
    --color-primary-600: #1e88e5;
    --color-primary-700: #1976d2;
    --radius-lg: 0.75rem;
    --radius-xl: 1rem;
  }
  
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    -webkit-font-smoothing: antialiased;
    background-color: #f9fafb;
    color: #111827;
    line-height: 1.6;
    padding: 2rem;
  }
  
  /* Component styles */
  .card {
    background: white;
    border-radius: var(--radius-xl);
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    border: 1px solid #e5e7eb;
    padding: 1.5rem;
    margin-bottom: 1.5rem;
    transition: box-shadow 0.2s;
  }
  
  .card:hover {
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
  }
  
  .btn-primary, .btn-secondary {
    padding: 0.5rem 1rem;
    border-radius: var(--radius-lg);
    font-weight: 500;
    border: none;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .btn-primary {
    background: var(--color-primary-600);
    color: white;
  }
  
  .btn-primary:hover {
    background: var(--color-primary-700);
  }
  
  .btn-secondary {
    background: #e5e7eb;
    color: #374151;
  }
  
  .btn-secondary:hover {
    background: #d1d5db;
  }
  
  .badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    font-weight: 500;
    border-radius: 9999px;
  }
  
  .badge-primary { background: var(--color-primary-100); color: var(--color-primary-700); }
  .badge-success { background: #dcfce7; color: #15803d; }
  .badge-warning { background: #fef3c7; color: #b45309; }
  .badge-error { background: #fee2e2; color: #b91c1c; }
  
  /* Typography */
  h1 { font-size: 2.25rem; font-weight: 700; margin: 1.5rem 0 1rem; }
  h2 { font-size: 1.875rem; font-weight: 600; margin: 2rem 0 0.75rem; }
  h3 { font-size: 1.5rem; font-weight: 600; margin: 1.5rem 0 0.5rem; }
  p { margin-bottom: 1rem; line-height: 1.75; }
  
  /* Tables */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 1rem 0;
  }
  
  th, td {
    padding: 0.75rem;
    text-align: left;
    border: 1px solid #e5e7eb;
  }
  
  th {
    background: #f9fafb;
    font-weight: 600;
  }
  
  @media print {
    body { background: white; padding: 0; }
    .card { box-shadow: none; page-break-inside: avoid; }
  }
`;

/**
 * MDX Renderer implementation
 */
export class MDXRenderer implements Renderer {
  readonly format = "html";

  /**
   * Render MDX content to HTML
   *
   * @param report - Report with MDX content (from .mdx.njk template)
   * @param options - Render options
   * @returns HTML Buffer
   */
  async render(report: Report, options: RenderOptions = {}): Promise<Buffer> {
    try {
      console.log("[MDXRenderer] Starting MDX rendering...");

      const styles = options.styles || DEFAULT_STYLES;

      // Compile MDX to JavaScript
      console.log("[MDXRenderer] Compiling MDX...");
      const compiled = await compile(report.content, {
        outputFormat: "function-body",
        development: process.env.NODE_ENV === "development",
      });

      const compiledCode = String(compiled);

      // Execute the compiled MDX code
      console.log("[MDXRenderer] Executing compiled MDX...");
      const { default: MDXContent } = this.evaluateMDX(compiledCode);

      // Render React component to HTML string
      console.log("[MDXRenderer] Rendering React components to HTML...");
      const contentHtml = ReactDOMServer.renderToStaticMarkup(
        React.createElement(MDXContent, {
          components: {
            ...components,
          },
        })
      );

      // Build complete HTML document (similar to HTMLRenderer)
      const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.escapeHtml(report.title)}</title>
  <style>${styles}</style>
</head>
<body>
  ${contentHtml}
</body>
</html>`;

      console.log("[MDXRenderer] ✓ MDX rendering completed successfully");
      return Buffer.from(html, "utf-8");
    } catch (error) {
      console.error("[MDXRenderer] Error:", error);
      throw new RendererError(
        `MDX rendering failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
        this.format,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Evaluate compiled MDX code safely
   */
  private evaluateMDX(code: string): any {
    try {
      // Create function with React and runtime in scope
      const fn = new Function(
        "React",
        ...Object.keys(runtime),
        `${code}; return { default: MDXContent };`
      );

      return fn(React, ...Object.values(runtime));
    } catch (error: any) {
      console.error("[MDXRenderer] Error evaluating MDX:", error);
      throw new Error(`Failed to evaluate MDX: ${error.message}`);
    }
  }

  /**
   * Escape HTML special characters (same as HTMLRenderer)
   */
  private escapeHtml(text: string): string {
    const map: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (char) => map[char] || char);
  }
}

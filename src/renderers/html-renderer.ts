/**
 * HTML Renderer
 *
 * Converts Markdown content to HTML using marked library
 */

import { marked } from "marked";
import type { Report } from "../types/index.js";
import type { Renderer, RenderOptions } from "./renderer-interface.js";
import { RendererError } from "./renderer-interface.js";

/**
 * Default CSS styles for HTML reports
 */
const DEFAULT_STYLES = `
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
    line-height: 1.6;
    color: #333;
    max-width: 900px;
    margin: 0 auto;
    padding: 2rem;
  }
  
  h1, h2, h3, h4, h5, h6 {
    margin-top: 1.5em;
    margin-bottom: 0.5em;
    font-weight: 600;
  }
  
  h1 { font-size: 2.5em; border-bottom: 2px solid #eee; padding-bottom: 0.3em; }
  h2 { font-size: 2em; border-bottom: 1px solid #eee; padding-bottom: 0.3em; }
  h3 { font-size: 1.5em; }
  
  p { margin: 1em 0; }
  
  code {
    background: #f4f4f4;
    padding: 0.2em 0.4em;
    border-radius: 3px;
    font-family: 'Monaco', 'Courier New', monospace;
    font-size: 0.9em;
  }
  
  pre {
    background: #f4f4f4;
    padding: 1em;
    border-radius: 5px;
    overflow-x: auto;
  }
  
  pre code {
    background: none;
    padding: 0;
  }
  
  table {
    border-collapse: collapse;
    width: 100%;
    margin: 1em 0;
  }
  
  th, td {
    border: 1px solid #ddd;
    padding: 0.75em;
    text-align: left;
  }
  
  th {
    background: #f8f9fa;
    font-weight: 600;
  }
  
  blockquote {
    border-left: 4px solid #ddd;
    padding-left: 1em;
    margin-left: 0;
    color: #666;
  }
  
  a {
    color: #0366d6;
    text-decoration: none;
  }
  
  a:hover {
    text-decoration: underline;
  }
  
  img {
    max-width: 100%;
    height: auto;
  }
  
  ul, ol {
    padding-left: 2em;
    margin: 1em 0;
  }
  
  li {
    margin: 0.5em 0;
  }
  
  @media print {
    body {
      max-width: 100%;
      padding: 1rem;
    }
  }
`;

/**
 * HTML Renderer implementation
 */
export class HTMLRenderer implements Renderer {
  readonly format = "html";

  async render(report: Report, options: RenderOptions = {}): Promise<Buffer> {
    try {
      const styles = options.styles || DEFAULT_STYLES;

      // Configure marked options
      marked.setOptions({
        gfm: true, // GitHub Flavored Markdown
        breaks: true, // Convert \n to <br>
      });

      // Convert markdown content to HTML using marked
      const contentHtml = await marked.parse(report.content);

      // Build complete HTML document
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

      return Buffer.from(html, "utf-8");
    } catch (error) {
      throw new RendererError(
        `HTML rendering failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
        this.format,
        error instanceof Error ? error : undefined
      );
    }
  }

  /**
   * Escape HTML special characters
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

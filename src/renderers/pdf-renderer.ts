/**
 * PDF Renderer
 *
 * Converts HTML to PDF format using Playwright.
 * Can accept HTML from any source (HTMLRenderer, MDXRenderer, etc.)
 */
import { RendererError } from "./renderer-interface.js";
import type { RenderOptions, Renderer } from "./renderer-interface.js";
import type { Report } from "../types/index.js"; //

/**
 * PDF Renderer implementation using Playwright
 */
export class PDFRenderer implements Renderer {
  readonly format = "pdf";

  /**
   * Render report to PDF
   *
   * @param report - Report object. Can contain:
   *                 - Markdown content (will use HTMLRenderer)
   *                 - Pre-rendered HTML (pass in options.htmlContent)
   * @param options - Render options including PDF-specific settings
   * @returns PDF Buffer
   */
  async render(report: Report, options: RenderOptions = {}): Promise<Buffer> {
    try {
      let html: string;

      // ✅ Option 1: Use pre-rendered HTML if provided
      if (options.htmlContent) {
        console.log("[PDFRenderer] Using pre-rendered HTML");
        html = options.htmlContent;
      }
      // ✅ Option 2: Render Markdown to HTML (legacy behavior)
      else {
        console.log("[PDFRenderer] Rendering Markdown to HTML");
        const { HTMLRenderer } = await import("./html-renderer.js");
        const htmlRenderer = new HTMLRenderer();
        const htmlBuffer = await htmlRenderer.render(report, options);
        html = htmlBuffer.toString("utf-8");
      }

      // Convert HTML to PDF using Playwright
      try {
        const { chromium } = await import("playwright");

        const launchOptions: any = {
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
          ],
        };

        const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
        if (executablePath) {
          launchOptions.executablePath = executablePath;
          console.log(`[PDFRenderer] Using system Chromium: ${executablePath}`);
        }

        const browser = await chromium.launch(launchOptions);
        const page = await browser.newPage();

        await page.setContent(html, {
          waitUntil: "networkidle",
        });

        const pdfOptions = {
          format: (options.pdfFormat || "A4") as any,
          printBackground: options.printBackground ?? true,
          margin: options.pdfMargin || {
            top: "1.5cm",
            right: "1.5cm",
            bottom: "1.5cm",
            left: "1.5cm",
          },
          preferCSSPageSize: options.preferCSSPageSize ?? false,
          displayHeaderFooter: options.displayHeaderFooter ?? false,
          headerTemplate: options.headerTemplate,
          footerTemplate: options.footerTemplate,
        };

        const pdf = await page.pdf(pdfOptions);

        await browser.close();

        console.log(
          `[PDFRenderer] ✓ PDF generated successfully (${pdf.length} bytes)`
        );
        return Buffer.from(pdf);
      } catch (importError) {
        console.error("[PDFRenderer] Playwright error:", importError);
        console.warn(
          "⚠️  Playwright not installed. PDF generation requires Playwright."
        );
        console.warn("   Install with: pnpm add -D playwright");
        console.warn("   Then run: pnpm exec playwright install chromium");

        throw new RendererError(
          "Playwright not available. Cannot generate PDF.",
          this.format,
          importError instanceof Error ? importError : undefined
        );
      }
    } catch (error) {
      throw new RendererError(
        `PDF rendering failed: ${
          error instanceof Error ? error.message : String(error)
        }`,
        this.format,
        error instanceof Error ? error : undefined
      );
    }
  }
}

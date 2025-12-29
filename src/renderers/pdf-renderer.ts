/**
 * PDF Renderer
 *
 * Converts Markdown reports to PDF format using Playwright
 */
import { RendererError } from "./renderer-interface.js";
import { HTMLRenderer } from "./html-renderer.js";

/**
 * PDF Renderer implementation using Playwright
 */
export class PDFRenderer {
  format = "pdf";
  private htmlRenderer = new HTMLRenderer();

  async render(report: any, options: any = {}): Promise<Buffer> {
    try {
      // First convert to HTML
      const htmlBuffer = await this.htmlRenderer.render(report, options);
      const html = htmlBuffer.toString("utf-8");

      // Try to use Playwright if available
      try {
        const { chromium } = await import("playwright");

        // ✅ Configure launch options for system Chromium
        const launchOptions: any = {
          headless: true,
          args: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
          ],
        };

        // ✅ Use system Chromium if available (Docker environment)
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

        const pdf = await page.pdf({
          format: "A4",
          printBackground: true,
          margin: {
            top: "1.5cm",
            right: "1.5cm",
            bottom: "1.5cm",
            left: "1.5cm",
          },
        });

        await browser.close();

        console.log(`[PDFRenderer] ✓ PDF generated successfully`);
        return Buffer.from(pdf);
      } catch (importError) {
        // Playwright not available or failed to launch
        console.error("[PDFRenderer] Error:", importError);
        console.warn(
          "⚠️  Playwright not installed. PDF generation requires Playwright."
        );
        console.warn("   Install with: pnpm add -D playwright");
        console.warn("   Then run: pnpm exec playwright install chromium");
        console.warn("   Falling back to HTML output.");
        return htmlBuffer;
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

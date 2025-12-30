# @aganitha/reporting-framework

A flexible, plugin-based TypeScript framework for generating LLM-powered reports from structured data with **rich MDX templates and React components**.

## Table of Contents

- [Features](#features)
- [What's New in v1.0.10](#whats-new-in-v1010)
- [Installation](#installation)
- [Core Concepts](#core-concepts)
- [Quick Start Guide](#quick-start-guide)
- [Rendering System](#rendering-system)
- [API Reference](#api-reference)
- [LLM Configuration](#llm-configuration)
- [Template System](#template-system)
- [Plugin Development Guide](#plugin-development-guide)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [TypeScript Support](#typescript-support)
- [License](#license)

---

## Features

- 🔌 **Plugin Architecture** — Build extensible plugins for different data types (CSV, JSON, XML, APIs, databases)
- 🤖 **Multi-LLM Support** — Works with OpenAI GPT-4, DeepSeek, Google Gemini via Vercel AI SDK
- 📊 **Multiple Output Formats** — Generate reports in Markdown, HTML, and PDF
- ⚛️ **MDX Templates** — Use React components in your report templates
- 🎨 **Rich Components** — Built-in cards, badges, charts, and metrics components
- 📋 **FHIR-Inspired Bundles** — Standardized data format with metadata
- 🎯 **Template Engine** — Nunjucks + MDX templates with custom filters
- 📦 **TypeScript First** — Full type safety and IntelliSense support
- 🔄 **Dual Ingestion** — Support both file-based and API-based data fetching
- 📝 **Auto-Generated Docs** — Plugin capabilities exposed via JSON schemas
- ✅ **React 18 & 19 Compatible** — Works with both React 18 and React 19

---

## What's New in v1.0.10

### 🎨 MDX Rendering with React Components

- **New MDXRenderer** — Compile and render MDX templates with React components
- **Built-in Components** — Cards, Badges, Buttons, Charts, DataTables, and more
- **Server-Side Rendering** — All components render to static HTML (no client JavaScript)
- **Modern Styling** — Tailwind-inspired utilities and professional design system

### 🔧 Enhanced PDF Renderer

- **Dual Mode Support** — Accept pre-rendered HTML or auto-render from Markdown
- **Options API** — Configurable page size, margins, headers, and footers
- **Better Error Handling** — Clear messages for missing Playwright dependencies

### 📦 Improved Type System

- **Export Report Type** — Proper type exports from `renderer-interface`
- **Enhanced RenderOptions** — Support for `htmlContent` and PDF configuration
- **Full Type Safety** — All renderers properly typed

### ⚡ Performance Improvements

- **Single MDX Render** — Generate HTML once, reuse for both HTML and PDF outputs
- **Optimized Bundling** — Reduced package size with better tree-shaking

---

## Installation

Install the framework using your preferred package manager:

```bash
npm install @aganitha/reporting-framework
# or
pnpm add @aganitha/reporting-framework
# or
yarn add @aganitha/reporting-framework
```

### Peer Dependencies

The framework requires React for MDX rendering:

```bash
npm install react react-dom
# or
pnpm add react react-dom
```

### Optional: PDF Generation

For PDF output, install Playwright:

```bash
npm install -D playwright
npx playwright install chromium
```

---

## Core Concepts

### What is a Plugin?

A plugin is a self-contained module that knows how to:

- Ingest data from files or APIs
- Transform raw data into standardized bundles
- Generate reports using LLM prompts and templates

Each plugin implements the `FrameworkPlugin` interface and provides:

- A unique `id` for identification
- Methods to ingest data (`ingestFromFile`, `ingestFromAPI`)
- YAML specifications defining report structure
- Prompt templates for LLM interactions
- **MDX or Markdown output templates** for rendering reports

### What is a Bundle?

A Bundle is a standardized container for data (inspired by FHIR). It contains:

- `source` — Where the data came from
- `records` — Array of data records
- `stats` — Computed statistics about the data
- `metadata` — Ingestion info (timestamp, file path, record count, method)
- `samples` — Small subset of data for LLM context

### What is a Report Specification?

A report specification is a YAML file that defines:

- Variables to generate using the LLM
- Which prompt to use for each variable
- The data inputs each prompt needs
- The final template used to render the report (Markdown or MDX)

---

## Quick Start Guide

### Step 1 — Create a Plugin

```typescript
import { FrameworkPlugin, Bundle } from "@aganitha/reporting-framework";

export class MyPlugin implements FrameworkPlugin {
  id = "my-plugin";
  version = "1.0.0";
  description = "My custom data analysis plugin";

  getIngestionCapabilities() {
    return {
      file: true,
      api: false,
      fileFormats: ["json", "csv"],
    };
  }

  async ingestFromFile(filePath: string): Promise<Bundle> {
    // Your ingestion logic here
    return {
      source: filePath,
      records: [],
      stats: {},
      metadata: {},
    };
  }

  getSpecifications() {
    return {
      default: fs.readFileSync("./specs/default.yaml", "utf-8"),
    };
  }

  getPromptsDir() {
    return path.join(__dirname, "prompts");
  }

  getTemplatesDir() {
    return path.join(__dirname, "templates");
  }
}
```

### Step 2 — Create an MDX Template

**`templates/report.mdx.njk`:**

```mdx
# {{ title }}

<Card title="Data Summary" variant="primary">
  <MetricCard 
    label="Total Records" 
    value="{{ stats.total | number_format }}" 
    trend="up"
  />

  <MetricCard 
    label="Average Value" 
    value="{{ stats.average | round(2) }}" 
  />
</Card>

## Analysis Results

{{ ctx.summary }}

<DataTable 
  data={[
    {% for record in records | slice(0, 10) %}
    { name: "{{ record.name }}", value: {{ record.value }} },
    {% endfor %}
  ]}
  columns={["name", "value"]}
/>
```

### Step 3 — Generate Report with MDX

```typescript
import {
  PluginRegistry,
  ReportEngine,
  MDXRenderer,
  PDFRenderer,
} from "@aganitha/reporting-framework";

// Register plugin
const registry = new PluginRegistry();
registry.register(new MyPlugin());

// Generate report
const engine = new ReportEngine(registry);
const bundle = await registry
  .getPlugin("my-plugin")!
  .ingestFromFile("./data/sample.json");

const report = await engine.generateReport({
  pluginId: "my-plugin",
  specificationId: "default",
  bundle,
  llmConfig: {
    provider: "openai",
    model: "gpt-4",
    apiKey: process.env.OPENAI_API_KEY!,
  },
});

// Render to HTML with MDX
const mdxRenderer = new MDXRenderer();
const htmlBuffer = await mdxRenderer.render({
  id: "my-report",
  title: "My Report",
  content: report.content,
  metadata: report.metadata,
});

// Save HTML
await fs.writeFile("report.html", htmlBuffer);

// Optional: Generate PDF
const pdfRenderer = new PDFRenderer();
const pdfBuffer = await pdfRenderer.render(
  {
    id: "my-report",
    title: "My Report",
    content: report.content,
    metadata: report.metadata,
  },
  {
    htmlContent: htmlBuffer.toString("utf-8"),
    pdfFormat: "A4",
    printBackground: true,
  }
);

await fs.writeFile("report.pdf", pdfBuffer);
```

---

## Rendering System

The framework provides three renderers for different use cases:

### 1. HTMLRenderer (Markdown → HTML)

Use for simple Markdown reports without components.

```typescript
import { HTMLRenderer } from "@aganitha/reporting-framework";

const renderer = new HTMLRenderer();
const html = await renderer.render({
  id: "report",
  title: "My Report",
  content: "# Hello\n\nThis is **markdown**.",
});
```

**Input:** Plain Markdown  
**Output:** Styled HTML document

---

### 2. MDXRenderer (MDX → HTML with React)

Use for rich reports with interactive-looking components.

```typescript
import { MDXRenderer } from "@aganitha/reporting-framework";

const renderer = new MDXRenderer();
const html = await renderer.render({
  id: "report",
  title: "Dashboard",
  content: `
# Sales Dashboard

<Card title="Q4 Results">
  <MetricCard label="Revenue" value="$1.2M" change="+15%" trend="up" />
</Card>
  `,
});
```

**Input:** MDX (Markdown + JSX)  
**Output:** HTML with rendered React components

**Available Components:**

- `<Card>` — Container with title and variants
- `<MetricCard>` — Display metrics with optional trends
- `<Badge>` — Status badges (primary, success, warning, error)
- `<Button>` — Styled buttons
- `<DataTable>` — Render tabular data
- `<Chart>` — Coming soon (Recharts integration)

---

### 3. PDFRenderer (HTML → PDF)

Use to generate PDF versions of reports.

```typescript
import { PDFRenderer, MDXRenderer } from "@aganitha/reporting-framework";

// Mode 1: Pre-rendered HTML (recommended for MDX)
const mdxRenderer = new MDXRenderer();
const html = await mdxRenderer.render(report);

const pdfRenderer = new PDFRenderer();
const pdf = await pdfRenderer.render(report, {
  htmlContent: html.toString("utf-8"),
  pdfFormat: "A4",
  printBackground: true,
  pdfMargin: {
    top: "1.5cm",
    right: "1.5cm",
    bottom: "1.5cm",
    left: "1.5cm",
  },
});

// Mode 2: Auto-render from Markdown (legacy)
const pdf = await pdfRenderer.render(report, {
  pdfFormat: "Letter",
});
```

**PDF Options:**

| Option                | Type                          | Default     | Description               |
| --------------------- | ----------------------------- | ----------- | ------------------------- |
| `htmlContent`         | `string`                      | `undefined` | Pre-rendered HTML content |
| `pdfFormat`           | `"A4" \| "Letter" \| "Legal"` | `"A4"`      | Page size                 |
| `printBackground`     | `boolean`                     | `true`      | Print background colors   |
| `pdfMargin`           | `object`                      | `1.5cm all` | Page margins              |
| `displayHeaderFooter` | `boolean`                     | `false`     | Show header/footer        |

---

## API Reference

### PluginRegistry

```typescript
class PluginRegistry {
  register(plugin: FrameworkPlugin): void;
  getPlugin(id: string): FrameworkPlugin | undefined;
  hasPlugin(id: string): boolean;
  listPlugins(): FrameworkPlugin[];
  listPluginsWithCapabilities(): PluginMetadata[];
}
```

### ReportEngine

```typescript
class ReportEngine {
  async generateReport(options: ReportGenerationOptions): Promise<ReportResult>;
  listPlugins(): PluginInfo[];
  getPluginInfo(pluginId: string): PluginInfo | undefined;
}

interface ReportGenerationOptions {
  pluginId: string;
  specificationId: string;
  bundle: Bundle;
  llmConfig: LLMConfig;
}
```

### Renderers

```typescript
interface Renderer {
  readonly format: string;
  render(report: Report, options?: RenderOptions): Promise<Buffer>;
}

interface RenderOptions {
  styles?: string;
  htmlContent?: string; // For PDFRenderer with pre-rendered HTML
  pdfFormat?: "A4" | "Letter" | "Legal" | "A3" | "A5";
  pdfMargin?: { top?: string; right?: string; bottom?: string; left?: string };
  printBackground?: boolean;
  preferCSSPageSize?: boolean;
  displayHeaderFooter?: boolean;
  headerTemplate?: string;
  footerTemplate?: string;
}
```

---

## LLM Configuration

### OpenAI

```typescript
const config = {
  provider: "openai",
  apiKey: process.env.OPENAI_API_KEY,
  model: "gpt-4-turbo",
  temperature: 0.7,
  maxTokens: 4096,
};
```

### DeepSeek

```typescript
const config = {
  provider: "deepseek",
  apiKey: process.env.DEEPSEEK_API_KEY,
  model: "deepseek-chat",
  temperature: 0.5,
  maxTokens: 8192,
};
```

### Google Gemini

```typescript
const config = {
  provider: "google",
  apiKey: process.env.GOOGLE_API_KEY,
  model: "gemini-2.0-flash",
  temperature: 0.6,
};
```

---

## Template System

### Nunjucks Basics

```nunjucks
{# Variable interpolation #}
{{ title }}

{# Conditional #}
{% if stats.total > 0 %}
  Total: {{ stats.total | number_format }}
{% endif %}

{# Loop #}
{% for record in records | slice(0, 5) %}
- {{ record.name }}: {{ record.value }}
{% endfor %}
```

### Built-in Filters

| Filter              | Usage                            | Description           |
| ------------------- | -------------------------------- | --------------------- |
| `number_format`     | `{{ 1234567 \| number_format }}` | `1,234,567`           |
| `round(n)`          | `{{ 3.14159 \| round(2) }}`      | `3.14`                |
| `keys`              | `{{ obj \| keys }}`              | Array of object keys  |
| `top_entries(n)`    | `{{ obj \| top_entries(5) }}`    | Top N key-value pairs |
| `slice(start, end)` | `{{ arr \| slice(0, 10) }}`      | Array slice           |

### MDX Templates

MDX templates combine Nunjucks variables with JSX components:

```mdx
# {{ title }}

## Summary

{{ ctx.summary }}

<Card title="Top Performers" variant="success">
{% for item in records | top_entries(5) %}
  <Badge variant="primary">{{ item.name }}</Badge>
{% endfor %}
</Card>
```

**Template Resolution:**

- `.mdx.njk` files → Processed by Nunjucks → MDX → MDXRenderer
- `.md.njk` files → Processed by Nunjucks → Markdown → HTMLRenderer

---

## Plugin Development Guide

### Recommended Structure

```
my-plugin/
├─ package.json
├─ tsconfig.json
├─ src/
│  ├─ index.ts              # Plugin class export
│  ├─ prompts/
│  │  └─ summary.prompt.md
│  ├─ templates/
│  │  └─ report.mdx.njk     # MDX template (recommended)
│  └─ specs/
│     └─ default.yaml
└─ README.md
```

### Using MDX Templates

**1. Create MDX template:**

```mdx
# {{ title }}

<Card title="Analysis Results">
  {{ ctx.analysis }}
</Card>

<DataTable 
  data={[
    {% for item in records %}
    { name: "{{ item.name }}", value: {{ item.value }} },
    {% endfor %}
  ]}
/>
```

**2. Reference in spec:**

```yaml
id: default
version: 1.0.0
variables:
  - name: analysis
    type: text
    prompt: analysis.prompt.md
    inputs: [records, stats]
template: report.mdx.njk # ← MDX template
```

**3. Plugin automatically uses MDXRenderer for `.mdx.njk` files**

---

## Testing

### Unit Tests

```typescript
import { describe, it, expect } from "vitest";
import { MyPlugin } from "./index";

describe("MyPlugin", () => {
  it("should ingest data correctly", async () => {
    const plugin = new MyPlugin();
    const bundle = await plugin.ingestFromFile("./fixtures/data.json");

    expect(bundle.records).toHaveLength(10);
    expect(bundle.stats.total).toBe(10);
  });
});
```

### Integration Tests

```typescript
import { PluginRegistry, ReportEngine } from "@aganitha/reporting-framework";

describe("Report Generation", () => {
  it("should generate MDX report", async () => {
    const registry = new PluginRegistry();
    registry.register(new MyPlugin());

    const engine = new ReportEngine(registry);
    const bundle = {
      /* test data */
    };

    const result = await engine.generateReport({
      pluginId: "my-plugin",
      specificationId: "default",
      bundle,
      llmConfig: { provider: "openai", model: "gpt-4" },
    });

    expect(result.content).toContain("<Card");
  });
});
```

---

## Links and Resources

- **GitHub Repository:** [https://github.com/tnikhil-acog/reporting-framework](https://github.com/tnikhil-acog/reporting-framework)
- **npm Package:** [https://www.npmjs.com/package/@aganitha/reporting-framework](https://www.npmjs.com/package/@aganitha/reporting-framework)
- **Issue Tracker:** [https://github.com/tnikhil-acog/reporting-framework/issues](https://github.com/tnikhil-acog/reporting-framework/issues)

---

## Changelog

### v1.0.10 (2025-12-30)

- ✨ Added MDXRenderer for React component support
- ✨ Enhanced PDFRenderer with dual mode (pre-rendered HTML + legacy)
- ✨ Added RenderOptions.htmlContent for passing pre-rendered HTML to PDF
- 🐛 Fixed Report type export from renderer-interface
- ✅ Added React 19 support (^18.0.0 || ^19.0.0)
- 📦 Built-in components: Card, MetricCard, Badge, Button, DataTable
- 🎨 Modern styling with Tailwind-inspired utilities
- 📝 Updated documentation with MDX examples

### v1.0.9 (2025-12-29)

- 🔧 Fixed PDF renderer functionality
- 📝 Improved error handling and logging

### v1.0.8 and earlier

- Initial releases with core plugin system and LLM integrations

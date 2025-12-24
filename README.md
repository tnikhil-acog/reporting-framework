# @aganitha/reporting-framework

A flexible, plugin-based framework for generating LLM-powered reports from structured data.

## Features

- 🔌 **Plugin Architecture** - Extensible plugin system for different data types
- 🤖 **Multi-LLM Support** - OpenAI, DeepSeek, Google Gemini via Vercel AI SDK
- 📊 **Multiple Output Formats** - Markdown, HTML, and PDF
- 📋 **FHIR-Inspired Bundles** - Standardized data format with metadata
- 🎨 **Template Engine** - Nunjucks templates with custom filters
- 📦 **TypeScript First** - Full type safety and IntelliSense support
- 🔧 **Highly Customizable** - Override defaults at every level

## Installation

### npm

```bash
npm install @aganitha/reporting-framework
```

### pnpm

```bash
pnpm add @aganitha/reporting-framework
```

## Quick Start

### 1. Create a Plugin

```typescript
import { FrameworkPlugin, Bundle } from "@aganitha/reporting-framework";

export class MyPlugin implements FrameworkPlugin {
  readonly id = "my-plugin";
  readonly version = "1.0.0";
  readonly description = "My custom plugin";

  async ingestFromFile(filePath: string): Promise<Bundle> {
    const data = await readData(filePath);

    return {
      resourceType: "Bundle",
      type: "collection",
      source: filePath,
      timestamp: new Date().toISOString(),
      records: data,
      entry: [],
      stats: { total: data.length },
    };
  }

  getSpecifications(): Record<string, string> {
    return { default: "path/to/spec.yaml" };
  }

  getPromptsDir(): string {
    return "path/to/prompts";
  }

  getTemplatesDir(): string {
    return "path/to/templates";
  }
}
```

### 2. Generate Reports

```typescript
import { ReportEngine, PluginRegistry } from "@aganitha/reporting-framework";

// Setup
const registry = new PluginRegistry();
registry.register(new MyPlugin());

const engine = new ReportEngine();

// Generate
const result = await engine.generateReport({
  pluginId: "my-plugin",
  llmConfig: {
    provider: "openai",
    apiKey: process.env.OPENAI_API_KEY,
    model: "gpt-4",
  },
  specificationId: "default",
  bundle: myBundle,
});

console.log(result.content); // Markdown report
```

### 3. Render to HTML/PDF

```typescript
import { HTMLRenderer, PDFRenderer } from "@aganitha/reporting-framework";

// HTML
const htmlRenderer = new HTMLRenderer();
const html = await htmlRenderer.render(result.content);
await htmlRenderer.save(html, "./report.html");

// PDF
const pdfRenderer = new PDFRenderer();
const pdf = await pdfRenderer.render(result.content);
await pdfRenderer.save(pdf, "./report.pdf");
```

## Core Concepts

### Bundle

Standardized FHIR-inspired data container:

```typescript
interface Bundle {
  resourceType: "Bundle";
  type: "collection" | "document" | "searchset";
  source: string;
  timestamp: string;
  records: any[];
  entry: BundleEntry[];
  stats: Record<string, any>;
}
```

### FrameworkPlugin Interface

```typescript
interface FrameworkPlugin {
  readonly id: string;
  readonly version: string;
  readonly description: string;

  ingestFromFile(filePath: string): Promise<Bundle>;
  getSpecifications(): Record<string, string>;
  getPromptsDir(): string;
  getTemplatesDir(): string;
}
```

## LLM Configuration

### OpenAI

```typescript
const llmConfig = {
  provider: "openai",
  apiKey: process.env.OPENAI_API_KEY,
  model: "gpt-4-turbo",
  temperature: 0.7,
  maxTokens: 4096,
};
```

### DeepSeek

```typescript
const llmConfig = {
  provider: "deepseek",
  apiKey: process.env.DEEPSEEK_API_KEY,
  model: "deepseek-chat",
  temperature: 0.5,
  maxTokens: 8192,
};
```

### Google Gemini

```typescript
const llmConfig = {
  provider: "google",
  apiKey: process.env.GOOGLE_API_KEY,
  model: "gemini-1.5-pro",
  temperature: 0.6,
  maxTokens: 8192,
};
```

## Template System

Built-in Nunjucks filters for templates:

```nunjucks
{# Slice arrays #}
{{ items | slice(0, 10) }}

{# Top N entries from object #}
{{ journals | top_entries(5) }}

{# Object keys #}
{% for key in data | keys %}
  {{ key }}: {{ data[key] }}
{% endfor %}

{# Number formatting #}
{{ count | number_format }}

{# Round decimals #}
{{ value | round(2) }}
```

## Debug Logging

Enable diagnostics with the `debug` library:

```bash
# All framework logs
DEBUG=framework:* node app.js

# Specific components
DEBUG=framework:report node app.js
DEBUG=framework:llm node app.js
DEBUG=framework:renderer node app.js
```

Available namespaces:

- `framework` - General logs
- `framework:report` - Report engine
- `framework:llm` - LLM interactions
- `framework:renderer` - HTML/PDF rendering
- `framework:bundle` - Bundle processing
- `framework:plugin` - Plugin operations
- `framework:error` - Errors (always enabled)

## TypeScript Support

Full type definitions included:

```typescript
import type {
  Bundle,
  BundleEntry,
  FrameworkPlugin,
  PluginReport,
  ReportSpecification,
  LLMConfig,
} from "@aganitha/reporting-framework";
```

## Plugin Development Guide

### Directory Structure

Each plugin should follow this structure:

```
my-plugin/
├── src/
│   ├── index.ts           # Plugin implementation
│   ├── prompts/
│   │   └── default.md     # LLM prompt template
│   ├── templates/
│   │   ├── default.html   # HTML output template
│   │   └── default.md     # Markdown output template
│   └── specs/
│       └── default.yaml   # Data specification
├── package.json
└── tsconfig.json
```

### Handling Data Specifications

Specifications (YAML) define data structure expectations:

```yaml
# specs/default.yaml
version: 1.0
fields:
  - name: patent_id
    type: string
    required: true
  - name: title
    type: string
    required: true
  - name: citations
    type: array
    items: string
```

The framework validates bundles against specs before processing.

### Template Variables

Templates receive a context object with:

```typescript
{
  records: any[];              // Processed data from bundle
  stats: Record<string, any>;  // Statistics object
  timestamp: string;           // Bundle creation time
  source: string;              // Data source path
}
```

## Environment Configuration

Configure behavior via environment variables:

```bash
# Default bundle storage location
FRAMEWORK_BUNDLES_DIR=/shared/reporting-framework/bundles

# Default reports storage location
FRAMEWORK_REPORTS_DIR=/shared/reporting-framework/reports

# Plugin registry location
FRAMEWORK_PLUGINS_DIR=/shared/reporting-framework/plugins

# Enable debug logging
DEBUG=framework:*
```

**Default Location:** `/shared/reporting-framework/` (can be overridden per command)

## Troubleshooting

### Missing Specification Error

**Error:** `Specification not found: {specId}`

**Solution:** Ensure the plugin's `getSpecifications()` returns the correct specification ID and files exist in `specs/` directory.

### Bundle Validation Failed

**Error:** `Bundle validation failed for specification: default`

**Solution:**

1. Check that bundle data matches the specification in `specs/default.yaml`
2. Verify all required fields are present
3. Confirm field types match specification

### LLM Rate Limiting

**Error:** `API rate limit exceeded`

**Solution:**

- Add exponential backoff retry logic
- Reduce `maxTokens` in LLM config
- Space out requests or use batch processing

### PDF Generation Failed

**Error:** `Failed to launch browser for PDF rendering`

**Solution:**

- Ensure Playwright dependencies are installed: `pnpm install`
- Check system has required libraries (Linux: install `libnss3`, etc.)
- Try HTML output first to verify content is valid

## Dependencies

- `ai` - Vercel AI SDK for LLM providers
- `nunjucks` - Template engine
- `marked` - Markdown to HTML converter
- `playwright` - PDF generation
- `debug` - Debug logging

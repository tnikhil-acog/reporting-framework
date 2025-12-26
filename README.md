# @aganitha/reporting-framework

A flexible, plugin-based framework for generating LLM-powered reports from structured data.

## Features

- 🔌 **Plugin Architecture** - Extensible plugin system for different data types
- 🤖 **Multi-LLM Support** - OpenAI, DeepSeek, Google Gemini via Vercel AI SDK
- 📊 **Multiple Output Formats** - Markdown, HTML, and PDF
- 📋 **FHIR-Inspired Bundles** - Standardized data format with metadata
- 🎨 **Template Engine** - Nunjucks templates with custom filters
- 📦 **TypeScript First** - Full type safety and IntelliSense support

# @aganitha/reporting-framework

A flexible, plugin-based TypeScript framework for generating LLM-powered reports from structured data. This framework allows pipeline developers to build custom data analysis and reporting workflows with standardized interfaces, multi-LLM support, and powerful templating capabilities.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Core Concepts](#core-concepts)
- [Quick Start Guide](#quick-start-guide)
- [API Reference](#api-reference)
- [LLM Configuration](#llm-configuration)
- [Template System](#template-system)
- [Plugin Development Guide](#plugin-development-guide)
- [Testing](#testing)
- [Troubleshooting](#troubleshooting)
- [TypeScript Support](#typescript-support)
- [License](#license)
- [Links and Resources](#links-and-resources)

---

## Features

- **Plugin Architecture** — Build extensible plugins for different data types (CSV, JSON, XML, APIs, databases).
- **Multi-LLM Support** — Works with OpenAI GPT-4, DeepSeek, Google Gemini, and Anthropic Claude via the Vercel AI SDK.
- **Multiple Output Formats** — Generate reports in Markdown, HTML, and PDF.
- **Standardized Bundles** — FHIR-inspired data containers with rich metadata for tracking data lineage.
- **Template Engine** — Nunjucks templates with custom filters for data formatting.
- **Dual Ingestion** — Support both file-based ingestion and API-based data fetching.
- **Auto-Generated Docs** — Plugin capabilities exposed via JSON schemas for automatic UI generation.
- **TypeScript First** — Full type safety with IntelliSense support throughout.
- **Validation System** — JSON Schema validation for API queries and bundle structures.
- **Plugin Discovery** — Find plugins by capability, file format, or API endpoints.

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

---

## Core Concepts

### What is a Plugin?

A plugin is a self-contained module that knows how to:

- Ingest data from files or APIs
- Transform raw data into standardized bundles
- Generate reports using LLM prompts and templates

Each plugin implements the `FrameworkPlugin` interface and typically provides:

- A unique `id` for identification
- Methods to ingest data (`ingestFromFile`, `ingestFromAPI`)
- YAML specifications defining report structure
- Prompt templates for LLM interactions
- Output templates for rendering reports

### What is a Bundle?

A Bundle is a standardized container for data (inspired by FHIR). It usually contains:

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
- The final template used to render the report

This separation keeps report structure declarative and independent of plugin code.

---

## Quick Start Guide

Below is a short, practical workflow to get a plugin running and generate a report.

### Step 1 — Create a Plugin

Create a new TypeScript package (e.g. `my-plugin`) with the recommended layout:

```
my-plugin/
├─ package.json
├─ tsconfig.json
├─ src/
│  ├─ index.ts            # exports plugin class
│  ├─ prompts/            # LLM prompt files (plain text/markdown)
│  ├─ templates/          # Nunjucks templates
│  └─ specs/              # YAML specifications
└─ README.md
```

Implement the `FrameworkPlugin` interface. See the [Plugin Development Guide](#plugin-development-guide) below for details.

### Step 2 — Add a Specification

Create a YAML spec (`specs/default.yaml`) that lists variables, the prompt to use, inputs, and template file.

### Step 3 — Add Prompts and Templates

- `prompts/summary.prompt.md` — the instruction for the LLM
- `templates/report.md.njk` — a Nunjucks template to render the final report

### Step 4 — Register and Generate

```ts
import {
  PluginRegistry,
  ReportEngine,
  createLLMClient,
} from "@aganitha/reporting-framework";
import { MyPlugin } from "my-plugin";

const registry = new PluginRegistry();
registry.register(new MyPlugin());

const engine = new ReportEngine(registry);
const client = createLLMClient({
  provider: "openai",
  apiKey: process.env.OPENAI_API_KEY,
  model: "gpt-4",
});

const bundle = await registry
  .getPlugin("my-plugin")!
  .ingestFromFile("./data/sample.json");
const result = await engine.generateReport({
  pluginId: "my-plugin",
  llmConfig: { provider: "openai", model: "gpt-4" },
  specificationId: "default",
  bundle,
});

console.log(result.content);
```

---

## API Reference (summary)

This is a concise reference for the most-used framework APIs. For full types and examples, see the source in `packages/framework/src`.

### PluginRegistry

- `register(plugin: FrameworkPlugin): void` — Validates and registers a plugin. Throws `PluginValidationError` on failure.
- `getPlugin(id: string): FrameworkPlugin | undefined` — Returns a plugin instance.
- `hasPlugin(id: string): boolean` — Checks registration.
- `listPlugins(): FrameworkPlugin[]` — Lists all registered plugins.
- `listPluginsWithCapabilities(): PluginMetadata[]` — Metadata with capabilities.

### ReportEngine

- `generateReport(options: ReportGenerationOptions): Promise<ReportResult>` — Main entry to generate reports. Options include `pluginId`, `llmConfig`, `specificationId`, and `bundle`.
- `listPlugins()` / `getPluginInfo(pluginId)` — Utilities for discovery.

### LLM Utilities

- `createLLMClient(config: LLMConfig): LLMClient` — Create a provider-agnostic LLM client.
- `getSupportedProviders(): string[]` — e.g. `['openai','deepseek','google']`
- `getAvailableModels(provider: string): string[]` — List supported models for a provider.

---

## LLM Configuration

Example configuration objects for supported providers:

### OpenAI

```json
{
  "provider": "openai",
  "apiKey": "<env:OPENAI_API_KEY>",
  "model": "gpt-4-turbo",
  "temperature": 0.7,
  "maxTokens": 4096
}
```

### DeepSeek

```json
{
  "provider": "deepseek",
  "apiKey": "<env:DEEPSEEK_API_KEY>",
  "model": "deepseek-chat",
  "temperature": 0.5,
  "maxTokens": 8192
}
```

### Google Gemini

```json
{
  "provider": "google",
  "apiKey": "<env:GOOGLE_API_KEY>",
  "model": "gemini-1.5-pro",
  "temperature": 0.6
}
```

---

## Template System

We use Nunjucks for rendering templates. Templates are standard `.njk` or `.md` files and have access to a rendering context containing `records`, `stats`, `metadata`, `timestamp`, and generated variables (via `ctx`).

Basic examples:

```nunjucks
{# Variable interpolation #}
{{ title }}

{# Conditional #}
{% if stats.total > 0 %}
  Total: {{ stats.total | number_format }}
{% endif %}

{# Loop #}
{% for r in records | slice(0,5) %}
- {{ r.name }}
{% endfor %}
```

Built-in filters include `number_format`, `round(n)`, `keys`, `top_entries(n)`, and `slice(start,end)`.

---

## Plugin Development Guide

This section helps you implement a plugin that integrates smoothly with the framework.

### Required surface

Your plugin class must implement the `FrameworkPlugin` interface. Important properties/methods:

- `id: string` (lowercase, hyphen-separated)
- `version: string` (semver)
- `description: string`
- `getIngestionCapabilities(): { file: boolean; api: boolean; fileFormats?: string[]; apiEndpoints?: string[] }`
- `getSpecifications(): Record<string,string>` — return YAML specs
- `getPromptsDir(): string` and `getTemplatesDir(): string`
- `generate(spec: PluginSpec, bundle: Bundle, llmClient: LLMClient): Promise<PluginReport>`

Optional methods for file/API ingestion:

- `ingestFromFile(filePath: string): Promise<Bundle>`
- `ingestFromAPI(query: APIQuery): Promise<APIIngestionResult>`
- `getAPIQuerySchema(): Record<string, any>`

### Recommended layout

```
src/
  index.ts      # export plugin class
  prompts/
  templates/
  specs/
```

### Prompt best practices

- Be explicit about required output format (use JSON arrays for `string_list`).
- Provide representative samples and summary statistics to reduce token usage.
- Reference earlier generated variables with `ctx.variable_name`.

### Bundle best practices

- Include `stats` (count, avg, min, max) and `samples` (10–20 records).
- Provide `metadata` with `ingested_at`, `source_file` or `api_endpoint`, and `record_count`.

---

## Testing

- Unit tests: test ingestion and generation separately, mock `llmClient`.
- Integration tests: register plugin with `PluginRegistry` and run `ReportEngine.generateReport()` with fixtures.

Example using Vitest/Jest style:

```ts
const registry = new PluginRegistry();
const plugin = new MyPlugin();
registry.register(plugin);
const bundle = await plugin.ingestFromFile("./tests/fixtures/sample.csv");
const fakeLLM = { generateText: async () => "ok" } as any;
const engine = new ReportEngine(registry);
const result = await engine.generateReport({
  pluginId: plugin.id,
  llmConfig: { provider: "openai", model: "gpt-4" },
  specificationId: "default",
  bundle,
});
expect(result.content).toBeDefined();
```

---

## Troubleshooting

- **PluginValidationError** — Run `validatePlugin(plugin)` to get detailed errors (missing methods/properties or mismatched capabilities).
- **Missing Specification** — Ensure your `getSpecifications()` returns the expected key (e.g. `default`).
- **Bundle Validation Failed** — Compare the bundle structure with the spec and verify required fields exist.
- **LLM Rate Limits** — Implement exponential backoff and retries; consider using cheaper models for development.
- **PDF Rendering Errors** — Ensure Playwright and system dependencies are installed. On Linux, install required libs (e.g., `libnss3`, `libatk1.0-0`, `libxkbcommon0`, `libgbm1`).

---

## TypeScript Support

The framework exports complete TypeScript types. Common types:

- `FrameworkPlugin`, `Bundle<T>`, `PluginSpec`, `PluginReport`, `LLMConfig`, `LLMClient`, `ReportGenerationOptions`, `ReportResult`.

Use these types in your plugin for full type safety and better DX.

---

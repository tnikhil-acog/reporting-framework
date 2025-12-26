/**
 * Report Engine
 *
 * Orchestrates report generation with support for both file and API ingestion.
 */

import path from "path";
import fs from "fs/promises";
import nunjucks from "nunjucks";
import yaml from "js-yaml";
import type {
  FrameworkPlugin,
  PluginSpec,
  APIQuery,
  APIIngestionResult,
} from "../plugins/plugin-interface.js";
import { UnsupportedIngestionError } from "../plugins/plugin-interface.js";
import { PluginRegistry } from "../plugins/plugin-registry.js";
import {
  supportsFileIngestion,
  supportsAPIIngestion,
} from "../plugins/plugin-validation.js";
import {
  createLLMClient,
  type LLMClient,
  type LLMConfig,
} from "../llm/llm-client-factory.js";
import type { Bundle } from "../bundles/types.js";

/**
 * Options for report generation
 */
export interface ReportGenerationOptions {
  pluginId: string;
  llmConfig: LLMConfig;
  specificationId: string;
  bundle: Bundle;
}

/**
 * Options for data ingestion
 */
export interface DataIngestionOptions {
  /** Ingestion type */
  type: "file" | "api";

  /** File path (required for file ingestion) */
  filePath?: string;

  /** Query parameters (required for API ingestion) */
  query?: APIQuery;
}

/**
 * Result of report generation
 */
export interface ReportResult {
  content: string;
  metadata: {
    pluginId: string;
    provider: string;
    model: string;
    generatedAt: Date;
    recordCount: number;
    ingestionMethod?: "file" | "api" | "database" | "stream";
  };
}

/**
 * Parsed specification structure
 */
interface ParsedSpec {
  id: string;
  template_file: string;
  variables: Array<{
    name: string;
    type: string;
    prompt_file: string;
    inputs: string[];
  }>;
}

/**
 * Report Engine - Orchestrates report generation
 */
export class ReportEngine {
  private pluginRegistry: PluginRegistry;

  constructor(pluginRegistry: PluginRegistry) {
    this.pluginRegistry = pluginRegistry;
  }

  /**
   * Ingest data using the appropriate method (file or API)
   *
   * @param plugin - Plugin instance
   * @param options - Ingestion options
   * @returns Bundle with ingested data
   * @throws {UnsupportedIngestionError} If plugin doesn't support requested method
   */
  async ingestData(
    plugin: FrameworkPlugin,
    options: DataIngestionOptions
  ): Promise<Bundle<any>> {
    const capabilities = plugin.getIngestionCapabilities();

    if (options.type === "file") {
      // Validate file ingestion support
      if (!capabilities.file) {
        throw new UnsupportedIngestionError(plugin.id, "file", capabilities);
      }

      if (!plugin.ingestFromFile) {
        throw new Error(
          `Plugin "${plugin.id}" declares file support but doesn't implement ingestFromFile()`
        );
      }

      if (!options.filePath) {
        throw new Error("filePath is required for file ingestion");
      }

      console.log(`[ReportEngine] Ingesting from file: ${options.filePath}`);
      return await plugin.ingestFromFile(options.filePath);
    }

    if (options.type === "api") {
      // Validate API ingestion support
      if (!capabilities.api) {
        throw new UnsupportedIngestionError(plugin.id, "api", capabilities);
      }

      if (!plugin.ingestFromAPI) {
        throw new Error(
          `Plugin "${plugin.id}" declares API support but doesn't implement ingestFromAPI()`
        );
      }

      if (!options.query) {
        throw new Error("query is required for API ingestion");
      }

      console.log(
        `[ReportEngine] Ingesting from API with query:`,
        options.query
      );
      const result: APIIngestionResult = await plugin.ingestFromAPI(
        options.query
      );

      // Log API metadata
      if (result.apiMetadata) {
        console.log(
          `[ReportEngine] API Response: ${result.apiMetadata.statusCode} (${result.apiMetadata.responseTime}ms)`
        );
        if (result.apiMetadata.rateLimit) {
          console.log(
            `[ReportEngine] Rate Limit: ${result.apiMetadata.rateLimit.remaining} remaining`
          );
        }
      }

      return result.bundle;
    }

    throw new Error(`Unknown ingestion type: ${options.type}`);
  }

  /**
   * Resolve input reference (e.g., "bundle.stats" or "ctx.summary_md")
   */
  private resolveInputReference(
    reference: string,
    context: Record<string, any>
  ): any {
    const parts = reference.split(".");

    if (parts[0] === "bundle") {
      let value: any = context.bundle;
      for (let i = 1; i < parts.length; i++) {
        value = value?.[parts[i]];
      }
      return value;
    } else if (parts[0] === "ctx") {
      let value: any = context;
      for (let i = 1; i < parts.length; i++) {
        value = value?.[parts[i]];
      }
      return value;
    }

    return context[reference];
  }

  /**
   * Generate a single variable by calling the LLM
   */
  private async generateVariable(
    varDef: any,
    promptsDir: string,
    context: Record<string, any>,
    llmClient: LLMClient,
    env: nunjucks.Environment
  ): Promise<any> {
    console.log(`  → Generating variable: ${varDef.name}...`);

    // Load prompt template
    const promptPath = path.join(promptsDir, varDef.prompt_file);
    const promptTemplate = await fs.readFile(promptPath, "utf-8");

    // Build input context for prompt rendering
    const promptContext: Record<string, any> = {
      bundle: context.bundle,
      stats: context.bundle.stats,
      samples: context.bundle.samples?.main || context.bundle.samples,
      metadata: context.bundle.metadata,
    };

    // Add resolved inputs
    for (const input of varDef.inputs) {
      const value = this.resolveInputReference(input, context);
      const parts = input.split(".");
      const key =
        parts.length > 2 ? parts[parts.length - 2] : parts[parts.length - 1];
      promptContext[key] = value;
    }

    // Add previously generated variables
    for (const [key, value] of Object.entries(context)) {
      if (
        key !== "bundle" &&
        key !== "stats" &&
        key !== "samples" &&
        key !== "timestamp"
      ) {
        promptContext[key] = value;
      }
    }

    // Render the prompt
    const prompt = env.renderString(promptTemplate, promptContext);

    // Call LLM
    const response = await llmClient.generateText({ prompt });

    // Parse response based on type
    let value: any = response;
    if (varDef.type === "string_list") {
      try {
        // Remove markdown code fences if present
        let cleanResponse = response.trim();
        cleanResponse = cleanResponse.replace(/^```json\s*/i, "");
        cleanResponse = cleanResponse.replace(/^```\s*/i, "");
        cleanResponse = cleanResponse.replace(/\s*```$/i, "");

        value = JSON.parse(cleanResponse.trim());
        if (!Array.isArray(value)) {
          throw new Error("Expected array");
        }
      } catch (error) {
        console.warn(
          `  ⚠ Failed to parse JSON for ${varDef.name}, using raw response`
        );
        value = [response.trim()];
      }
    } else if (varDef.type === "markdown") {
      value = response.trim();
    }

    console.log(`  ✓ ${varDef.name} generated`);
    return value;
  }

  /**
   * Generate a report from a bundle
   */
  async generateReport(
    options: ReportGenerationOptions
  ): Promise<ReportResult> {
    const { pluginId, llmConfig, specificationId, bundle } = options;

    const plugin = this.pluginRegistry.getPlugin(pluginId);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    await plugin.initialize?.();

    // Get plugin directories
    const promptsDir = plugin.getPromptsDir();
    const templatesDir = plugin.getTemplatesDir();

    // Get specification
    const specifications = plugin.getSpecifications();
    const specYaml = specifications[specificationId];
    if (!specYaml) {
      throw new Error(
        `Specification "${specificationId}" not found for plugin "${pluginId}"`
      );
    }

    // Parse YAML specification
    const spec = yaml.load(specYaml) as ParsedSpec;
    if (!spec) {
      throw new Error(`Failed to parse specification: ${specificationId}`);
    }

    // Create LLM client
    const llmClient = createLLMClient(llmConfig);

    // Setup Nunjucks
    const env = nunjucks.configure({
      autoescape: false,
      throwOnUndefined: true,
    });

    // Add custom filters
    env.addFilter("number_format", (num: number) => num.toLocaleString());
    env.addFilter("round", (num: number, decimals: number = 0) =>
      Number(num.toFixed(decimals))
    );
    env.addFilter("keys", (obj: any) => {
      if (!obj || typeof obj !== "object") return [];
      return Object.keys(obj);
    });
    env.addFilter("top_entries", (obj: any, n: number = 10) => {
      if (!obj || typeof obj !== "object") return [];
      return Object.entries(obj)
        .sort(([, a]: any, [, b]: any) => (b as number) - (a as number))
        .slice(0, n);
    });
    env.addFilter("slice", (arr: any[], start: number = 0, end?: number) => {
      if (!Array.isArray(arr)) return [];
      return arr.slice(start, end);
    });

    // Initialize context
    const context: Record<string, any> = {
      bundle,
      stats: bundle.stats,
      samples: bundle.samples,
      timestamp: new Date().toISOString(),
      title: `${
        pluginId.charAt(0).toUpperCase() + pluginId.slice(1)
      } Analysis Report`,
    };

    console.log(
      `\n[ReportEngine] Generating report with specification: ${specificationId}`
    );

    // Generate each variable
    for (const varDef of spec.variables) {
      const value = await this.generateVariable(
        varDef,
        promptsDir,
        context,
        llmClient,
        env
      );
      context[varDef.name] = value;
    }

    // Render final template
    console.log(`  → Rendering final report template...`);
    const templatePath = path.join(templatesDir, spec.template_file);
    const reportTemplate = await fs.readFile(templatePath, "utf-8");
    const markdown = env.renderString(reportTemplate, context);
    console.log(`  ✓ Report rendered\n`);

    return {
      content: markdown.trim(),
      metadata: {
        pluginId,
        provider: llmConfig.provider,
        model: llmConfig.model,
        generatedAt: new Date(),
        recordCount: bundle.records.length,
        ingestionMethod: bundle.metadata.ingestion_method,
      },
    };
  }

  /**
   * List all registered plugins
   */
  listPlugins(): Array<{
    id: string;
    version: string;
    description: string;
  }> {
    return this.pluginRegistry.listPlugins().map((plugin) => ({
      id: plugin.id,
      version: plugin.version,
      description: plugin.description,
    }));
  }

  /**
   * Get plugin information
   */
  getPluginInfo(pluginId: string): FrameworkPlugin | undefined {
    return this.pluginRegistry.getPlugin(pluginId);
  }

  /**
   * Register a new plugin
   */
  registerPlugin(plugin: FrameworkPlugin): void {
    this.pluginRegistry.register(plugin);
  }
}

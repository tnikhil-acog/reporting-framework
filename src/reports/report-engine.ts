/**
 * Report Engine
 *
 * Orchestrates report generation by:
 * 1. Loading the YAML specification from the plugin
 * 2. Iterating through each variable in the specification
 * 3. Loading the corresponding prompt template
 * 4. Rendering the prompt with appropriate data
 * 5. Calling the LLM to generate the variable value
 * 6. Building context with generated variables
 * 7. Finally rendering the report template with all variables
 */

import path from "path";
import fs from "fs/promises";
import nunjucks from "nunjucks";
import yaml from "js-yaml";
import { FrameworkPlugin, PluginSpec } from "../plugins/plugin-interface.js";
import { PluginRegistry } from "../plugins/plugin-registry.js";
import {
  createLLMClient,
  type LLMClient,
  type LLMConfig,
} from "../llm/llm-client-factory.js";
import { Bundle } from "../bundles/types.js";

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
   * Resolve input reference (e.g., "bundle.stats" or "ctx.summary_md")
   */
  private resolveInputReference(
    reference: string,
    context: Record<string, any>
  ): any {
    const parts = reference.split(".");

    if (parts[0] === "bundle") {
      // Return the bundle property
      let value: any = context.bundle;
      for (let i = 1; i < parts.length; i++) {
        value = value?.[parts[i]];
      }
      return value;
    } else if (parts[0] === "ctx") {
      // Return from context (for previously generated variables)
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
    // Start with the bundle's direct properties for easy access
    const promptContext: Record<string, any> = {
      bundle: context.bundle,
      stats: context.bundle.stats,
      samples: context.bundle.samples?.main || context.bundle.samples,
      metadata: context.bundle.metadata,
    };

    // Add resolved inputs with simplified names
    for (const input of varDef.inputs) {
      const value = this.resolveInputReference(input, context);

      // Extract the last part of the path for the key name
      // e.g., "bundle.samples.main" → "samples"
      // e.g., "ctx.summary_md" → "summary_md"
      const parts = input.split(".");
      const key =
        parts.length > 2 ? parts[parts.length - 2] : parts[parts.length - 1];

      console.log(
        `[DEBUG] Processing input "${input}" → key="${key}", value exists: ${!!value}`
      );
      promptContext[key] = value;
    }

    console.log(
      `[DEBUG] Final promptContext keys:`,
      Object.keys(promptContext)
    );
    console.log(
      `[DEBUG] Final promptContext.stats exists:`,
      !!promptContext.stats
    );

    // Also add any previously generated variables from context
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

    console.log(
      `[DEBUG] About to render. First 300 chars:`,
      promptTemplate.substring(0, 300)
    );
    console.log(
      `[DEBUG] promptContext.stats.totalArticles =`,
      promptContext.stats?.totalArticles
    );

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
        // Fallback: try to extract strings from the response
        value = [response.trim()];
      }
    } else if (varDef.type === "markdown") {
      value = response.trim();
    }

    console.log(`  ✓ ${varDef.name} generated`);
    return value;
  }

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

    // Get specification from plugin
    const specifications = plugin.getSpecifications();
    const specYaml = specifications[specificationId];
    if (!specYaml) {
      throw new Error(`Specification not found: ${specificationId}`);
    }

    // Parse YAML specification
    const spec = yaml.load(specYaml) as ParsedSpec;
    if (!spec) {
      throw new Error(`Failed to parse specification: ${specificationId}`);
    }

    // Create LLM client
    const llmClient = createLLMClient(llmConfig);

    // Setup Nunjucks for template rendering
    const env = nunjucks.configure({
      autoescape: false,
      throwOnUndefined: true,
    });

    env.addFilter("number_format", (num: number) => num.toLocaleString());
    env.addFilter("round", (num: number, decimals: number = 0) =>
      Number(num.toFixed(decimals))
    );

    // Add custom filter to get object keys
    env.addFilter("keys", (obj: any) => {
      if (!obj || typeof obj !== "object") return [];
      return Object.keys(obj);
    });

    // Add custom filter to get top N items from an object sorted by value
    env.addFilter("top_entries", (obj: any, n: number = 10) => {
      if (!obj || typeof obj !== "object") return [];
      return Object.entries(obj)
        .sort(([, a]: any, [, b]: any) => (b as number) - (a as number))
        .slice(0, n);
    });

    // Add custom filter to slice arrays
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

    // Generate each variable in sequence
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

    // Load and render final report template
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
      },
    };
  }

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

  getPluginInfo(pluginId: string): FrameworkPlugin | undefined {
    return this.pluginRegistry.getPlugin(pluginId);
  }

  registerPlugin(plugin: FrameworkPlugin): void {
    this.pluginRegistry.register(plugin);
  }
}

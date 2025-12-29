/**
 * @aganitha/framework
 *
 * Core framework for plugin-based LLM report generation.
 */

// ============================================================================
// Types
// ============================================================================
export type { Report, ReportMetadata } from "./types/index.js";

// ============================================================================
// Plugin System
// ============================================================================
export type {
  FrameworkPlugin,
  PluginMetadata,
  PluginSpec,
  PluginReport,
  APIQuery,
  APIIngestionResult,
  IngestionCapabilities,
} from "./plugins/plugin-interface.js";

export {
  APIIngestionError,
  UnsupportedIngestionError,
  PluginValidationError,
} from "./plugins/plugin-interface.js";

export type { PluginRegistryEntry } from "./plugins/plugin-config.js";

export { PluginRegistry } from "./plugins/plugin-registry.js";

export {
  validatePluginId,
  validateClassName,
  validatePackageName,
  validateVersion,
  validatePluginEntry,
  getPluginValidationErrors,
  generateClassNameFromId,
  extractPluginIdFromPackageName,
} from "./plugins/plugin-config.js";

// NEW: Plugin validation utilities
export {
  validatePlugin,
  supportsFileIngestion,
  supportsAPIIngestion,
  getSupportedFileFormats,
  getAPIEndpoints,
  validateAPIQuery,
  type PluginValidationResult,
} from "./plugins/plugin-validation.js";

// ============================================================================
// Bundle System
// ============================================================================
export type { Bundle, BundleMetadata, PluginBundle } from "./bundles/types.js";

// ============================================================================
// LLM Client System
// ============================================================================
export type { LLMConfig, LLMClient, ProviderName } from "./llm/llm-config.js";
export { LLMError } from "./llm/llm-config.js";
export {
  createLLMClient,
  getSupportedProviders,
  isProviderSupported,
  getAvailableModels,
} from "./llm/llm-client-factory.js";
export { AiSdkLlmClient } from "./llm/ai-sdk-llm-client.js";

// ============================================================================
// Report Engine
// ============================================================================
export {
  ReportEngine,
  type ReportGenerationOptions,
  type DataIngestionOptions,
  type ReportResult,
} from "./reports/report-engine.js";

// ============================================================================
// Renderers
// ============================================================================
export type {
  Renderer,
  RenderOptions,
} from "./renderers/renderer-interface.js";
export { RendererError } from "./renderers/renderer-interface.js";
export { HTMLRenderer } from "./renderers/html-renderer.js";
export { PDFRenderer } from "./renderers/pdf-renderer.js";
export { MDXRenderer } from "./renderers/mdx-renderer.js";

// ============================================================================
// Components (for MDX templates)
// ============================================================================
export * from "./components/index.js";

// ============================================================================
// Utilities
// ============================================================================
export * from "./lib/utils.js";

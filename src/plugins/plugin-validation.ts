/**
 * Plugin Validation Utilities
 *
 * Validates that plugins correctly implement the framework interface.
 */

import type {
  FrameworkPlugin,
  IngestionCapabilities,
} from "./plugin-interface.js";

/**
 * Validation result
 */
export interface PluginValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Validate that a plugin has at least one ingestion method
 * and that declared capabilities match implementations
 *
 * @param plugin - Plugin to validate
 * @returns Validation result with errors and warnings
 */
export function validatePlugin(
  plugin: FrameworkPlugin
): PluginValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required properties
  if (!plugin.id) {
    errors.push("Plugin must have an 'id' property");
  }

  if (!plugin.version) {
    errors.push("Plugin must have a 'version' property");
  }

  if (!plugin.description) {
    errors.push("Plugin must have a 'description' property");
  }

  // Check if getIngestionCapabilities is implemented
  if (!plugin.getIngestionCapabilities) {
    errors.push(
      `Plugin "${plugin.id}" must implement getIngestionCapabilities()`
    );
    return { valid: false, errors, warnings };
  }

  let capabilities: IngestionCapabilities;
  try {
    capabilities = plugin.getIngestionCapabilities();
  } catch (error: any) {
    errors.push(
      `Plugin "${plugin.id}" getIngestionCapabilities() threw an error: ${error.message}`
    );
    return { valid: false, errors, warnings };
  }

  // At least one ingestion method must be supported
  if (!capabilities.file && !capabilities.api) {
    errors.push(
      `Plugin "${plugin.id}" must support at least one ingestion method (file or API). ` +
        `Set either capabilities.file or capabilities.api to true.`
    );
  }

  // Validate file ingestion implementation
  if (capabilities.file) {
    if (!plugin.ingestFromFile) {
      errors.push(
        `Plugin "${plugin.id}" declares file ingestion support (file: true) ` +
          `but doesn't implement ingestFromFile()`
      );
    }

    if (!capabilities.fileFormats || capabilities.fileFormats.length === 0) {
      warnings.push(
        `Plugin "${plugin.id}" supports file ingestion but doesn't declare ` +
          `supported file formats in capabilities.fileFormats`
      );
    }
  } else {
    // file: false, but ingestFromFile is implemented
    if (plugin.ingestFromFile) {
      warnings.push(
        `Plugin "${plugin.id}" implements ingestFromFile() but declares ` +
          `file: false in capabilities. Consider setting file: true.`
      );
    }
  }

  // Validate API ingestion implementation
  if (capabilities.api) {
    if (!plugin.ingestFromAPI) {
      errors.push(
        `Plugin "${plugin.id}" declares API ingestion support (api: true) ` +
          `but doesn't implement ingestFromAPI()`
      );
    }

    if (!plugin.getAPIQuerySchema) {
      warnings.push(
        `Plugin "${plugin.id}" supports API ingestion but doesn't provide ` +
          `getAPIQuerySchema(). This is recommended for UI generation.`
      );
    }

    if (!capabilities.apiEndpoints || capabilities.apiEndpoints.length === 0) {
      warnings.push(
        `Plugin "${plugin.id}" supports API ingestion but doesn't declare ` +
          `available endpoints in capabilities.apiEndpoints`
      );
    }
  } else {
    // api: false, but ingestFromAPI is implemented
    if (plugin.ingestFromAPI) {
      warnings.push(
        `Plugin "${plugin.id}" implements ingestFromAPI() but declares ` +
          `api: false in capabilities. Consider setting api: true.`
      );
    }
  }

  // Check required methods
  if (!plugin.generate) {
    errors.push(`Plugin "${plugin.id}" must implement generate()`);
  }

  if (!plugin.getSpecifications) {
    errors.push(`Plugin "${plugin.id}" must implement getSpecifications()`);
  }

  if (!plugin.getPromptsDir) {
    errors.push(`Plugin "${plugin.id}" must implement getPromptsDir()`);
  }

  if (!plugin.getTemplatesDir) {
    errors.push(`Plugin "${plugin.id}" must implement getTemplatesDir()`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check if a plugin supports file ingestion
 *
 * @param plugin - Plugin to check
 * @returns true if plugin supports file ingestion
 */
export function supportsFileIngestion(plugin: FrameworkPlugin): boolean {
  try {
    const capabilities = plugin.getIngestionCapabilities?.();
    return !!(capabilities?.file && plugin.ingestFromFile);
  } catch {
    return false;
  }
}

/**
 * Check if a plugin supports API ingestion
 *
 * @param plugin - Plugin to check
 * @returns true if plugin supports API ingestion
 */
export function supportsAPIIngestion(plugin: FrameworkPlugin): boolean {
  try {
    const capabilities = plugin.getIngestionCapabilities?.();
    return !!(capabilities?.api && plugin.ingestFromAPI);
  } catch {
    return false;
  }
}

/**
 * Get supported file formats for a plugin
 *
 * @param plugin - Plugin to check
 * @returns Array of supported file formats (extensions)
 */
export function getSupportedFileFormats(plugin: FrameworkPlugin): string[] {
  try {
    const capabilities = plugin.getIngestionCapabilities?.();
    return capabilities?.fileFormats || [];
  } catch {
    return [];
  }
}

/**
 * Get available API endpoints for a plugin
 *
 * @param plugin - Plugin to check
 * @returns Array of available API endpoint names
 */
export function getAPIEndpoints(plugin: FrameworkPlugin): string[] {
  try {
    const capabilities = plugin.getIngestionCapabilities?.();
    return capabilities?.apiEndpoints || [];
  } catch {
    return [];
  }
}

/**
 * Validate API query against plugin's schema
 *
 * @param plugin - Plugin to validate against
 * @param query - Query object to validate
 * @returns Validation result
 */
export function validateAPIQuery(
  plugin: FrameworkPlugin,
  query: any
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!supportsAPIIngestion(plugin)) {
    errors.push(`Plugin "${plugin.id}" does not support API ingestion`);
    return { valid: false, errors };
  }

  const schema = plugin.getAPIQuerySchema?.();
  if (!schema) {
    // No schema provided, assume valid
    return { valid: true, errors: [] };
  }

  // Basic validation against JSON Schema
  if (schema.required && Array.isArray(schema.required)) {
    for (const field of schema.required) {
      if (!(field in query)) {
        errors.push(`Required field "${field}" is missing`);
      }
    }
  }

  if (schema.properties) {
    for (const [key, value] of Object.entries(query)) {
      if (!(key in schema.properties)) {
        errors.push(`Unknown field "${key}"`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

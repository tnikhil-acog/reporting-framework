/**
 * Plugin Registry
 *
 * Central registry for all plugins.
 * Handles plugin registration, validation, and discovery.
 */

import type {
  FrameworkPlugin,
  PluginMetadata,
  IngestionCapabilities,
} from "./plugin-interface.js";
import { PluginValidationError } from "./plugin-interface.js";
import {
  validatePlugin,
  type PluginValidationResult,
} from "./plugin-validation.js";

/**
 * Plugin Registry - Manages plugin lifecycle
 */
export class PluginRegistry {
  private plugins: Map<string, FrameworkPlugin> = new Map();

  /**
   * Register a plugin with validation
   *
   * @param plugin - Plugin instance to register
   * @throws {PluginValidationError} If validation fails
   */
  register(plugin: FrameworkPlugin): void {
    // Validate plugin before registration
    const validation = validatePlugin(plugin);

    if (!validation.valid) {
      throw new PluginValidationError(plugin.id, validation.errors);
    }

    // Log warnings if any
    if (validation.warnings.length > 0) {
      console.warn(
        `[PluginRegistry] Plugin "${plugin.id}" validation warnings:`
      );
      validation.warnings.forEach((warning) => console.warn(`  - ${warning}`));
    }

    // Check for duplicate registration
    if (this.plugins.has(plugin.id)) {
      console.warn(
        `[PluginRegistry] Plugin "${plugin.id}" is already registered. Overwriting.`
      );
    }

    this.plugins.set(plugin.id, plugin);
    console.log(
      `[PluginRegistry] ✓ Plugin "${plugin.id}" registered successfully`
    );
  }

  /**
   * Unregister a plugin
   *
   * @param pluginId - ID of plugin to unregister
   * @returns true if plugin was unregistered, false if not found
   */
  unregister(pluginId: string): boolean {
    const existed = this.plugins.has(pluginId);
    this.plugins.delete(pluginId);
    if (existed) {
      console.log(`[PluginRegistry] Plugin "${pluginId}" unregistered`);
    }
    return existed;
  }

  /**
   * Get a plugin by ID
   *
   * @param pluginId - Plugin ID to retrieve
   * @returns Plugin instance or undefined if not found
   */
  getPlugin(pluginId: string): FrameworkPlugin | undefined {
    return this.plugins.get(pluginId);
  }

  /**
   * Check if a plugin is registered
   *
   * @param pluginId - Plugin ID to check
   * @returns true if plugin is registered
   */
  hasPlugin(pluginId: string): boolean {
    return this.plugins.has(pluginId);
  }

  /**
   * List all registered plugins
   *
   * @returns Array of plugin instances
   */
  listPlugins(): FrameworkPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get validation results for a plugin
   *
   * @param pluginId - Plugin ID to validate
   * @returns Validation result or null if plugin not found
   */
  validatePlugin(pluginId: string): PluginValidationResult | null {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return null;
    return validatePlugin(plugin);
  }

  /**
   * List plugins with their capabilities
   *
   * @returns Array of plugin metadata with capabilities
   */
  listPluginsWithCapabilities(): Array<{
    id: string;
    version: string;
    description: string;
    capabilities: IngestionCapabilities;
  }> {
    return Array.from(this.plugins.values()).map((plugin) => ({
      id: plugin.id,
      version: plugin.version,
      description: plugin.description,
      capabilities: plugin.getIngestionCapabilities(),
    }));
  }

  /**
   * Get plugin metadata
   *
   * @param pluginId - Plugin ID
   * @returns Plugin metadata or undefined if not found
   */
  getPluginMetadata(pluginId: string): PluginMetadata | undefined {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) return undefined;

    const specs = plugin.getSpecifications();

    return {
      id: plugin.id,
      version: plugin.version,
      description: plugin.description,
      specifications: Object.keys(specs),
      capabilities: plugin.getIngestionCapabilities(),
    };
  }

  /**
   * Get all plugin metadata
   *
   * @returns Array of plugin metadata
   */
  getAllMetadata(): PluginMetadata[] {
    return Array.from(this.plugins.values()).map((plugin) => {
      const specs = plugin.getSpecifications();
      return {
        id: plugin.id,
        version: plugin.version,
        description: plugin.description,
        specifications: Object.keys(specs),
        capabilities: plugin.getIngestionCapabilities(),
      };
    });
  }

  /**
   * Find plugins by capability
   *
   * @param capability - "file" or "api"
   * @returns Array of plugin IDs that support the capability
   */
  findPluginsByCapability(capability: "file" | "api"): string[] {
    return Array.from(this.plugins.values())
      .filter((plugin) => {
        const capabilities = plugin.getIngestionCapabilities();
        return capability === "file" ? capabilities.file : capabilities.api;
      })
      .map((plugin) => plugin.id);
  }

  /**
   * Find plugins that support specific file format
   *
   * @param format - File format (e.g., "xml", "csv", "json")
   * @returns Array of plugin IDs that support the format
   */
  findPluginsByFileFormat(format: string): string[] {
    return Array.from(this.plugins.values())
      .filter((plugin) => {
        const capabilities = plugin.getIngestionCapabilities();
        return capabilities.fileFormats?.includes(format.toLowerCase());
      })
      .map((plugin) => plugin.id);
  }

  /**
   * Clear all registered plugins
   */
  clear(): void {
    this.plugins.clear();
    console.log("[PluginRegistry] All plugins cleared");
  }

  /**
   * Get registry statistics
   *
   * @returns Statistics about registered plugins
   */
  getStats(): {
    totalPlugins: number;
    filePlugins: number;
    apiPlugins: number;
    hybridPlugins: number;
  } {
    let filePlugins = 0;
    let apiPlugins = 0;
    let hybridPlugins = 0;

    for (const plugin of this.plugins.values()) {
      const capabilities = plugin.getIngestionCapabilities();

      if (capabilities.file && capabilities.api) {
        hybridPlugins++;
      } else if (capabilities.file) {
        filePlugins++;
      } else if (capabilities.api) {
        apiPlugins++;
      }
    }

    return {
      totalPlugins: this.plugins.size,
      filePlugins,
      apiPlugins,
      hybridPlugins,
    };
  }
}

/**
 * Plugin Registry
 *
 * Manages the discovery, registration, and retrieval of plugins.
 * This is the central hub for plugin management.
 */

import type { FrameworkPlugin, PluginMetadata } from "./plugin-interface.js";

const log = (message: string) =>
  console.debug(`[framework:plugins:registry] ${message}`);

export class PluginRegistry {
  private plugins: Map<string, FrameworkPlugin> = new Map();

  /**
   * Register a plugin with the registry
   *
   * @param plugin - The plugin instance to register
   * @throws Error if a plugin with the same ID is already registered
   *
   * @example
   * ```typescript
   * const registry = new PluginRegistry();
   * const patentPlugin = new PatentPlugin();
   * registry.register(patentPlugin);
   * ```
   */
  register(plugin: FrameworkPlugin): void {
    if (this.plugins.has(plugin.id)) {
      throw new Error(
        `Plugin with ID "${plugin.id}" is already registered. ` +
          `Existing plugin: ${this.plugins.get(plugin.id)?.version}`
      );
    }

    this.plugins.set(plugin.id, plugin);
    log(`✅ Registered plugin: ${plugin.id} v${plugin.version}`);
  }

  /**
   * Register multiple plugins at once
   *
   * @param plugins - Array of plugin instances
   *
   * @example
   * ```typescript
   * registry.registerBulk([patentPlugin, pubmedPlugin, staffingPlugin]);
   * ```
   */
  registerBulk(plugins: FrameworkPlugin[]): void {
    for (const plugin of plugins) {
      this.register(plugin);
    }
  }

  /**
   * Get a plugin by ID
   *
   * @param id - Plugin ID (e.g., "patent", "pubmed")
   * @returns The plugin instance
   * @throws Error if plugin is not found
   *
   * @example
   * ```typescript
   * const plugin = registry.getPlugin("patent");
   * const bundle = await plugin.ingestFromFile("patents.csv");
   * ```
   */
  getPlugin(id: string): FrameworkPlugin {
    const plugin = this.plugins.get(id);
    if (!plugin) {
      const available = Array.from(this.plugins.keys());
      throw new Error(
        `Plugin not found: "${id}"\n` +
          `Available plugins: ${available.join(", ") || "(none registered)"}`
      );
    }
    return plugin;
  }

  /**
   * Get all registered plugins
   *
   * @returns Array of all plugin instances
   *
   * @example
   * ```typescript
   * const allPlugins = registry.getAllPlugins();
   * console.log(`Found ${allPlugins.length} plugins`);
   * ```
   */
  getAllPlugins(): FrameworkPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * List all registered plugins (alias for getAllPlugins)
   *
   * @returns Array of all plugin instances
   */
  listPlugins(): FrameworkPlugin[] {
    return this.getAllPlugins();
  }

  /**
   * Get plugin IDs
   *
   * @returns Array of all registered plugin IDs
   *
   * @example
   * ```typescript
   * const ids = registry.getPluginIds();
   * // Returns: ["patent", "pubmed", "staffing"]
   * ```
   */
  getPluginIds(): string[] {
    return Array.from(this.plugins.keys());
  }

  /**
   * Check if a plugin is registered
   *
   * @param id - Plugin ID
   * @returns true if the plugin exists, false otherwise
   *
   * @example
   * ```typescript
   * if (registry.hasPlugin("patent")) {
   *   const plugin = registry.getPlugin("patent");
   * }
   * ```
   */
  hasPlugin(id: string): boolean {
    return this.plugins.has(id);
  }

  /**
   * Get metadata for all plugins (for discovery/listing)
   *
   * @returns Array of plugin metadata
   *
   * @example
   * ```typescript
   * const allMetadata = registry.getAllPluginMetadata();
   * // Use for UI plugin grid, CLI help text, etc.
   * ```
   */
  getAllPluginMetadata(): PluginMetadata[] {
    return Array.from(this.plugins.values()).map((plugin: FrameworkPlugin) => ({
      id: plugin.id,
      version: plugin.version,
      description: plugin.description,
      specifications: Object.keys(plugin.getSpecifications()),
    }));
  }

  /**
   * Get metadata for a specific plugin
   *
   * @param id - Plugin ID
   * @returns Plugin metadata
   * @throws Error if plugin is not found
   *
   * @example
   * ```typescript
   * const metadata = registry.getPluginMetadata("patent");
   * console.log(metadata.specifications);
   * // ["patent_report", "patent_summary", "market_analysis"]
   * ```
   */
  getPluginMetadata(id: string): PluginMetadata {
    const plugin = this.getPlugin(id);
    return {
      id: plugin.id,
      version: plugin.version,
      description: plugin.description,
      specifications: Object.keys(plugin.getSpecifications()),
    };
  }

  /**
   * Unregister a plugin (useful for testing)
   *
   * @param id - Plugin ID
   * @returns true if plugin was unregistered, false if it didn't exist
   *
   * @example
   * ```typescript
   * registry.unregister("patent");
   * ```
   */
  unregister(id: string): boolean {
    const hadPlugin = this.plugins.has(id);
    if (hadPlugin) {
      this.plugins.delete(id);
      log(`❌ Unregistered plugin: ${id}`);
    }
    return hadPlugin;
  }

  /**
   * Clear all registered plugins (useful for testing)
   *
   * @example
   * ```typescript
   * registry.clear();
   * ```
   */
  clear(): void {
    log(`🗑️  Clearing ${this.plugins.size} plugins from registry`);
    this.plugins.clear();
  }
}

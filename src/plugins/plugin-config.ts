/**
 * Plugin Configuration Types and Utilities
 *
 * Defines the structure and validation logic for plugin registry entries.
 * This is the single source of truth for plugin configuration across the framework.
 */

/**
 * Plugin registry entry - defines all metadata about a registered plugin
 */
export interface PluginRegistryEntry {
  /**
   * Unique plugin identifier (lowercase, no spaces, no special chars except hyphens)
   * Examples: "patent", "pubmed", "custom-data"
   */
  id: string;

  /**
   * Human-readable plugin name
   * Examples: "Patent Analysis", "PubMed Literature"
   */
  name: string;

  /**
   * The class name that implements FrameworkPlugin
   * Must be in PascalCase and end with "Plugin"
   * Examples: "PatentPlugin", "PubMedPlugin", "CustomDataPlugin"
   */
  className: string;

  /**
   * NPM package name where the plugin is located
   * Can be scoped package (@org/plugin-name) or local reference
   * Examples: "@aganitha/plugin-patent", "my-company/plugin-custom"
   */
  packageName: string;

  /**
   * Human-readable description of what the plugin does
   */
  description: string;

  /**
   * Plugin version (semantic versioning)
   * Examples: "1.0.0", "2.1.3"
   */
  version: string;

  /**
   * Data types this plugin can process
   * Examples: ["csv"], ["xml"], ["csv", "json"]
   */
  supportedDataTypes: string[];

  /**
   * Optional metadata about the plugin
   */
  metadata?: PluginMetadata;
}

/**
 * Optional metadata for plugins
 */
export interface PluginMetadata {
  /**
   * Plugin author/maintainer name
   */
  author?: string;

  /**
   * Plugin repository URL
   */
  repository?: string;

  /**
   * Plugin documentation URL
   */
  homepage?: string;

  /**
   * Tags for categorizing the plugin
   * Examples: ["analysis", "research", "healthcare"]
   */
  tags?: string[];

  /**
   * Custom metadata fields
   */
  [key: string]: any;
}

/**
 * Validates a plugin ID
 * - Must be lowercase
 * - Must contain only alphanumeric characters and hyphens
 * - Cannot start or end with hyphen
 * - Must be between 1 and 50 characters
 *
 * @param id - Plugin ID to validate
 * @returns true if valid, false otherwise
 */
export function validatePluginId(id: string): boolean {
  if (typeof id !== "string") {
    return false;
  }

  const idRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
  return idRegex.test(id) && id.length >= 1 && id.length <= 50;
}

/**
 * Validates a class name
 * - Must be PascalCase
 * - Must end with "Plugin"
 * - Must contain only alphanumeric characters
 * - Must be between 3 and 100 characters (including "Plugin")
 *
 * @param className - Class name to validate
 * @returns true if valid, false otherwise
 */
export function validateClassName(className: string): boolean {
  if (typeof className !== "string") {
    return false;
  }

  // Must end with Plugin
  if (!className.endsWith("Plugin")) {
    return false;
  }

  // Must be PascalCase (start with uppercase)
  if (!className[0].match(/[A-Z]/)) {
    return false;
  }

  // Must contain only alphanumeric characters
  if (!/^[a-zA-Z0-9]+$/.test(className)) {
    return false;
  }

  // Length validation
  if (className.length < 8 || className.length > 100) {
    // "XPlugin" is minimum (7 chars)
    return false;
  }

  return true;
}

/**
 * Validates a package name
 * - Must be a valid npm package name
 * - Can be scoped (@org/name) or unscoped
 * - Must follow npm naming rules
 *
 * @param packageName - Package name to validate
 * @returns true if valid, false otherwise
 */
export function validatePackageName(packageName: string): boolean {
  if (typeof packageName !== "string") {
    return false;
  }

  // Allow scoped packages (@org/name) or regular packages
  const scopedPackageRegex = /^@[a-z0-9-]+\/[a-z0-9-]+$/;
  const regularPackageRegex = /^[a-z0-9-]+$/;

  const isScoped = scopedPackageRegex.test(packageName);
  const isRegular = regularPackageRegex.test(packageName);

  return isScoped || isRegular;
}

/**
 * Validates a version string
 * - Must follow semantic versioning (major.minor.patch)
 * - Can have pre-release and build metadata
 *
 * @param version - Version string to validate
 * @returns true if valid, false otherwise
 */
export function validateVersion(version: string): boolean {
  if (typeof version !== "string") {
    return false;
  }

  const semverRegex =
    /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

  return semverRegex.test(version);
}

/**
 * Validates a plugin registry entry
 * Performs comprehensive validation of all required fields
 *
 * @param entry - Plugin entry to validate
 * @returns object with validation result and errors
 */
export function validatePluginEntry(entry: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Type check
  if (typeof entry !== "object" || entry === null) {
    return {
      valid: false,
      errors: ["Plugin entry must be an object"],
    };
  }

  // Validate id
  if (!entry.id) {
    errors.push("Plugin must have an 'id' field");
  } else if (!validatePluginId(entry.id)) {
    errors.push(
      `Invalid plugin id: "${entry.id}". Must be lowercase alphanumeric with hyphens, 1-50 characters`
    );
  }

  // Validate name
  if (!entry.name) {
    errors.push("Plugin must have a 'name' field");
  } else if (typeof entry.name !== "string" || entry.name.length === 0) {
    errors.push("Plugin name must be a non-empty string");
  }

  // Validate className
  if (!entry.className) {
    errors.push("Plugin must have a 'className' field");
  } else if (!validateClassName(entry.className)) {
    errors.push(
      `Invalid className: "${entry.className}". Must be PascalCase and end with 'Plugin' (e.g., PatentPlugin)`
    );
  }

  // Validate packageName
  if (!entry.packageName) {
    errors.push("Plugin must have a 'packageName' field");
  } else if (!validatePackageName(entry.packageName)) {
    errors.push(
      `Invalid packageName: "${entry.packageName}". Must be a valid npm package name`
    );
  }

  // Validate description
  if (!entry.description) {
    errors.push("Plugin must have a 'description' field");
  } else if (
    typeof entry.description !== "string" ||
    entry.description.length === 0
  ) {
    errors.push("Plugin description must be a non-empty string");
  }

  // Validate version
  if (!entry.version) {
    errors.push("Plugin must have a 'version' field");
  } else if (!validateVersion(entry.version)) {
    errors.push(
      `Invalid version: "${entry.version}". Must follow semantic versioning (e.g., 1.0.0)`
    );
  }

  // Validate supportedDataTypes
  if (!entry.supportedDataTypes) {
    errors.push("Plugin must have a 'supportedDataTypes' field");
  } else if (!Array.isArray(entry.supportedDataTypes)) {
    errors.push("supportedDataTypes must be an array");
  } else if (entry.supportedDataTypes.length === 0) {
    errors.push("supportedDataTypes must have at least one data type");
  } else if (
    !entry.supportedDataTypes.every((type: any) => typeof type === "string")
  ) {
    errors.push("All supportedDataTypes must be strings");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Gets validation errors for a plugin entry in a human-readable format
 *
 * @param entry - Plugin entry to validate
 * @returns Formatted error message or null if valid
 */
export function getPluginValidationErrors(entry: any): string | null {
  const result = validatePluginEntry(entry);

  if (result.valid) {
    return null;
  }

  const errorLines = result.errors.map(
    (error, index) => `  ${index + 1}. ${error}`
  );
  return `Plugin validation failed:\n${errorLines.join("\n")}`;
}

/**
 * Generates a class name from a plugin ID
 * Useful for suggesting class names during plugin creation
 *
 * @param pluginId - Plugin ID (e.g., "my-plugin")
 * @returns Suggested class name (e.g., "MyPluginPlugin")
 */
export function generateClassNameFromId(pluginId: string): string {
  const parts = pluginId.split("-");
  const pascalCase = parts
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("");
  return `${pascalCase}Plugin`;
}

/**
 * Extracts plugin ID from package name
 * Assumes scoped packages follow pattern @org/plugin-xxx
 *
 * @param packageName - Package name (e.g., "@aganitha/plugin-patent")
 * @returns Plugin ID (e.g., "patent")
 */
export function extractPluginIdFromPackageName(
  packageName: string
): string | null {
  // Scoped package: @org/plugin-xxx
  const scopedMatch = packageName.match(/@[^/]+\/plugin-(.+)/);
  if (scopedMatch) {
    return scopedMatch[1];
  }

  // Unscoped package: plugin-xxx
  const unscopedMatch = packageName.match(/plugin-(.+)/);
  if (unscopedMatch) {
    return unscopedMatch[1];
  }

  return null;
}

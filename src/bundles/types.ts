/**
 * Bundle Types
 *
 * A Bundle is a standardized container for ingested data.
 * All plugins produce Bundles, and the framework consumes Bundles.
 */

/**
 * Bundle Metadata - Information about data ingestion
 */
export interface BundleMetadata {
  /** When the data was ingested (ISO 8601 timestamp) */
  ingested_at: string;

  /** Source of the data (file path, API endpoint, database, etc.) */
  source_file: string;

  /** Number of records in the bundle */
  record_count: number;

  /** Ingestion method used */
  ingestion_method?: "file" | "api" | "database" | "stream";

  /** API-specific metadata (only present when ingestion_method === "api") */
  api_metadata?: {
    /** API endpoint URL */
    endpoint?: string;

    /** Original query parameters */
    query?: Record<string, any>;

    /** HTTP status code */
    statusCode?: number;

    /** Rate limit information */
    rate_limit?: {
      /** Requests remaining in current window */
      remaining: number;

      /** When the rate limit resets (ISO 8601 timestamp) */
      reset: string;

      /** Total requests allowed per window */
      limit?: number;
    };

    /** Response time in milliseconds */
    responseTime?: number;

    /** Any additional API-specific metadata */
    [key: string]: any;
  };

  /** File-specific metadata (only present when ingestion_method === "file") */
  file_metadata?: {
    /** File size in bytes */
    size?: number;

    /** File format/extension */
    format?: string;

    /** File encoding */
    encoding?: string;

    /** File modification time */
    modifiedAt?: string;
  };
}

/**
 * Bundle - Standardized data container
 */
export interface Bundle<T = any> {
  /** Source identifier (e.g., "patent", "pubmed", "staffing") */
  source: string;

  /** The actual data records */
  records: T[];

  /** Computed statistics about the data */
  stats: Record<string, any>;

  /** Metadata about ingestion */
  metadata: BundleMetadata;

  /** Sample records for preview/testing (optional) */
  samples?: Record<string, T[]>;
}

/**
 * Plugin Bundle - Bundle with plugin and spec information
 */
export interface PluginBundle {
  bundle: Bundle;
  pluginId: string;
  specificationId: string;
}

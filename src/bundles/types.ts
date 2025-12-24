/**
 * Bundle Types
 *
 * A Bundle is a standardized container for ingested data.
 * All plugins produce Bundles, and the framework consumes Bundles.
 */

export interface BundleMetadata {
  ingested_at: string;
  source_file: string;
  record_count: number;
}

export interface Bundle<T = any> {
  /** Source identifier (e.g., "patent", "pubmed", "staffing") */
  source: string;

  /** The actual data records */
  records: T[];

  /** Computed statistics about the data */
  stats: Record<string, any>;

  /** Metadata about ingestion */
  metadata: BundleMetadata;

  /** Sample records for preview/testing */
  samples?: Record<string, T[]>;
}

export interface PluginBundle {
  bundle: Bundle;
  pluginId: string;
  specificationId: string;
}

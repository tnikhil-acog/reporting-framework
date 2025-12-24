/**
 * Common types used across the framework
 */

/**
 * Report structure returned by ReportEngine
 */
export interface Report {
  /** Report ID */
  id: string;

  /** Report title */
  title: string;

  /** Report content (Markdown) */
  content: string;

  /** Report metadata */
  metadata: ReportMetadata;
}

/**
 * Report metadata
 */
export interface ReportMetadata {
  /** Plugin ID that generated the report */
  pluginId: string;

  /** LLM provider used */
  provider: string;

  /** LLM model used */
  model: string;

  /** When the report was generated */
  generatedAt: Date;

  /** Number of records in the input bundle */
  recordCount: number;

  /** Total tokens used (if available) */
  totalTokens?: number;

  /** Generation time in milliseconds (if available) */
  generationTimeMs?: number;
}

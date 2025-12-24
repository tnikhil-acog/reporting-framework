/**
 * LLM Provider Configuration and Client Interface
 *
 * Based on AI SDK for unified LLM access
 */

/**
 * Supported LLM providers
 */
export type ProviderName = "gemini" | "openai" | "deepseek";

/**
 * LLM Configuration
 */
export interface LLMConfig {
  /** Provider name */
  provider: ProviderName;

  /** Model name */
  model: string;

  /** API key for authentication */
  apiKey: string;
}

/**
 * LLM Client interface
 */
export interface LLMClient {
  /**
   * Generate text using the LLM
   *
   * @param params - Generation parameters
   * @returns Generated text
   */
  generateText(params: { prompt: string; model?: string }): Promise<string>;
}

/**
 * Error thrown when LLM operations fail
 */
export class LLMError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly originalError?: Error
  ) {
    super(message);
    this.name = "LLMError";
  }
}

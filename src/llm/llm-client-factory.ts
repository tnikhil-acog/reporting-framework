/**
 * LLM Client Factory
 *
 * Creates LLM client instances based on configuration
 */

import type { LLMClient, LLMConfig, ProviderName } from "./llm-config.js";
import { LLMError } from "./llm-config.js";
import { AiSdkLlmClient } from "./ai-sdk-llm-client.js";

/**
 * Creates an LLM client instance based on configuration
 *
 * @param config - LLM configuration
 * @returns LLM client instance
 */
export function createLLMClient(config: LLMConfig): LLMClient {
  return new AiSdkLlmClient(config);
}

/**
 * Get list of all supported providers
 *
 * @returns Array of provider names
 */
export function getSupportedProviders(): ProviderName[] {
  return ["openai", "gemini", "deepseek"];
}

/**
 * Check if a provider is supported
 *
 * @param provider - Provider name to check
 * @returns true if supported, false otherwise
 */
export function isProviderSupported(provider: string): boolean {
  return getSupportedProviders().includes(provider as ProviderName);
}

/**
 * Get available models for a specific provider
 *
 * @param provider - Provider name
 * @returns Array of model names
 */
export function getAvailableModels(provider: ProviderName): string[] {
  switch (provider) {
    case "openai":
      return ["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gpt-4", "gpt-3.5-turbo"];
    case "gemini":
      return ["gemini-pro", "gemini-1.5-pro", "gemini-1.5-flash"];
    case "deepseek":
      return ["deepseek-chat", "deepseek-coder"];
    default:
      throw new LLMError(`Unsupported provider: ${provider}`, provider);
  }
}

// Re-export types for convenience
export type { LLMClient, LLMConfig, ProviderName };
export { LLMError };

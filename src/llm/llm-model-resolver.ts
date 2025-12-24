/**
 * AI SDK Model Resolver
 *
 * Resolves LLM configuration to AI SDK model instances
 */

import type { LLMConfig } from "./llm-config.js";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createDeepSeek } from "@ai-sdk/deepseek";

/**
 * Resolve LLM configuration to AI SDK model
 *
 * @param config - LLM configuration
 * @returns AI SDK model instance
 * @throws Error if provider is unknown
 */
export function resolveAiSdkModel(config: LLMConfig): any {
  switch (config.provider) {
    case "gemini":
      const google = createGoogleGenerativeAI({ apiKey: config.apiKey });
      return google(config.model);

    case "openai":
      const openai = createOpenAI({ apiKey: config.apiKey });
      return openai(config.model);

    case "deepseek":
      const deepseek = createDeepSeek({ apiKey: config.apiKey });
      return deepseek(config.model);

    default:
      throw new Error(`Unknown provider: ${config.provider}`);
  }
}

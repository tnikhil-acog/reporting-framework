/**
 * AI SDK LLM Client
 *
 * LLM client implementation using Vercel AI SDK
 */

import { generateText } from "ai";
import { resolveAiSdkModel } from "./llm-model-resolver.js";
import type { LLMClient, LLMConfig } from "./llm-config.js";

/**
 * AI SDK-based LLM client
 */
export class AiSdkLlmClient implements LLMClient {
  constructor(private config: LLMConfig) {}

  async generateText(params: {
    prompt: string;
    model?: string;
  }): Promise<string> {
    const model = resolveAiSdkModel({
      ...this.config,
      model: params.model ?? this.config.model,
    });

    const { text } = await generateText({
      model,
      prompt: params.prompt,
    });

    return text;
  }
}

import type { ContentGenerator } from "./content-generator.ts";
import { OpenAIContentGenerator } from "./openai-generator.ts";
import { GeminiContentGenerator } from "./gemini-generator.ts";
import { MockContentGenerator } from "./mock-generator.ts";

export * from "./content-generator.ts";
export * from "./openai-generator.ts";
export * from "./gemini-generator.ts";
export * from "./mock-generator.ts";

export interface ProviderFactoryOptions {
  provider: "openai" | "gemini" | "mock" | string;
  model?: string;
  apiKey?: string;
  baseURL?: string;
}

export function createContentGenerator(options: ProviderFactoryOptions): ContentGenerator {
  const provider = (options.provider || "openai").toLowerCase();

  switch (provider) {
    case "mock":
      return new MockContentGenerator();

    case "gemini": {
      const apiKey = options.apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
      if (!apiKey) {
        throw new Error("Gemini API 키가 설정되지 않았습니다. GEMINI_API_KEY 환경 변수를 확인하세요.");
      }
      const model = options.model || process.env.GEMINI_MODEL || "gemini-2.5-flash";
      return new GeminiContentGenerator(apiKey, model);
    }

    case "openai": {
      const apiKey = options.apiKey || process.env.OPENAI_API_KEY || process.env.AI_GATEWAY_API_KEY;
      if (!apiKey) {
        throw new Error("OpenAI API 키가 설정되지 않았습니다. OPENAI_API_KEY 또는 AI_GATEWAY_API_KEY 환경 변수를 확인하세요.");
      }
      const model = options.model || process.env.OPENAI_MODEL || "gpt-4o-mini";
      return new OpenAIContentGenerator(apiKey, model);
    }

    default:
      throw new Error(`지원하지 않는 Provider입니다: ${options.provider}. (지원: openai, gemini, mock)`);
  }
}

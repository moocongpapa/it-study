import type { ContentGenerator } from "./content-generator.ts";
import { OpenAIContentGenerator } from "./openai-generator.ts";
import { MockContentGenerator } from "./mock-generator.ts";

export * from "./content-generator.ts";
export * from "./openai-generator.ts";
export * from "./mock-generator.ts";

export interface ProviderFactoryOptions {
  provider: "openai" | "mock" | string;
  model?: string;
  apiKey?: string;
}

export function createContentGenerator(options: ProviderFactoryOptions): ContentGenerator {
  const provider = (options.provider || "openai").toLowerCase();

  switch (provider) {
    case "mock":
      return new MockContentGenerator();

    case "openai": {
      const apiKey = options.apiKey || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("OPENAI_API_KEY 환경 변수를 확인하세요.");
      }
      const model = options.model || process.env.OPENAI_MODEL || "gpt-5.6-terra";
      return new OpenAIContentGenerator(apiKey, model);
    }

    default:
      throw new Error(`지원하지 않는 Provider입니다: ${options.provider}. (지원: openai, mock)`);
  }
}

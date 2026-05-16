/**
 * AI Provider Configuration
 *
 * To switch providers, simply update these env vars — no code changes needed.
 *
 * Supported provider presets:
 *   - ZHIPU:   AI_BASE_URL=https://open.bigmodel.cn/api/paas/v4  AI_MODEL=glm-4.7-flash
 *   - OPENAI:  AI_BASE_URL=https://api.openai.com/v1              AI_MODEL=gpt-4o-mini
 *   - DEEPSEEK: AI_BASE_URL=https://api.deepseek.com/v1           AI_MODEL=deepseek-chat
 *   - SILICONFLOW: AI_BASE_URL=https://api.siliconflow.cn/v1      AI_MODEL=Qwen/Qwen2.5-7B-Instruct
 */

export interface AIProviderConfig {
  apiKey: string;
  baseURL: string;
  model: string;
}

export function getAIConfig(): AIProviderConfig {
  const apiKey = process.env.AI_API_KEY || process.env.ZHIPU_API_KEY || "";
  const baseURL =
    process.env.AI_BASE_URL || "https://open.bigmodel.cn/api/paas/v4";
  const model = process.env.AI_MODEL || "glm-4.7-flash";

  if (!apiKey) {
    throw new Error("AI_API_KEY is not configured");
  }

  return { apiKey, baseURL, model };
}

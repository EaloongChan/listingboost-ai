/**
 * Multi-provider AI Fallback Configuration
 *
 * Define up to 3 providers via env vars. The system tries them in order
 * (1 → 2 → 3) until one succeeds. Perfect for: main provider + 2 backups.
 *
 * How to configure in Vercel Environment Variables:
 *   AI_KEY_1    = your-main-api-key
 *   AI_URL_1    = https://open.bigmodel.cn/api/paas/v4
 *   AI_MODEL_1  = glm-4.7-flash
 *   AI_KEY_2    = your-backup-api-key
 *   AI_URL_2    = https://api.siliconflow.cn/v1
 *   AI_MODEL_2  = deepseek-ai/DeepSeek-V3-Flash
 *   AI_KEY_3    = your-last-resort-key
 *   AI_URL_3    = https://api.deepseek.com/v1
 *   AI_MODEL_3  = deepseek-chat
 *
 * Legacy support: If AI_KEY_1 is not set, falls back to old ZHIPU_API_KEY / AI_API_KEY.
 */

export interface AIProviderConfig {
  apiKey: string;
  baseURL: string;
  model: string;
  name: string; // e.g. "Provider 1", "智谱", "硅基流动"
}

function readProvider(index: number, fallbackKey?: string, fallbackURL?: string, fallbackModel?: string): AIProviderConfig | null {
  const key = process.env[`AI_KEY_${index}`] || fallbackKey || "";
  const url = process.env[`AI_URL_${index}`] || fallbackURL || "";
  const model = process.env[`AI_MODEL_${index}`] || fallbackModel || "";

  if (!key || !url || !model) return null;

  return { apiKey: key, baseURL: url, model, name: `Provider ${index}` };
}

export function getAIProviders(): AIProviderConfig[] {
  const providers: AIProviderConfig[] = [];

  // Provider 1 — read explicitly or fall back to legacy vars
  const p1 = readProvider(
    1,
    process.env.AI_API_KEY || process.env.ZHIPU_API_KEY,
    process.env.AI_BASE_URL || "https://open.bigmodel.cn/api/paas/v4",
    process.env.AI_MODEL || "glm-4.7-flash"
  );
  if (p1) providers.push(p1);

  // Provider 2 — backup (硅基流动 / SiliconFlow)
  const p2 = readProvider(2);
  if (p2) providers.push(p2);

  // Provider 3 — last resort (DeepSeek official)
  const p3 = readProvider(3);
  if (p3) providers.push(p3);

  return providers;
}

/**
 * Legacy compatibility — returns the first available provider.
 * Use getAIProviders() + fallback loop in production.
 */
export function getAIConfig(): AIProviderConfig {
  const providers = getAIProviders();
  if (providers.length === 0) {
    throw new Error("No AI provider is configured. Set AI_KEY_1 / AI_URL_1 / AI_MODEL_1 or ZHIPU_API_KEY.");
  }
  return providers[0];
}

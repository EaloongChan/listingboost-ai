import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { getAIProviders } from "@/lib/ai-provider";
import { SYSTEM_PROMPT } from "@/lib/ai-prompts";
import { hashRequest, getCached, setCache } from "@/lib/cache";
import { checkRateLimit } from "@/lib/rate-limit";

// Cost control: reasonable token limits
const MAX_TOKENS = 2048;

function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIP = request.headers.get("x-real-ip");
  if (realIP) return realIP;
  return "unknown";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productName, keySellingPoints, targetAudience, tone, platform } =
      body;

    if (!productName?.trim()) {
      return NextResponse.json(
        { error: "Product name is required" },
        { status: 400 }
      );
    }

    // ─── Rate Limiting (Module 2) ───
    const ip = getClientIP(request);
    const rateCheck = checkRateLimit(ip);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: rateCheck.reason,
          rateLimited: true,
          retryAfterMs: rateCheck.retryAfterMs,
        },
        { status: 429 }
      );
    }

    // ─── Cache Check (Module 2) ───
    const cacheKey = hashRequest({
      productName: productName.trim(),
      keySellingPoints: keySellingPoints?.trim() || "",
      targetAudience,
      tone,
      platform,
    });

    const cached = getCached<Record<string, unknown>>(cacheKey);
    if (cached) {
      return NextResponse.json({
        result: cached,
        cached: true,
      });
    }

    // ─── Multi-provider Fallback (Module 1: Decoupled) ───
    const providers = getAIProviders();
    if (providers.length === 0) {
      return NextResponse.json(
        { error: "AI service is not configured" },
        { status: 500 }
      );
    }

    const userMessage = `Generate a product listing with the following details:
- Product Name: ${productName}
- Key Selling Points: ${keySellingPoints || "Not specified"}
- Target Audience: ${targetAudience || "General e-commerce shoppers"}
- Tone: ${tone || "Professional"}
- Platform: ${platform || "Amazon"}

Respond with a JSON object containing: title, bulletPoints (array of 5 strings), and productDescription.`;

    let content: string | null = null;
    let lastError: string | null = null;

    for (const provider of providers) {
      try {
        const client = new OpenAI({
          apiKey: provider.apiKey,
          baseURL: provider.baseURL,
        });

        const completion = await client.chat.completions.create({
          model: provider.model,
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userMessage },
          ],
          temperature: 0.85,
          max_tokens: MAX_TOKENS,
        });

        const raw = completion.choices[0]?.message?.content?.trim();
        if (raw) {
          content = raw;
          break; // Success — stop trying other providers
        }
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        lastError = message;
        console.warn(`Provider ${provider.name} (${provider.baseURL}) failed: ${message}`);
        // Continue to next provider
      }
    }

    if (!content) {
      return NextResponse.json(
        {
          error: "All AI providers are currently unavailable. Please try again later.",
          detail: lastError || undefined,
        },
        { status: 503 }
      );
    }

    // ─── Parse & Validate ───
    let cleanedContent = content;
    if (content.startsWith("```")) {
      cleanedContent = content
        .replace(/^```(?:json)?\s*\n?/i, "")
        .replace(/\n?```\s*$/i, "")
        .trim();
    }

    let result;
    try {
      result = JSON.parse(cleanedContent);
    } catch {
      const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        return NextResponse.json(
          { error: "AI returned invalid format. Please try again." },
          { status: 500 }
        );
      }
    }

    if (
      !result.title ||
      !Array.isArray(result.bulletPoints) ||
      !result.productDescription
    ) {
      return NextResponse.json(
        { error: "AI returned incomplete data. Please try again." },
        { status: 500 }
      );
    }

    // ─── Cache the result (Module 2) ───
    setCache(cacheKey, result);

    return NextResponse.json({ result });
  } catch (error) {
    console.error("AI generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate listing. Please try again later." },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const SYSTEM_PROMPT = `You are an expert e-commerce copywriter who specializes in creating high-converting product listings. You generate compelling, SEO-optimized product content for various e-commerce platforms.

When given product information, you MUST respond with a valid JSON object in this exact format (no markdown, no code blocks, just raw JSON):
{
  "title": "A compelling product title (under 200 characters, include key SEO keywords)",
  "bulletPoints": [
    "Bullet point 1 starting with a benefit keyword in CAPS",
    "Bullet point 2 starting with a feature keyword in CAPS",
    "Bullet point 3 starting with a benefit keyword in CAPS",
    "Bullet point 4 starting with a guarantee keyword in CAPS",
    "Bullet point 5 starting with a use-case keyword in CAPS"
  ],
  "productDescription": "A detailed product description (300-600 words) with clear sections, emotional appeal, and a call to action"
}

Rules:
- Match the requested tone perfectly (professional, casual, luxury, technical, or emotional)
- Optimize for the target platform's best practices
- Include relevant keywords for SEO
- Make bullet points scannable with CAPS prefix
- Description should be persuasive but not spammy
- If the user writes in Chinese, respond in Chinese. If in English, respond in English. Match the user's language.
- Always respond with valid JSON only, no extra text`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { productName, keySellingPoints, targetAudience, tone, platform } = body;

    if (!productName?.trim()) {
      return NextResponse.json(
        { error: "Product name is required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.ZHIPU_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI service is not configured" },
        { status: 500 }
      );
    }

    const client = new OpenAI({
      apiKey: apiKey,
      baseURL: "https://open.bigmodel.cn/api/paas/v4",
    });

    const userMessage = `Generate a product listing with the following details:
- Product Name: ${productName}
- Key Selling Points: ${keySellingPoints || "Not specified"}
- Target Audience: ${targetAudience || "General e-commerce shoppers"}
- Tone: ${tone || "Professional"}
- Platform: ${platform || "Amazon"}

Please respond with a JSON object containing: title, bulletPoints (array of 5 strings), and productDescription.`;

    const completion = await client.chat.completions.create({
      model: "glm-4.7-flash",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage },
      ],
      temperature: 1.0,
      max_tokens: 4096,
    });

    const content = completion.choices[0]?.message?.content?.trim();

    if (!content) {
      return NextResponse.json(
        { error: "AI generated empty response" },
        { status: 500 }
      );
    }

    // Parse JSON from response (handle potential markdown code blocks)
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
      // If JSON parsing fails, try to extract JSON from the text
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

    // Validate the result structure
    if (!result.title || !Array.isArray(result.bulletPoints) || !result.productDescription) {
      return NextResponse.json(
        { error: "AI returned incomplete data. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ result });
  } catch (error) {
    console.error("AI generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate listing. Please try again later." },
      { status: 500 }
    );
  }
}

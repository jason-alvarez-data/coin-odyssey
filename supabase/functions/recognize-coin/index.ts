import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");

const CACHED_SYSTEM_PROMPT = `You are an expert numismatist (coin specialist) with encyclopedic knowledge of world coins from all eras and countries. You have deep expertise in:

- World coin denominations, series, and mintage history from all countries
- Coin grading standards (Sheldon scale, PCGS/NGC grading)
- Mint marks and their locations on coins from different countries and eras
- Coin compositions and metallurgy across different historical periods
- Country-specific numismatic conventions (e.g. U.S. cent vs penny terminology)
- Date placement conventions on coins from different cultures
- Edge lettering, reeding patterns, and other identifying features
- Common coin series: U.S. Lincoln Cents, Washington Quarters, Morgan Dollars, Franklin Half Dollars, Walking Liberty, Mercury Dimes, Buffalo Nickels; European Euro coinage; British Sovereigns and Crowns; Canadian Maple Leafs; Australian coins; Roman, Greek, and ancient coinage
- Error coins, varieties, and proof vs circulation strikes
- How to read partially worn or damaged coin inscriptions

When analyzing coin images, you apply your full expertise to extract as much accurate information as possible. You are precise and conservative — if you cannot determine a field with reasonable certainty from the image provided, you return null for that field rather than guessing. You never fabricate coin details.

You always respond ONLY with a valid JSON object. No preamble. No explanation. No markdown code fences. Raw JSON only.

The JSON object must have exactly these keys:
- denomination: string or null (e.g. "Quarter Dollar", "1 Euro", "Penny", "5 Pence")
- year: number or null (4-digit integer, e.g. 1965)
- country: string or null (full country name in English, e.g. "United States", "Germany", "United Kingdom")
- currency: string or null (ISO 4217 code where known, e.g. "USD", "EUR", "GBP", "CAD")
- mintMark: string or null (single letter or symbol visible on coin, e.g. "D", "S", "W", "P")
- composition: string or null (e.g. "Copper-Nickel Clad", "90% Silver", "Bronze", "Zinc Core")
- confidence: one of exactly "high", "medium", "low", or "unrecognized"
- grade: string or null — Sheldon-scale grade estimate based on visible wear, luster, strike, and surface marks. Use standard PCGS/NGC notation. Examples: "MS-65", "AU-58", "XF-45", "VF-30", "F-15", "VG-10", "G-6", "PR-65". Return null only if the coin is unrecognizable or the image is too poor to judge condition.
- gradeConfidence: one of exactly "high", "medium", "low", or "unrecognized" — how confident you are in the grade estimate. Photo-based grading is inherently approximate; bias toward "medium" or "low" unless the image clearly shows surface detail.
- notes: string or null (brief observation about condition, variety, or anything useful for cataloging)

Confidence guidelines (for identification):
- "high": You can clearly identify denomination, year, and country with certainty
- "medium": You can identify most fields but one or two are unclear or estimated
- "low": The coin is worn, damaged, or partially visible; you can make educated guesses only
- "unrecognized": The image quality is too poor, or the coin is too obscure to identify meaningfully

Grade confidence guidelines:
- "high": Surface detail, luster, and wear are clearly visible; you are confident in the grade within a couple of Sheldon points
- "medium": Some details are clear; grade estimate is reasonable but could be off by 5–10 points
- "low": Lighting, glare, or focus obscure the surfaces; the grade is a rough estimate
- "unrecognized": You cannot judge the grade meaningfully

Example of a valid response:
{"denomination":"Quarter Dollar","year":1965,"country":"United States","currency":"USD","mintMark":null,"composition":"Copper-Nickel Clad","confidence":"high","grade":"AU-55","gradeConfidence":"medium","notes":"Washington Quarter, clad composition introduced this year replacing silver"}`;

Deno.serve(async (req: Request) => {
  // CORS headers for mobile/web clients
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
      },
    });
  }

  if (req.method !== "POST") {
    return Response.json({ success: false, error: "Method not allowed" }, { status: 405 });
  }

  // Verify the user is authenticated
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return Response.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  if (!ANTHROPIC_API_KEY) {
    return Response.json(
      { success: false, error: "Recognition service not configured" },
      { status: 500 }
    );
  }

  try {
    const { obverseImage, reverseImage, mediaType } = await req.json();

    if (!obverseImage && !reverseImage) {
      return Response.json(
        { success: false, error: "At least one image is required" },
        { status: 400 }
      );
    }

    const validTypes = ["image/jpeg", "image/png", "image/webp"];
    const resolvedMediaType = validTypes.includes(mediaType) ? mediaType : "image/jpeg";

    // Build the message content with image(s)
    const content: Array<Record<string, unknown>> = [];

    if (obverseImage) {
      content.push({
        type: "image",
        source: { type: "base64", media_type: resolvedMediaType, data: obverseImage },
      });
    }
    if (reverseImage) {
      content.push({
        type: "image",
        source: { type: "base64", media_type: resolvedMediaType, data: reverseImage },
      });
    }

    // Add the text instruction
    let instruction: string;
    if (obverseImage && reverseImage) {
      instruction =
        "These are the obverse (first image) and reverse (second image) of the same coin. Use both to identify it. Return the JSON object as instructed.";
    } else if (reverseImage) {
      instruction =
        "This is the reverse (back/tails) of the coin. Analyze this coin and return a JSON object with the fields specified in your instructions.";
    } else {
      instruction =
        "This is the obverse (front/heads) of the coin. Analyze this coin and return a JSON object with the fields specified in your instructions.";
    }
    content.push({ type: "text", text: instruction });

    // Call Anthropic API
    const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 384,
        system: [
          {
            type: "text",
            text: CACHED_SYSTEM_PROMPT,
            cache_control: { type: "ephemeral" },
          },
        ],
        messages: [{ role: "user", content }],
      }),
    });

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text();
      console.error("Anthropic API error:", anthropicResponse.status, errorText);

      if (anthropicResponse.status === 429) {
        return Response.json(
          {
            success: false,
            code: "rate_limit",
            error: "Recognition service is busy. Please try again in a few minutes.",
          },
          { status: 200, headers: { "Access-Control-Allow-Origin": "*" } }
        );
      }

      return Response.json(
        {
          success: false,
          code: "service_unavailable",
          error: "Recognition service unavailable. Please try again.",
        },
        { status: 200, headers: { "Access-Control-Allow-Origin": "*" } }
      );
    }

    const anthropicData = await anthropicResponse.json();

    const rawText = anthropicData.content
      ?.filter((block: { type: string }) => block.type === "text")
      .map((block: { text: string }) => block.text)
      .join("") ?? "";

    const cleaned = rawText.replace(/```json|```/g, "").trim();

    try {
      const result = JSON.parse(cleaned);
      return Response.json({ success: true, result }, {
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    } catch {
      return Response.json({
        success: true,
        result: {
          denomination: null,
          year: null,
          country: null,
          currency: null,
          mintMark: null,
          composition: null,
          confidence: "unrecognized",
          grade: null,
          gradeConfidence: "unrecognized",
          notes: null,
          error: "Failed to parse recognition response",
        },
      }, {
        headers: { "Access-Control-Allow-Origin": "*" },
      });
    }
  } catch (error) {
    console.error("Coin recognition error:", error);
    return Response.json(
      { success: false, error: "Recognition service unavailable. Please try again." },
      { status: 500, headers: { "Access-Control-Allow-Origin": "*" } }
    );
  }
});

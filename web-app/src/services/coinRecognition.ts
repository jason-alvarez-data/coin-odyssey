import Anthropic from '@anthropic-ai/sdk';
import { CoinRecognitionResult } from '@/types/recognition';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

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
- notes: string or null (brief observation about condition, variety, or anything useful for cataloging)

Confidence guidelines:
- "high": You can clearly identify denomination, year, and country with certainty
- "medium": You can identify most fields but one or two are unclear or estimated
- "low": The coin is worn, damaged, or partially visible; you can make educated guesses only
- "unrecognized": The image quality is too poor, or the coin is too obscure to identify meaningfully

Example of a valid response:
{"denomination":"Quarter Dollar","year":1965,"country":"United States","currency":"USD","mintMark":null,"composition":"Copper-Nickel Clad","confidence":"high","notes":"Washington Quarter, clad composition introduced this year replacing silver"}`;

export async function recognizeCoin(
  imageBase64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp',
  side: 'obverse' | 'reverse' = 'obverse'
): Promise<CoinRecognitionResult> {
  const sideInstruction =
    side === 'reverse'
      ? 'This is the reverse (back/tails) of the coin.'
      : 'This is the obverse (front/heads) of the coin.';

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    system: [
      {
        type: 'text',
        text: CACHED_SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: mediaType,
              data: imageBase64,
            },
          },
          {
            type: 'text',
            text: `${sideInstruction} Analyze this coin and return a JSON object with the fields specified in your instructions.`,
          },
        ],
      },
    ],
  });

  return parseResponse(response);
}

export async function recognizeCoinBothSides(
  obverseBase64: string,
  reverseBase64: string,
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp'
): Promise<CoinRecognitionResult> {
  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 256,
    system: [
      {
        type: 'text',
        text: CACHED_SYSTEM_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: obverseBase64 },
          },
          {
            type: 'image',
            source: { type: 'base64', media_type: mediaType, data: reverseBase64 },
          },
          {
            type: 'text',
            text: 'These are the obverse (first image) and reverse (second image) of the same coin. Use both to identify it. Return the JSON object as instructed.',
          },
        ],
      },
    ],
  });

  return parseResponse(response);
}

function parseResponse(response: Anthropic.Message): CoinRecognitionResult {
  const rawText = response.content
    .filter((block): block is Anthropic.TextBlock => block.type === 'text')
    .map((block) => block.text)
    .join('');

  const cleaned = rawText.replace(/```json|```/g, '').trim();

  try {
    return JSON.parse(cleaned) as CoinRecognitionResult;
  } catch {
    return {
      denomination: null,
      year: null,
      country: null,
      currency: null,
      mintMark: null,
      composition: null,
      confidence: 'unrecognized',
      notes: null,
      error: 'Failed to parse recognition response',
    };
  }
}

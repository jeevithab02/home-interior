import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const STYLES = [
  "Modern",
  "Minimalist",
  "Scandinavian",
  "Luxury",
  "Industrial",
  "Bohemian",
  "Japandi",
  "Contemporary",
] as const;

const AnalyzeInput = z.object({
  imageDataUrl: z
    .string()
    .startsWith("data:image/", { message: "Image must be a data URL" })
    .max(15_000_000, { message: "Image too large" }),
  style: z.enum(STYLES),
});

const ROOM_TYPES = [
  "Bedroom",
  "Living Room",
  "Kitchen",
  "Bathroom",
  "Office",
  "Dining Room",
  "Study Room",
] as const;

export type Recommendation = {
  category: "Color" | "Furniture" | "Lighting" | "Decor" | "Layout";
  issue: string;
  suggestion: string;
  impact: "High" | "Medium" | "Low";
};

export type DetectedFurniture = {
  name: string;
  condition: "Keep" | "Replace" | "Add" | "Remove";
  note: string;
};

export type DesignResult = {
  room_type: string;
  confidence: number;
  style: string;
  analysis: {
    brightness: "Dim" | "Balanced" | "Bright";
    clutter: "Minimal" | "Moderate" | "Cluttered";
    estimated_size: "Small" | "Medium" | "Large";
    dominant_colors: string[];
  };
  design_score: {
    overall: number;
    style_match: number;
    harmony: number;
    functionality: number;
    lighting: number;
  };
  recommendations: Recommendation[];
  color_palette: string[];
  lighting: string;
  furniture: DetectedFurniture[];
  redesign_prompt: string;
};

const JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "room_type",
    "confidence",
    "analysis",
    "design_score",
    "recommendations",
    "color_palette",
    "lighting",
    "furniture",
    "redesign_prompt",
  ],
  properties: {
    room_type: { type: "string", enum: [...ROOM_TYPES] },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    analysis: {
      type: "object",
      additionalProperties: false,
      required: ["brightness", "clutter", "estimated_size", "dominant_colors"],
      properties: {
        brightness: { type: "string", enum: ["Dim", "Balanced", "Bright"] },
        clutter: { type: "string", enum: ["Minimal", "Moderate", "Cluttered"] },
        estimated_size: { type: "string", enum: ["Small", "Medium", "Large"] },
        dominant_colors: {
          type: "array",
          minItems: 3,
          maxItems: 5,
          items: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" },
        },
      },
    },
    design_score: {
      type: "object",
      additionalProperties: false,
      required: ["overall", "style_match", "harmony", "functionality", "lighting"],
      properties: {
        overall: { type: "number", minimum: 0, maximum: 100 },
        style_match: { type: "number", minimum: 0, maximum: 100 },
        harmony: { type: "number", minimum: 0, maximum: 100 },
        functionality: { type: "number", minimum: 0, maximum: 100 },
        lighting: { type: "number", minimum: 0, maximum: 100 },
      },
    },
    recommendations: {
      type: "array",
      minItems: 5,
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["category", "issue", "suggestion", "impact"],
        properties: {
          category: {
            type: "string",
            enum: ["Color", "Furniture", "Lighting", "Decor", "Layout"],
          },
          issue: { type: "string" },
          suggestion: { type: "string" },
          impact: { type: "string", enum: ["High", "Medium", "Low"] },
        },
      },
    },
    color_palette: {
      type: "array",
      minItems: 4,
      maxItems: 6,
      items: { type: "string", pattern: "^#[0-9A-Fa-f]{6}$" },
    },
    lighting: { type: "string" },
    furniture: {
      type: "array",
      minItems: 4,
      maxItems: 8,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "condition", "note"],
        properties: {
          name: { type: "string" },
          condition: {
            type: "string",
            enum: ["Keep", "Replace", "Add", "Remove"],
          },
          note: { type: "string" },
        },
      },
    },
    redesign_prompt: { type: "string" },
  },
} as const;

// Strip fields Gemini's schema dialect doesn't support (e.g. additionalProperties).
function toGeminiSchema(node: unknown): unknown {
  if (Array.isArray(node)) return node.map(toGeminiSchema);
  if (node && typeof node === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      if (key === "additionalProperties") continue;
      out[key] = toGeminiSchema(value);
    }
    return out;
  }
  return node;
}

function parseDataUrl(dataUrl: string): { mimeType: string; data: string } {
  const match = /^data:([^;]+);base64,(.*)$/s.exec(dataUrl);
  if (!match) throw new Error("Invalid image data URL");
  return { mimeType: match[1], data: match[2] };
}

async function callGemini(
  model: string,
  systemPrompt: string,
  userText: string,
  imageDataUrl: string,
  schema: unknown,
  apiKey: string,
) {
  const { mimeType, data } = parseDataUrl(imageDataUrl);
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [
          {
            role: "user",
            parts: [{ text: userText }, { inlineData: { mimeType, data } }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: toGeminiSchema(schema),
        },
      }),
    },
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 429)
      throw new Error("Rate limit reached. Please try again in a moment.");
    console.error("Gemini API error", res.status, text);
    throw new Error(`AI request failed (${res.status})`);
  }
  return res.json();
}

export const analyzeRoom = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AnalyzeInput.parse(input))
  .handler(async ({ data }): Promise<DesignResult> => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("AI service not configured");

    const systemPrompt = `You are a world-class interior designer AI performing a deep visual analysis of a room photo.
Return a comprehensive design report in the ${data.style} style.

STRICT REQUIREMENTS:
- Classify room as one of: ${ROOM_TYPES.join(", ")}.
- analysis.brightness: judge overall exposure (Dim/Balanced/Bright).
- analysis.clutter: how tidy the space looks (Minimal/Moderate/Cluttered).
- analysis.estimated_size: relative visual scale (Small/Medium/Large).
- analysis.dominant_colors: 3-5 hex colors sampled from the current room.
- design_score: score each dimension 0-100 based on current state (before redesign). Be critical but fair.
- recommendations: 5-8 items. Each MUST have category, current issue, actionable suggestion, and impact level.
- color_palette: 4-6 hex colors curated for the ${data.style} target aesthetic.
- lighting: one sentence describing an ideal lighting scheme.
- furniture: 4-8 pieces already visible OR that should be added. Use "Keep" for pieces to preserve, "Replace" for pieces to swap, "Add" for missing essentials, "Remove" for pieces to discard.
- redesign_prompt: ONE vivid, detailed prompt (60-90 words) that a photorealistic image-generation model can use to render this exact room redesigned in ${data.style} style. Reference the room type, key architectural features (window position, ceiling, flooring), the new color palette, specific furniture pieces, and lighting mood. Photorealistic, professional interior photography, natural composition.
Return ONLY valid JSON conforming to the schema.`;

    const json = (await callGemini(
      "gemini-2.5-flash",
      systemPrompt,
      `Analyze this room and produce the full design report in ${data.style} style.`,
      data.imageDataUrl,
      JSON_SCHEMA,
      apiKey,
    )) as {
      candidates?: { content?: { parts?: { text?: string }[] } }[];
    };
    const content = json.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) throw new Error("Empty AI response");

    let parsed: Omit<DesignResult, "style">;
    try {
      parsed = JSON.parse(content);
    } catch {
      throw new Error("Malformed AI response");
    }
    return { ...parsed, style: data.style };
  });

// ---------- Redesign generation ----------

const RedesignInput = z.object({
  imageDataUrl: z.string().startsWith("data:image/").max(15_000_000),
  prompt: z.string().min(20).max(1200),
  style: z.enum(STYLES),
});

const VARIATION_MODIFIERS = [
  "Emphasize warm golden-hour natural light streaming through the windows, cozy inviting mood, shallow depth of field.",
  "Emphasize cool overcast daylight, crisp editorial magazine composition, wide-angle architectural view.",
  "Emphasize evening ambient lighting with layered warm lamps and accent fixtures, moody cinematic atmosphere.",
];

async function generateSingleImage(
  imageDataUrl: string,
  prompt: string,
  apiKey: string,
): Promise<string> {
  const { mimeType, data } = parseDataUrl(imageDataUrl);
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }, { inlineData: { mimeType, data } }],
          },
        ],
        generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
      }),
    },
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    if (res.status === 429) throw new Error("Rate limit reached");
    console.error("Gemini image API error", res.status, text);
    throw new Error(`Redesign failed (${res.status})`);
  }
  const json = (await res.json()) as {
    candidates?: { content?: { parts?: { inlineData?: { data?: string } }[] } }[];
  };
  const parts = json.candidates?.[0]?.content?.parts ?? [];
  const b64 = parts.find((p) => p.inlineData?.data)?.inlineData?.data;
  if (!b64) throw new Error("No image in response");
  return `data:image/png;base64,${b64}`;
}

export const generateRedesigns = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => RedesignInput.parse(input))
  .handler(async ({ data }): Promise<{ variations: string[] }> => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("AI service not configured");

    const basePrompt = `Photorealistic professional interior design photograph. Redesign the room in the photo in ${data.style} style. ${data.prompt} Preserve the room's architecture, window positions, and overall camera angle. High detail, natural composition, magazine-quality.`;

    const prompts = VARIATION_MODIFIERS.map((mod) => `${basePrompt} ${mod}`);

    // Run all 3 in parallel; if some fail, return whatever succeeded.
    const settled = await Promise.allSettled(
      prompts.map((p) => generateSingleImage(data.imageDataUrl, p, apiKey)),
    );
    const variations = settled
      .filter((s): s is PromiseFulfilledResult<string> => s.status === "fulfilled")
      .map((s) => s.value);

    if (variations.length === 0) {
      const firstError = settled.find(
        (s): s is PromiseRejectedResult => s.status === "rejected",
      );
      throw new Error(
        firstError?.reason instanceof Error
          ? firstError.reason.message
          : "Redesign generation failed",
      );
    }
    return { variations };
  });

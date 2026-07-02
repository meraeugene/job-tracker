import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  role: z.string().min(2),
  company: z.string().min(2),
  jobDescription: z.string().min(30),
  resumeText: z.string().min(20),
});

const resultSchema = z.object({
  fitScore: z.coerce.number(),
  matchedKeywords: z.array(z.string()).default([]),
  missingKeywords: z.array(z.string()).default([]),
  resumeSuggestions: z.array(z.string()).default([]),
  improvedSummary: z.string().default(""),
  improvedBullets: z.array(z.string()).default([]),
  rationale: z.string().default(""),
});

type GeminiCandidate = {
  content?: {
    parts?: Array<{ text?: string }>;
  };
};

type GeminiResponse = {
  candidates?: GeminiCandidate[];
};

function parseJsonObject(text: string) {
  const clean = text
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(clean);
  } catch {
    const start = clean.indexOf("{");
    const end = clean.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(clean.slice(start, end + 1));
    }
    throw new Error("Gemini did not return valid JSON.");
  }
}

export async function POST(request: NextRequest) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Send resume text and job details." },
      { status: 400 },
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "Resume analysis is unavailable because the AI service key is not configured.",
      },
      { status: 503 },
    );
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const prompt = `You are Mira, an expert resume targeting assistant.
Compare the candidate resume against the job description.
Use semantic matching, not simple keyword counting.
Do not invent experience. Only recommend wording that is truthful based on the resume.
Return JSON only with this exact shape:
{
  "fitScore": 0,
  "matchedKeywords": [],
  "missingKeywords": [],
  "resumeSuggestions": [],
  "improvedSummary": "",
  "improvedBullets": [],
  "rationale": ""
}

Rules:
- fitScore must be a strict, honest 0-100 estimate based on job requirements, resume evidence, seniority fit, tools, responsibilities, and missing requirements.
- Do not be generous. Penalize missing must-have requirements, unclear evidence, seniority mismatch, missing tools, and vague resume claims.
- Use 90+ only for an exceptional, direct match with clear evidence for almost every major requirement.
- Use 75-89 for strong matches with some gaps, 55-74 for partial matches, 35-54 for weak matches, and below 35 for poor matches.
- matchedKeywords should be skills/responsibilities clearly supported by the resume.
- missingKeywords should be important job requirements not clearly proven by the resume.
- resumeSuggestions must explain exact changes to make.
- improvedSummary should be ready-to-use resume wording based only on true resume evidence.
- improvedBullets should be ready-to-use resume bullet rewrites tied to this job.

Role: ${parsed.data.role}
Company: ${parsed.data.company}
Job description:
${parsed.data.jobDescription}

Resume:
${parsed.data.resumeText}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
            maxOutputTokens: 4096,
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      console.error("Resume improvements Gemini error", {
        status: response.status,
        error: errorText.slice(0, 500),
      });
      if (response.status === 429) {
        return NextResponse.json(
          {
            error:
              "Resume analysis could not run because the AI quota for this key has been reached. Check the Gemini billing or quota settings, then try again.",
          },
          { status: 429 },
        );
      }
      return NextResponse.json(
        {
          error:
            "Resume analysis is temporarily unavailable. Please try again in a moment.",
        },
        { status: 502 },
      );
    }

    const payload = (await response.json()) as GeminiResponse;
    const text = payload.candidates?.[0]?.content?.parts
      ?.map((part) => part.text ?? "")
      .join("")
      .trim();
    if (!text) {
      return NextResponse.json(
        {
          error:
            "Resume analysis returned no result. Please try again in a moment.",
        },
        { status: 502 },
      );
    }

    const result = resultSchema.parse(parseJsonObject(text));
    return NextResponse.json({
      ...result,
      fitScore: Math.max(0, Math.min(100, Math.round(Number(result.fitScore) || 0))),
    });
  } catch (error) {
    console.error("Resume improvements parse error", error);
    return NextResponse.json(
      {
        error:
          "Resume analysis is temporarily unavailable. Please try again in a moment.",
      },
      { status: 502 },
    );
  }
}

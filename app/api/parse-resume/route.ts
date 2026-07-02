import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { parseResumeText } from "@/utils/resume-parser";

const requestSchema = z.object({
  fileName: z.string().min(1),
  rawText: z.string().min(20),
  lastUpdated: z.string().optional(),
});

type GeminiCandidate = {
  content?: {
    parts?: Array<{ text?: string }>;
  };
};

type GeminiResponse = {
  candidates?: GeminiCandidate[];
};

export async function POST(request: NextRequest) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "Send resume fileName and extracted rawText." }, { status: 400 });
  }

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json({
      ...parseResumeText(parsed.data),
      warning: "GEMINI_API_KEY is not configured; local parsing was used.",
    });
  }

  const fallback = parseResumeText(parsed.data);

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const prompt = `Parse this resume into exact structured JSON.
Use only facts present in the resume. Do not invent content.
Return this shape:
{
  "sections": {
    "summary": "",
    "experience": "",
    "skills": "",
    "education": "",
    "certifications": "",
    "projects": "",
    "highlights": "",
    "targetRoles": "",
    "profileSummary": "",
    "portfolioLinks": ""
  },
  "keywords": []
}

Rules:
- PROFESSIONAL SUMMARY must go only into summary/profileSummary.
- TECHNICAL SKILLS must go only into skills.
- In skills, preserve category headings exactly when present. For technical skills, normalize headings to exactly:
  Frontend:
  Backend & Databases:
  Tools, DevOps & Cloud:
  AI-Assisted Dev & Other:
- Put databases like MySQL, MongoDB, Supabase, and Firebase under Backend & Databases, not AI.
- Put Git, GitHub, Docker, Vercel, Postman, Figma, AWS, EC2, S3, and CI/CD under Tools, DevOps & Cloud.
- Put Claude, GitHub Copilot/Codex, OpenAI API, Anthropic API, Gemini, semantic search, SBERT, FAISS, OCR, Stripe, PayMongo, PayPal, and webhooks under AI-Assisted Dev & Other.
- PROFESSIONAL EXPERIENCE must go only into experience.
- PROJECTS must go only into projects.
- EDUCATION must go only into education.
- AWARDS & CERTIFICATIONS must go only into certifications.
- Contact links/email/phone must go only into portfolioLinks.
- Keep section text concise but complete.
- Be careful with section boundaries and preserve exact tools, employers, titles, dates, schools, certificates, and project names.
- If the resume is ambiguous, keep the original wording rather than guessing.

Resume text:
${parsed.data.rawText}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        }),
      },
    );

    if (!response.ok) {
      return NextResponse.json({
        ...fallback,
        warning: "Gemini resume parsing failed; local parsing was used.",
      });
    }

    const payload = (await response.json()) as GeminiResponse;
    const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return NextResponse.json({
        ...fallback,
        warning: "Gemini returned no resume parse; local parsing was used.",
      });
    }

    const ai = JSON.parse(text) as Partial<typeof fallback>;
    return NextResponse.json({
      ...fallback,
      sections: {
        ...fallback.sections,
        ...(ai.sections ?? {}),
      },
      keywords: Array.isArray(ai.keywords) ? ai.keywords : fallback.keywords,
    });
  } catch {
    return NextResponse.json({
      ...fallback,
      warning: "Could not parse the resume with Gemini; local parsing was used.",
    });
  }
}

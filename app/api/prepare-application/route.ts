import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  role: z.string().min(2),
  company: z.string().min(2),
  platform: z.string().min(2).optional(),
  jobUrl: z.string().url().optional(),
  workMode: z.enum(["Remote", "Hybrid", "On-site"]),
  location: z.string().min(2),
  jobDescription: z.string().min(30),
  resumeText: z.string().min(20).optional(),
});

/* ─── Prompts split into two focused tasks ─── */

const materialsPrompt = `You are Mira, a job application assistant. Return ONLY valid JSON matching the shape below.
Analyze the resume against the job description. The fitScore must be a strict 0-100 estimate based on evidence, seniority, tools, and requirements. Do not inflate.
Generate: fitScore, matchedSkills (string[]), missingSkills (string[]), resumeSuggestions (string[3]), tailoredSummary (string), resumeBullets (string[3]), coverLetter (string), screeningAnswers ({question,answer}[2]).
Keep answers concise and role-specific.`;

const interviewPrompt = `You are Mira, an interview prep assistant. Return ONLY valid JSON: { "stages": [...] }.
Generate 5 interview stages from the job description and resume:
1. HR Screen  2. Hiring Manager  3. Technical/Role  4. Final  5. Offer/Negotiation
Each stage: { title, expectation (1 sentence), questions (string[5]), answers (string[5]), checklist (string[3]) }.
Questions must be realistic interviewer questions, not study prompts. Answers must be complete and tied to the resume/job.`;

type GeminiCandidate = {
  content?: {
    parts?: Array<{ text?: string }>;
  };
};

type GeminiResponse = {
  candidates?: GeminiCandidate[];
};

type RequestData = z.infer<typeof requestSchema>;

function fallbackMaterials(input: RequestData) {
  const words = `${input.jobDescription} ${input.resumeText ?? ""}`
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3);
  const frequent = Array.from(new Set(words)).slice(0, 10);
  const fitScore = input.resumeText ? 72 : 58;

  return {
    role: input.role,
    company: input.company,
    platform: input.platform || "Manual entry",
    location: `${input.workMode} - ${input.location}`,
    fitScore,
    matchedSkills: frequent.slice(0, 5),
    missingSkills: ["Role-specific metrics", "Recent project examples", "Interview stories"],
    resumeSuggestions: [
      `Add bullets that mirror the strongest keywords for ${input.role}.`,
      "Quantify recent achievements with scope, tools, and business impact.",
      "Move the most relevant experience into the top third of the resume.",
    ],
    tailoredSummary: `Candidate summary tailored for ${input.role} at ${input.company}. Emphasize relevant experience, measurable outcomes, and interest in ${input.workMode.toLowerCase()} work.`,
    resumeBullets: [
      `Delivered work aligned with ${input.role} responsibilities using relevant tools and cross-functional collaboration.`,
      "Improved team outcomes by translating requirements into clear execution plans and measurable deliverables.",
      "Communicated progress, blockers, and results clearly with stakeholders in fast-moving environments.",
    ],
    coverLetter: `Dear ${input.company} Hiring Team,\n\nI am excited to apply for the ${input.role} role. The position stands out because it connects directly with my experience delivering practical, user-focused work and collaborating across teams. I would bring a clear execution style, strong ownership, and careful attention to the requirements described in the posting.\n\nThank you for your consideration. I would welcome the chance to discuss how my background can support ${input.company}.`,
    screeningAnswers: [
      {
        question: "Why are you interested in this role?",
        answer: `I am interested in the ${input.role} role because it matches the kind of work I want to do next and gives me room to contribute directly to ${input.company}'s goals.`,
      },
      {
        question: "Are you comfortable with the work setup?",
        answer: `Yes. The ${input.workMode.toLowerCase()} setup in ${input.location} works for me.`,
      },
    ],
  };
}

function fallbackInterview(input: RequestData) {
  const stages = [
    { title: "Initial HR / Recruiter Screen", focus: "motivation and fit" },
    { title: "Hiring Manager Interview", focus: "ownership and judgment" },
    { title: "Technical / Role Interview", focus: "skills and problem-solving" },
    { title: "Final Interview", focus: "culture fit and maturity" },
    { title: "Offer / Negotiation", focus: "compensation and expectations" },
  ];

  return stages.map((s) => ({
    title: s.title,
    expectation: `Evaluate ${s.focus} for the ${input.role} position.`,
    questions: [
      `Tell me about your background for this ${input.role} role.`,
      `Why ${input.company}?`,
      "What are you looking for in your next role?",
      "Tell me about a project most similar to this role.",
      "What questions do you have for us?",
    ],
    answers: [
      `I would summarize my background around the parts most relevant to ${input.role}, focusing on tools, outcomes, and team collaboration.`,
      `I am interested in ${input.company} because the role connects with work I enjoy and I see room to contribute and grow.`,
      "I am looking for a role with meaningful work, clear ownership, and growth through feedback.",
      "I would choose a project with a clear problem, explain my responsibility, and finish with the measurable result.",
      "I would ask about success metrics, team workflow, and what makes someone thrive in this role.",
    ],
    checklist: ["Review job description", "Prepare STAR stories", "Research company"],
  }));
}

/* ─── Gemini call helper ─── */

async function callGemini(systemPrompt: string, userPayload: string, apiKey: string, model: string) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: `${systemPrompt}\n\n${userPayload}` }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          temperature: 0.55,
        },
      }),
    },
  );

  if (!response.ok) return null;

  const payload = (await response.json()) as GeminiResponse;
  const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Fill in the job details and paste the job description.",
        details: parsed.error.flatten(),
      },
      { status: 400 },
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      ...fallbackMaterials(parsed.data),
      interviewPrep: fallbackInterview(parsed.data),
    });
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  const userContext = JSON.stringify({
    role: parsed.data.role,
    company: parsed.data.company,
    platform: parsed.data.platform,
    workMode: parsed.data.workMode,
    location: parsed.data.location,
    jobDescription: parsed.data.jobDescription,
    resumeText: parsed.data.resumeText,
  });

  try {
    // Fire both calls in parallel — roughly halves total wait time
    const [materialsResult, interviewResult] = await Promise.all([
      callGemini(materialsPrompt, userContext, apiKey, model),
      callGemini(interviewPrompt, userContext, apiKey, model),
    ]);

    const baseMaterials = fallbackMaterials(parsed.data);
    const baseInterview = fallbackInterview(parsed.data);

    // Merge AI results over fallbacks
    const materials = materialsResult
      ? { ...baseMaterials, ...materialsResult }
      : baseMaterials;

    const interviewPrep = interviewResult?.stages
      ? interviewResult.stages
      : interviewResult?.interviewRoadmap?.stages
        ? interviewResult.interviewRoadmap.stages
        : Array.isArray(interviewResult)
          ? interviewResult
          : baseInterview;

    return NextResponse.json({
      ...materials,
      interviewPrep,
      interviewRoadmap: { stages: interviewPrep },
    });
  } catch (error) {
    return NextResponse.json({
      ...fallbackMaterials(parsed.data),
      interviewPrep: fallbackInterview(parsed.data),
      warning: error instanceof Error ? error.message : "AI generation failed; fallback materials were created.",
    });
  }
}

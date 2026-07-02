import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  role: z.string().min(2),
  company: z.string().min(2),
  location: z.string().optional(),
  jobDescription: z.string().optional(),
  resumeText: z.string().optional(),
  candidateProfile: z.string().optional(),
  matchedSkills: z.array(z.string()).optional(),
});

type GeminiCandidate = {
  content?: {
    parts?: Array<{ text?: string }>;
  };
};

type GeminiResponse = {
  candidates?: GeminiCandidate[];
};

function candidateName(input: z.infer<typeof requestSchema>) {
  const source = input.candidateProfile || input.resumeText || "";
  const firstLine =
    source
      .split(/\n/)
      .map((line) => line.trim())
      .find((line) => line && !/@|https?:|www\.|\+?\d/.test(line)) || "";
  return firstLine.replace(/\s*\|.*$/, "").trim() || "Candidate";
}

function fallbackLetter(input: z.infer<typeof requestSchema>) {
  const name = candidateName(input);
  return `Dear ${input.company} Hiring Team,\n\nMy name is ${name}, and I am excited to apply for the ${input.role} role. My background aligns with the position through practical execution, clear communication, and a strong focus on delivering useful outcomes.\n\nAcross my work, I have turned requirements into organized deliverables, collaborated with stakeholders, and used feedback to improve the final result. I would bring that same ownership to ${input.company}, along with the ability to learn quickly, communicate clearly, and contribute with care from the first weeks of the role.\n\nThis opportunity stands out because it connects with the kind of work I want to keep doing: solving real problems, supporting a team, and building reliable results. I would welcome the chance to discuss how my experience can support your goals for this position.\n\nSincerely,\n${name}`;
}

export async function POST(request: NextRequest) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json({ error: "Send job and resume details." }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ letter: fallbackLetter(parsed.data), error: "GEMINI_API_KEY is not configured." }, { status: 503 });
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const prompt = `Write a tailored cover letter.
Return JSON only: {"letter":"..."}.
Keep it professional, warm, specific, and between 260 and 360 words.
Use 4 paragraphs plus a signoff.
Make it concrete: connect the candidate's resume evidence to the job needs, then explain why this company/role is a strong fit.
Use the candidate's extracted profile information when available. Include the candidate's name in the introduction and signoff if it is clearly present. Use contact details only if they are clearly present.
Do not invent experience. Use only supplied resume/job details.

Role: ${parsed.data.role}
Company: ${parsed.data.company}
Location: ${parsed.data.location ?? ""}
Matched skills: ${(parsed.data.matchedSkills ?? []).join(", ")}
Candidate profile/contact header: ${parsed.data.candidateProfile ?? ""}
Job description: ${parsed.data.jobDescription ?? ""}
Resume text: ${parsed.data.resumeText ?? ""}`;

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
            temperature: 0.55,
          },
        }),
      },
    );

    if (!response.ok) {
      return NextResponse.json({ letter: fallbackLetter(parsed.data), error: "Gemini cover letter generation failed." }, { status: 502 });
    }

    const payload = (await response.json()) as GeminiResponse;
    const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) return NextResponse.json({ letter: fallbackLetter(parsed.data) });

    const parsedText = JSON.parse(text) as { letter?: string };
    return NextResponse.json({ letter: parsedText.letter || fallbackLetter(parsed.data) });
  } catch {
    return NextResponse.json({ letter: fallbackLetter(parsed.data) });
  }
}

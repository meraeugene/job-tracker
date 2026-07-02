import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  role: z.string().min(2),
  company: z.string().min(2),
  jobDescription: z.string().optional(),
  stageTitle: z.string().min(2),
  currentQuestion: z.string().min(5),
  answer: z.string().min(2),
  history: z
    .array(
      z.object({
        question: z.string(),
        answer: z.string(),
      }),
    )
    .optional(),
});

type GeminiCandidate = {
  content?: {
    parts?: Array<{ text?: string }>;
  };
};

type GeminiResponse = {
  candidates?: GeminiCandidate[];
};

function fallbackFeedback(input: z.infer<typeof requestSchema>) {
  return {
    feedback:
      "Good start. Make the answer stronger by adding one specific example, the action you personally took, and a measurable result.",
    nextQuestion: `What is one project or experience that best proves you can succeed as a ${input.role}?`,
  };
}

export async function POST(request: NextRequest) {
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Send the job, current question, and your spoken answer." },
      { status: 400 },
    );
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      {
        error: "GEMINI_API_KEY is not configured.",
        ...fallbackFeedback(parsed.data),
      },
      { status: 503 },
    );
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
  const prompt = `You are a voice interview coach.
Return JSON only with "feedback" and "nextQuestion".
Keep feedback under 70 words. Ask one realistic follow-up question.

Job: ${parsed.data.role} at ${parsed.data.company}
Stage: ${parsed.data.stageTitle}
Current question: ${parsed.data.currentQuestion}
Candidate answer: ${parsed.data.answer}
Recent history: ${JSON.stringify(parsed.data.history ?? [])}
Job description: ${parsed.data.jobDescription ?? ""}`;

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
            temperature: 0.7,
          },
        }),
      },
    );

    if (!response.ok) {
      return NextResponse.json(
        {
          error: "Gemini interview feedback failed.",
          ...fallbackFeedback(parsed.data),
        },
        { status: 502 },
      );
    }

    const payload = (await response.json()) as GeminiResponse;
    const text = payload.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      return NextResponse.json(fallbackFeedback(parsed.data));
    }

    return NextResponse.json(JSON.parse(text) as { feedback: string; nextQuestion: string });
  } catch {
    return NextResponse.json(fallbackFeedback(parsed.data));
  }
}

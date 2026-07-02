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

const systemPrompt = `You are Mira, a safe job application assistant.
Return structured JSON only. Do not automate login, browser control, CAPTCHA, auto-submit, or scraping behind logged-in platforms.
Prepare application materials from the supplied job description and resume text.
The fitScore must be a strict, honest 0-100 estimate based on resume evidence, job requirements, seniority, tools, responsibilities, and missing requirements. Do not inflate the score. Penalize missing must-have requirements, unclear evidence, seniority mismatch, missing tools, and vague resume claims.
Interview prep must be generated specifically from the job description and resume. Create realistic interviewer questions, not generic study prompts. Follow common industry interview stages: Initial HR / Recruiter Screen, Hiring Manager Interview, Technical / Role Interview, Final Interview, and Offer / Negotiation. Each interview stage must include title, expectation, exactly 8 questions, exactly 8 complete sample answers, and a checklist. Start with a natural "tell me about yourself" style opener connected to the role and company.`;

type GeminiCandidate = {
  content?: {
    parts?: Array<{ text?: string }>;
  };
};

type GeminiResponse = {
  candidates?: GeminiCandidate[];
};

function fallbackMaterials(input: z.infer<typeof requestSchema>) {
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
    interviewPrep: [
      {
        title: "Initial HR / Recruiter Screen",
        expectation: "Confirm motivation, communication style, compensation range, availability, and fit for the work setup.",
        questions: [
          `Walk me through your background for this ${input.role} role.`,
          `Why ${input.company}?`,
          `What are you looking for in your next role?`,
          `How do you work best in a ${input.workMode.toLowerCase()} setup?`,
          "What salary or growth expectations should we know about?",
          "When are you available to start?",
          "What part of this job description feels most familiar to you?",
          "What questions do you have for us?",
        ],
        answers: [
          `I would summarize my background around the parts most relevant to ${input.role}: the work I have done, the tools I use confidently, and the outcomes I can help deliver. I would then connect that experience to what ${input.company} is asking for in this role.`,
          `I am interested in ${input.company} because the role connects with work I already enjoy: solving practical problems, collaborating clearly, and improving the final user or team outcome. I also see room to contribute while continuing to grow.`,
          "I am looking for a role where I can contribute consistently, take ownership of meaningful work, and keep improving through feedback. I want the day-to-day responsibilities to match the skills I am actively building.",
          `In a ${input.workMode.toLowerCase()} setup, I work best with clear priorities, written updates, and predictable communication. I like to make progress visible early so the team can adjust quickly if something changes.`,
          "I would answer with a researched range, explain that I am open to the full package, and ask about the role expectations, growth path, and compensation band before locking into a number.",
          "I would give a clear start window and mention any notice period or scheduling constraints honestly. If flexible, I would say I can align with the team's preferred timeline.",
          "I would point to the responsibilities that match my strongest examples, then mention one area I am excited to learn quickly. That shows both fit and curiosity.",
          "I would ask about success in the first 90 days, team workflow, current priorities, and what separates a good hire from a great hire in this role.",
        ],
        checklist: ["Prepare salary range", "Confirm availability", "Review job description", "Prepare two questions"],
      },
      {
        title: "Hiring Manager Interview",
        expectation: "Show judgment, ownership, role-specific skill, and examples that prove you can do the work.",
        questions: [
          "Tell me about a project most similar to this role.",
          "How do you prioritize when several tasks are urgent?",
          "Describe a time you handled ambiguity.",
          "What would you want to learn in your first 30 days?",
          "Tell me about feedback you received and how you used it.",
          "How do you communicate blockers?",
          "What quality bar do you hold yourself to?",
          "Why should we choose you for this role?",
        ],
        answers: [
          "I would choose a project with a clear problem, explain my responsibility, describe the tools and decisions I used, and finish with the result. I would keep the example close to the job description.",
          "I prioritize by impact, deadline, risk, and dependencies. I communicate tradeoffs early, confirm what matters most with the team, and make sure urgent work does not hide important follow-up.",
          "I handled ambiguity by writing down what was known, asking clarifying questions, identifying the riskiest assumption, and delivering a small first version so the team could react quickly.",
          "In the first 30 days, I would learn the product, team workflow, success metrics, code/process standards, and the most painful current problems so my early work supports the team instead of adding noise.",
          "I would describe the feedback, explain what I changed, and show the improved result. I would make it clear that feedback is useful to me because it shortens the path to better work.",
          "I communicate blockers early with context: what I tried, what is blocked, what decision or help I need, and what I can keep doing while waiting.",
          "My quality bar is work that is clear, maintainable, tested or checked appropriately, and easy for the next person to understand. I also care about the user's actual experience, not just finishing a task.",
          `You should choose me because I can connect practical execution with clear communication. For ${input.role}, I would bring ownership, learning speed, and careful attention to the responsibilities ${input.company} needs covered.`,
        ],
        checklist: ["Prepare 3 STAR stories", "Study company context", "Review required tools", "Prepare role questions"],
      },
      {
        title: "Technical / Role Interview",
        expectation: "Demonstrate role-specific skills, practical judgment, tool familiarity, and how you solve problems in the actual work.",
        questions: [
          `Which skills matter most for succeeding as a ${input.role}?`,
          "Walk me through how you would approach one responsibility from the job post.",
          "How do you check the quality of your work before handing it off?",
          "Tell me about a time you had to learn a tool or process quickly.",
          "How do you break down a large task?",
          "How do you handle unclear requirements?",
          "What technical or role-specific mistake taught you the most?",
          "How would you explain a complex decision to a non-technical teammate?",
        ],
        answers: [
          `I would name the skills from the job description, connect them to my experience, and explain how I would apply them in ${input.company}'s workflow.`,
          "I would clarify the goal, define constraints, identify dependencies, break the work into smaller steps, and confirm the result against the expected outcome.",
          "I review requirements, test the main path, check edge cases, document decisions, and ask for feedback when the work affects other people or systems.",
          "I learn quickly by identifying the minimum needed context, using documentation or examples, asking targeted questions, and applying the tool on a small real task.",
          "I split large work by outcome, dependency, and risk. I start with the piece that proves the approach, then build toward the complete result.",
          "I write down what is known, list assumptions, ask clarifying questions, and propose a small next step so the team can react before too much time is spent.",
          "I would choose a real mistake, explain what happened without blaming others, and focus on the process change I made afterward.",
          "I would remove jargon, explain the tradeoff, show the impact, and give a recommendation with the reason behind it.",
        ],
        checklist: ["Review role tools", "Prepare project walkthroughs", "Practice tradeoff explanations", "Prepare examples with metrics"],
      },
      {
        title: "Final Interview",
        expectation: "Confirm culture fit, maturity, long-term motivation, and confidence with senior decision makers.",
        questions: [
          `Why is ${input.company} the right next move for you?`,
          "What kind of team helps you do your best work?",
          "How do you respond when priorities change suddenly?",
          "What would your previous teammates say you are good at?",
          "What is one area you are actively improving?",
          "How do you build trust with a new team?",
          "What would make you successful in the first 90 days?",
          "Do you have any concerns about this role?",
        ],
        answers: [
          `I would connect ${input.company}'s role needs with my experience and explain why the work, team, and growth path fit my goals.`,
          "I do best with clear expectations, honest feedback, and teammates who communicate early. I also try to create that same clarity for others.",
          "I confirm what changed, ask what outcome matters most now, adjust the plan, and communicate the impact on timeline or scope.",
          "I would mention strengths that are useful in this role, such as ownership, communication, follow-through, and learning quickly.",
          "I would name a real improvement area, describe what I am doing about it, and show that it does not block me from succeeding in the role.",
          "I build trust by listening first, documenting what I learn, delivering small promises reliably, and communicating before problems become surprises.",
          "Success would mean I understand the workflow, contribute to priority work, build useful relationships, and show that I can own tasks with good judgment.",
          "I would answer honestly and professionally, framing concerns as clarifying questions about expectations, priorities, or team process.",
        ],
        checklist: ["Review company context", "Prepare career story", "Prepare senior-level questions", "Clarify values and goals"],
      },
      {
        title: "Offer / Negotiation",
        expectation: "Discuss compensation, start date, expectations, and final decision points with clarity and professionalism.",
        questions: [
          "What compensation range are you looking for?",
          "How soon can you start?",
          "Are there any benefits or conditions important to you?",
          "How are you evaluating this offer?",
          "Would you accept if we meet your target range?",
          "Do you have other processes ongoing?",
          "What would help you make a confident decision?",
          "Do you have any final questions before we move forward?",
        ],
        answers: [
          "I would give a researched range, mention flexibility around the full package, and ask whether it aligns with the role's approved band.",
          "I would give a clear start date or notice period and show willingness to coordinate a smooth onboarding timeline.",
          "I would mention practical needs like schedule, equipment, benefits, growth path, or remote/hybrid expectations without overloading the conversation.",
          "I would say I am considering role fit, team expectations, growth, compensation, and whether I can do meaningful work successfully.",
          "I would be honest: if the package and expectations align, I would say I am ready to move forward; if not, I would explain what remains unresolved.",
          "I would be transparent without using other processes as pressure. I would focus on timeline and decision clarity.",
          "I would ask for written details, expectations for the first months, reporting structure, and anything that affects the decision.",
          "I would ask final questions about onboarding, success measures, and next steps, then thank them for the time and clarity.",
        ],
        checklist: ["Research salary range", "Define walkaway needs", "Review offer details", "Prepare final questions"],
      },
    ],
  };
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

  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(fallbackMaterials(parsed.data));
  }

  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${systemPrompt}\n\n${JSON.stringify({
            role: parsed.data.role,
            company: parsed.data.company,
            platform: parsed.data.platform,
            workMode: parsed.data.workMode,
            location: parsed.data.location,
            jobDescription: parsed.data.jobDescription,
            resumeText: parsed.data.resumeText,
            requiredShape: {
              jobDetails: ["role", "company", "platform", "location"],
              resumeMatch: ["fitScore", "matchedSkills", "missingSkills", "resumeSuggestions"],
              applicationMaterials: ["tailoredSummary", "resumeBullets", "coverLetter", "screeningAnswers"],
              interviewRoadmap: {
                stages: [
                  {
                    title: "Initial HR / Recruiter Screen",
                    expectation: "what the interviewer evaluates",
                    questions: ["8 Gemini-generated questions based on this job"],
                    answers: ["8 complete sample answers tied to resume/job details"],
                    checklist: ["specific preparation items"],
                  },
                  {
                    title: "Hiring Manager Interview",
                    expectation: "what the interviewer evaluates",
                    questions: ["8 Gemini-generated questions based on this job"],
                    answers: ["8 complete sample answers tied to resume/job details"],
                    checklist: ["specific preparation items"],
                  },
                  {
                    title: "Technical / Role Interview",
                    expectation: "what the interviewer evaluates",
                    questions: ["8 Gemini-generated questions based on this job"],
                    answers: ["8 complete sample answers tied to resume/job details"],
                    checklist: ["specific preparation items"],
                  },
                  {
                    title: "Final Interview",
                    expectation: "what the interviewer evaluates",
                    questions: ["8 Gemini-generated questions based on this job"],
                    answers: ["8 complete sample answers tied to resume/job details"],
                    checklist: ["specific preparation items"],
                  },
                  {
                    title: "Offer / Negotiation",
                    expectation: "what the interviewer evaluates",
                    questions: ["8 Gemini-generated questions based on this job"],
                    answers: ["8 complete sample answers tied to resume/job details"],
                    checklist: ["specific preparation items"],
                  },
                ],
              },
            },
          })}`,
                },
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.55,
          },
        }),
      },
    );

    if (!response.ok) {
      return NextResponse.json({
        ...fallbackMaterials(parsed.data),
        warning: "Gemini generation failed; fallback materials were created.",
      });
    }

    const payload = (await response.json()) as GeminiResponse;
    const content = payload.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
      return NextResponse.json({ error: "No application materials were returned." }, { status: 502 });
    }

    return NextResponse.json({
      ...fallbackMaterials(parsed.data),
      ...JSON.parse(content),
    });
  } catch (error) {
    return NextResponse.json({
      ...fallbackMaterials(parsed.data),
      warning: error instanceof Error ? error.message : "AI generation failed; fallback materials were created.",
    });
  }
}

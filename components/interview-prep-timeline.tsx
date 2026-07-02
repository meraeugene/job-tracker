"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { VoiceInterviewPanel } from "@/components/voice-interview-panel";
import type { ApplicationJob, InterviewStage } from "@/types/application";

const extraQuestions = [
  {
    question: "Tell me about yourself and why this role makes sense for you.",
    answer:
      "I would give a focused summary of my background, highlight the work most relevant to this role, and explain why this opportunity is a logical next step. I would keep it under two minutes and connect my strongest examples to the company's needs.",
  },
  {
    question: "What is one project you are proud of and what was your impact?",
    answer:
      "I would choose a project with a clear problem, explain my responsibility, describe the decisions I made, and end with the measurable result or user/team improvement. I would avoid vague claims and make the impact specific.",
  },
  {
    question: "How do you handle feedback or corrections?",
    answer:
      "I treat feedback as a way to shorten the path to better work. I listen for the real issue, ask clarifying questions when needed, apply the change, and follow up by showing what improved.",
  },
  {
    question: "How do you manage multiple priorities?",
    answer:
      "I compare urgency, impact, dependencies, and risk. Then I communicate tradeoffs early, confirm the most important outcome, and keep stakeholders updated so no one is surprised.",
  },
  {
    question: "What would you do in your first 30 days?",
    answer:
      "I would learn the product, team workflow, expectations, and current priorities. I would ask good questions, look for small useful contributions, and build trust before proposing bigger changes.",
  },
  {
    question: "Why should we choose you over another candidate?",
    answer:
      "I would connect my experience directly to the role, show that I understand the company's needs, and emphasize ownership, communication, and learning speed. I would support the answer with one concrete example.",
  },
  {
    question: "Describe a time you solved a difficult problem.",
    answer:
      "I would use a STAR answer: describe the situation, define the task, explain the actions I took, and finish with the result. I would include what I learned and how I would apply it in this role.",
  },
  {
    question: "What questions do you have for the interviewer?",
    answer:
      "I would ask about success in the first 90 days, team workflow, current priorities, and what separates a good hire from a great hire. That shows I am thinking about contribution, not just getting hired.",
  },
];

function normalizeStageTitle(title: string) {
  if (/recruiter|screen/i.test(title)) return "Initial HR / Recruiter Screen";
  if (/hiring manager|manager/i.test(title)) return "Hiring Manager Interview";
  if (/technical|role|deep dive|assessment/i.test(title))
    return "Technical / Role Interview";
  if (/final|executive|leadership/i.test(title)) return "Final Interview";
  if (/offer|negotiation/i.test(title)) return "Offer / Negotiation";
  return title;
}

function withMoreCards(stage: InterviewStage): InterviewStage {
  const questions = [...stage.questions];
  const answers = [...stage.answers];

  for (const item of extraQuestions) {
    if (questions.length >= 8) break;
    if (
      questions.some(
        (question) => question.toLowerCase() === item.question.toLowerCase(),
      )
    ) {
      continue;
    }
    questions.push(item.question);
    answers.push(item.answer);
  }

  return {
    ...stage,
    title: normalizeStageTitle(stage.title),
    questions,
    answers,
  };
}

function industryStages(job: ApplicationJob) {
  const stages = job.interviewPrep.map(withMoreCards);
  const titles = new Set(stages.map((stage) => stage.title));

  if (!titles.has("Technical / Role Interview")) {
    stages.push(
      withMoreCards({
        title: "Technical / Role Interview",
        expectation:
          "Prove you can do the actual work through role-specific discussion, practical judgment, tools, and problem solving.",
        questions: [
          `What skills would matter most for succeeding as a ${job.role}?`,
          "Walk me through how you would approach a task from the job description.",
        ],
        answers: [
          `I would name the skills from the job description, connect them to my experience, and explain how I would apply them in ${job.company}'s workflow.`,
          "I would clarify the goal, identify requirements and risks, break the work into steps, communicate progress, and validate the result before calling it done.",
        ],
        checklist: [
          "Review job tools",
          "Prepare project examples",
          "Practice role-specific explanations",
        ],
      }),
    );
  }

  if (!titles.has("Final Interview")) {
    stages.push(
      withMoreCards({
        title: "Final Interview",
        expectation:
          "Confirm team fit, maturity, motivation, and whether you can represent yourself clearly with senior decision makers.",
        questions: [
          `Why is ${job.company} the right next move for you?`,
          "What kind of team helps you do your best work?",
        ],
        answers: [
          `I would connect ${job.company}'s role needs with my experience and explain why the work, team, and growth path fit my goals.`,
          "I do best with clear expectations, honest feedback, and teammates who communicate early. I also try to create that same clarity for others.",
        ],
        checklist: [
          "Prepare career story",
          "Review company context",
          "Prepare thoughtful questions",
        ],
      }),
    );
  }

  if (!titles.has("Offer / Negotiation")) {
    stages.push(
      withMoreCards({
        title: "Offer / Negotiation",
        expectation:
          "Prepare for compensation, start date, benefits, decision timeline, and final offer questions.",
        questions: [
          "What compensation range are you looking for?",
          "How soon can you start?",
        ],
        answers: [
          "I would give a researched range, explain that I am open to the full package, and ask whether that aligns with the approved band for the role.",
          "I would give a clear start date or notice period and show willingness to coordinate a smooth onboarding timeline.",
        ],
        checklist: [
          "Research salary range",
          "Define priorities",
          "Review offer details",
        ],
      }),
    );
  }

  return stages;
}

export function InterviewPrepTimeline({
  job,
  onBack,
}: {
  job: ApplicationJob;
  onBack?: () => void;
}) {
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [cardIndex, setCardIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const stages = industryStages(job);
  const stage = stages[phaseIndex];

  function selectPhase(index: number) {
    setPhaseIndex(index);
    setCardIndex(0);
    setDirection(index > phaseIndex ? 1 : -1);
    setRevealed({});
  }

  function selectCard(index: number) {
    setDirection(index > cardIndex ? 1 : -1);
    setCardIndex(index);
  }

  if (!stage) return null;

  return (
    <Card>
      <CardHeader className="border-b border-border">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            {onBack && (
              <Button
                variant="secondary"
                size="sm"
                className="mb-4"
                onClick={onBack}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            )}
            <CardDescription>
              {job.role} at {job.company}
            </CardDescription>
            <CardTitle className="mt-2 text-2xl">{stage.title}</CardTitle>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground">
              {stage.expectation}
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:items-end">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted px-2.5 py-1 text-xs">
              <span className="font-medium uppercase tracking-wide text-primary">
                Phase
              </span>
              <span className="font-semibold text-foreground">
                {phaseIndex + 1}
              </span>
              <span className="text-muted-foreground">/</span>
              <span className="text-muted-foreground">{stages.length}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={phaseIndex === 0}
                onClick={() => selectPhase(Math.max(0, phaseIndex - 1))}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>

              <Button
                size="sm"
                disabled={phaseIndex === stages.length - 1}
                onClick={() =>
                  selectPhase(Math.min(stages.length - 1, phaseIndex + 1))
                }
              >
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          {stages.map((item, index) => (
            <button
              key={item.title}
              className={`h-2 flex-1 rounded-full transition ${
                index <= phaseIndex ? "bg-primary" : "bg-muted"
              }`}
              aria-label={`Go to ${item.title}`}
              onClick={() => selectPhase(index)}
            />
          ))}
        </div>
      </CardHeader>
      <CardContent className="pt-6 pb-5">
        <section className="w-full p-1">
          <div className="mb-5 text-center">
            <h4 className="text-base font-semibold">Practice flashcards</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              Try answering out loud first, then flip the card to check a full
              answer.
            </p>
          </div>
          <div className="mx-auto max-w-5xl">
            {(() => {
              const key = `${phaseIndex}-${cardIndex}`;
              const isRevealed = Boolean(revealed[key]);
              const question = stage.questions[cardIndex] ?? "";
              const answer =
                stage.answers[cardIndex] ??
                "A strong answer should use a specific example, explain your action clearly, and connect the result back to the role.";

              return (
                <>
                  <div className="mb-4 flex items-center justify-center gap-2 text-xs font-medium text-muted-foreground">
                    <span className="rounded-full border border-blue-100 bg-primary/5 px-3 py-1 text-primary">
                      Card {cardIndex + 1} / {stage.questions.length}
                    </span>
                  </div>
                  <div className="relative px-14">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="absolute left-0 top-1/2 z-10 h-11 w-11 -translate-y-1/2 rounded-full p-0"
                      disabled={cardIndex === 0}
                      aria-label="Previous card"
                      onClick={() => selectCard(Math.max(0, cardIndex - 1))}
                    >
                      <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <Button
                      size="sm"
                      className="absolute right-0 top-1/2 z-10 h-11 w-11 -translate-y-1/2 rounded-full p-0"
                      disabled={cardIndex === stage.questions.length - 1}
                      aria-label="Next card"
                      onClick={() =>
                        selectCard(
                          Math.min(stage.questions.length - 1, cardIndex + 1),
                        )
                      }
                    >
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                    <div className="[perspective:1400px]">
                      <motion.button
                        key={`${phaseIndex}-${cardIndex}`}
                        type="button"
                        className="relative min-h-[380px] w-full rounded-2xl border border-blue-100 bg-white p-10 text-center shadow-[0_24px_64px_rgba(37,99,235,0.10)] outline-none transition hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-primary/25"
                        initial={{
                          opacity: 0,
                          x: direction * 42,
                          scale: 0.985,
                          rotateY: 0,
                        }}
                        animate={{
                          opacity: 1,
                          x: 0,
                          scale: 1,
                          rotateY: isRevealed ? 180 : 0,
                        }}
                        exit={{
                          opacity: 0,
                          x: direction * -42,
                          scale: 0.985,
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 180,
                          damping: 24,
                        }}
                        style={{
                          transformStyle: "preserve-3d",
                        }}
                        onClick={() =>
                          setRevealed((current) => ({
                            ...current,
                            [key]: !isRevealed,
                          }))
                        }
                      >
                        <div
                          className="absolute inset-0 grid place-items-center p-10 [backface-visibility:hidden]"
                          style={{ transform: "rotateY(0deg)" }}
                        >
                          <div>
                            <p className="mb-6 text-xs font-semibold uppercase text-primary">
                              Question
                            </p>
                            <p className="mx-auto max-w-3xl text-3xl font-semibold leading-tight text-foreground">
                              {question}
                            </p>
                          </div>
                        </div>
                        <div
                          className="absolute inset-0 grid place-items-center p-10 [backface-visibility:hidden]"
                          style={{ transform: "rotateY(180deg)" }}
                        >
                          <div>
                            <p className="mb-6 text-xs font-semibold uppercase text-primary">
                              Answer
                            </p>
                            <p className="mx-auto max-w-3xl text-lg font-medium leading-8 text-foreground sm:text-xl">
                              {answer}
                            </p>
                          </div>
                        </div>
                      </motion.button>
                    </div>
                  </div>
                </>
              );
            })()}
          </div>
          <VoiceInterviewPanel
            key={`${job.id}-${stage.title}`}
            job={job}
            stage={stage}
          />
        </section>
      </CardContent>
    </Card>
  );
}

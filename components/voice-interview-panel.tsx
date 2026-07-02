"use client";

import { Loader2, Mic, PhoneCall, ShieldCheck, X } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ApplicationJob, InterviewStage } from "@/types/application";

type SpeechRecognitionConstructor = new () => SpeechRecognition;

type SpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
};

type SpeechRecognitionResult = ArrayLike<{ transcript: string }> & {
  isFinal?: boolean;
};

type SpeechRecognitionEvent = {
  resultIndex?: number;
  results: ArrayLike<SpeechRecognitionResult>;
};

type Turn = {
  question: string;
  answer: string;
  feedback?: string;
};

const interviewerName = "Mira";
const introMessage = `Hello, I am ${interviewerName}, your AI interviewer. I will guide this interview, ask one question at a time, and let you know when we reach the final question.`;
const miraVoiceKey = "job-tracker:mira-voice-id";
const defaultMiraVoiceId = "XrExE9yKIg1WjnnlVkGX";
const allowedMiraVoiceIds = new Set([
  "EXAVITQu4vr4xnSDxMaL",
  "XrExE9yKIg1WjnnlVkGX",
  "pFZP5JQG7iQjIQuC4Bku",
]);

function isMeaningfulAnswer(value: string) {
  const clean = value.trim();
  const words = clean
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9]/gi, ""))
    .filter((word) => word.length > 1);

  return clean.length >= 8 && words.length >= 2;
}

function FeedbackCard({ turn, index }: { turn: Turn; index: number }) {
  return (
    <motion.article
      className="rounded-lg border border-border bg-card p-4 shadow-[0_12px_32px_rgba(15,23,42,0.045)]"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: index * 0.04 }}
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Question {index + 1}
          </p>
          <h5 className="mt-1 text-base font-semibold">Interview note</h5>
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Question
          </p>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-foreground">
            {turn.question}
          </p>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-muted-foreground">
            Your answer
          </p>
          <p className="mt-1 text-sm leading-6 text-muted-foreground">
            {turn.answer}
          </p>
        </div>
        <div className="rounded-lg bg-muted/50 p-3">
          <p className="text-xs font-medium uppercase text-primary">Feedback</p>
          <p className="mt-1 text-sm leading-6 text-foreground">
            {turn.feedback}
          </p>
        </div>
      </div>
    </motion.article>
  );
}

function getSpeechRecognition() {
  if (typeof window === "undefined") return null;
  const browserWindow = window as typeof window & {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };

  return (
    browserWindow.SpeechRecognition ??
    browserWindow.webkitSpeechRecognition ??
    null
  );
}

export function VoiceInterviewPanel({
  job,
  stage,
}: {
  job: ApplicationJob;
  stage: InterviewStage;
}) {
  const firstQuestion = `To start, tell me about yourself and how your background connects to the ${job.role} role at ${job.company}.`;
  const [question, setQuestion] = useState(firstQuestion);
  const [answer, setAnswer] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [listening, setListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [autoSending, setAutoSending] = useState(false);
  const [confirmingAnswer, setConfirmingAnswer] = useState(false);
  const [submitCountdown, setSubmitCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [focusWarnings, setFocusWarnings] = useState(0);
  const [lastWarning, setLastWarning] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimerRef = useRef<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const confirmationTimerRef = useRef<number | null>(null);
  const countdownTimerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const listeningWantedRef = useRef(false);
  const loadingRef = useRef(false);
  const submittingRef = useRef(false);
  const lastSubmittedRef = useRef("");
  const restartAttemptsRef = useRef(0);
  const maxTurns = Math.min(5, Math.max(3, stage.questions.length || 4));
  const supported = useMemo(() => Boolean(getSpeechRecognition()), []);

  useEffect(() => {
    loadingRef.current = loading || autoSending;
  }, [autoSending, loading]);

  useEffect(() => {
    if (!started) return;

    function warnFocusLoss(message: string) {
      setFocusWarnings((count) => count + 1);
      setLastWarning(message);
    }

    function handleVisibilityChange() {
      if (document.hidden) {
        warnFocusLoss(
          "Tab switch detected. Please stay on the interview screen.",
        );
      }
    }

    function handleBlur() {
      warnFocusLoss(
        "Window focus changed. Keep the interview active while practicing.",
      );
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleBlur);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleBlur);
    };
  }, [started]);

  useEffect(() => {
    return () => {
      stopCamera();
      listeningWantedRef.current = false;
      clearSilenceTimer();
      clearConfirmationTimer();
      clearCountdownTimer();
      stopMiraAudio();
    };
  }, []);

  function clearSilenceTimer() {
    if (silenceTimerRef.current) {
      window.clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }

  function clearConfirmationTimer() {
    if (confirmationTimerRef.current) {
      window.clearTimeout(confirmationTimerRef.current);
      confirmationTimerRef.current = null;
    }
  }

  function clearCountdownTimer() {
    if (countdownTimerRef.current) {
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }

  function stopMiraAudio() {
    audioRef.current?.pause();
    audioRef.current = null;
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }

  function speak(text = question, onEnd?: () => void) {
    stopMiraAudio();
    const storedVoiceId = window.localStorage.getItem(miraVoiceKey);
    const voiceId =
      storedVoiceId && allowedMiraVoiceIds.has(storedVoiceId)
        ? storedVoiceId
        : defaultMiraVoiceId;

    void fetch("/api/speak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, voiceId }),
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Voice API failed.");
        return response.blob();
      })
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audioRef.current = audio;
        audioUrlRef.current = url;
        audio.onended = () => {
          stopMiraAudio();
          onEnd?.();
        };
        audio.onerror = () => {
          stopMiraAudio();
          setError(
            "Mira voice failed. Check your ElevenLabs API key and quota.",
          );
        };
        return audio.play();
      })
      .catch(() => {
        setError("Mira voice failed. Check your ElevenLabs API key and quota.");
      });
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera is not available in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraError(null);
    } catch {
      setCameraError("Camera permission was blocked or unavailable.");
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }

  function startListening() {
    const Recognition = getSpeechRecognition();
    if (!Recognition) {
      setError("Speech recognition is not available in this browser.");
      return;
    }

    listeningWantedRef.current = true;
    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      restartAttemptsRef.current = 0;
      const allTranscript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      const finalTranscript = Array.from(event.results)
        .slice(event.resultIndex ?? 0)
        .filter((result) => result.isFinal)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      const nextAnswer = allTranscript || finalTranscript;
      setAnswer(nextAnswer);
      if (isMeaningfulAnswer(finalTranscript)) {
        confirmAnswer(finalTranscript);
      }
    };
    recognition.onend = () => {
      setListening(false);
      if (listeningWantedRef.current && !loadingRef.current) {
        restartAttemptsRef.current += 1;
        if (restartAttemptsRef.current > 6) {
          listeningWantedRef.current = false;
          setError(
            "Mira paused listening. Speak again by restarting the interview.",
          );
          return;
        }
        window.setTimeout(() => {
          if (listeningWantedRef.current && !loadingRef.current) {
            startListening();
          }
        }, 350);
      }
    };
    recognition.onerror = (event) => {
      setListening(false);
      if (listeningWantedRef.current && !loadingRef.current) {
        restartAttemptsRef.current += 1;
        if (restartAttemptsRef.current > 6) {
          listeningWantedRef.current = false;
          setError(
            "Mira paused listening. Speak again by restarting the interview.",
          );
          return;
        }
        window.setTimeout(
          () => {
            if (listeningWantedRef.current && !loadingRef.current) {
              startListening();
            }
          },
          event.error === "no-speech" ? 250 : 650,
        );
        return;
      }
      setError(
        "Could not capture your voice. You can type your answer instead.",
      );
    };
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    setError(null);
  }

  function stopListening() {
    clearSilenceTimer();
    listeningWantedRef.current = false;
    recognitionRef.current?.stop();
    setListening(false);
  }

  function confirmAnswer(finalTranscript: string) {
    if (submittingRef.current || confirmationTimerRef.current) return;

    clearSilenceTimer();
    clearConfirmationTimer();
    clearCountdownTimer();
    stopListening();
    setAnswer(finalTranscript);
    setConfirmingAnswer(true);
    setSubmitCountdown(5);
    setError(null);

    confirmationTimerRef.current = window.setTimeout(() => {
      confirmationTimerRef.current = null;
      clearCountdownTimer();
      setSubmitCountdown(0);
      setConfirmingAnswer(false);
      setAutoSending(true);
      void submitAnswer(finalTranscript).finally(() => setAutoSending(false));
    }, 5000);
    countdownTimerRef.current = window.setInterval(() => {
      setSubmitCountdown((seconds) => Math.max(seconds - 1, 0));
    }, 1000);
  }

  function startInterview() {
    setStarted(true);
    setError(null);
    setAnswer("");
    setConfirmingAnswer(false);
    setSubmitCountdown(0);
    setFocusWarnings(0);
    setLastWarning(null);
    lastSubmittedRef.current = "";
    restartAttemptsRef.current = 0;
    void startCamera();
    setQuestion(introMessage);
    speak(introMessage, () => {
      setQuestion(firstQuestion);
      speak(firstQuestion, () => {
        if (getSpeechRecognition()) startListening();
      });
    });
  }

  function endInterview() {
    stopListening();
    clearConfirmationTimer();
    clearCountdownTimer();
    stopCamera();
    stopMiraAudio();
    setStarted(false);
    setAnswer("");
    setConfirmingAnswer(false);
    setSubmitCountdown(0);
    setError(null);
    setQuestion(firstQuestion);
  }

  async function submitAnswer(answerOverride?: string) {
    const submittedAnswer = (answerOverride ?? answer).trim();

    if (loading || submittingRef.current) return;

    if (!isMeaningfulAnswer(submittedAnswer)) {
      setError("Say a short answer first before I move to the next question.");
      return;
    }

    const submissionKey = submittedAnswer.toLowerCase();
    if (submissionKey === lastSubmittedRef.current) return;
    lastSubmittedRef.current = submissionKey;
    submittingRef.current = true;

    clearSilenceTimer();
    clearConfirmationTimer();
    clearCountdownTimer();
    stopListening();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/interview-voice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: job.role,
          company: job.company,
          jobDescription: job.jobDescription,
          stageTitle: stage.title,
          currentQuestion: question,
          answer: submittedAnswer,
          history: turns.slice(-4).map((turn) => ({
            question: turn.question,
            answer: turn.answer,
          })),
        }),
      });
      const payload = (await response.json()) as {
        error?: string;
        feedback?: string;
        nextQuestion?: string;
      };

      if (payload.error && !payload.feedback) {
        throw new Error(payload.error);
      }

      const feedback =
        payload.feedback ||
        "Good answer. Add a specific example and measurable result.";
      const completedTurns = turns.length + 1;
      const nextQuestion =
        payload.nextQuestion || "Can you give me a more specific example?";
      setTurns((current) => [
        ...current,
        { question, answer: submittedAnswer, feedback },
      ]);

      if (completedTurns >= maxTurns) {
        const closing =
          "That completes the interview. I saved your feedback below.";
        setQuestion(closing);
        speak(closing, () => {
          stopCamera();
          setStarted(false);
          setQuestion(firstQuestion);
          setAnswer("");
        });
        return;
      }

      const nextSpokenQuestion =
        completedTurns === maxTurns - 1
          ? `Final question. ${nextQuestion}`
          : nextQuestion;
      setQuestion(nextSpokenQuestion);
      setAnswer("");
      speak(nextSpokenQuestion, () => {
        if (getSpeechRecognition()) startListening();
      });

      if (!response.ok && payload.error) {
        setError(`${payload.error} Add your AI key to enable live coaching.`);
      }
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Interview feedback failed.",
      );
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }
  }

  return (
    <section className="mt-6 rounded-lg border border-border bg-card p-5 shadow-[0_10px_30px_rgba(31,24,14,0.05)]">
      {!started ? (
        <div className="flex min-h-56 flex-col items-center justify-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <PhoneCall className="h-7 w-7" />
          </div>
          <h4 className="text-lg font-semibold">Live AI Interview</h4>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Start a live interview with {interviewerName}. Answer questions and
            receive real-time feedback.
          </p>
          <Button className="mt-5" type="button" onClick={startInterview}>
            Start AI interview
          </Button>
          {!supported && (
            <p className="mt-3 text-sm text-muted-foreground">
              Voice capture is unavailable in this browser, but typed answers
              will still work after starting.
            </p>
          )}
        </div>
      ) : null}
      {started && (
        <div className="fixed inset-0 z-50 h-screen overflow-hidden bg-background">
          <div className="relative flex h-screen w-screen flex-col overflow-hidden">
            <div className="relative px-5 pb-5 pt-7 text-center">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                {loading || autoSending
                  ? `${interviewerName} is thinking`
                  : confirmingAnswer
                    ? "Answer captured"
                    : listening
                      ? "Listening live"
                      : "Live interview"}
              </div>
              <h4 className="mx-auto max-w-2xl text-xl font-semibold">
                {job.role} interview
              </h4>
              <p className="mx-auto mt-2 max-w-xl text-sm text-muted-foreground">
                {job.company} - {stage.title}
              </p>
              <Button
                variant="secondary"
                size="sm"
                type="button"
                className="absolute right-5 top-7"
                onClick={endInterview}
              >
                <X className="h-4 w-4" />
                End
              </Button>
            </div>

            {lastWarning && (
              <div className="absolute left-5 top-5 z-20 w-[min(calc(100%-2.5rem),360px)] rounded-xl border border-border bg-card/95 p-4 text-foreground shadow-[0_18px_44px_rgba(15,23,42,0.12)] ring-1 ring-black/5 backdrop-blur dark:ring-white/10">
                <div className="flex items-start gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
                    <ShieldCheck className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">
                      Focus notice {focusWarnings}
                    </p>
                    <p className="mt-1 text-sm leading-5 text-muted-foreground">
                      {lastWarning}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="min-h-0 flex flex-1 flex-col items-center justify-center gap-6 bg-muted/40 p-5">
              <section className="w-full max-w-xl">
                <div className="mx-auto flex flex-col items-center gap-4">
                  <div className="w-full overflow-hidden rounded-2xl border border-border bg-black shadow-[0_18px_48px_rgba(15,23,42,0.12)]">
                    <video
                      ref={videoRef}
                      className="aspect-video max-h-[34vh] w-full object-cover"
                      autoPlay
                      muted
                      playsInline
                    />
                  </div>
                  {cameraError && (
                    <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
                      {cameraError}
                    </p>
                  )}
                </div>
              </section>

              <section className="flex w-full max-w-5xl flex-col items-center text-center">
                <div className="relative mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <div
                    className={`absolute inset-0 rounded-full border border-primary/20 ${listening ? "animate-ping" : ""}`}
                  />
                  {loading || autoSending || confirmingAnswer ? (
                    <Loader2 className="h-12 w-12 animate-spin" />
                  ) : (
                    <Mic className="h-12 w-12" />
                  )}
                </div>
                <motion.div
                  key={`${listening}-${loading}-${autoSending}-${confirmingAnswer}`}
                  className="max-w-xl"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <h2 className="text-2xl font-semibold tracking-normal sm:text-3xl">
                    {loading || autoSending
                      ? "Preparing the next question"
                      : confirmingAnswer
                        ? "Answer captured"
                        : listening
                          ? "Your turn"
                          : "Listen to Mira"}
                  </h2>
                </motion.div>
                <p className="mt-4 max-w-xl text-sm leading-6 text-muted-foreground">
                  {loading || autoSending
                    ? "Mira is reviewing your answer and choosing the next question."
                    : confirmingAnswer
                      ? `Submitting in ${submitCountdown || 1} seconds.`
                      : listening
                        ? "Speak naturally. Mira will capture your answer automatically."
                        : "The question is spoken aloud, just like a live interview."}
                </p>
                {listening && answer && (
                  <div className="mt-4 max-w-3xl rounded-2xl border border-primary/20 bg-card px-4 py-3 text-left text-sm shadow-sm">
                    <div className="mb-2 inline-flex items-center gap-2 text-primary">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                      </span>
                      <span className="font-medium">Live transcript</span>
                    </div>
                    <p className="leading-6 text-muted-foreground">{answer}</p>
                  </div>
                )}
              </section>
            </div>
          </div>
        </div>
      )}
      {started && !supported && (
        <p className="mt-2 text-sm text-muted-foreground">
          Voice capture is unavailable in this browser. Typed answers still
          work.
        </p>
      )}
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      {!started && turns.length > 0 && (
        <div className="mt-6 rounded-lg border border-border bg-background p-4 shadow-[0_14px_40px_rgba(15,23,42,0.045)]">
          <div className="mb-4 flex flex-col gap-2 border-b border-border pb-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase text-primary">
                Interview summary
              </p>
              <h4 className="mt-1 text-lg font-semibold">Interview feedback</h4>
            </div>
            <p className="max-w-md text-sm leading-6 text-muted-foreground">
              Review the latest notes and improve the answer that needs the most
              work.
            </p>
          </div>
          <div className="grid gap-3 xl:grid-cols-2">
            {turns.slice(-4).map((turn, index) => (
              <FeedbackCard
                key={`${turn.question}-${index}`}
                turn={turn}
                index={index}
              />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

"use client";

import { Loader2, ShieldCheck, X } from "lucide-react";
import { motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import type { ApplicationJob, InterviewStage } from "@/types/application";
import { cn } from "@/utils/cn";

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
  const [speaking, setSpeaking] = useState(false);
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
      window.clearTimeout(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
  }

  function stopMiraAudio() {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    audioRef.current?.pause();
    audioRef.current = null;
    setSpeaking(false);
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }

  function speak(text = question, onEnd?: () => void) {
    stopMiraAudio();
    if (typeof window === "undefined" || !window.speechSynthesis) {
      onEnd?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    const allVoices = window.speechSynthesis.getVoices();
    const enVoices = allVoices.filter((v) => v.lang.toLowerCase().includes("en"));
    const storedName = window.localStorage.getItem(miraVoiceKey);
    let voice = enVoices.find((v) => v.name === storedName);

    if (!voice) {
      // 1. Google UK English Female
      voice = enVoices.find((v) => v.name.toLowerCase().includes("google uk english female") || v.name.toLowerCase().includes("google uk english"));

      // 2. UK / GB English female
      if (!voice) {
        voice = enVoices.find((v) => (v.lang.toLowerCase().includes("gb") || v.lang.toLowerCase().includes("uk")) && v.name.toLowerCase().includes("female"));
      }

      // 3. Any UK / GB English voice
      if (!voice) {
        voice = enVoices.find((v) => v.lang.toLowerCase().includes("gb") || v.lang.toLowerCase().includes("uk"));
      }

      // 4. Any English female voice
      if (!voice) {
        const femaleKeywords = ["zira", "samantha", "hazel", "karen", "salli", "veena", "moira"];
        for (const kw of femaleKeywords) {
          const found = enVoices.find((v) => v.name.toLowerCase().includes(kw));
          if (found) {
            voice = found;
            break;
          }
        }
      }
    }
    if (!voice) {
      voice = enVoices[0];
    }

    if (voice) {
      utterance.voice = voice;
    }

    utterance.onend = () => {
      setSpeaking(false);
      onEnd?.();
    };
    utterance.onerror = () => {
      setSpeaking(false);
      onEnd?.();
    };

    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
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
      clearSilenceTimer();
      clearConfirmationTimer();
      clearCountdownTimer();
      setConfirmingAnswer(false);
      setSubmitCountdown(0);

      const allTranscript = Array.from(event.results)
        .map((result) => result[0]?.transcript ?? "")
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      setAnswer(allTranscript);

      if (isMeaningfulAnswer(allTranscript)) {
        // Start 7.5 second silence auto-submit timer
        silenceTimerRef.current = window.setTimeout(() => {
          silenceTimerRef.current = null;
          confirmAnswer(allTranscript);
        }, 7500);
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
    <section className="mt-6">
      {!started && turns.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-5 shadow-[0_10px_30px_rgba(31,24,14,0.05)] text-center flex min-h-56 flex-col items-center justify-center">
          <div className="relative mb-6">
            {/* Outer ring pulse */}
            <span className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" style={{ animationDuration: "2s" }} />
            <span className="absolute -inset-3 rounded-full border border-primary/10 animate-ping" style={{ animationDuration: "2.6s", animationDelay: "0.4s" }} />
            {/* Logo badge (Circle) */}
            <div
              className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 p-3 shadow-[0_12px_36px_rgba(37,99,235,0.18)]"
              style={{ animation: "logo-pop 0.6s cubic-bezier(0.34,1.56,0.64,1) both" }}
            >
              <img src="/Mira.png" alt="M" className="h-full w-full object-contain" />
            </div>
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

      {!started && turns.length > 0 ? (
        <div className="w-full max-w-4xl mx-auto py-2 px-1">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-border pb-6">
            <div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/30 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 border border-emerald-250 dark:border-emerald-900">
                Practice Completed
              </span>
              <h3 className="mt-2 text-2xl font-bold tracking-tight">Interview Performance Report</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Review your transcribed answers and Mira's personalized coaching notes.
              </p>
            </div>
            <Button
              onClick={() => {
                setTurns([]);
                setAnswer("");
                setError(null);
              }}
              className="sm:self-start rounded-xl px-5 shadow-sm transition-all hover:scale-[1.02]"
            >
              Practice Again
            </Button>
          </div>

          <div className="space-y-8">
            {turns.map((turn, index) => (
              <div key={index} className="relative border-l-2 border-primary/20 pl-6 ml-3 space-y-4">
                {/* Timeline node */}
                <div className="absolute -left-[9px] top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary border-4 border-background dark:border-[#0b141a]" />

                <div className="flex flex-col gap-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    Question {index + 1}
                  </span>
                  <h4 className="text-lg font-semibold text-foreground">
                    {turn.question}
                  </h4>
                </div>

                <div className="rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 p-4 border border-zinc-150 dark:border-zinc-800/80">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Your Response
                  </span>
                  <p className="mt-1.5 text-sm text-foreground leading-6 italic">
                    "{turn.answer}"
                  </p>
                </div>

                {turn.feedback && (
                  <div className="rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 p-5 border border-blue-150/50 dark:border-blue-900/40">
                    <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                      Mira's Coaching Feedback
                    </span>
                    <p className="mt-2 text-sm text-foreground leading-6">
                      {turn.feedback}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {started && (
        <div className="fixed inset-0 z-50 h-screen overflow-hidden bg-background">
          <div className="relative flex h-screen w-screen flex-col overflow-hidden">
            <div className="relative px-5 pb-5 pt-7 text-center">
              <div className="mb-3 inline-flex items-center gap-2">
                <span className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  {loading || autoSending
                    ? `${interviewerName} is thinking`
                    : confirmingAnswer
                      ? "Answer captured"
                      : listening
                        ? "Listening live"
                        : "Live interview"}
                </span>
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                  Question {Math.min(maxTurns, turns.length + 1)} of {maxTurns}
                </span>
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
                <div className="relative mb-5 flex h-24 items-center justify-center">
                  {/* Animated rings */}
                  <span
                    className={cn(
                      "absolute inset-0 rounded-full border-2 border-primary/30 transition-all",
                      (listening || speaking) ? "animate-ping opacity-100" : "opacity-0"
                    )}
                    style={{ animationDuration: "1.4s" }}
                  />
                  <span
                    className={cn(
                      "absolute -inset-2 rounded-full border border-primary/15 transition-all",
                      (listening || speaking) ? "animate-ping opacity-100" : "opacity-0"
                    )}
                    style={{ animationDuration: "1.8s", animationDelay: "0.3s" }}
                  />
                  {/* Mira logo badge */}
                  <div
                    className={cn(
                      "relative flex h-24 w-24 items-center justify-center rounded-full bg-white dark:bg-zinc-900 border border-zinc-150 dark:border-zinc-800 shadow-[0_12px_36px_rgba(37,99,235,0.18)] transition-all duration-300",
                      loading || autoSending || confirmingAnswer ? "opacity-70" : "opacity-100",
                      speaking && "animate-[speaking-wave_2s_ease-in-out_infinite]",
                      listening && "animate-[breath_2.5s_ease-in-out_infinite]"
                    )}
                  >
                    {loading || autoSending || confirmingAnswer ? (
                      <Loader2 className="h-10 w-10 animate-spin" />
                    ) : (
                      <img src="/Mira.png" alt="M" className="h-12 w-12 object-contain" />
                    )}
                  </div>
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
                        ? "Speak naturally. Speak clearly and pause when finished."
                        : "The question is spoken aloud, just like a live interview."}
                </p>

                {listening && answer && (
                  <div className="mt-4 max-w-2xl w-full flex flex-col items-center gap-3.5">
                    <div className="w-full rounded-2xl border border-primary/20 bg-card px-4 py-3 text-left text-sm shadow-sm">
                      <div className="mb-2 inline-flex items-center gap-2 text-primary">
                        <span className="relative flex h-2.5 w-2.5">
                          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-60" />
                          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                        </span>
                        <span className="font-medium text-xs uppercase tracking-wider">Live transcript</span>
                      </div>
                      <p className="leading-6 text-muted-foreground italic font-light">"{answer}"</p>
                    </div>

                    <div className="flex items-center gap-3">
                      {isMeaningfulAnswer(answer) && (
                        <Button
                          type="button"
                          className="h-10 rounded-xl px-5 font-semibold shadow-md transition-all active:scale-95"
                          onClick={() => {
                            clearSilenceTimer();
                            clearConfirmationTimer();
                            clearCountdownTimer();
                            stopListening();
                            setConfirmingAnswer(false);
                            setSubmitCountdown(0);
                            setAutoSending(true);
                            void submitAnswer(answer).finally(() => setAutoSending(false));
                          }}
                        >
                          Submit Answer
                        </Button>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {isMeaningfulAnswer(answer)
                          ? "Or pause for 7s to auto-submit"
                          : "Keep speaking to build a meaningful answer..."}
                      </p>
                    </div>
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
      {error && <p className="mt-3 text-sm text-red-600 px-4 text-center">{error}</p>}
    </section>
  );
}

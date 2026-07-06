"use client";

import { Loader2, ShieldCheck, Volume2, VolumeX, X } from "lucide-react";
import { motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  abort: () => void;
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
  return value.trim().length > 0;
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
  const interviewQuestions = useMemo(() => {
    return [
      `To start, please introduce yourself and tell me what interests you about the ${job.role} position at ${job.company}.`,
      `How does your previous experience directly prepare you for the challenges of this ${job.role} role?`,
      `Can you describe a specific project or achievement that demonstrates your capability for this position?`,
      `In this role, how do you handle tight deadlines or conflicting priorities when working on a team?`,
      `Finally, what are your professional goals for the near future, and how does this role fit into them?`
    ];
  }, [job.role, job.company]);
  const firstQuestion = interviewQuestions[0];
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
  const cameraActiveRef = useRef(false);
  const listeningWantedRef = useRef(false);
  const loadingRef = useRef(false);
  const submittingRef = useRef(false);
  const lastSubmittedRef = useRef("");
  const restartAttemptsRef = useRef(0);
  const startedRef = useRef(false);
  const maxTurns = 5;
  const supported = useMemo(() => Boolean(getSpeechRecognition()), []);
  const [voicesReady, setVoicesReady] = useState(false);
  const [voicesTimeout, setVoicesTimeout] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedMute = window.localStorage.getItem("job-tracker:mira-mute");
      if (storedMute === "true") {
        setIsMuted(true);
      }
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const newVal = !prev;
      window.localStorage.setItem("job-tracker:mira-mute", String(newVal));
      if (newVal) {
        if (typeof window !== "undefined" && window.speechSynthesis) {
          window.speechSynthesis.cancel();
        }
      }
      return newVal;
    });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setVoicesReady(true);
      return;
    }

    const checkVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      if (allVoices.length > 0) {
        setVoicesReady(true);
      }
    };

    checkVoices();
    window.speechSynthesis.onvoiceschanged = checkVoices;

    const timer = window.setTimeout(() => {
      setVoicesTimeout(true);
    }, 3000);

    return () => {
      window.clearTimeout(timer);
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

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

  const stopMiraAudio = useCallback(() => {
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
  }, []);

  function speak(text = question, onEnd?: () => void) {
    stopMiraAudio();
    if (!startedRef.current || isMuted || typeof window === "undefined" || !window.speechSynthesis) {
      onEnd?.();
      return;
    }

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

      // 3. Any English female voice
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

    // If no female voice is found (or still loading), remain silent and advance
    if (!voice) {
      onEnd?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.voice = voice;

    utterance.onend = () => {
      setSpeaking(false);
      if (startedRef.current) {
        onEnd?.();
      }
    };
    utterance.onerror = () => {
      setSpeaking(false);
      if (startedRef.current) {
        onEnd?.();
      }
    };

    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera is not available in this browser.");
      return;
    }

    cameraActiveRef.current = true;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      if (!cameraActiveRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraError(null);
    } catch {
      setCameraError("Camera permission was blocked or unavailable.");
    }
  }

  const stopCamera = useCallback(() => {
    cameraActiveRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

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
        // Start 2.5 second silence auto-submit timer
        silenceTimerRef.current = window.setTimeout(() => {
          silenceTimerRef.current = null;
          confirmAnswer(allTranscript);
        }, 2500);
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
        "Could not capture your voice. Please check your microphone and try again.",
      );
    };
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
    setError(null);
  }

  const stopListening = useCallback(() => {
    clearSilenceTimer();
    listeningWantedRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch {
        // Ignore any errors from aborting an already stopped instance
      }
      recognitionRef.current = null;
    }
    setListening(false);
  }, []);



  function confirmAnswer(finalTranscript: string) {
    if (submittingRef.current || confirmationTimerRef.current) return;

    clearSilenceTimer();
    clearConfirmationTimer();
    clearCountdownTimer();
    stopListening();
    setAnswer(finalTranscript);
    setConfirmingAnswer(true);
    setSubmitCountdown(3);
    setError(null);

    confirmationTimerRef.current = window.setTimeout(() => {
      confirmationTimerRef.current = null;
      clearCountdownTimer();
      setSubmitCountdown(0);
      setConfirmingAnswer(false);
      setAutoSending(true);
      void submitAnswer(finalTranscript).finally(() => setAutoSending(false));
    }, 3000);
    countdownTimerRef.current = window.setInterval(() => {
      setSubmitCountdown((seconds) => Math.max(seconds - 1, 0));
    }, 1000);
  }

  function startInterview() {
    setTurns([]);
    setStarted(true);
    startedRef.current = true;
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
    startedRef.current = false;
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

    let feedback = "Good answer. (AI coaching offline)";

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

      if (payload.feedback) {
        feedback = payload.feedback;
      } else if (payload.error) {
        feedback = `AI Coaching feedback failed: ${payload.error}`;
      }

      if (!response.ok && payload.error) {
        setError(`${payload.error} Add your AI key to enable live coaching.`);
      }
    } catch (submitError) {
      console.error("Coaching feedback API error:", submitError);
      feedback = "AI coaching offline. Your response was recorded successfully.";
    } finally {
      setLoading(false);
      submittingRef.current = false;
    }

    // Always record turn, advance, and end interview cleanly regardless of API status
    const completedTurns = turns.length + 1;
    const nextQuestion = interviewQuestions[completedTurns] || "Could you tell me more about that?";
    setTurns((current) => [
      ...current,
      { question, answer: submittedAnswer, feedback },
    ]);

    if (completedTurns >= maxTurns) {
      const closing =
        "That completes the interview. I saved your feedback below.";
      setQuestion(closing);
      speak(closing, () => {
        startedRef.current = false;
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
  }

  useEffect(() => {
    return () => {
      stopListening();
      stopCamera();
      clearSilenceTimer();
      clearConfirmationTimer();
      clearCountdownTimer();
      stopMiraAudio();
    };
  }, [stopListening, stopCamera, stopMiraAudio]);


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
          <Button
            className="mt-5"
            type="button"
            onClick={startInterview}
            disabled={!voicesReady && !voicesTimeout}
          >
            {!voicesReady && !voicesTimeout ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Preparing voice...
              </>
            ) : (
              "Start AI interview"
            )}
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
        <div className="fixed inset-0 z-50 h-screen overflow-hidden bg-slate-50 dark:bg-[#0b141a] text-foreground">
          <div className="relative flex h-screen w-screen flex-col overflow-hidden">
            <header className="border-b border-border bg-card px-4 py-2.5 grid grid-cols-3 items-center shrink-0">
              {/* Left Column: Badges */}
              <div className="flex items-center gap-1.5 justify-start">
                <span className="rounded-full border border-primary/20 bg-primary/10 px-2.5 py-0.5 text-[10px] font-semibold text-primary">
                  {loading || autoSending
                    ? "Thinking"
                    : confirmingAnswer
                      ? "Captured"
                      : listening
                        ? "Listening"
                        : "Live"}
                </span>
                <span className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-[10px] font-semibold text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                  Q{Math.min(maxTurns, turns.length + 1)}/{maxTurns}
                </span>
              </div>

              {/* Center Column: Centered title / subtitle */}
              <div className="text-center flex flex-col items-center justify-center min-w-0">
                <h4 className="text-xs font-bold tracking-tight text-foreground truncate w-full max-w-[130px] sm:max-w-xs md:max-w-md">
                  {job.role}
                </h4>
                <p className="text-[9px] text-muted-foreground truncate w-full max-w-[130px] sm:max-w-xs">
                  {job.company} — {stage.title}
                </p>
              </div>

              {/* Right Column: Controls */}
              <div className="flex items-center gap-1.5 justify-end">
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={toggleMute}
                  title={isMuted ? "Unmute Mira" : "Mute Mira"}
                  className="h-8 w-8 rounded-full flex items-center justify-center p-0"
                >
                  {isMuted ? (
                    <VolumeX className="h-3.5 w-3.5 text-red-500" />
                  ) : (
                    <Volume2 className="h-3.5 w-3.5 text-primary animate-pulse" />
                  )}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  type="button"
                  onClick={endInterview}
                  className="h-8 gap-1 px-2.5 rounded-full flex items-center text-[11px] font-semibold"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>End</span>
                </Button>
              </div>
            </header>

            <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center bg-slate-50 dark:bg-[#0b141a] p-4 sm:p-6 md:p-8 overflow-y-auto">
              {lastWarning && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 rounded-full border border-amber-250 bg-amber-50/95 px-5 py-2 text-xs text-amber-800 shadow-md backdrop-blur dark:border-amber-900/40 dark:bg-amber-950/80 dark:text-amber-300 animate-pulse whitespace-nowrap">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-500" />
                  </span>
                  <span className="font-semibold">Notice:</span>
                  <span>Tab switch detected ({focusWarnings} warnings)</span>
                </div>
              )}

              <div className="flex flex-col items-center justify-center gap-12 sm:gap-16 w-full max-w-2xl my-auto px-4">
                {/* Center: Camera Preview Container */}
                <div className="relative w-full aspect-video rounded-3xl overflow-hidden border border-zinc-200 bg-black shadow-xl dark:border-zinc-800">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    playsInline
                  />
                  
                  {cameraError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/90 p-4 text-center">
                      <p className="text-xs text-red-200 bg-red-950/40 border border-red-900/50 rounded-xl px-4 py-3">
                        {cameraError}
                      </p>
                    </div>
                  )}
                </div>

                {/* Bottom: Pulsing Mira Avatar & Circular Countdown Loader */}
                <div className="flex flex-col items-center justify-center relative">
                  {confirmingAnswer ? (
                    /* Circular Countdown Loader in place of static avatar */
                    <div className="relative flex h-28 w-28 items-center justify-center sm:h-36 sm:w-36 animate-pulse">
                      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/10 opacity-75" />
                      <span className="relative text-2xl font-extrabold text-primary sm:text-3xl">
                        {submitCountdown || 1}s
                      </span>
                      <svg viewBox="0 0 100 100" className="absolute inset-0 h-full w-full -rotate-90">
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          stroke="currentColor"
                          strokeWidth="3.5"
                          fill="transparent"
                          className="text-primary/10"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="45"
                          stroke="currentColor"
                          strokeWidth="3.5"
                          fill="transparent"
                          className="text-primary transition-all duration-1000"
                          strokeDasharray={282.7}
                          strokeDashoffset={282.7 - (282.7 * (submitCountdown || 1)) / 3}
                        />
                      </svg>
                    </div>
                  ) : (
                    /* Static Pulsing Mira Avatar */
                    <div
                      className={cn(
                        "relative flex h-28 w-28 items-center justify-center rounded-full bg-white border border-zinc-200 shadow-md transition-all duration-300 sm:h-36 sm:w-36 dark:bg-zinc-800 dark:border-zinc-700",
                        loading || autoSending ? "opacity-75" : "opacity-100",
                        speaking && "animate-[speaking-wave_2s_ease-in-out_infinite] ring-4 ring-primary/20",
                        listening && "animate-[breath_2.5s_ease-in-out_infinite] ring-4 ring-emerald-500/10"
                      )}
                    >
                      {loading || autoSending ? (
                        <Loader2 className="h-10 w-10 animate-spin text-primary sm:h-14 sm:w-14" />
                      ) : (
                        <img src="/Mira.png" alt="Mira" className="h-12 w-12 object-contain sm:h-16 sm:w-16" />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {started && !supported && (
        <p className="mt-2 text-sm text-muted-foreground">
          Voice capture is unavailable in this browser.
        </p>
      )}
      {error && <p className="mt-3 text-sm text-red-600 px-4 text-center">{error}</p>}
    </section>
  );
}

"use client";

import {
  ArrowRight,
  FileCheck2,
  FileUp,
  Loader2,
  Mic2,
  Volume2,
} from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useApplicationStore } from "@/hooks/use-application-store";
import { useResumeFileUpload } from "@/hooks/use-resume-file-upload";

const introMessages = [
  "Meet Mira, your application prep friend for staying organized and showing up ready.",
  "Mira helps you parse your resume, save job applications, draft cover letters, and practice interviews with a calm AI interviewer.",
  "Your workspace is saved to this browser on your device. Upload your resume when you are ready to start.",
];

const splashMessage =
  "Welcome to Mira. Choose the voice you like, preview it if you want, then click get started.";
const introPill = "Your application prep friend";
const miraVoiceKey = "job-tracker:mira-voice-id";
const defaultMiraVoiceId = "XrExE9yKIg1WjnnlVkGX";
const miraVoiceOptions = [
  {
    id: "XrExE9yKIg1WjnnlVkGX",
    name: "Matilda",
    tone: "Warm young voice",
  },
  {
    id: "EXAVITQu4vr4xnSDxMaL",
    name: "Sarah",
    tone: "Soft young voice",
  },
  {
    id: "pFZP5JQG7iQjIQuC4Bku",
    name: "Lily",
    tone: "Bright textured voice",
  },
];

function AnimatedIntroText({ text }: { text: string }) {
  const words = text.split(" ");

  return (
    <motion.h1
      key={text}
      className="mx-auto max-w-5xl text-balance text-4xl font-semibold leading-tight tracking-normal sm:text-6xl"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.035,
          },
        },
      }}
    >
      {words.map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          className={`inline-block ${
            word.replace(/[^a-z]/gi, "").toLowerCase() === "mira"
              ? "text-primary"
              : ""
          }`}
          variants={{
            hidden: { opacity: 0, y: 14, filter: "blur(5px)" },
            visible: { opacity: 1, y: 0, filter: "blur(0px)" },
          }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {word}
          {index < words.length - 1 ? "\u00a0" : ""}
        </motion.span>
      ))}
    </motion.h1>
  );
}

export function ResumeOnboarding({
  embedded = false,
  redirectTo = "/profile",
  redirectWhenReady = false,
}: {
  embedded?: boolean;
  redirectTo?: string;
  redirectWhenReady?: boolean;
}) {
  const router = useRouter();
  const { resume, resumeParsing, resumeError, storageLoaded } =
    useApplicationStore();
  const saveResumeFile = useResumeFileUpload();
  const [dragging, setDragging] = useState(false);
  const [parsePercent, setParsePercent] = useState(0);
  const [introStep, setIntroStep] = useState(0);
  const [showSplash, setShowSplash] = useState(!embedded);
  const [introComplete, setIntroComplete] = useState(embedded);
  const [mounted, setMounted] = useState(false);
  const [selectedVoiceId, setSelectedVoiceId] = useState(defaultMiraVoiceId);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const splashSpokenRef = useRef(false);

  useEffect(() => {
    if (!redirectWhenReady || !resume) return;
    router.replace(redirectTo);
  }, [redirectTo, redirectWhenReady, resume, router]);

  useEffect(() => {
    globalThis.setTimeout(() => setMounted(true), 0);
  }, []);

  const activeVoiceId = mounted
    ? (miraVoiceOptions.find(
        (voice) => voice.id === window.localStorage.getItem(miraVoiceKey),
      )?.id ?? selectedVoiceId)
    : selectedVoiceId;

  const stopMiraAudio = useCallback(() => {
    audioRef.current?.pause();
    audioRef.current = null;
    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopMiraAudio();
    };
  }, [stopMiraAudio]);

  function chooseVoice(voiceId: string) {
    setSelectedVoiceId(voiceId);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(miraVoiceKey, voiceId);
    }
  }

  const playMiraVoice = useCallback(
    (text: string, voiceId: string, onEnd?: () => void) => {
      stopMiraAudio();

      void fetch("/api/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voiceId }),
      })
        .then(async (response) => {
          if (!response.ok) throw new Error("Mira voice failed.");
          return response.blob();
        })
        .then((blob) => {
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audioRef.current = audio;
          audioUrlRef.current = url;
          const releaseAudio = () => {
            audioRef.current = null;
            URL.revokeObjectURL(url);
            if (audioUrlRef.current === url) {
              audioUrlRef.current = null;
            }
            onEnd?.();
          };
          audio.onended = releaseAudio;
          audio.onerror = releaseAudio;
          return audio.play();
        })
        .catch(() => onEnd?.());
    },
    [stopMiraAudio],
  );

  useEffect(() => {
    if (!resumeParsing) {
      return;
    }

    const timer = window.setInterval(() => {
      setParsePercent((value) =>
        Math.min(value + Math.ceil((96 - value) / 5), 96),
      );
    }, 280);

    return () => window.clearInterval(timer);
  }, [resumeParsing]);

  useEffect(() => {
    if (embedded || resume || showSplash || introComplete) {
      return;
    }

    let advanced = false;
    function advanceIntro() {
      if (advanced) return;
      advanced = true;
      globalThis.setTimeout(() => {
        if (introStep < introMessages.length - 1) {
          setIntroStep((value) =>
            Math.min(value + 1, introMessages.length - 1),
          );
        } else {
          setIntroComplete(true);
        }
      }, 600);
    }

    const fallbackTimer = window.setTimeout(
      advanceIntro,
      Math.max(4200, introMessages[introStep].split(/\s+/).length * 430),
    );

    playMiraVoice(introMessages[introStep], activeVoiceId, advanceIntro);

    return () => {
      window.clearTimeout(fallbackTimer);
      stopMiraAudio();
    };
  }, [
    embedded,
    introComplete,
    introStep,
    playMiraVoice,
    resume,
    activeVoiceId,
    showSplash,
    stopMiraAudio,
  ]);

  useEffect(() => {
    if (embedded || resume || !showSplash || splashSpokenRef.current) {
      return;
    }

    splashSpokenRef.current = true;
    playMiraVoice(splashMessage, activeVoiceId);

    return () => {
      stopMiraAudio();
    };
  }, [
    embedded,
    playMiraVoice,
    resume,
    activeVoiceId,
    showSplash,
    stopMiraAudio,
  ]);

  async function upload(file: File | undefined) {
    if (!file || resumeParsing) return;
    setParsePercent(8);
    await saveResumeFile(file);
    setParsePercent(100);
    router.push(redirectTo);
  }

  function handleInput(event: ChangeEvent<HTMLInputElement>) {
    void upload(event.target.files?.[0]);
  }

  if (!storageLoaded) {
    return (
      <main
        className={`flex items-center justify-center bg-background px-4 py-10 pb-28 ${embedded ? "min-h-[calc(100vh-8rem)]" : "min-h-screen"}`}
      >
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <AnimatedIntroText text="Welcome to Mira" />
        </motion.div>
      </main>
    );
  }

  if (resume) {
    if (redirectWhenReady) {
      return null;
    }

    return (
      <main
        className={`flex items-center justify-center bg-background px-4 py-10 pb-28 ${embedded ? "min-h-[calc(100vh-8rem)]" : "min-h-screen"}`}
      >
        <Card className="w-full max-w-xl">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <FileCheck2 className="h-7 w-7" />
            </div>
            <h1 className="text-2xl font-semibold">Resume is ready</h1>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted-foreground">
              Mira will use {resume.fileName} to prefill context, compare roles,
              and generate interview prep.
            </p>
            <Button className="mt-6" onClick={() => router.push(redirectTo)}>
              Continue to prepare
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (showSplash && !resume) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#eef5ff_0%,#fbfdff_46%,#ffffff_100%)] px-4 py-10 pb-28 text-center">
        <div className="w-full max-w-3xl">
          <motion.div
            className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {introPill}
          </motion.div>

          <AnimatedIntroText text="Welcome to Mira" />

          <motion.div
            className="mx-auto mt-7 flex w-full max-w-sm items-center gap-2"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
          >
            <label className="sr-only" htmlFor="mira-voice">
              Mira voice
            </label>
            <select
              id="mira-voice"
              className="h-10 min-w-0 flex-1 rounded-md border border-border bg-card px-3 text-sm font-medium text-foreground shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              value={activeVoiceId}
              onChange={(event) => chooseVoice(event.target.value)}
            >
              {miraVoiceOptions.map((voice) => (
                <option key={voice.id} value={voice.id}>
                  {voice.name} - {voice.tone}
                </option>
              ))}
            </select>
            <Button
              size="icon"
              variant="secondary"
              type="button"
              aria-label="Preview Mira voice"
              onClick={() => playMiraVoice(splashMessage, activeVoiceId)}
            >
              <Volume2 className="h-4 w-4" />
            </Button>
          </motion.div>

          <motion.div
            className="mt-8"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <Button
              className="h-12 rounded-xl px-6 text-base"
              onClick={() => {
                setShowSplash(false);
              }}
            >
              Get started
              <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        </div>
      </main>
    );
  }

  if (!introComplete) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10 pb-28 text-center">
        <div className="w-full max-w-6xl">
          <motion.div
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {introPill}
          </motion.div>
          <AnimatedIntroText text={introMessages[introStep]} />
          <div className="mt-9 flex justify-center gap-2">
            {introMessages.map((message, index) => (
              <span
                key={message}
                className={`h-1.5 rounded-full transition-all ${
                  index === introStep ? "w-10 bg-primary" : "w-2 bg-muted"
                }`}
              />
            ))}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main
      className={`flex items-center justify-center bg-background px-4 py-10 pb-28 ${embedded ? "min-h-[calc(100vh-8rem)]" : "min-h-screen"}`}
    >
      <div className="w-full max-w-3xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
            Start with your resume
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
            Upload your resume once. Mira will parse your profile first, then
            use it to prepare applications.
          </p>
        </div>

        <Card className="rounded-xl border-[#dfe5ef] shadow-[0_22px_56px_rgba(15,23,42,0.08)] dark:border-border">
          <CardContent className="p-5 sm:p-7">
            <motion.label
              whileTap={{ scale: 0.99 }}
              onDragOver={(event) => {
                event.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setDragging(false);
                void upload(event.dataTransfer.files?.[0]);
              }}
              className={`flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center transition ${
                dragging
                  ? "border-primary bg-primary/10"
                  : "border-[#dfe5ef] bg-[#f7f9fd] hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_18px_44px_rgba(0,132,255,0.16)] dark:border-border dark:bg-muted"
              }`}
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-lg bg-card text-primary shadow-sm">
                {resumeParsing ? (
                  <Loader2 className="h-8 w-8 animate-spin" />
                ) : (
                  <FileUp className="h-8 w-8" />
                )}
              </div>
              <span className="text-lg font-semibold">
                {resumeParsing
                  ? "Parsing your resume..."
                  : "Upload your resume"}
              </span>
              <span className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                Drop a PDF or DOCX here, or click to browse. This step is
                required before adding job applications.
              </span>
              {resumeParsing && (
                <div className="mt-6 w-full max-w-sm">
                  <div className="mb-2 flex items-center justify-between text-xs font-medium text-muted-foreground">
                    <span>Parsing resume</span>
                    <span>{parsePercent}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-card shadow-inner">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-300"
                      style={{ width: `${parsePercent}%` }}
                    />
                  </div>
                </div>
              )}
              <input
                className="sr-only"
                type="file"
                accept=".pdf,.docx"
                disabled={resumeParsing}
                onChange={handleInput}
              />
            </motion.label>

            {resumeError && (
              <p className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950">
                {resumeError}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

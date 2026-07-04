"use client";

import { ArrowRight, FileCheck2, FileUp, Loader2 } from "lucide-react";
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
  "Welcome to Mira.";
const introPill = "Your application prep friend";
const miraVoiceKey = "job-tracker:mira-voice-id";

function AnimatedIntroText({ text }: { text: string }) {
  const words = text.split(" ");

  return (
    <motion.h1
      key={text}
      className="mx-auto max-w-5xl flex flex-wrap items-center justify-center gap-x-2 sm:gap-x-3 text-balance text-3xl font-semibold leading-tight tracking-normal sm:text-6xl"
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
      {words.map((word, index) => {
        const cleanWord = word.replace(/[^a-z]/gi, "").toLowerCase();
        const isMira = cleanWord === "mira";
        if (isMira) {
          // Extract trailing punctuation (like commas or periods) to keep punctuation styling
          const punctuation = word.slice(word.toLowerCase().indexOf("mira") + 4);

          return (
            <motion.span
              key={`${word}-${index}`}
              className="inline-flex items-center mr-2 sm:mr-2.5"
              variants={{
                hidden: { opacity: 0, y: 14, filter: "blur(5px)" },
                visible: { opacity: 1, y: 0, filter: "blur(0px)" },
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <img
                src="/Mira.png"
                alt="M"
                className="h-22 w-22 object-contain"
                style={{
                  animation: "splash-logo-reveal 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) both",
                }}
              />
              <span
                className="text-5xl font-semibold tracking-tight text-blue-600 dark:text-[#e9edef]"
                style={{
                  animation: "splash-text-slide 0.75s cubic-bezier(0.16, 1, 0.3, 1) 0.55s both",
                }}
              >
                ira{punctuation}
              </span>
            </motion.span>
          );
        }

        return (
          <motion.span
            key={`${word}-${index}`}
            className="inline-block"
            variants={{
              hidden: { opacity: 0, y: 14, filter: "blur(5px)" },
              visible: { opacity: 1, y: 0, filter: "blur(0px)" },
            }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {word}
            {index < words.length - 1 ? "\u00a0" : ""}
          </motion.span>
        );
      })}
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
  const [synthesisVoices, setSynthesisVoices] = useState<SpeechSynthesisVoice[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const splashSpokenRef = useRef(false);
  const [voicesTimeout, setVoicesTimeout] = useState(false);

  const getDefaultVoiceName = useCallback((voicesList: SpeechSynthesisVoice[]) => {
    const allEn = voicesList.filter((v) => v.lang.toLowerCase().includes("en"));

    // 1. Google UK English Female
    let found = allEn.find((v) => v.name.toLowerCase().includes("google uk english female") || v.name.toLowerCase().includes("google uk english"));
    if (found) return found.name;

    // 2. UK / GB English female
    found = allEn.find((v) => (v.lang.toLowerCase().includes("gb") || v.lang.toLowerCase().includes("uk")) && v.name.toLowerCase().includes("female"));
    if (found) return found.name;

    // 3. Any English female voice
    const femaleKeywords = ["zira", "samantha", "hazel", "karen", "salli", "veena", "moira"];
    for (const kw of femaleKeywords) {
      const target = allEn.find((v) => v.name.toLowerCase().includes(kw));
      if (target) return target.name;
    }

    return "";
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;

    const loadVoices = () => {
      const allVoices = window.speechSynthesis.getVoices();
      const enVoices = allVoices.filter((v) =>
        v.lang.toLowerCase().includes("en"),
      );
      setSynthesisVoices(enVoices);

      // Auto-select and save the UK English Female voice to localStorage
      const defaultVoice = getDefaultVoiceName(enVoices);
      if (defaultVoice && !window.localStorage.getItem(miraVoiceKey)) {
        window.localStorage.setItem(miraVoiceKey, defaultVoice);
      }
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, [getDefaultVoiceName]);

  useEffect(() => {
    if (!redirectWhenReady || !resume) return;
    router.replace(redirectTo);
  }, [redirectTo, redirectWhenReady, resume, router]);

  useEffect(() => {
    globalThis.setTimeout(() => setMounted(true), 0);
    const timer = window.setTimeout(() => {
      setVoicesTimeout(true);
    }, 4000);
    return () => window.clearTimeout(timer);
  }, []);

  const activeVoiceId = mounted
    ? (window.localStorage.getItem(miraVoiceKey) ?? getDefaultVoiceName(synthesisVoices))
    : "";

  const stopMiraAudio = useCallback(() => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
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



  const playMiraVoice = useCallback(
    (text: string, voiceName: string, onEnd?: () => void) => {
      stopMiraAudio();

      if (typeof window === "undefined" || !window.speechSynthesis) {
        onEnd?.();
        return;
      }

      const allVoices = window.speechSynthesis.getVoices();
      const enVoices = allVoices.filter((v) => v.lang.toLowerCase().includes("en"));

      // Find the specific voice requested, OR look for a female English voice fallback
      let voice = enVoices.find((v) => v.name === voiceName);

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

      // If we don't have a female voice, remain silent and advance
      if (!voice) {
        onEnd?.();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = voice;

      utterance.onend = () => {
        onEnd?.();
      };
      utterance.onerror = () => {
        onEnd?.();
      };

      window.speechSynthesis.speak(utterance);
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
      Math.max(8500, introMessages[introStep].split(/\s+/).length * 750),
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
    if (embedded || resume || !showSplash || !mounted || splashSpokenRef.current) {
      return;
    }

    // Wait until voices are loaded, or we hit the timeout
    if (synthesisVoices.length === 0 && !voicesTimeout) {
      return;
    }

    splashSpokenRef.current = true;

    let advanced = false;
    const advanceSplash = () => {
      if (advanced) return;
      advanced = true;
      setShowSplash(false);
    };

    // Fallback timer in case speech synthesis fails or is blocked
    const fallbackTimer = window.setTimeout(
      advanceSplash,
      5000
    );

    // Speak introduction automatically once onboarding mounts and splash overlay fades out
    const speechDelay = window.setTimeout(() => {
      playMiraVoice(splashMessage, activeVoiceId, advanceSplash);
    }, 2000);

    return () => {
      window.clearTimeout(speechDelay);
      window.clearTimeout(fallbackTimer);
      stopMiraAudio();
    };
  }, [
    embedded,
    playMiraVoice,
    resume,
    activeVoiceId,
    showSplash,
    stopMiraAudio,
    mounted,
    synthesisVoices,
    voicesTimeout,
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
    const voicesLoading = mounted && synthesisVoices.length === 0 && !voicesTimeout;
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

          {voicesLoading && (
            <motion.div
              className="mt-8 flex flex-col items-center justify-center gap-2 text-sm text-muted-foreground"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span>Preparing voice synthesis...</span>
            </motion.div>
          )}
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
                className={`h-1.5 rounded-full transition-all ${index === introStep ? "w-10 bg-primary" : "w-2 bg-muted"
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

        <div>
          <div className="flex items-center  overflow-hidden justify-center ">
            <img
              src="/Mira.png"
              alt="M"
              className="h-24 w-24 object-contain"
              style={{
                animation: "splash-logo-reveal 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) both",
              }}
            />
            <span
              className="text-5xl font-semibold tracking-tight text-blue-600 dark:text-[#e9edef]"
              style={{
                animation: "splash-text-slide 0.75s cubic-bezier(0.16, 1, 0.3, 1) 0.55s both",
              }}
            >
              ira
            </span>
          </div>

          <div className="mb-8 text-center">
            <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
              Start with your resume
            </h1>
          </div>
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
              className={`flex min-h-72 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center transition ${dragging
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

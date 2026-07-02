"use client";

import { useCallback } from "react";
import { useApplicationStore } from "@/hooks/use-application-store";

export function useResumeFileUpload() {
  const setResume = useApplicationStore((state) => state.setResume);
  const setResumeUploadState = useApplicationStore(
    (state) => state.setResumeUploadState,
  );

  return useCallback(
    async (file: File) => {
      setResumeUploadState({ resumeParsing: true, resumeError: null });

      try {
        const { parseResumeFile } = await import("@/utils/resume-file-parser");
        const resume = await parseResumeFile(file);
        setResume(resume);
        setResumeUploadState({ resumeParsing: false });
      } catch (error) {
        setResumeUploadState({
          resumeError:
            error instanceof Error ? error.message : "Resume parsing failed.",
          resumeParsing: false,
        });
      }
    },
    [setResume, setResumeUploadState],
  );
}

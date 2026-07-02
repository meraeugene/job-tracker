"use client";

import { useCallback } from "react";
import { useApplicationStore } from "@/hooks/use-application-store";

const allowedResumeExtensions = new Set(["pdf", "docx"]);
const allowedResumeTypes = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);
const maxResumeBytes = 10 * 1024 * 1024;

function validateResumeFile(file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() ?? "";
  const hasAllowedExtension = allowedResumeExtensions.has(extension);
  const hasAllowedType = !file.type || allowedResumeTypes.has(file.type);

  if (!hasAllowedExtension || !hasAllowedType) {
    return "Upload a resume as a PDF or DOCX file.";
  }

  if (file.size === 0) {
    return "Upload a resume file that is not empty.";
  }

  if (file.size > maxResumeBytes) {
    return "Upload a resume smaller than 10 MB.";
  }

  return null;
}

export function useResumeFileUpload() {
  const setResume = useApplicationStore((state) => state.setResume);
  const setResumeUploadState = useApplicationStore(
    (state) => state.setResumeUploadState,
  );

  return useCallback(
    async (file: File) => {
      const validationError = validateResumeFile(file);
      if (validationError) {
        setResumeUploadState({
          resumeError: validationError,
          resumeParsing: false,
        });
        return;
      }

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

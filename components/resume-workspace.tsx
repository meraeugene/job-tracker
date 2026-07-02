"use client";

import { ResumeExtractPreview } from "@/components/resume-extract-preview";
import { ResumeOnboarding } from "@/components/resume-onboarding";
import { useApplicationStore } from "@/hooks/use-application-store";
import { useResumeFileUpload } from "@/hooks/use-resume-file-upload";

export function ResumeWorkspace() {
  const {
    resume,
    resumeError,
    resumeParsing,
    setResume,
    removeResumeAndData,
  } = useApplicationStore();
  const saveResumeFile = useResumeFileUpload();

  if (!resume) {
    return <ResumeOnboarding embedded redirectTo="/profile" />;
  }

  return (
    <div className="w-full">
      <ResumeExtractPreview
        resume={resume}
        onUpload={saveResumeFile}
        onRemove={removeResumeAndData}
        onUpdate={setResume}
        parsing={resumeParsing}
        error={resumeError}
      />
    </div>
  );
}

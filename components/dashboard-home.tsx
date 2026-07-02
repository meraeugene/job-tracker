"use client";

import { SquarePen } from "lucide-react";
import { PrepareApplicationForm } from "@/components/prepare-application-form";
import { ResumeOnboarding } from "@/components/resume-onboarding";
import { useApplicationStore } from "@/hooks/use-application-store";

export function DashboardHome() {
  const { resume } = useApplicationStore();

  if (!resume) return <ResumeOnboarding embedded redirectTo="/profile" />;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
          <SquarePen className="h-3.5 w-3.5" />
          Prepare phase
        </div>
        <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">
          Add a Job Application
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
          Paste a job post to generate materials and prep.
        </p>
      </div>
      <div className="mx-auto w-full max-w-3xl">
        <PrepareApplicationForm />
      </div>
    </div>
  );
}

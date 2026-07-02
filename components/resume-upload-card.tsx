"use client";

import { FileUp, ShieldCheck } from "lucide-react";
import type { ChangeEvent } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ResumeProfile } from "@/types/application";

export function ResumeUploadCard({
  resume = null,
  onUpload,
}: {
  resume?: ResumeProfile | null;
  onUpload?: (file: File) => void | Promise<void>;
}) {
  function handleUpload(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) void onUpload?.(file);
  }

  if (!resume) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Upload your resume to get started.</CardDescription>
        </CardHeader>
        <CardContent>
          <label className="group flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted p-8 text-center transition hover:-translate-y-0.5 hover:border-primary hover:bg-primary/10 hover:shadow-[0_18px_44px_rgba(0,132,255,0.16)]">
            <FileUp className="mb-3 h-8 w-8 text-primary" />
            <span className="font-medium">Upload your resume</span>
            <span className="mt-1 text-sm text-muted-foreground group-hover:text-foreground">Accepts PDF or DOCX</span>
            <input className="sr-only" type="file" accept=".pdf,.docx" onChange={handleUpload} />
          </label>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
        <CardDescription>Primary resume used for matching and application materials.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="truncate font-medium">{resume.fileName}</p>
            <p className="text-sm text-muted-foreground">Last updated {resume.lastUpdated}</p>
          </div>
          <div className="rounded-lg border border-border bg-muted px-3 py-2 text-right">
            <p className="text-xl font-semibold">{resume.readinessScore}</p>
            <p className="text-xs text-muted-foreground">Readiness</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950 dark:text-green-200">
          <ShieldCheck className="h-4 w-4" />
          ATS ready
        </div>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary">View</Button>
          <label className="inline-flex h-10 cursor-pointer items-center justify-center rounded-md border border-border bg-card px-4 text-sm font-medium transition hover:bg-muted">
            Replace
            <input className="sr-only" type="file" accept=".pdf,.docx" onChange={handleUpload} />
          </label>
        </div>
      </CardContent>
    </Card>
  );
}

"use client";

import { Check, Copy, Loader2, RefreshCcw, Save, SquarePen } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/input";
import { useApplicationStore } from "@/hooks/use-application-store";
import type { ApplicationJob } from "@/types/application";

function CoverLetterSkeleton() {
  return (
    <div className="rounded-lg border border-border bg-muted p-5">
      <div className="animate-pulse space-y-5">
        <div className="h-4 w-48 rounded bg-card" />
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-card" />
          <div className="h-3 w-11/12 rounded bg-card" />
          <div className="h-3 w-4/5 rounded bg-card" />
        </div>
        <div className="space-y-2">
          <div className="h-3 w-full rounded bg-card" />
          <div className="h-3 w-10/12 rounded bg-card" />
          <div className="h-3 w-2/3 rounded bg-card" />
        </div>
      </div>
    </div>
  );
}

async function copyText(value: string) {
  try {
    await navigator.clipboard.writeText(value);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = value;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
}

export function CoverLetterPanel({ job }: { job: ApplicationJob }) {
  const [letter, setLetter] = useState(job.coverLetter);
  const [editing, setEditing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const { updateJob, resume } = useApplicationStore();

  async function regenerate() {
    setGenerating(true);
    try {
      const response = await fetch("/api/generate-cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          role: job.role,
          company: job.company,
          location: job.location,
          jobDescription: job.jobDescription,
          resumeText: resume?.rawText,
          matchedSkills: job.matchedSkills,
        }),
      });
      const payload = (await response.json()) as { letter?: string };
      if (payload.letter) {
        setLetter(payload.letter);
        updateJob(job.id, { coverLetter: payload.letter });
      }
    } finally {
      setGenerating(false);
    }
  }

  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle>Cover Letter</CardTitle>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              await copyText(letter);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1600);
            }}
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button variant="secondary" size="sm" onClick={regenerate} disabled={generating}>
            {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
            {generating ? "Generating..." : "Regenerate"}
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setEditing((value) => !value)}>
            <SquarePen className="h-4 w-4" />
            Edit
          </Button>
          <Button size="sm" onClick={() => updateJob(job.id, { coverLetter: letter })}>
            <Save className="h-4 w-4" />
            Save
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {generating ? (
          <CoverLetterSkeleton />
        ) : editing ? (
          <Textarea value={letter} onChange={(event) => setLetter(event.target.value)} className="min-h-72" />
        ) : (
          <div className="whitespace-pre-wrap rounded-lg border border-border bg-muted p-5 text-sm leading-7">
            {letter}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

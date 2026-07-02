"use client";

import { Copy, Save, SquarePen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ApplicationJob } from "@/types/application";

export function ScreeningAnswersPanel({ job }: { job: ApplicationJob }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Screening Answers</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {job.screeningAnswers.map((item) => (
          <div key={item.question} className="rounded-lg border border-border p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h3 className="font-medium">{item.question}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{item.answer}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="secondary" size="icon" aria-label="Copy answer" onClick={() => navigator.clipboard.writeText(item.answer)}>
                  <Copy className="h-4 w-4" />
                </Button>
                <Button variant="secondary" size="icon" aria-label="Edit answer">
                  <SquarePen className="h-4 w-4" />
                </Button>
                <Button variant="secondary" size="icon" aria-label="Save answer">
                  <Save className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

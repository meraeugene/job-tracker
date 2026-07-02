import { FitScoreBadge } from "@/components/fit-score-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ApplicationJob } from "@/types/application";

export function ResumeMatchPanel({ job }: { job: ApplicationJob }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Resume Match</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <FitScoreBadge score={job.fitScore} />
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="mb-2 text-sm font-medium">Matched skills</h3>
            <div className="flex flex-wrap gap-2">
              {job.matchedSkills.map((skill) => (
                <span key={skill} className="rounded-full bg-green-50 px-3 py-1 text-sm text-green-700 dark:bg-green-950 dark:text-green-200">
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <div>
            <h3 className="mb-2 text-sm font-medium">Missing skills</h3>
            <div className="flex flex-wrap gap-2">
              {job.missingSkills.map((skill) => (
                <span key={skill} className="rounded-full bg-amber-50 px-3 py-1 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-medium">Resume improvement suggestions</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {job.resumeSuggestions.map((suggestion) => (
              <li key={suggestion}>• {suggestion}</li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-medium">Suggested tailored resume summary</h3>
          <p className="rounded-lg border border-border bg-muted p-4 text-sm">{job.tailoredSummary}</p>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-medium">Suggested bullet points</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {job.resumeBullets.map((bullet) => (
              <li key={bullet}>• {bullet}</li>
            ))}
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

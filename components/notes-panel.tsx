"use client";

import { Save } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { useApplicationStore } from "@/hooks/use-application-store";
import type { ApplicationJob } from "@/types/application";

export function NotesPanel({ job }: { job: ApplicationJob }) {
  const [notes, setNotes] = useState(job.notes);
  const { updateJob } = useApplicationStore();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2 text-sm font-medium">
            Recruiter name
            <Input value={notes.recruiterName} onChange={(event) => setNotes({ ...notes, recruiterName: event.target.value })} />
          </label>
          <label className="space-y-2 text-sm font-medium">
            Interview date
            <Input type="date" value={notes.interviewDate} onChange={(event) => setNotes({ ...notes, interviewDate: event.target.value })} />
          </label>
          <label className="space-y-2 text-sm font-medium">
            Salary discussed
            <Input value={notes.salaryDiscussed} onChange={(event) => setNotes({ ...notes, salaryDiscussed: event.target.value })} />
          </label>
          <label className="space-y-2 text-sm font-medium">
            Follow-up reminder
            <Input type="date" value={notes.reminderDate} onChange={(event) => setNotes({ ...notes, reminderDate: event.target.value })} />
          </label>
        </div>
        <label className="space-y-2 text-sm font-medium">
          Personal notes
          <Textarea value={notes.content} onChange={(event) => setNotes({ ...notes, content: event.target.value })} />
        </label>
        <Button onClick={() => updateJob(job.id, { notes })}>
          <Save className="h-4 w-4" />
          Save Notes
        </Button>
      </CardContent>
    </Card>
  );
}

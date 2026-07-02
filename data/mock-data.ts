import type { ApplicationJob, JobStatus } from "@/types/application";

export const statuses: JobStatus[] = [
  "Saved",
  "Ready",
  "Applied",
  "Assessment",
  "Follow Up",
  "Interview",
  "Final Interview",
  "Offer",
  "Rejected",
];

export const trackerStatuses: JobStatus[] = [
  "Applied",
  "Assessment",
  "Interview",
  "Final Interview",
  "Offer",
];

export const jobs: ApplicationJob[] = [];

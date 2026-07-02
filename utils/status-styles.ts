import type { JobStatus } from "@/types/application";

export const statusSurfaceStyles: Record<JobStatus, string> = {
  Saved:
    "border-slate-200 bg-slate-50/40 dark:border-slate-800 dark:bg-slate-950/20",
  Ready:
    "border-blue-200 bg-blue-50/40 dark:border-blue-900 dark:bg-blue-950/20",
  Applied: "border-sky-200 bg-sky-50/40 dark:border-sky-900 dark:bg-sky-950/20",
  Assessment:
    "border-cyan-200 bg-cyan-50/40 dark:border-cyan-900 dark:bg-cyan-950/20",
  "Follow Up":
    "border-amber-200 bg-amber-50/40 dark:border-amber-900 dark:bg-amber-950/20",
  Interview:
    "border-green-200 bg-green-50/40 dark:border-green-900 dark:bg-green-950/20",
  "Final Interview":
    "border-emerald-200 bg-emerald-50/40 dark:border-emerald-900 dark:bg-emerald-950/20",
  Offer:
    "border-purple-200 bg-purple-50/40 dark:border-purple-900 dark:bg-purple-950/20",
  Rejected:
    "border-red-200 bg-red-50/40 dark:border-red-900 dark:bg-red-950/20",
};

export const statusAccentStyles: Record<JobStatus, string> = {
  Saved: "border-l-slate-400",
  Ready: "border-l-blue-500",
  Applied: "border-l-sky-500",
  Assessment: "border-l-cyan-500",
  "Follow Up": "border-l-amber-500",
  Interview: "border-l-green-500",
  "Final Interview": "border-l-emerald-500",
  Offer: "border-l-purple-500",
  Rejected: "border-l-red-500",
};

"use client";

import { create } from "zustand";
import { jobs as initialJobs } from "@/data/mock-data";
import type {
  ApplicationJob,
  JobStatus,
  ResumeProfile,
} from "@/types/application";
import { parseResumeText } from "@/utils/resume-parser";

const jobsKey = "job-tracker:v3:jobs";
const resumeKey = "job-tracker:v3:resume";
const maxStoredJsonBytes = 2_000_000;

type ApplicationStore = {
  jobs: ApplicationJob[];
  storageLoaded: boolean;
  appliedJobs: ApplicationJob[];
  resume: ResumeProfile | null;
  resumeParsing: boolean;
  resumeError: string | null;
  setJobs: (jobs: ApplicationJob[]) => void;
  setResume: (resume: ResumeProfile | null) => void;
  setResumeUploadState: (state: {
    resumeParsing?: boolean;
    resumeError?: string | null;
  }) => void;
  addJob: (job: ApplicationJob) => void;
  updateJob: (id: string, patch: Partial<ApplicationJob>) => void;
  replaceJobs: (jobs: ApplicationJob[]) => void;
  updateJobStatus: (id: string, status: JobStatus) => void;
  deleteJob: (id: string) => void;
  removeResumeAndData: () => void;
};

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;

  try {
    const value = window.localStorage.getItem(key);
    if (value && value.length > maxStoredJsonBytes) {
      window.localStorage.removeItem(key);
      return fallback;
    }
    return value ? (JSON.parse(value) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function removeJson(key: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(key);
}

function normalizeTrackedJobs(jobs: ApplicationJob[]) {
  const today = new Date().toISOString().slice(0, 10);

  return jobs.map((job) =>
    job.status === "Saved" || job.status === "Ready"
      ? {
          ...job,
          status: "Applied" as const,
          currentStage: "Applied",
          dateApplied: job.dateApplied || today,
        }
      : job,
  );
}

function normalizeStoredResume(resume: ResumeProfile | null) {
  if (!resume?.rawText) return resume;

  try {
    const parsed = parseResumeText({
      fileName: resume.fileName,
      rawText: resume.rawText,
      lastUpdated: resume.lastUpdated,
    });
    return {
      ...parsed,
      manualProjects: resume.manualProjects ?? [],
    };
  } catch {
    return resume;
  }
}

function appliedJobs(jobs: ApplicationJob[]) {
  return jobs.filter((job) =>
    ["Applied", "Assessment", "Interview", "Final Interview", "Offer"].includes(
      job.status,
    ),
  );
}

function loadInitialState() {
  const jobs = normalizeTrackedJobs(readJson(jobsKey, initialJobs));
  const resume = normalizeStoredResume(readJson(resumeKey, null));

  return {
    jobs,
    resume,
    appliedJobs: appliedJobs(jobs),
  };
}

const initialState = loadInitialState();

export const useApplicationStore = create<ApplicationStore>((set, get) => ({
  jobs: initialState.jobs,
  storageLoaded: true,
  appliedJobs: initialState.appliedJobs,
  resume: initialState.resume,
  resumeParsing: false,
  resumeError: null,

  setJobs: (jobs) => {
    const nextJobs = normalizeTrackedJobs(jobs);
    writeJson(jobsKey, nextJobs);
    set({ jobs: nextJobs, appliedJobs: appliedJobs(nextJobs) });
  },

  setResume: (resume) => {
    if (resume) {
      writeJson(resumeKey, resume);
    } else {
      removeJson(resumeKey);
    }
    set({ resume });
  },

  setResumeUploadState: (state) => {
    set(state);
  },

  addJob: (job) => {
    const nextJobs = [job, ...get().jobs];
    writeJson(jobsKey, nextJobs);
    set({ jobs: nextJobs, appliedJobs: appliedJobs(nextJobs) });
  },

  updateJob: (id, patch) => {
    const nextJobs = get().jobs.map((job) =>
      job.id === id ? { ...job, ...patch } : job,
    );
    writeJson(jobsKey, nextJobs);
    set({ jobs: nextJobs, appliedJobs: appliedJobs(nextJobs) });
  },

  replaceJobs: (jobs) => {
    writeJson(jobsKey, jobs);
    set({ jobs, appliedJobs: appliedJobs(jobs) });
  },

  updateJobStatus: (id, status) => {
    const nextJobs = get().jobs.map((job) =>
      job.id === id
        ? {
            ...job,
            status,
            currentStage: status,
            dateApplied:
              status === "Applied" && !job.dateApplied
                ? new Date().toISOString().slice(0, 10)
                : job.dateApplied,
          }
        : job,
    );
    writeJson(jobsKey, nextJobs);
    set({ jobs: nextJobs, appliedJobs: appliedJobs(nextJobs) });
  },

  deleteJob: (id) => {
    const nextJobs = get().jobs.filter((job) => job.id !== id);
    writeJson(jobsKey, nextJobs);
    set({ jobs: nextJobs, appliedJobs: appliedJobs(nextJobs) });
  },

  removeResumeAndData: () => {
    removeJson(resumeKey);
    removeJson(jobsKey);
    set({ resume: null, jobs: [], appliedJobs: [] });
  },
}));

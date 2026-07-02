export type JobStatus =
  | "Saved"
  | "Ready"
  | "Applied"
  | "Assessment"
  | "Follow Up"
  | "Interview"
  | "Final Interview"
  | "Offer"
  | "Rejected";

export type ScreeningAnswer = {
  question: string;
  answer: string;
};

export type InterviewStage = {
  title: string;
  expectation: string;
  questions: string[];
  answers: string[];
  checklist: string[];
};

export type ApplicationJob = {
  id: string;
  role: string;
  company: string;
  platform: string;
  location: string;
  jobUrl: string;
  jobDescription: string;
  fitScore: number;
  currentStage: string;
  nextStep: string;
  dateSaved: string;
  dateApplied?: string;
  status: JobStatus;
  matchedSkills: string[];
  missingSkills: string[];
  resumeSuggestions: string[];
  tailoredSummary: string;
  resumeBullets: string[];
  coverLetter: string;
  screeningAnswers: ScreeningAnswer[];
  interviewPrep: InterviewStage[];
  notes: {
    recruiterName: string;
    interviewDate: string;
    salaryDiscussed: string;
    content: string;
    reminderDate: string;
  };
};

export type ResumeProfile = {
  fileName: string;
  lastUpdated: string;
  readinessScore: number;
  atsReady: boolean;
  rawText: string;
  keywords: string[];
  manualProjects?: string[];
  sections: {
    summary: string;
    experience: string;
    skills: string;
    education: string;
    certifications: string;
    projects: string;
    highlights: string;
    targetRoles: string;
    profileSummary: string;
    portfolioLinks: string;
  };
};

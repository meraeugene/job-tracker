# Job Tracker

Job Tracker is a Next.js App Router job application workspace. Users upload a resume once, enter structured job details, prepare application materials, and track applications in a local-storage backed table or kanban board.

## Stack

- Next.js App Router, TypeScript, Tailwind CSS
- shadcn/ui-inspired local components
- Lucide React, Framer Motion
- React Hook Form, Zod
- TanStack Table
- dnd-kit
- Supabase database/auth/storage clients
- Gemini API routes for resume parsing, application material generation, and voice interview coaching
- PDF parsing dependency ready for resume ingestion

## Getting Started

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The app redirects to `/dashboard`.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in real values:

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
GEMINI_API_KEY
GEMINI_MODEL
GEMINI_TTS_MODEL
GEMINI_TTS_VOICE
JWT_SECRET
NEXT_PUBLIC_APP_URL
```

Never expose service-role keys in client code.

## Database

Run `supabase/schema.sql` in Supabase SQL editor to create:

- `profiles`
- `resumes`
- `jobs`
- `application_outputs`
- `notes`

## Current Implementation

The UI uses mock data first so the product can be reviewed immediately. Built pages:

- `/dashboard`
- `/job-applications`
- `/profile`
- `/cover-letters`
- `/interview-prep`
- `/board`

The API route `POST /api/prepare-application` accepts structured job details, a job description, and optional resume text. It calls Gemini when configured and otherwise returns local fallback materials so the tracker remains usable.

The API route `POST /api/parse-resume` extracts structured profile sections from resume text with Gemini. Add `GEMINI_API_KEY` to `.env.local` before uploading resumes.

The API route `POST /api/interview-voice` accepts a transcript answer and returns Gemini-powered interview feedback plus the next voice prompt. Add `GEMINI_API_KEY` to `.env.local` to enable live coaching.

The API route `POST /api/speak` generates Mira's spoken interview prompts with Gemini TTS. Optional `GEMINI_TTS_MODEL` and `GEMINI_TTS_VOICE` values control the model and voice; the browser voice is used as a fallback if TTS is unavailable.

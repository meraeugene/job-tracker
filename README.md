# Job Tracker

Job Tracker is a Next.js App Router job application workspace. Users upload a resume once, enter structured job details, prepare application materials, and track applications in a local-storage backed table or kanban board.

## Stack

- Next.js App Router, TypeScript, Tailwind CSS
- shadcn/ui-inspired local components
- Lucide React, Framer Motion
- React Hook Form, Zod
- TanStack Table
- dnd-kit
- Gemini API routes for resume parsing, application material generation, and interview coaching
- ElevenLabs TTS for Mira's human voice
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
GEMINI_API_KEY
GEMINI_MODEL
ELEVENLABS_API_KEY
ELEVENLABS_VOICE_ID
ELEVENLABS_MODEL_ID
ELEVENLABS_OUTPUT_FORMAT
JWT_SECRET
NEXT_PUBLIC_APP_URL
```

Keep server-only API keys out of client code.

## Data Storage

The current app stores workspace data locally in the browser through the app store. No external database setup is required.

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

The API route `POST /api/speak` generates Mira's spoken onboarding and interview prompts with ElevenLabs only. Add `ELEVENLABS_API_KEY` to enable voice. `ELEVENLABS_VOICE_ID`, `ELEVENLABS_MODEL_ID`, and `ELEVENLABS_OUTPUT_FORMAT` control the default voice, model, and returned audio format. The default voice is Matilda (`XrExE9yKIg1WjnnlVkGX`), a warm young female ElevenLabs premade voice. The splash screen lets users preview and select the free-working female voices tested for this app: Matilda (`XrExE9yKIg1WjnnlVkGX`), Sarah (`EXAVITQu4vr4xnSDxMaL`), and Lily (`pFZP5JQG7iQjIQuC4Bku`). The default model is `eleven_flash_v2_5`, which is suited for low-latency interview prompts.

ElevenLabs has a free tier suitable for local testing and demos, but quota and licensing limits apply. Check the current ElevenLabs plan details before using it in production.

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  file_url text not null,
  file_name text not null,
  parsed_text text,
  readiness_score integer default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (select 1 from pg_type where typname = 'job_status') then
    create type job_status as enum ('Saved', 'Ready', 'Applied', 'Assessment', 'Follow Up', 'Interview', 'Final Interview', 'Offer', 'Rejected');
  end if;
end
$$;

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references profiles(id) on delete cascade,
  role text not null,
  company text not null,
  platform text not null,
  location text,
  job_url text,
  job_description text,
  fit_score integer default 0,
  current_stage text default 'Saved',
  next_step text default 'Prepare application',
  status job_status not null default 'Saved',
  date_saved date not null default current_date,
  date_applied date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists application_outputs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  tailored_summary text,
  resume_bullets jsonb default '[]'::jsonb,
  cover_letter text,
  screening_answers_json jsonb default '[]'::jsonb,
  interview_prep_json jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists notes (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  content text,
  reminder_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists resumes_user_id_idx on resumes(user_id);
create index if not exists jobs_user_id_status_idx on jobs(user_id, status);
create index if not exists application_outputs_job_id_idx on application_outputs(job_id);
create index if not exists notes_job_id_idx on notes(job_id);

# AGENTS.md

Use this file as the starting `AGENTS.md` for a new system that follows the same architecture as Archivia: a Next.js App Router application with role-based route groups, Server Actions, custom JWT cookie authentication, file storage, email notifications, and optional external ML/search services.

Replace every `{{PLACEHOLDER}}` before using it in a real project.

---

# AGENTS.md

Guidance for coding agents working in `{{PROJECT_NAME}}`.

## Project Snapshot

`{{PROJECT_NAME}}` is a Next.js App Router application for `{{DOMAIN_DESCRIPTION}}`.

The system uses:

- Next.js App Router for pages, layouts, API routes, and Server Components.
- Server Actions for authenticated business operations.
- Application data stored through the configured project data layer.
- Custom JWT cookie authentication.
- Middleware and role-specific layouts for access control.
- Cloudinary or another file service for uploads.
- Nodemailer or another email provider for notifications.
- Optional external HTTP services for recommendation, search, analytics, or ML features.

## Commands

```bash
npm install
npm run dev
npm run build
npm run start
npm run lint
```

Optional seed/script commands:

```bash
npx tsx scripts/seed.ts
npx tsx scripts/{{SEED_SCRIPT_NAME}}.ts
```

Notes:

- The dev server should run at `http://localhost:3000` unless configured otherwise.
- Document any required external services here.
- If Python or ML scripts are used, document the required Python command and dependencies.

## Architecture Map

- `app/` contains the Next.js App Router surface.
- `app/(root)/` contains the shared authenticated user experience.
- `app/({{ROLE_1}})/` contains `{{ROLE_1}}`-only workflows.
- `app/({{ROLE_2}})/` contains `{{ROLE_2}}`-only workflows.
- `app/({{ROLE_3}})/` contains `{{ROLE_3}}`-only workflows.
- `app/auth/` contains login, password recovery, and authentication screens.
- `app/api/` contains API routes for uploads, downloads, webhooks, or raw request/response operations.
- `actions/` contains Server Actions grouped by domain.
- `components/` contains reusable and shared UI.
- `components/ui/` contains design-system primitives.
- `hooks/` contains client-side workflow hooks.
- `utils/` contains service clients, validators, formatting helpers, and integration helpers.
- `lib/` contains framework-agnostic helpers such as JWT, hashing, crypto, and parsing utilities.
- `types/` contains shared domain interfaces.
- `data/` contains static options, seed data, and local datasets.
- `scripts/` contains seeders, importers, exports, and maintenance scripts.
- `store/` contains client state stores.
- `public/` contains static assets.

## Auth And Access Control

Authentication is custom unless this project explicitly adopts another provider.

Expected flow:

1. Login action validates the submitted credentials.
2. User is fetched from the application `users` table.
3. Password is compared against a secure hash.
4. Session metadata is recorded if the project tracks sessions.
5. A JWT is signed with `JWT_SECRET`.
6. The JWT is stored in an HTTP-only `session` cookie.
7. Middleware verifies the cookie and redirects users based on route and role.

Keep these layers aligned:

- `middleware.ts` handles broad route protection and workflow gates.
- Role-specific layouts enforce role access with server-side redirects.
- Server Actions must still validate session and role before sensitive operations.
- Client components should never be trusted as the only source of authorization.

## Role Areas

Define each role clearly:

- `{{ROLE_1}}`: `{{ROLE_1_RESPONSIBILITIES}}`
- `{{ROLE_2}}`: `{{ROLE_2_RESPONSIBILITIES}}`
- `{{ROLE_3}}`: `{{ROLE_3_RESPONSIBILITIES}}`
- Shared authenticated users: `{{SHARED_AUTHENTICATED_FEATURES}}`

When adding a new route, update:

- `middleware.ts`
- the matching route group layout,
- navigation links,
- Server Action authorization checks,
- and this file.

## Data And Services

Data clients:

- Keep browser-safe clients separate from server-only clients.
- Keep privileged data access server-side.
- Document any configured external data provider here.

External services:

- File storage: `{{FILE_STORAGE_PROVIDER}}`
- Email provider: `{{EMAIL_PROVIDER}}`
- Search service: `{{SEARCH_SERVICE_URL_OR_NONE}}`
- Recommendation/ML service: `{{ML_SERVICE_URL_OR_NONE}}`
- Other integrations: `{{OTHER_INTEGRATIONS_OR_NONE}}`

Environment variables:

```text
JWT_SECRET

{{FILE_STORAGE_ENV_KEYS}}
{{EMAIL_ENV_KEYS}}
{{EXTERNAL_SERVICE_ENV_KEYS}}
```

Important:

- Never expose server-only keys in client code.
- Avoid `NEXT_PUBLIC_` prefixes for secrets.
- Keep `.env.local` out of version control.
- Document every new environment variable in the README.

## Server Actions

Group Server Actions by domain:

```text
actions/auth/
actions/common/
actions/{{ROLE_1}}/
actions/{{ROLE_2}}/
actions/{{ROLE_3}}/
```

Action rules:

- Validate session before reading or mutating protected data.
- Validate role before role-specific operations.
- Return predictable `{ data, error }` or domain-specific result shapes.
- Keep database writes server-side.
- Keep email/file side effects close to the action that triggers them.
- Prefer typed domain objects from `types/`.

## API Routes

Use `app/api/*/route.ts` for:

- file uploads,
- file deletion,
- downloads,
- webhook receivers,
- streaming responses,
- raw request/response integrations,
- long-running script triggers,
- or operations that cannot be expressed cleanly as Server Actions.

API route rules:

- Validate authentication and authorization where needed.
- Validate request payloads.
- Keep secrets server-only.
- Return explicit HTTP status codes.
- Log enough context for debugging without logging secrets.

## UI And Frontend Conventions

- Keep route-specific UI close to the route under `app/...`.
- Put reusable UI in `components/`.
- Put design-system primitives in `components/ui/`.
- Put reusable hooks in `hooks/`.
- Use existing components and styling patterns before adding new ones.
- Keep forms accessible and validate on both client and server when appropriate.
- Use loading, empty, error, and success states for user-facing workflows.
- Do not hide authorization problems only with client-side conditional rendering.

## TypeScript Conventions

- Keep strict TypeScript compatibility.
- Prefer the `@/*` path alias for cross-folder imports.
- Put shared domain types in `types/`.
- Avoid repeating loose object shapes across actions/components.
- Keep service response mapping explicit at boundaries.

## Safety Notes

- Do not commit `.env.local` or real secrets.
- Do not import server-only clients into client components.
- Do not weaken middleware or layout role checks when adding routes.
- Do not trust role or user IDs passed from the browser.
- Do not assume external services are available unless the README says how to run them.
- Keep file deletion logic aligned with the upload provider and resource type.
- Use a strong `JWT_SECRET` in production.

## Testing And Verification

Before handing off meaningful changes:

- Run `npm run lint` when available.
- Do not run `npm run build` after every small change. Reserve builds for meaningful checkpoints, before final handoff on larger changes, or when the user explicitly asks for a build.
- Run `npm run build` when feasible for substantial changes that touch routing, data flow, shared components, configuration, or production behavior.
- Smoke-test affected role flows.
- Verify middleware redirects for protected pages.
- Verify Server Action authorization for sensitive operations.
- For upload changes, test upload and delete paths.
- For email changes, test with safe recipient accounts.
- For external service changes, verify service URLs and failure handling.

## Documentation

Update `README.md` when adding or changing:

- environment variables,
- external services,
- setup commands,
- seed/import scripts,
- route groups,
- roles and permissions,
- file upload behavior,
- email behavior,
- search/recommendation behavior,
- deployment assumptions,
- or auth/session architecture.

## New Project Checklist

Before using this template in a new system:

- Replace all `{{PLACEHOLDER}}` values.
- Rename route groups to match the new roles.
- Update command names and seed scripts.
- Update environment variable names.
- Update external service URLs.
- Update the role and workflow gate descriptions.
- Confirm whether auth is custom JWT or another provider.
- Remove sections that do not apply.

# Claude Instructions — Video Timeline App

## Project Context

- **Stack:** React + Next.js 15 (App Router), JavaScript (JSX) — no TypeScript
- **Purpose:** Media timeline editor — users upload images/videos, arrange them on a timeline, and export a stitched video via FFmpeg
- **Backend:** Next.js API routes (no separate server)
- **Services:** Prisma + PostgreSQL, Cloudinary (media storage), FFmpeg via fluent-ffmpeg (export), @dnd-kit (timeline drag and drop)
- **Hosting:** Railway (required — Vercel does not support long-running FFmpeg processes)

---

## Folder Structure

```
src/
  app/
    layout.js              ← root layout
    page.js                ← home route (/)
    globals.css
    <route>/
      page.js
      loading.js
      error.js
    api/
      <route>/
        route.js           ← API route handler (thin controller only)

  components/
    ui/                    ← generic reusable UI (Button, Modal, Spinner, etc.)
    timeline/              ← timeline-specific components
    media/                 ← upload, asset grid, asset card components

  lib/
    prisma.js              ← Prisma singleton
    cloudinary.js          ← Cloudinary singleton
    ffmpeg.js              ← FFmpeg/fluent-ffmpeg helpers
    constants/
      mediaLimits.js       ← upload size limits, allowed formats
      jobStatus.js         ← PENDING / PROCESSING / COMPLETE / FAILED
      ...

  services/
    project.service.js     ← project CRUD logic
    asset.service.js       ← upload, fetch, delete assets
    clip.service.js        ← timeline clip ordering and updates
    export.service.js      ← FFmpeg job orchestration

  hooks/                   ← custom React hooks
  utils/                   ← pure helper functions
  context/                 ← React Context providers
  types/                   ← shared plain-JS type documentation (JSDoc)

prisma/                    ← at root, outside src/
  schema.prisma
```

---

## Code Separation Rules

### Constants

- Never define reusable constants inline in a component or page file.
- All constants go in `lib/constants/<topic>.js`.
- If a constant has any chance of being used in more than one file, extract it immediately.
- Examples: upload limits, allowed MIME types, job status values, timeline defaults, FFmpeg output settings.

### Shared Utilities / Singletons

- Third-party SDK configs used in more than one file go in `lib/<service>.js`.
- `lib/prisma.js` — Prisma client singleton, never instantiate `PrismaClient` anywhere else.
- `lib/cloudinary.js` — Cloudinary config singleton.
- `lib/ffmpeg.js` — shared FFmpeg helper functions.

### Components

- If a UI pattern appears in more than one place, extract it to `components/ui/`.
- Feature-specific components go in `components/<feature>/` (e.g. `components/timeline/`, `components/media/`).
- One-off page UI with zero reuse potential can stay in the page file.

### Services

- All business logic lives in `services/` — never directly in route handlers.
- Database queries go in service files, not in API route files.
- Each service file owns one responsibility.

### Types

- Shared shape documentation goes in `types/` using JSDoc comments.
- Never duplicate a type definition across files.

### General Principle

Before writing any constant, component, or utility inline — ask: "Could this be needed elsewhere?" If yes, put it in the right shared location from the start.

---

## API Design Rules

- Keep route handlers thin — they only read request data, call a service, and return a response.
- Never put database logic or FFmpeg logic directly in route files.
- Validate all input before calling a service.
- Use consistent response shapes for success and error cases.
- Use correct HTTP status codes:
  - `200` success
  - `201` created resource
  - `400` validation error
  - `404` not found
  - `500` unexpected server error
- Long-running FFmpeg export jobs must follow the async job pattern: create a job record, return the job ID immediately, process in the background, let the frontend poll for status.

---

## Service Layer Rules

- `export.service.js` handles all FFmpeg logic — no FFmpeg calls anywhere else.
- `asset.service.js` handles all Cloudinary interactions — no Cloudinary calls in route files.
- `clip.service.js` handles timeline reordering — always update positions inside a Prisma transaction.
- Keep services focused: one service, one responsibility.

---

## Server Components vs Client Components

- All components in `app/` are Server Components by default.
- Add `'use client'` only when the component uses:
  - React hooks (`useState`, `useEffect`, `useContext`, etc.)
  - Browser APIs (`window`, `document`, `localStorage`, etc.)
  - Event handlers or drag-and-drop interactions
- Push `'use client'` as far down the tree as possible.
- The timeline drag-and-drop area will always be a Client Component.

---

## Validation and Error Handling

- Validate every request body, query param, and route param before processing.
- Never trust frontend input.
- Return user-friendly error messages for validation failures — never raw stack traces.
- Use shared error classes for known error types (ValidationError, NotFoundError, ExternalServiceError).
- Wrap async route handlers with a shared async handler instead of repeating try/catch everywhere.
- Never leak secret values in API responses.

---

## Data Modeling Rules

- Prisma models must be normalized.
- Add indexes on fields used in frequent lookups (e.g. `projectId + position` on `TimelineClip`).
- Use enums for restricted values (e.g. `MediaType`, `JobStatus`).
- Include `createdAt` and `updatedAt` on all core models.
- Prefer explicit Prisma relations over duplicating related data.
- Name fields consistently across DB, services, and API responses.
- Never store derived data unless it is intentionally cached.

---

## FFmpeg Rules

- All FFmpeg logic lives in `services/export.service.js` and `lib/ffmpeg.js` only.
- Use the concat demuxer pattern with a temp filelist for stitching clips.
- Always clean up temp files in `/tmp` after export completes or fails.
- Use `-c copy` when all clips are the same format to avoid re-encoding.
- Export jobs must be async — never block an API response waiting for FFmpeg to finish.
- Update the `ExportJob` record in Postgres as status changes (PENDING → PROCESSING → COMPLETE / FAILED).

---

## Code Comments

### Imports

- Do not add comments above import statements. Leave all imports clean.

### Functions and Hooks

- Every non-trivial function (more than 2–3 lines or non-obvious logic) must have a comment above it explaining what it does and what it returns:
  ```js
  // Builds a temporary FFmpeg filelist from an ordered array of local file paths.
  // Returns the path to the written filelist.txt file.
  async function buildFilelist(filePaths, outputDir) { ... }
  ```

### Logic Blocks inside Functions

- Non-obvious steps inside a function must be prefixed with a numbered comment:
  ```js
  // 1. Fetch ordered clips from DB
  // 2. Download each asset to /tmp
  // 3. Write filelist.txt for FFmpeg concat demuxer
  // 4. Run FFmpeg and await completion
  // 5. Upload output file to Cloudinary
  // 6. Update ExportJob status to COMPLETE
  // 7. Clean up temp files
  ```

### JSX Sections

- Label major JSX blocks with `{/* ── Section Name ── */}` style comments:
  ```jsx
  {
    /* ── Timeline track ── */
  }
  {
    /* ── Clip drag handles ── */
  }
  {
    /* ── Export controls ── */
  }
  ```

### What NOT to comment

- Self-evident one-liners (`useState`, simple assignments).
- Never restate the code in plain English — explain the _why_, not the _what_.
- No comments above import statements.

---

## Naming Conventions

- Files: `camelCase.js` for utils/services/hooks/lib, `PascalCase.jsx` for components.
- Next.js special files (`page.js`, `layout.js`, `loading.js`, `error.js`, `route.js`) are always lowercase.
- Hooks: always prefix with `use` (e.g. `useTimeline`, `useExportJob`).
- Constants: `UPPER_SNAKE_CASE`.
- CSS classes: `kebab-case`.

---

## Styling

- Tailwind CSS for all styling.
- No inline `style={{}}` props unless the value is truly dynamic (e.g. clip width based on duration).
- Global styles in `app/globals.css`.
- Use class names, not IDs, for styling.

---

## Routing

- File-based routing via the `app/` directory — no routing library needed.
- Use Next.js `<Link>` for navigation — never `<a href>` for internal routes.
- Use `redirect()` from `next/navigation` for programmatic redirects in Server Components.
- Use `useRouter()` from `next/navigation` for programmatic navigation in Client Components.

---

## State Management

- Use React Context + `useReducer` for global state (current project, timeline clips).
- Keep local UI state in `useState` inside Client Components.
- Avoid prop drilling more than 2 levels — lift to context.
- Do not add Redux unless complexity clearly demands it.

---

## Security Rules

- Never hardcode secrets, API keys, database URLs, or Cloudinary credentials.
- All secrets come from environment variables in `.env.local`.
- `NEXT_PUBLIC_` prefix only for values that are safe to expose to the browser.
- Do not log uploaded file contents or user data to the console in production.
- Sanitize and validate all input before use.
- Return generic error messages for sensitive failures.

---

## Testing Rules

- Keep pure calculation logic (e.g. clip position recalculation, filelist building) separate from Next.js request/response objects so they can be unit tested in isolation.
- Prefer unit-testable service functions over large route handler functions.

---

## Environment Variables Reference

```
DATABASE_URL=                  ← PostgreSQL connection string
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

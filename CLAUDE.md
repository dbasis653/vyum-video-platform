# Claude Instructions for this Project

## Code Separation Rules (always follow these)

### Constants

- Never define reusable constants inline in a component or page file.
- All constants go in `lib/constants/<topic>.ts`.
- If a constant is only used in one file and has zero reuse potential, it can stay local. If there is any chance it will be used elsewhere, extract it immediately.
- Examples: social media formats, crop presets, tool definitions, upload limits, folder names, transformation configs.

### Shared Utilities / Singletons

- Third-party SDK configs that are used in more than one file go in `lib/<service>.ts`.
- Example: `lib/cloudinary.ts`, `lib/prisma.ts` — never repeat `.config()` calls across route files.

### Components

- If a UI pattern appears in more than one place, extract it to `components/ui/<ComponentName>.tsx`.
- Feature-specific components go in `components/<feature>/`.
- Page-specific one-off UI that has no reuse potential can stay in the page file.

### Types

- Shared types and interfaces go in `types/` or co-located with their constants file (e.g. `SocialFormat` lives in `lib/constants/socialFormats.ts`).
- Never duplicate a type definition across files.

### General Principle

Before writing any constant, component, or utility inline — ask: "Could this be needed elsewhere?"
If yes, put it in the right shared location from the start.

## Code Comments (always follow these)

### Imports

- Every import of a shared constant, singleton, or utility must have a comment above it explaining:
  1. What the import is (one line)
  2. Why it lives in a shared file instead of inline (one line)
- Example:
  ```ts
  // cloudinary — pre-configured Cloudinary v2 instance (credentials loaded from env)
  // Shared singleton from lib/cloudinary.ts — never repeat cloudinary.config() in a route file.
  import cloudinary from "@/lib/cloudinary";
  ```

### Functions and Hooks

- Every non-trivial function (more than 2–3 lines or non-obvious logic) must have a comment above it explaining:
  - What it does
  - What it takes as input and what it returns (if not obvious from the name/types)
- Example:
  ```ts
  // Calculates a centered crop box that fits within imgW × imgH while preserving the given aspect ratio.
  // Returns a PixelCrop ready to pass directly to react-image-crop.
  function makeCenteredCrop(aspect: number, imgW: number, imgH: number): PixelCrop { ... }
  ```

### Logic Blocks inside Functions

- Non-obvious steps inside a function must be prefixed with a numbered or descriptive comment.
- Example:

  ```ts
  // 1. Authenticate — must be outside try/catch so the 401 is returned correctly
  const { userId } = await auth();

  // 2. Look up DB user row — webhook creates this on first sign-up
  const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });

  // 3. Upload to Cloudinary with auto quality compression
  const result = await new Promise(...)
  ```

### JSX Sections

- Major JSX blocks must have a short comment label. Use the existing `{/* ── Label ── */}` style.
- Example:
  ```tsx
  {
    /* ── Preset buttons ── */
  }
  {
    /* ── Crop canvas + preview ── */
  }
  {
    /* ── Action buttons ── */
  }
  ```

### What NOT to comment

- Do not comment self-evident one-liners (e.g. `useState`, simple assignments).
- Do not restate the code in plain English — explain the _why_, not the _what_.

## Folder Structure Reference

```
lib/
  cloudinary.ts              ← Cloudinary singleton
  prisma.ts                  ← Prisma singleton
  constants/
    socialFormats.ts
    cropPresets.ts
    playgroundTools.ts
    uploadLimits.ts
    ...

components/
  ui/                        ← generic reusable UI (Button, Modal, Spinner, etc.)
  <feature>/                 ← feature-specific components (video/, image/, playground/, etc.)

types/                       ← shared TypeScript types/interfaces
```

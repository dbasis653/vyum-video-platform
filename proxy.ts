/**
 * middleware.ts  (project root)
 *
 * Runs on every request before it reaches a page or API route.
 * Merged from the original proxy.ts + the new onboarding-gate logic.
 *
 * Responsibilities:
 *
 *   1. Redirect logged-in users away from auth pages (/sign-in, /sign-up) → /home
 *      (same UX behaviour proxy.ts had)
 *
 *   2. Require authentication for every non-public route.
 *      Unauthenticated users accessing a protected page → /sign-in.
 *
 *   3. Onboarding gate — authenticated users who haven't chosen a username yet
 *      are redirected to /onboarding before they can access any app page.
 *
 * Why we DON'T query the database here:
 *   Next.js middleware runs on the Edge runtime; Prisma (Node.js) cannot run here.
 *   Instead, when a user completes onboarding (/api/user/onboarding PATCH), we set
 *   Clerk's publicMetadata.onboardingComplete = true. That flag is embedded in the
 *   JWT session claims and readable from sessionClaims — no DB round-trip needed.
 *
 * Public routes (no auth required):
 *   /                     — landing page
 *   /sign-in(.*)          — Clerk auth flow
 *   /sign-up(.*)          — Clerk auth flow
 *   /api/webhooks/clerk   — Clerk webhook (verified by svix, not Clerk session)
 *
 * Auth-gated but NOT onboarding-gated:
 *   /onboarding           — the username-pick page itself (must stay reachable
 *                           before onboarding is complete)
 *
 * Note on removed isPublicApiRoute from proxy.ts:
 *   /api/videos and /api/images were previously listed as public API routes because
 *   their GET handlers had no auth. Those handlers now require auth (added in the
 *   Clerk-user-sync session), so that exemption is no longer needed.
 */

import {
  clerkMiddleware,
  createRouteMatcher,
  clerkClient,
} from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// ─── Route classifiers ────────────────────────────────────────────────────────

// Routes that are fully public — no session required at all
const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/api/webhooks/clerk", // uses svix HMAC verification, not Clerk session
]);

// Auth pages specifically — used to redirect already-logged-in users away
const isAuthPage = createRouteMatcher(["/sign-in(.*)", "/sign-up(.*)"]);

// The onboarding page AND its API are reachable while authenticated but NOT yet onboarded.
// Without /api/user/onboarding here, the PATCH from the form gets intercepted by the
// onboarding gate (onboardingComplete is still false at submit time) and redirected to
// the /onboarding HTML page. fetch() then receives HTML instead of JSON → res.json()
// throws → catch block fires → "Network error". Adding the API route here fixes it.
const isOnboardingRoute = createRouteMatcher([
  "/onboarding",
  "/api/user/onboarding",
]);

// ─── Middleware logic ─────────────────────────────────────────────────────────

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth();

  // 1. Logged-in user hitting /sign-in or /sign-up → send them to /home.
  //    Prevents showing the auth pages to someone who is already signed in.
  //    (Mirrors the behaviour from the original proxy.ts)
  if (userId && isAuthPage(req)) {
    return NextResponse.redirect(new URL("/home", req.url));
  }

  // 2. All other public routes (/, /api/webhooks/clerk) — let through with no
  //    further checks. The webhook route does its own svix signature verification.
  if (isPublicRoute(req)) return;

  // 3. Not logged in and not a public route → redirect to /sign-in.
  //    (Replaces the manual !isPublicRoute && !isPublicApiRoute check in proxy.ts)
  if (!userId) {
    return NextResponse.redirect(new URL("/sign-in", req.url));
  }

  // 4. User is authenticated — let them reach /onboarding without checking
  //    whether onboarding is complete (would cause an infinite redirect loop).
  if (isOnboardingRoute(req)) return;

  // 5. Onboarding gate.
  //
  //    Fast path: JWT already says onboarding is done — trust it and skip the API call.
  //    This is the common case for every request after onboarding is complete.
  const claimsComplete =
    (sessionClaims?.publicMetadata as { onboardingComplete?: boolean })
      ?.onboardingComplete ?? false;

  if (claimsComplete) return NextResponse.next();

  //    Slow path: JWT says onboardingComplete is false, but it might be stale.
  //    Clerk publicMetadata is updated server-side instantly, but the signed JWT
  //    in the __session cookie is only refreshed when it expires (~60s TTL).
  //    So right after a user completes onboarding, the JWT still has the old value.
  //    We call the Clerk backend to get the real, current metadata.
  //    This branch runs at most once per user — only during that ~60s stale window —
  //    then the JWT catches up and the fast path handles all future requests.
  const client = await clerkClient();
  const user = await client.users.getUser(userId);
  const backendComplete =
    (user.publicMetadata as { onboardingComplete?: boolean })
      ?.onboardingComplete ?? false;

  if (!backendComplete) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  // JWT was stale but backend confirms onboarding is done — let through
  return NextResponse.next();
});

// ─── Matcher ─────────────────────────────────────────────────────────────────
// Taken from proxy.ts — covers all non-static paths AND API routes explicitly.

export const config = {
  matcher: [
    "/((?!.*\\..*|_next).*)", // all paths except static files and Next.js internals
    "/", // always run for the root
    "/(api|trpc)(.*)", // always run for API routes
  ],
};

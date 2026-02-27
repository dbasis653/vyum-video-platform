/**
 * app/api/user/onboarding/route.ts
 *
 * PATCH /api/user/onboarding
 *
 * Called by the onboarding page once the user submits their chosen username.
 *
 * What it does:
 *   1. Verifies the Clerk session (rejects unauthenticated requests).
 *   2. Validates the username (alphanumeric + underscores, 3–20 chars, unique).
 *   3. Saves the username to our DB User row (looked up by Clerk's userId).
 *   4. Updates Clerk's publicMetadata to set onboardingComplete: true.
 *
 * Why we touch Clerk's metadata:
 *   middleware.ts runs on the Edge runtime — Prisma (Node.js) cannot run there.
 *   Instead of querying the DB in middleware, we store a lightweight flag in
 *   Clerk's session claims. The flag is readable from sessionClaims in middleware
 *   without any DB round-trip, keeping the auth check fast.
 */

import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

// Helper: fetch the primary email from Clerk (used when the webhook missed creating the row)
async function getClerkEmail(userId: string): Promise<string> {
  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);
  const primary = clerkUser.emailAddresses.find(
    (e) => e.id === clerkUser.primaryEmailAddressId,
  );
  return primary?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress ?? "";
}

// Regex: only letters, digits, and underscores; 3 to 20 characters
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,20}$/;

export async function PATCH(request: NextRequest) {
  // 1. Authenticate — get the Clerk userId from the active session
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse and validate the username from the request body
  let username: string;
  try {
    const body = await request.json();
    username = (body.username ?? "").trim();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!username) {
    return NextResponse.json(
      { error: "Username is required" },
      { status: 400 },
    );
  }

  if (!USERNAME_REGEX.test(username)) {
    return NextResponse.json(
      {
        error:
          "Username must be 3–20 characters and contain only letters, numbers, or underscores",
      },
      { status: 400 },
    );
  }

  // 3. Check uniqueness — Prisma will throw P2002 on unique constraint violation,
  //    but an explicit pre-check gives us a friendlier error message
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    return NextResponse.json(
      { error: "That username is already taken" },
      { status: 400 },
    );
  }

  // 4. Save username to the DB.
  //    Use upsert instead of update so this also handles the case where the
  //    Clerk webhook (user.created) failed to create the User row — e.g. because
  //    Prisma wasn't generated yet. In that case we fetch the email from Clerk and
  //    create the row on the spot, so onboarding still succeeds.
  try {
    const email = await getClerkEmail(userId);
    await prisma.user.upsert({
      where: { clerkId: userId },
      // If the row already exists (normal path), just set the username
      update: { username },
      // If the row is missing (webhook failed), create it now with the email from Clerk
      create: { clerkId: userId, email, username },
    });
  } catch (err: unknown) {
    // P2002 = unique constraint violation (race condition between pre-check and upsert)
    if ((err as { code?: string })?.code === "P2002") {
      return NextResponse.json(
        { error: "That username is already taken" },
        { status: 400 },
      );
    }
    throw err;
  }

  // 5. Mark onboarding as complete in Clerk's publicMetadata.
  //    middleware.ts reads sessionClaims.publicMetadata.onboardingComplete to
  //    decide whether to redirect the user back to /onboarding.
  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    publicMetadata: { onboardingComplete: true },
  });

  return NextResponse.json({ success: true });
}

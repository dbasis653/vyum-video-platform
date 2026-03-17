// prisma — shared PrismaClient singleton; never instantiate PrismaClient locally.
// Singleton prevents connection pool exhaustion in serverless environments.
import { prisma } from "@/lib/prisma";

// clerkClient — Clerk server SDK; imported here because the service needs to fetch the user's
// email on upsert and update publicMetadata after the DB write. Kept here (not in the route)
// so the Clerk API calls stay with the business logic they support.
import { clerkClient } from "@clerk/nextjs/server";

// ─── Private helpers ──────────────────────────────────────────────────────────

// Fetches the primary email address from Clerk for a given userId.
// Used when the Clerk webhook missed creating the User row and we need the email for upsert.
async function getClerkEmail(userId: string): Promise<string> {
  const client = await clerkClient();
  const clerkUser = await client.users.getUser(userId);
  const primary = clerkUser.emailAddresses.find(
    (e) => e.id === clerkUser.primaryEmailAddressId,
  );
  return primary?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress ?? "";
}

// ─── completeOnboarding ───────────────────────────────────────────────────────

// Saves the chosen username to the DB User row and sets onboardingComplete in Clerk publicMetadata.
// Uses upsert to handle the case where the Clerk webhook missed creating the User row
// (race condition on very first sign-in).
// Throws an { status: 400 } error if the username is already taken.
export async function completeOnboarding(clerkUserId: string, username: string) {
  // 1. Check uniqueness — explicit pre-check gives a friendlier error than the P2002 constraint
  const existing = await prisma.user.findUnique({ where: { username } });
  if (existing) {
    const err = new Error("That username is already taken") as Error & { status: number };
    err.status = 400;
    throw err;
  }

  // 2. Upsert the User row with the new username.
  //    If the row is missing (webhook failed), create it with the email fetched from Clerk.
  try {
    const email = await getClerkEmail(clerkUserId);
    await prisma.user.upsert({
      where: { clerkId: clerkUserId },
      update: { username },
      create: { clerkId: clerkUserId, email, username },
    });
  } catch (err: unknown) {
    // P2002 = unique constraint violation (race condition between pre-check and upsert)
    if ((err as { code?: string })?.code === "P2002") {
      const e = new Error("That username is already taken") as Error & { status: number };
      e.status = 400;
      throw e;
    }
    throw err;
  }

  // 3. Mark onboarding as complete in Clerk's publicMetadata.
  //    middleware.ts reads sessionClaims.publicMetadata.onboardingComplete to decide
  //    whether to redirect the user back to /onboarding — no DB round-trip needed there.
  const client = await clerkClient();
  await client.users.updateUserMetadata(clerkUserId, {
    publicMetadata: { onboardingComplete: true },
  });
}

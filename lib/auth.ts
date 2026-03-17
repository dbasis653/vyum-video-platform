// prisma — shared PrismaClient singleton; never instantiate PrismaClient locally.
// Singleton prevents connection pool exhaustion in serverless environments.
import { prisma } from "@/lib/prisma";

// Looks up the DB User row corresponding to a Clerk userId.
// Returns the User row, or null if the webhook hasn't created it yet (race condition on first sign-in).
// Shared across all service functions that need to resolve the internal UUID from a Clerk session.
export async function resolveDbUser(clerkUserId: string) {
  return prisma.user.findUnique({ where: { clerkId: clerkUserId } });
}

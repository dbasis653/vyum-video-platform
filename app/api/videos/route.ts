/**
 * app/api/videos/route.ts
 *
 * GET /api/videos
 *
 * Returns only the videos that belong to the currently logged-in user.
 * Previously this returned all videos globally — the where clause now scopes
 * results to the user's own uploads via the User → Video relation.
 *
 * Why we filter by user:
 *   Each video row has a userId foreign key linking it to a User row that stores
 *   the Clerk ID. We filter through that relation so one user never sees another
 *   user's videos.
 */

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  // 1. Require an active Clerk session — return 401 if not signed in
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // 2. Fetch only this user's videos by filtering through the User relation.
    //    Prisma translates `user: { clerkId: userId }` to a JOIN on the User
    //    table, matching rows where User.clerkId equals the current Clerk userId.
    const videos = await prisma.video.findMany({
      where: {
        user: { clerkId: userId },
      },
      orderBy: { createdAt: "desc" },
    });

    // 3. Normalise size strings to numbers for the client
    const dto = videos.map((video) => ({
      ...video,
      originalSize: Number(video.originalSize),
      compressedSize: Number(video.compressedSize),
    }));

    return NextResponse.json(dto);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 },
    );
  }
}

/**
 * app/api/images/route.ts
 *
 * GET /api/images
 *
 * Returns only the images that belong to the currently logged-in user.
 * Previously this returned all images globally — the where clause now scopes
 * results to the user's own uploads via the User → Image relation.
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
    // 2. Fetch only this user's images by filtering through the User relation.
    //    Same pattern as videos/route.ts — filter by User.clerkId.
    const images = await prisma.image.findMany({
      where: {
        user: { clerkId: userId },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(images);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch images" },
      { status: 500 },
    );
  }
}

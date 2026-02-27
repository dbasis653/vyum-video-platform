/**
 * app/api/videos/[id]/route.ts
 *
 * PATCH /api/videos/[id]  — update title/description of a video
 * DELETE /api/videos/[id] — remove video from Cloudinary and the DB
 *
 * Change from before:
 *   Added an ownership check to both handlers. After verifying the Clerk session,
 *   we look up the video and confirm that its userId matches the requesting user's
 *   DB row. If it doesn't match, we return 403 Forbidden — preventing one user
 *   from editing or deleting another user's content.
 *
 * Ownership check pattern:
 *   1. Get Clerk userId from auth()
 *   2. Find the DB User by clerkId → get dbUser.id (our internal UUID)
 *   3. Find the Video by the route param id
 *   4. Assert video.userId === dbUser.id → 403 if not
 */

import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ─── Helper: resolve DB user from Clerk session ───────────────────────────────

async function resolveDbUser(clerkUserId: string) {
  return prisma.user.findUnique({ where: { clerkId: clerkUserId } });
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // 1. Authenticate
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const body = await request.json();
    const { title, description } = body as {
      title: string;
      description?: string;
    };

    if (!title || typeof title !== "string" || title.trim() === "") {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // 2. Fetch the video — need it to check ownership before updating
    const video = await prisma.video.findUnique({ where: { id } });
    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // 3. Resolve the DB user and verify they own this video
    const dbUser = await resolveDbUser(userId);
    if (!dbUser || video.userId !== dbUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 4. Apply the update — ownership confirmed
    const updated = await prisma.video.update({
      where: { id },
      data: { title: title.trim(), description: description ?? null },
    });

    return NextResponse.json({
      ...updated,
      originalSize: Number(updated.originalSize),
      compressedSize: Number(updated.compressedSize),
    });
  } catch (error: unknown) {
    if ((error as { code?: string })?.code === "P2025") {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to update video" },
      { status: 500 },
    );
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  // 1. Authenticate
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // 2. Fetch the video to verify it exists and check ownership
    const video = await prisma.video.findUnique({ where: { id } });
    if (!video) {
      return NextResponse.json({ error: "Video not found" }, { status: 404 });
    }

    // 3. Resolve the DB user and verify they own this video
    const dbUser = await resolveDbUser(userId);
    if (!dbUser || video.userId !== dbUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 4. Delete from Cloudinary first, then from the DB
    await cloudinary.uploader.destroy(video.publicId, {
      resource_type: "video",
    });
    await prisma.video.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete video" },
      { status: 500 },
    );
  }
}

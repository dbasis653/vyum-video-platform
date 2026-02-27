/**
 * app/api/images/[id]/route.ts
 *
 * PATCH /api/images/[id]  — update the title of an image
 * DELETE /api/images/[id] — remove image from Cloudinary and the DB
 *
 * Change from before:
 *   Added an ownership check to both handlers. After verifying the Clerk session,
 *   we look up the image and confirm that its userId matches the requesting user's
 *   DB row. If it doesn't match, we return 403 Forbidden — preventing one user
 *   from editing or deleting another user's content.
 *
 * Same ownership pattern as app/api/videos/[id]/route.ts.
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
    const { title } = body as { title: string };

    if (!title || typeof title !== "string" || title.trim() === "") {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    // 2. Fetch the image — need it to check ownership before updating
    const image = await prisma.image.findUnique({ where: { id } });
    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // 3. Resolve the DB user and verify they own this image
    const dbUser = await resolveDbUser(userId);
    if (!dbUser || image.userId !== dbUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 4. Apply the update — ownership confirmed
    const updated = await prisma.image.update({
      where: { id },
      data: { title: title.trim() },
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    if ((error as { code?: string })?.code === "P2025") {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Failed to update image" },
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
    // 2. Fetch the image to verify it exists and check ownership
    const image = await prisma.image.findUnique({ where: { id } });
    if (!image) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    // 3. Resolve the DB user and verify they own this image
    const dbUser = await resolveDbUser(userId);
    if (!dbUser || image.userId !== dbUser.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 4. Delete from Cloudinary first, then from the DB
    await cloudinary.uploader.destroy(image.publicId, {
      resource_type: "image",
    });
    await prisma.image.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to delete image" },
      { status: 500 },
    );
  }
}

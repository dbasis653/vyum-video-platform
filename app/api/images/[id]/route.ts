import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// getImageById / updateImage / deleteImage — image CRUD with ownership checks.
// Extracted to services/image.service.ts — keeps this route file thin (HTTP concerns only).
import { getImageById, updateImage, deleteImage } from "@/services/image.service";

// Maps a service error (with optional .status) to a NextResponse.
function serviceError(err: unknown) {
  const e = err as { status?: number; message?: string };
  return NextResponse.json(
    { error: e.message ?? "Internal server error" },
    { status: e.status ?? 500 },
  );
}

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    return NextResponse.json(await getImageById(userId, id));
  } catch (err) {
    return serviceError(err);
  }
}

// ─── PATCH ────────────────────────────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { title } = body as { title: string };

  if (!title || typeof title !== "string" || title.trim() === "") {
    return NextResponse.json({ error: "Title is required" }, { status: 400 });
  }

  try {
    return NextResponse.json(await updateImage(userId, id, { title }));
  } catch (err) {
    return serviceError(err);
  }
}

// ─── DELETE ───────────────────────────────────────────────────────────────────

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  try {
    return NextResponse.json(await deleteImage(userId, id));
  } catch (err) {
    return serviceError(err);
  }
}

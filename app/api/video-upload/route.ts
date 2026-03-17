import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// uploadVideo — uploads a video to Cloudinary with compression, creates the DB row.
// Extracted to services/video.service.ts — keeps this route file thin (HTTP concerns only).
import { uploadVideo } from "@/services/video.service";

// Maps a service error (with optional .status) to a NextResponse.
function serviceError(err: unknown) {
  const e = err as { status?: number; message?: string };
  return NextResponse.json(
    { error: e.message ?? "Internal server error" },
    { status: e.status ?? 500 },
  );
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Validate Cloudinary env vars before attempting upload — fail fast with a clear error.
  if (
    !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    return NextResponse.json({ error: "Cloudinary credentials not found" }, { status: 500 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const originalSize = formData.get("originalSize") as string;

    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const video = await uploadVideo(userId, { file, title, description, originalSize });
    return NextResponse.json({ video }, { status: 200 });
  } catch (err) {
    return serviceError(err);
  }
}

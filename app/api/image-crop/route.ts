import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

// cropImage / CropImageParams — applies a crop transformation and saves the result.
// Extracted to services/image.service.ts — keeps this route file thin (HTTP concerns only).
import { cropImage, type CropImageParams } from "@/services/image.service";

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

  const body = (await request.json()) as CropImageParams;
  const { imageId, mode, w, h } = body;

  if (!imageId || !mode || w === 0 || h === 0) {
    return NextResponse.json({ error: "Invalid crop parameters" }, { status: 400 });
  }

  try {
    const result = await cropImage(userId, body);
    // "copy" creates a new resource → 201; "overwrite" updates existing → 200
    return NextResponse.json(result, { status: mode === "copy" ? 201 : 200 });
  } catch (err) {
    return serviceError(err);
  }
}

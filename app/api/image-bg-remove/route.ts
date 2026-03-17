import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import {
  bgRemoveImage,
  type BgRemoveImageParams,
} from "@/services/image.service";

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
  if (!userId)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await request.json()) as BgRemoveImageParams;
  const { imageId, mode } = body;

  if (!imageId || !mode) {
    return NextResponse.json(
      { error: "Missing required fields: imageId, mode" },
      { status: 400 },
    );
  }

  try {
    const result = await bgRemoveImage(userId, body);
    // "copy" creates a new resource → 201; "preview"/"overwrite" → 200
    return NextResponse.json(result, { status: mode === "copy" ? 201 : 200 });
  } catch (err) {
    return serviceError(err);
  }
}

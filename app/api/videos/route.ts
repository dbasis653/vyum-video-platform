import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { getVideos } from "@/services/video.service";

// Maps a service error (with optional .status) to a NextResponse.
function serviceError(err: unknown) {
  const e = err as { status?: number; message?: string };
  return NextResponse.json(
    { error: e.message ?? "Internal server error" },
    { status: e.status ?? 500 },
  );
}

export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    return NextResponse.json(await getVideos(userId));
  } catch (err) {
    return serviceError(err);
  }
}

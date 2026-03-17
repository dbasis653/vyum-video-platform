import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";

import { uploadImage } from "@/services/image.service";

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

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string) || "Untitled";

    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const result = await uploadImage(userId, file, title);
    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return serviceError(err);
  }
}

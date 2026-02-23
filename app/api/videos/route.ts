import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const videos = await prisma.video.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(videos);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 },
    );
  }
}

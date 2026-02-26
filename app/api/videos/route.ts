import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const videos = await prisma.video.findMany({
      orderBy: {
        createdAt: "desc",
      },
    });

    const dto = videos.map((video) => ({
      ...video,
      originalSize: Number(video.originalSize),
      compressedSize: Number(video.compressedSize),
    }));

    return NextResponse.json(dto);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch videos" },
      { status: 500 },
    );
  }
}

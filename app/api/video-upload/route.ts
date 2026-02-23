import { NextRequest, NextResponse } from "next/server";

import { v2 as cloudinary } from "cloudinary";

import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client/extension";
// import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

//CONCEPT:
//Upload the video whichj will have it's metadata, send a response with those metadata
//so that we can store those metadata in our DB,

// Configuration
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface CloudinaryUploadResult {
  public_id: string;
  bytes: number;
  duration?: number;
  [key: string]: any; // Include other properties returned by Cloudinary
}

export async function POST(request: NextRequest) {
  const { userId } = await auth();

  try {
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      !process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      return NextResponse.json(
        { error: "Cloudinary credentials not found" },
        { status: 500 },
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const originalSize = formData.get("originalSize") as string;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const result = await new Promise<CloudinaryUploadResult>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            resource_type: "video",
            folder: "vyum-videos",
            transformation: [{ quality: "auto", fetch_format: "mp4" }],
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result as CloudinaryUploadResult);
          },
        );
        uploadStream.end(buffer);
      },
    );
    const video = await prisma.video.create({
      data: {
        title,
        description,
        originalSize: originalSize,
        compressedSize: String(result.bytes),
        duration: result.duration || 0,
        publicId: result.public_id,
      },
    });
    return NextResponse.json({ video }, { status: 200 });
  } catch (error) {
    console.log("Upload video falied", error);
    return NextResponse.json({ error: "Upload video failed" }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

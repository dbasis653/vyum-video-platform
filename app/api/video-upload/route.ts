/**
 * app/api/video-upload/route.ts
 *
 * POST /api/video-upload
 *
 * Uploads a video to Cloudinary with compression, then stores metadata in DB.
 *
 * Changes from before:
 *   1. Replaced the local PrismaClient instantiation (PrismaPg + new PrismaClient)
 *      with the shared singleton from lib/prisma.ts — avoids connection leaks and
 *      keeps all DB access consistent.
 *   2. Removed the `prisma.$disconnect()` in finally — the shared singleton must
 *      stay connected across requests; disconnecting would break other routes.
 *   3. The Video row is now linked to the uploading user via userId (FK → User.id).
 *
 * How ownership is set:
 *   After auth(), we look up the User row by clerkId and pass dbUser.id as
 *   userId when creating the Video record.
 */

import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma"; // shared singleton — replaces the old local client

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
  [key: string]: unknown;
}

export async function POST(request: NextRequest) {
  console.log("post request starts...");

  // 1. Authenticate — must be outside try/catch so the 401 is returned correctly
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Look up the DB User row so we have the internal UUID for the FK.
  //    The Clerk webhook (user.created) creates this row on first sign-up.
  const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!dbUser) {
    return NextResponse.json(
      { error: "User account not ready. Please refresh and try again." },
      { status: 404 },
    );
  }

  try {
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

    console.log("formData will set now...");

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string;
    const description = formData.get("description") as string;
    const originalSize = formData.get("originalSize") as string;

    console.log("formData set...");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    console.log("arrayBuffer will set now...");
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    console.log("arrayBuffer set...");

    // 3. Upload to Cloudinary with auto quality compression
    const result = await new Promise<CloudinaryUploadResult>(
      (resolve, reject) => {
        console.log("upload stream starts to store in cloudinary...");

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
        console.log("upload to cloudinary done");

        uploadStream.end(buffer);
      },
    );

    // 4. Store video metadata in DB, linking it to its owner via userId
    console.log("store the video info in the DB...");

    const video = await prisma.video.create({
      data: {
        title,
        description,
        originalSize,
        compressedSize: String(result.bytes),
        duration: result.duration || 0,
        publicId: result.public_id,
        userId: dbUser.id, // ← foreign key linking video to the uploading user
      },
    });

    console.log("stored to DB...");

    return NextResponse.json({ video }, { status: 200 });
  } catch (error) {
    console.log("Upload video failed", error);
    return NextResponse.json({ error: "Upload video failed" }, { status: 500 });
  }
  // Note: no prisma.$disconnect() here — the shared singleton stays alive
}

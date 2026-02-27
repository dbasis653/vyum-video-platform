/**
 * app/api/image-upload/route.ts
 *
 * POST /api/image-upload
 *
 * Uploads an image to Cloudinary, then stores the metadata in the DB.
 * Change from before: the Image row is now linked to the uploading user
 * via userId (foreign key → User.id).
 *
 * How ownership is set:
 *   1. We get the Clerk userId from the active session.
 *   2. We look up the corresponding User row in our DB using clerkId.
 *   3. We pass dbUser.id as userId when creating the Image record.
 */

import { NextRequest, NextResponse } from "next/server";
import { v2 as cloudinary } from "cloudinary";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

interface CloudinaryUploadResult {
  public_id: string;
  width: number;
  height: number;
  [key: string]: unknown;
}

export async function POST(request: NextRequest) {
  // 1. Authenticate
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Look up the DB User row so we have the internal UUID to use as a FK.
  //    The webhook (user.created) creates this row when the user signs up.
  const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!dbUser) {
    // This can happen if the Clerk webhook hasn't fired yet (race condition on
    // very first sign-in). Asking the user to retry is acceptable for now.
    return NextResponse.json(
      { error: "User account not ready. Please refresh and try again." },
      { status: 404 },
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = (formData.get("title") as string) || "Untitled";

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // 3. Upload to Cloudinary
    const result = await new Promise<CloudinaryUploadResult>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { folder: "images" },
          (error, result) => {
            if (error) reject(error);
            else resolve(result as CloudinaryUploadResult);
          },
        );
        uploadStream.end(buffer);
      },
    );

    // 4. Store metadata in DB, linking the image to its owner via userId
    await prisma.image.create({
      data: {
        title: title.trim(),
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        userId: dbUser.id, // ← foreign key linking image to the uploading user
      },
    });

    return NextResponse.json({ publicId: result.public_id }, { status: 200 });
  } catch (error) {
    console.log("Upload img failed", error);
    return NextResponse.json({ error: "Upload img failed" }, { status: 500 });
  }
}

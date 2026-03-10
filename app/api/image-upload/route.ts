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
// cloudinary — pre-configured Cloudinary v2 instance (cloud_name, api_key, api_secret loaded from env)
// Using the shared singleton from lib/cloudinary.ts so config is never repeated across route files.
import cloudinary from "@/lib/cloudinary";
import { auth } from "@clerk/nextjs/server";
// prisma — shared PrismaClient singleton; never instantiate PrismaClient locally in a route.
// Using a singleton prevents connection pool exhaustion in serverless/Edge environments.
import { prisma } from "@/lib/prisma";

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
    const image = await prisma.image.create({
      data: {
        title: title.trim(),
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        userId: dbUser.id, // ← foreign key linking image to the uploading user
      },
    });

    // Return both the DB UUID (for playground navigation) and publicId (for Cloudinary ops)
    return NextResponse.json({ id: image.id, publicId: result.public_id }, { status: 200 });
  } catch (error) {
    console.log("Upload img failed", error);
    return NextResponse.json({ error: "Upload img failed" }, { status: 500 });
  }
}

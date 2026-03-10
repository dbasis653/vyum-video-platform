/**
 * app/api/image-crop/route.ts
 *
 * POST /api/image-crop
 *
 * Applies a crop to an existing image using Cloudinary transformations.
 *
 * mode: "copy"      → uploads cropped version as a new asset, creates a new DB row
 * mode: "overwrite" → replaces the existing Cloudinary asset + updates the DB row
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
  // 1. Auth
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse body
  const body = await request.json();
  const { imageId, x, y, w, h, mode, title } = body as {
    imageId: string;
    x: number;
    y: number;
    w: number;
    h: number;
    mode: "copy" | "overwrite";
    title?: string;
  };

  if (!imageId || !mode || w === 0 || h === 0) {
    return NextResponse.json(
      { error: "Invalid crop parameters" },
      { status: 400 },
    );
  }

  // 3. Fetch image + ownership check
  const image = await prisma.image.findUnique({ where: { id: imageId } });
  if (!image) {
    return NextResponse.json({ error: "Image not found" }, { status: 404 });
  }

  const dbUser = await prisma.user.findUnique({ where: { clerkId: userId } });
  if (!dbUser || image.userId !== dbUser.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 4. Build the Cloudinary transformation URL
  //    Cloudinary fetches and renders this URL when we call uploader.upload()
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const transformedUrl = `https://res.cloudinary.com/${cloudName}/image/upload/c_crop,x_${x},y_${y},w_${w},h_${h}/${image.publicId}`;

  try {
    if (mode === "copy") {
      // Upload as a brand new asset
      const result = await new Promise<CloudinaryUploadResult>(
        (resolve, reject) => {
          cloudinary.uploader.upload(
            transformedUrl,
            { folder: "images" },
            (error, result) => {
              if (error) reject(error);
              else resolve(result as CloudinaryUploadResult);
            },
          );
        },
      );

      // Create a new DB row for the cropped copy
      const newImage = await prisma.image.create({
        data: {
          title: title ?? `${image.title}_cropped`,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          userId: dbUser.id,
        },
      });

      return NextResponse.json(newImage, { status: 201 });
    } else {
      // Overwrite: upload with the same public_id + invalidate CDN cache
      const result = await new Promise<CloudinaryUploadResult>(
        (resolve, reject) => {
          cloudinary.uploader.upload(
            transformedUrl,
            {
              public_id: image.publicId,
              overwrite: true,
              invalidate: true,
            },
            (error, result) => {
              if (error) reject(error);
              else resolve(result as CloudinaryUploadResult);
            },
          );
        },
      );

      // Update the DB row with the new dimensions
      const updated = await prisma.image.update({
        where: { id: imageId },
        data: { width: result.width, height: result.height },
      });

      return NextResponse.json(updated);
    }
  } catch (error) {
    console.error("image-crop failed", error);
    return NextResponse.json({ error: "Failed to save crop" }, { status: 500 });
  }
}

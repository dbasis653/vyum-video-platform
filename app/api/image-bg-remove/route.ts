/**
 * app/api/image-bg-remove/route.ts
 *
 * POST /api/image-bg-remove
 *
 * Applies Cloudinary AI background removal to an existing image.
 *
 * Strategy: build an on-the-fly transformation URL, then server-side poll it
 * (HEAD requests) until Cloudinary returns 200 (finished processing, cached).
 * This avoids the 400 error caused by passing an async Cloudinary transformation
 * URL as a source to uploader.upload().
 *
 * saveMode: "preview"   → polls until ready, returns the cached on-the-fly URL — no DB write
 * saveMode: "copy"      → polls until ready, uploads the cached URL as a new asset + DB row
 * saveMode: "overwrite" → polls until ready, re-uploads with same public_id + updates DB row
 */

import { NextRequest, NextResponse } from "next/server";
// cloudinary — pre-configured Cloudinary v2 instance (credentials loaded from env)
// Shared singleton from lib/cloudinary.ts — never repeat cloudinary.config() in a route file.
import cloudinary from "@/lib/cloudinary";
import { auth } from "@clerk/nextjs/server";
// prisma — shared PrismaClient singleton; never instantiate PrismaClient locally in a route.
// Using a singleton prevents connection pool exhaustion in serverless environments.
import { prisma } from "@/lib/prisma";
// BG_REMOVE_EFFECT / BG_REMOVE_FINE_EDGES_EFFECT / BG_REMOVE_FOLDER — reusable Cloudinary
// transformation strings and folder name; kept in lib/constants to avoid inline duplication.
import {
  BG_REMOVE_EFFECT,
  BG_REMOVE_FINE_EDGES_EFFECT,
  BG_REMOVE_FOLDER,
  type BgOutput,
} from "@/lib/constants/bgRemove";

interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  [key: string]: unknown;
}

// Polls a Cloudinary on-the-fly URL with GET requests until it returns 200.
// Cloudinary returns 423 while the async transformation is still processing.
// Must use GET (not HEAD) — HEAD does not trigger on-the-fly processing.
// Retries every 2s up to 20 times (~40s max) before giving up.
async function waitForReady(url: string): Promise<void> {
  for (let i = 0; i < 20; i++) {
    const res = await fetch(url, { method: "GET" });
    if (res.ok) return;
    if (res.status !== 423) {
      throw new Error(`Cloudinary returned unexpected status ${res.status}`);
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  throw new Error("Background removal timed out after 40s");
}

export async function POST(request: NextRequest) {
  // 1. Auth — must be outside try/catch so the 401 is returned correctly
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse body
  const body = await request.json();
  const {
    imageId,
    fineEdges = false,
    bgOutput = "transparent",
    saveMode,
    title,
  } = body as {
    imageId: string;
    fineEdges?: boolean;
    bgOutput?: BgOutput;
    saveMode: "preview" | "copy" | "overwrite";
    title?: string;
  };

  if (!imageId || !saveMode) {
    return NextResponse.json(
      { error: "Missing required fields: imageId, saveMode" },
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

  // 4. Choose the effect string based on fineEdges toggle
  const effect = fineEdges ? BG_REMOVE_FINE_EDGES_EFFECT : BG_REMOVE_EFFECT;

  // 5. Build the on-the-fly transformation URL
  //    e_background_removal is async — Cloudinary returns 423 until processing is done.
  //    We poll server-side so the client only receives a URL that is already cached (200).
  //
  //    bgOutput "transparent": chain f_png as a separate step (slash-separated) to force PNG
  //      output — PNG supports alpha so transparent areas are preserved.
  //      NOTE: f_png must NOT be combined in the same step as e_background_removal (causes 400).
  //    bgOutput "white": chain b_white to fill transparent areas with white, keeps original format.
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const outputStep = bgOutput === "transparent" ? "f_png" : "b_white";
  const bgRemovedUrl = `https://res.cloudinary.com/${cloudName}/image/upload/e_${effect}/${outputStep}/${image.publicId}`;

  try {
    // 6. Block until Cloudinary has finished processing (polls every 2s)
    await waitForReady(bgRemovedUrl);

    if (saveMode === "preview") {
      // URL is cached and immediately loadable — return it without any DB write.
      return NextResponse.json({ url: bgRemovedUrl });
    }

    if (saveMode === "copy") {
      // The URL is now cached (200), so uploader.upload() can fetch it without error.
      const result = await new Promise<CloudinaryUploadResult>(
        (resolve, reject) => {
          cloudinary.uploader.upload(
            bgRemovedUrl,
            { folder: BG_REMOVE_FOLDER },
            (error, result) => {
              if (error) reject(error);
              else resolve(result as CloudinaryUploadResult);
            },
          );
        },
      );

      // Create a new DB row for the bg-removed copy
      const newImage = await prisma.image.create({
        data: {
          title: title ?? `${image.title}_bg_removed`,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          userId: dbUser.id,
        },
      });

      return NextResponse.json(newImage, { status: 201 });
    }

    // saveMode === "overwrite"
    // Upload with the same public_id + invalidate CDN cache
    const result = await new Promise<CloudinaryUploadResult>(
      (resolve, reject) => {
        cloudinary.uploader.upload(
          bgRemovedUrl,
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

    // Update the DB row with the new dimensions (PNG may differ slightly)
    const updated = await prisma.image.update({
      where: { id: imageId },
      data: { width: result.width, height: result.height },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("image-bg-remove failed", error);
    return NextResponse.json(
      { error: "Background removal failed" },
      { status: 500 },
    );
  }
}

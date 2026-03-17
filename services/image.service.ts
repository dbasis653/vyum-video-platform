// cloudinary — pre-configured Cloudinary v2 instance (credentials loaded from env)
// Shared singleton from lib/cloudinary.ts — never repeat cloudinary.config() in a service file.
import cloudinary from "@/lib/cloudinary";

// prisma — shared PrismaClient singleton; never instantiate PrismaClient locally.
// Singleton prevents connection pool exhaustion in serverless environments.
import { prisma } from "@/lib/prisma";

// resolveDbUser — fetches the DB User row for a given Clerk userId.
// Shared from lib/auth.ts to avoid repeating prisma.user.findUnique in every service function.
import { resolveDbUser } from "@/lib/auth";

// BG_REMOVE_EFFECT / BG_REMOVE_FINE_EDGES_EFFECT / BG_REMOVE_FOLDER / BgOutput —
// Cloudinary transformation constants and the BgOutput union type.
// Kept in lib/constants to stay in sync across service and any future UI consumers.
import {
  BG_REMOVE_EFFECT,
  BG_REMOVE_FINE_EDGES_EFFECT,
  BG_REMOVE_FOLDER,
  type BgOutput,
} from "@/lib/constants/bgRemove";

// CloudinaryUploadResult — shared interface for Cloudinary upload API responses.
// Extracted to types/ so it is never duplicated across service or route files.
import { type CloudinaryUploadResult } from "@/types";

// ─── Internal helpers ─────────────────────────────────────────────────────────

// Produces a typed HTTP error that route handlers can catch and map to NextResponse.
// Attaches a status code to the Error object so the route can read it from the catch block.
function httpError(status: number, message: string): never {
  const err = new Error(message) as Error & { status: number };
  err.status = status;
  throw err;
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

// ─── getImages ────────────────────────────────────────────────────────────────

// Fetches all images owned by the given Clerk user, ordered newest first.
export async function getImages(clerkUserId: string) {
  return prisma.image.findMany({
    where: { user: { clerkId: clerkUserId } },
    orderBy: { createdAt: "desc" },
  });
}

// ─── getImageById ─────────────────────────────────────────────────────────────

// Fetches a single image by DB id and verifies the caller owns it.
// Throws 404 if the image does not exist, 403 if the caller does not own it.
export async function getImageById(clerkUserId: string, imageId: string) {
  const image = await prisma.image.findUnique({ where: { id: imageId } });
  if (!image) httpError(404, "Image not found");

  const dbUser = await resolveDbUser(clerkUserId);
  if (!dbUser || image.userId !== dbUser.id) httpError(403, "Forbidden");

  return image;
}

// ─── updateImage ──────────────────────────────────────────────────────────────

// Updates the title of an image after verifying ownership.
// Throws 404 if not found, 403 if the caller does not own the image.
export async function updateImage(
  clerkUserId: string,
  imageId: string,
  data: { title: string },
) {
  // 1. Fetch image + ownership check
  const image = await prisma.image.findUnique({ where: { id: imageId } });
  if (!image) httpError(404, "Image not found");

  const dbUser = await resolveDbUser(clerkUserId);
  if (!dbUser || image.userId !== dbUser.id) httpError(403, "Forbidden");

  // 2. Apply update — ownership confirmed
  return prisma.image.update({
    where: { id: imageId },
    data: { title: data.title.trim() },
  });
}

// ─── deleteImage ──────────────────────────────────────────────────────────────

// Deletes the Cloudinary asset and then the DB row for the given image.
// Throws 404 if not found, 403 if the caller does not own the image.
export async function deleteImage(clerkUserId: string, imageId: string) {
  // 1. Fetch image + ownership check
  const image = await prisma.image.findUnique({ where: { id: imageId } });
  if (!image) httpError(404, "Image not found");

  const dbUser = await resolveDbUser(clerkUserId);
  if (!dbUser || image.userId !== dbUser.id) httpError(403, "Forbidden");

  // 2. Delete from Cloudinary first, then from DB
  await cloudinary.uploader.destroy(image.publicId, { resource_type: "image" });
  await prisma.image.delete({ where: { id: imageId } });

  return { success: true };
}

// ─── uploadImage ──────────────────────────────────────────────────────────────

// Uploads an image file to Cloudinary and creates a DB row linked to the caller.
// Throws 404 if the user account isn't ready yet (webhook race condition on first sign-in).
// Returns { id, publicId } — both are needed for playground navigation.
export async function uploadImage(clerkUserId: string, file: File, title: string) {
  // 1. Resolve DB user — webhook creates this row on first sign-up
  const dbUser = await resolveDbUser(clerkUserId);
  if (!dbUser) httpError(404, "User account not ready. Please refresh and try again.");

  // 2. Buffer the file for upload_stream
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // 3. Upload to Cloudinary
  const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "images" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result as CloudinaryUploadResult);
      },
    );
    uploadStream.end(buffer);
  });

  // 4. Store metadata in DB, linking the image to its owner via userId
  const image = await prisma.image.create({
    data: {
      title: title.trim(),
      publicId: result.public_id,
      width: result.width ?? 0,
      height: result.height ?? 0,
      userId: dbUser.id,
    },
  });

  return { id: image.id, publicId: result.public_id };
}

// ─── CropImageParams ──────────────────────────────────────────────────────────

export interface CropImageParams {
  imageId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  mode: "copy" | "overwrite";
  title?: string;
}

// ─── cropImage ────────────────────────────────────────────────────────────────

// Applies a crop transformation to an existing image via Cloudinary.
// mode "copy": uploads cropped version as a new asset, creates a new DB row.
// mode "overwrite": replaces the existing Cloudinary asset, updates the DB row.
// Throws 404 / 403 on ownership failures.
export async function cropImage(clerkUserId: string, params: CropImageParams) {
  const { imageId, x, y, w, h, mode, title } = params;

  // 1. Fetch image + ownership check
  const image = await prisma.image.findUnique({ where: { id: imageId } });
  if (!image) httpError(404, "Image not found");

  const dbUser = await resolveDbUser(clerkUserId);
  if (!dbUser || image.userId !== dbUser.id) httpError(403, "Forbidden");

  // 2. Build the Cloudinary transformation URL
  //    Cloudinary fetches and applies the crop when we pass this URL to uploader.upload().
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const transformedUrl = `https://res.cloudinary.com/${cloudName}/image/upload/c_crop,x_${x},y_${y},w_${w},h_${h}/${image.publicId}`;

  if (mode === "copy") {
    // 3a. Upload cropped image as a brand new Cloudinary asset
    const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
      cloudinary.uploader.upload(
        transformedUrl,
        { folder: "images" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result as CloudinaryUploadResult);
        },
      );
    });

    // 4a. Create a new DB row for the cropped copy
    return prisma.image.create({
      data: {
        title: title ?? `${image.title}_cropped`,
        publicId: result.public_id,
        width: result.width ?? 0,
        height: result.height ?? 0,
        userId: dbUser.id,
      },
    });
  } else {
    // 3b. Overwrite: upload with the same public_id + invalidate CDN cache
    const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
      cloudinary.uploader.upload(
        transformedUrl,
        { public_id: image.publicId, overwrite: true, invalidate: true },
        (error, result) => {
          if (error) reject(error);
          else resolve(result as CloudinaryUploadResult);
        },
      );
    });

    // 4b. Update the DB row with the new dimensions
    return prisma.image.update({
      where: { id: imageId },
      data: { width: result.width ?? 0, height: result.height ?? 0 },
    });
  }
}

// ─── BgRemoveImageParams ──────────────────────────────────────────────────────

export interface BgRemoveImageParams {
  imageId: string;
  fineEdges?: boolean;
  bgOutput?: BgOutput;
  mode: "preview" | "copy" | "overwrite";
  title?: string;
}

// ─── bgRemoveImage ────────────────────────────────────────────────────────────

// Applies Cloudinary AI background removal to an existing image.
// Polls server-side until the async Cloudinary transformation is cached (200).
// mode "preview": returns the cached URL only — no DB write.
// mode "copy": uploads as a new asset and creates a new DB row.
// mode "overwrite": re-uploads with same public_id and updates the DB row.
// Throws 404 / 403 on ownership failures.
export async function bgRemoveImage(clerkUserId: string, params: BgRemoveImageParams) {
  const { imageId, fineEdges = false, bgOutput = "transparent", mode, title } = params;

  // 1. Fetch image + ownership check
  const image = await prisma.image.findUnique({ where: { id: imageId } });
  if (!image) httpError(404, "Image not found");

  const dbUser = await resolveDbUser(clerkUserId);
  if (!dbUser || image.userId !== dbUser.id) httpError(403, "Forbidden");

  // 2. Choose the effect string based on the fineEdges toggle
  const effect = fineEdges ? BG_REMOVE_FINE_EDGES_EFFECT : BG_REMOVE_EFFECT;

  // 3. Build the on-the-fly transformation URL.
  //    bgOutput "transparent": chain f_png as a separate step — PNG supports alpha.
  //    bgOutput "white": chain b_white to fill transparent areas with white.
  //    NOTE: f_png must NOT be combined in the same step as e_background_removal (causes 400).
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const outputStep = bgOutput === "transparent" ? "f_png" : "b_white";
  const bgRemovedUrl = `https://res.cloudinary.com/${cloudName}/image/upload/e_${effect}/${outputStep}/${image.publicId}`;

  // 4. Block until Cloudinary has finished processing (polls every 2s, up to 40s)
  await waitForReady(bgRemovedUrl);

  if (mode === "preview") {
    // URL is cached and immediately loadable — return it without any DB write
    return { url: bgRemovedUrl };
  }

  if (mode === "copy") {
    // 5a. The URL is now cached (200), safe to pass to uploader.upload()
    const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
      cloudinary.uploader.upload(
        bgRemovedUrl,
        { folder: BG_REMOVE_FOLDER },
        (error, result) => {
          if (error) reject(error);
          else resolve(result as CloudinaryUploadResult);
        },
      );
    });

    // 6a. Create a new DB row for the bg-removed copy
    return prisma.image.create({
      data: {
        title: title ?? `${image.title}_bg_removed`,
        publicId: result.public_id,
        width: result.width ?? 0,
        height: result.height ?? 0,
        userId: dbUser.id,
      },
    });
  }

  // mode === "overwrite"
  // 5b. Upload with the same public_id + invalidate CDN cache
  const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
    cloudinary.uploader.upload(
      bgRemovedUrl,
      { public_id: image.publicId, overwrite: true, invalidate: true },
      (error, result) => {
        if (error) reject(error);
        else resolve(result as CloudinaryUploadResult);
      },
    );
  });

  // 6b. Update the DB row with the new dimensions (PNG may differ slightly)
  return prisma.image.update({
    where: { id: imageId },
    data: { width: result.width ?? 0, height: result.height ?? 0 },
  });
}

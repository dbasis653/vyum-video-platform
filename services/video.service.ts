// cloudinary — pre-configured Cloudinary v2 instance (credentials loaded from env)
// Shared singleton from lib/cloudinary.ts — never repeat cloudinary.config() in a service file.
import cloudinary from "@/lib/cloudinary";

// prisma — shared PrismaClient singleton; never instantiate PrismaClient locally.
// Singleton prevents connection pool exhaustion in serverless environments.
import { prisma } from "@/lib/prisma";

// resolveDbUser — fetches the DB User row for a given Clerk userId.
// Shared from lib/auth.ts to avoid repeating prisma.user.findUnique in every service function.
import { resolveDbUser } from "@/lib/auth";

// CloudinaryUploadResult — shared interface for Cloudinary upload API responses.
// Extracted to types/ so it is never duplicated across service or route files.
import { type CloudinaryUploadResult } from "@/types";

// ─── Internal helpers ─────────────────────────────────────────────────────────

// Produces a typed HTTP error that route handlers can catch and map to NextResponse.
function httpError(status: number, message: string): never {
  const err = new Error(message) as Error & { status: number };
  err.status = status;
  throw err;
}

// Converts size fields from their DB storage type to Number for JSON serialization.
// Prisma stores video sizes as strings; the Video interface and clients expect numbers.
function normalizeVideo<T extends { originalSize: unknown; compressedSize: unknown }>(video: T) {
  return {
    ...video,
    originalSize: Number(video.originalSize),
    compressedSize: Number(video.compressedSize),
  };
}

// ─── getVideos ────────────────────────────────────────────────────────────────

// Fetches all videos owned by the given Clerk user, ordered newest first.
// Normalizes BigInt/string size fields to Number for JSON serialization.
export async function getVideos(clerkUserId: string) {
  const videos = await prisma.video.findMany({
    where: { user: { clerkId: clerkUserId } },
    orderBy: { createdAt: "desc" },
  });
  return videos.map(normalizeVideo);
}

// ─── updateVideo ──────────────────────────────────────────────────────────────

// Updates the title and description of a video after verifying ownership.
// Throws 404 if not found, 403 if the caller does not own the video.
export async function updateVideo(
  clerkUserId: string,
  videoId: string,
  data: { title: string; description?: string },
) {
  // 1. Fetch video + ownership check
  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) httpError(404, "Video not found");

  const dbUser = await resolveDbUser(clerkUserId);
  if (!dbUser || video.userId !== dbUser.id) httpError(403, "Forbidden");

  // 2. Apply update — ownership confirmed
  const updated = await prisma.video.update({
    where: { id: videoId },
    data: { title: data.title.trim(), description: data.description ?? null },
  });

  return normalizeVideo(updated);
}

// ─── deleteVideo ──────────────────────────────────────────────────────────────

// Deletes the Cloudinary asset and then the DB row for the given video.
// Throws 404 if not found, 403 if the caller does not own the video.
export async function deleteVideo(clerkUserId: string, videoId: string) {
  // 1. Fetch video + ownership check
  const video = await prisma.video.findUnique({ where: { id: videoId } });
  if (!video) httpError(404, "Video not found");

  const dbUser = await resolveDbUser(clerkUserId);
  if (!dbUser || video.userId !== dbUser.id) httpError(403, "Forbidden");

  // 2. Delete from Cloudinary first, then from DB
  await cloudinary.uploader.destroy(video.publicId, { resource_type: "video" });
  await prisma.video.delete({ where: { id: videoId } });

  return { success: true };
}

// ─── uploadVideo ──────────────────────────────────────────────────────────────

// Uploads a video file to Cloudinary with auto compression, then creates a DB row.
// Throws 404 if the user account isn't ready yet (webhook race condition on first sign-in).
export async function uploadVideo(
  clerkUserId: string,
  params: { file: File; title: string; description: string; originalSize: string },
) {
  const { file, title, description, originalSize } = params;

  // 1. Resolve DB user — webhook creates this row on first sign-up
  const dbUser = await resolveDbUser(clerkUserId);
  if (!dbUser) httpError(404, "User account not ready. Please refresh and try again.");

  // 2. Buffer the file for upload_stream
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // 3. Upload to Cloudinary with auto quality compression
  const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
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
  });

  // 4. Store video metadata in DB, linking it to its owner via userId
  return prisma.video.create({
    data: {
      title,
      description,
      originalSize,
      compressedSize: String(result.bytes ?? 0),
      duration: result.duration ?? 0,
      publicId: result.public_id,
      userId: dbUser.id,
    },
  });
}

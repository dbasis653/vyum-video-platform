// Shared interface for Cloudinary upload API responses — superset of all variants
// (images have width/height, videos have bytes/duration, bg-remove has secure_url).
// Extracted here so it is never re-defined locally in route or service files.
export interface CloudinaryUploadResult {
  public_id: string;
  secure_url?: string;
  width?: number;
  height?: number;
  bytes?: number;
  duration?: number;
  [key: string]: unknown;
}

export interface Video {
  id: string;
  title: string;
  description: string;
  publicId: string;
  originalSize: number;
  compressedSize: number;
  duration: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ImageItem {
  id: string;
  title: string;
  publicId: string;
  width: number;
  height: number;
  createdAt: Date;
  updatedAt: Date;
}

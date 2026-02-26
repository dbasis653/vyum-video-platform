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

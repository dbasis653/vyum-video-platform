"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import ImageCard from "@/components/ImageCard";
import { ImageItem } from "@/types";

export default function AllImages() {
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchImages = useCallback(async () => {
    try {
      const response = await axios.get("/api/images");
      if (Array.isArray(response.data)) setImages(response.data);
    } catch {
      setError("Failed to fetch images");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const handleUpdate = useCallback((updated: ImageItem) => {
    setImages((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }, []);

  const handleDelete = useCallback((id: string) => {
    setImages((prev) => prev.filter((i) => i.id !== id));
  }, []);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">All Images</h1>
        <Link href="/home" className="text-primary text-sm font-semibold hover:underline">
          ← Back to Home
        </Link>
      </div>

      {loading && (
        <div className="flex justify-center items-center min-h-[40vh]">
          <span className="loading loading-spinner loading-lg" />
        </div>
      )}

      {error && <p className="text-error">{error}</p>}

      {!loading && !error && images.length === 0 && (
        <p className="text-base-content opacity-50">No images uploaded yet.</p>
      )}

      {!loading && images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          {images.map((image) => (
            <ImageCard
              key={image.id}
              image={image}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import ImageCard from "@/components/image/ImageCard";
import { ImageItem } from "@/types";
import { ImageIcon } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import SkeletonGrid from "@/components/ui/SkeletonGrid";
import ErrorBanner from "@/components/ui/ErrorBanner";
import EmptyState from "@/components/ui/EmptyState";

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
      <SectionHeader label="All Images" back="/home" />
      {loading && <SkeletonGrid variant="image" />}
      {error && <ErrorBanner message={error} />}
      {!loading && !error && images.length === 0 && (
        <EmptyState icon={<ImageIcon size={18} style={{ color: "rgba(34,211,238,0.4)" }} />} message="No images uploaded yet" />
      )}

      {/* Grid */}
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

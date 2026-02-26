"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import VideoCard from "@/components/VideoCard";
import ImageCard from "@/components/ImageCard";
import { Video, ImageItem } from "@/types";

function Home() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [images, setImages] = useState<ImageItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    try {
      const [videosRes, imagesRes] = await Promise.all([
        axios.get("/api/videos"),
        axios.get("/api/images"),
      ]);
      if (Array.isArray(videosRes.data)) setVideos(videosRes.data);
      if (Array.isArray(imagesRes.data)) setImages(imagesRes.data);
    } catch {
      setError("Failed to load content");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleDownload = useCallback((url: string, title: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${title}.mp4`);
    link.setAttribute("target", "_blank");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const handleVideoUpdate = useCallback((updated: Video) => {
    setVideos((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
  }, []);

  const handleVideoDelete = useCallback((id: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== id));
  }, []);

  const handleImageUpdate = useCallback((updated: ImageItem) => {
    setImages((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  }, []);

  const handleImageDelete = useCallback((id: string) => {
    setImages((prev) => prev.filter((i) => i.id !== id));
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[40vh]">
        <span className="loading loading-spinner loading-lg" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-error mt-8">{error}</div>;
  }

  return (
    <div className="space-y-10">
      {/* Videos Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Videos</h2>
          {videos.length > 0 && (
            <Link href="/all-videos" className="text-primary text-sm font-semibold hover:underline">
              See more →
            </Link>
          )}
        </div>
        {videos.length === 0 ? (
          <p className="text-base-content opacity-50">No videos uploaded yet.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos.slice(0, 6).map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onDownload={handleDownload}
                onUpdate={handleVideoUpdate}
                onDelete={handleVideoDelete}
              />
            ))}
          </div>
        )}
      </section>

      {/* Images Section */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Images</h2>
          {images.length > 0 && (
            <Link href="/all-images" className="text-primary text-sm font-semibold hover:underline">
              See more →
            </Link>
          )}
        </div>
        {images.length === 0 ? (
          <p className="text-base-content opacity-50">No images uploaded yet.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            {images.slice(0, 8).map((image) => (
              <ImageCard
                key={image.id}
                image={image}
                onUpdate={handleImageUpdate}
                onDelete={handleImageDelete}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

export default Home;

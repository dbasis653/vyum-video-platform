"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import VideoCard from "@/components/VideoCard";
import ImageCard from "@/components/ImageCard";
import { Video, ImageItem } from "@/types";
import { VideoIcon, ImageIcon } from "lucide-react";

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
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
        <svg
          className="animate-spin w-7 h-7"
          fill="none"
          viewBox="0 0 24 24"
          style={{ color: "#22D3EE" }}
        >
          <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <span className="text-xs font-mono tracking-widest" style={{ color: "rgba(34,211,238,0.4)" }}>
          Loading…
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm mt-8"
        style={{
          background: "rgba(248,113,113,0.07)",
          border: "1px solid rgba(248,113,113,0.18)",
          color: "#fca5a5",
        }}
      >
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-10">
      {/* ── Videos section ── */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-0.5 h-4 rounded-full" style={{ background: "#3B82F6" }} />
          <span className="text-xs font-mono tracking-widest uppercase" style={{ color: "#22D3EE" }}>
            Videos
          </span>
          <div className="flex-1 h-px" style={{ background: "rgba(34,211,238,0.1)" }} />
          {videos.length > 0 && (
            <Link
              href="/all-videos"
              className="text-xs font-mono tracking-wider transition-opacity hover:opacity-75"
              style={{ color: "rgba(34,211,238,0.6)" }}
            >
              See all →
            </Link>
          )}
        </div>

        {videos.length === 0 ? (
          <div className="flex flex-col items-center py-12 gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: "rgba(34,211,238,0.06)",
                border: "1px solid rgba(34,211,238,0.12)",
              }}
            >
              <VideoIcon size={18} style={{ color: "rgba(34,211,238,0.4)" }} />
            </div>
            <p className="text-xs font-mono" style={{ color: "rgba(186,230,255,0.28)" }}>
              No videos uploaded yet
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {videos.slice(0, 3).map((video) => (
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

      {/* ── Images section ── */}
      <section>
        <div className="flex items-center gap-3 mb-5">
          <div className="w-0.5 h-4 rounded-full" style={{ background: "#3B82F6" }} />
          <span className="text-xs font-mono tracking-widest uppercase" style={{ color: "#22D3EE" }}>
            Images
          </span>
          <div className="flex-1 h-px" style={{ background: "rgba(34,211,238,0.1)" }} />
          {images.length > 0 && (
            <Link
              href="/all-images"
              className="text-xs font-mono tracking-wider transition-opacity hover:opacity-75"
              style={{ color: "rgba(34,211,238,0.6)" }}
            >
              See all →
            </Link>
          )}
        </div>

        {images.length === 0 ? (
          <div className="flex flex-col items-center py-12 gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: "rgba(34,211,238,0.06)",
                border: "1px solid rgba(34,211,238,0.12)",
              }}
            >
              <ImageIcon size={18} style={{ color: "rgba(34,211,238,0.4)" }} />
            </div>
            <p className="text-xs font-mono" style={{ color: "rgba(186,230,255,0.28)" }}>
              No images uploaded yet
            </p>
          </div>
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

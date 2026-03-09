"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import VideoCard from "@/components/video/VideoCard";
import { Video } from "@/types";
import { VideoIcon } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import SkeletonGrid from "@/components/ui/SkeletonGrid";
import ErrorBanner from "@/components/ui/ErrorBanner";
import EmptyState from "@/components/ui/EmptyState";

export default function AllVideos() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = useCallback(async () => {
    try {
      const response = await axios.get("/api/videos");
      if (Array.isArray(response.data)) setVideos(response.data);
    } catch {
      setError("Failed to fetch videos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  const handleDownload = useCallback((url: string, title: string) => {
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `${title}.mp4`);
    link.setAttribute("target", "_blank");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  const handleUpdate = useCallback((updated: Video) => {
    setVideos((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
  }, []);

  const handleDelete = useCallback((id: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== id));
  }, []);

  return (
    <div>
      <SectionHeader label="All Videos" back="/home" />
      {loading && <SkeletonGrid variant="video" />}
      {error && <ErrorBanner message={error} />}
      {!loading && !error && videos.length === 0 && (
        <EmptyState icon={<VideoIcon size={18} style={{ color: "rgba(34,211,238,0.4)" }} />} message="No videos uploaded yet" />
      )}

      {/* Grid */}
      {!loading && videos.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {videos.map((video) => (
            <VideoCard
              key={video.id}
              video={video}
              onDownload={handleDownload}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

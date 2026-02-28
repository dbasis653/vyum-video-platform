"use client";
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import Link from "next/link";
import VideoCard from "@/components/VideoCard";
import { Video } from "@/types";
import { VideoIcon, ArrowLeftIcon } from "lucide-react";

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
      {/* HUD header */}
      <div className="flex items-center gap-3 mb-7">
        <div className="w-0.5 h-4 rounded-full" style={{ background: "#3B82F6" }} />
        <span className="text-xs font-mono tracking-widest uppercase" style={{ color: "#22D3EE" }}>
          All Videos
        </span>
        <div className="flex-1 h-px" style={{ background: "rgba(34,211,238,0.1)" }} />
        <Link
          href="/home"
          className="flex items-center gap-1.5 text-xs font-mono tracking-wider transition-opacity hover:opacity-75"
          style={{ color: "rgba(34,211,238,0.55)" }}
        >
          <ArrowLeftIcon size={12} />
          Back
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
          <svg className="animate-spin w-7 h-7" fill="none" viewBox="0 0 24 24" style={{ color: "#22D3EE" }}>
            <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <span className="text-xs font-mono tracking-widest" style={{ color: "rgba(34,211,238,0.4)" }}>Loading…</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div
          className="px-4 py-3 rounded-lg text-sm"
          style={{
            background: "rgba(248,113,113,0.07)",
            border: "1px solid rgba(248,113,113,0.18)",
            color: "#fca5a5",
          }}
        >
          {error}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && videos.length === 0 && (
        <div className="flex flex-col items-center py-16 gap-3">
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

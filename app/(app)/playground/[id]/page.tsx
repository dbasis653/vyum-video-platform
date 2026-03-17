"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import axios from "axios";
import { ImageItem } from "@/types";
import SectionHeader from "@/components/ui/SectionHeader";
import ErrorBanner from "@/components/ui/ErrorBanner";
import CropTool from "@/components/playground/features/crop/CropTool";
import BgRemoveTool from "@/components/playground/features/bg-remove/BgRemoveTool";
// TOOLS  — ordered list of playground tools, each with { id, label, icon, comingSoon? }
//          drives the tab bar rendering — add new tools here to make them appear automatically
// ToolId — union type ("crop" | "bg-remove" | ...) used to type activeTool state
//          kept in lib/constants so any future sidebar, nav, or tool-picker component
//          can reference the same list without duplicating it
import { TOOLS, ToolId } from "@/lib/constants/playgroundTools";

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PlaygroundPage() {
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();

  const [image, setImage] = useState<ImageItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  // Read ?tool= from URL so buttons like "BG Remove" in ImagePreviewModal can pre-select a tool
  const initialTool = (searchParams.get("tool") as ToolId | null) ?? "crop";
  const [activeTool, setActiveTool] = useState<ToolId>(initialTool);

  useEffect(() => {
    axios
      .get(`/api/images/${id}`)
      .then((res) => setImage(res.data))
      .catch(() => setFetchError("Failed to load image."))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading)
    return (
      <div className="max-w-6xl mx-auto animate-pulse">
        {/* Header skeleton */}
        <div className="flex items-center gap-3 mb-6">
          <div
            className="w-6 h-6 rounded"
            style={{ background: "rgba(34,211,238,0.08)" }}
          />
          <div
            className="h-3 w-48 rounded"
            style={{ background: "rgba(34,211,238,0.08)" }}
          />
        </div>

        {/* Tool tabs skeleton */}
        <div className="flex gap-2 mb-6">
          {[80, 96].map((w) => (
            <div
              key={w}
              className="h-8 rounded-lg"
              style={{
                width: w,
                background: "rgba(34,211,238,0.07)",
                border: "1px solid rgba(34,211,238,0.1)",
              }}
            />
          ))}
        </div>

        {/* Main content skeleton — image left, controls right */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-6">
          {/* Image area */}
          <div
            className="rounded-2xl aspect-video"
            style={{
              background: "rgba(34,211,238,0.05)",
              border: "1px solid rgba(34,211,238,0.08)",
            }}
          />

          {/* Controls panel */}
          <div
            className="rounded-2xl p-5 flex flex-col gap-4"
            style={{
              background: "#0f1929",
              border: "1px solid rgba(34,211,238,0.1)",
            }}
          >
            <div
              className="h-3 w-24 rounded"
              style={{ background: "rgba(34,211,238,0.08)" }}
            />
            {[1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="h-10 rounded-lg"
                style={{ background: "rgba(34,211,238,0.06)" }}
              />
            ))}
            <div
              className="mt-auto h-10 rounded-lg"
              style={{ background: "rgba(34,211,238,0.1)" }}
            />
          </div>
        </div>
      </div>
    );
  if (fetchError) return <ErrorBanner message={fetchError} />;
  if (!image) return null;

  return (
    <div className="max-w-6xl mx-auto">
      <SectionHeader label={`Playground — ${image.title}`} back="/all-images" />

      {/* ── Tool tab bar ── */}
      <div className="flex gap-2 mb-6">
        {TOOLS.map((tool) => {
          const active = activeTool === tool.id && !tool.comingSoon;
          return (
            <button
              key={tool.id}
              onClick={() => !tool.comingSoon && setActiveTool(tool.id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-mono transition-all"
              style={{
                background: active
                  ? "rgba(34,211,238,0.18)"
                  : "rgba(34,211,238,0.05)",
                border: active
                  ? "1px solid rgba(34,211,238,0.4)"
                  : "1px solid rgba(34,211,238,0.1)",
                color: tool.comingSoon
                  ? "rgba(186,230,255,0.2)"
                  : active
                    ? "#22D3EE"
                    : "rgba(186,230,255,0.45)",
                cursor: tool.comingSoon ? "not-allowed" : "pointer",
              }}
              title={tool.comingSoon ? "Coming soon" : tool.label}
            >
              {tool.icon}
              {tool.label}
              {tool.comingSoon && (
                <span
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                  style={{
                    background: "rgba(34,211,238,0.07)",
                    border: "1px solid rgba(34,211,238,0.12)",
                    color: "rgba(34,211,238,0.3)",
                  }}
                >
                  soon
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Active tool ── */}
      {activeTool === "crop" && <CropTool image={image} />}
      {activeTool === "bg-remove" && <BgRemoveTool image={image} />}
    </div>
  );
}

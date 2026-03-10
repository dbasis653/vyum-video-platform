"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import axios from "axios";
import { getCldImageUrl } from "next-cloudinary";
import { Download } from "lucide-react";
import { ImageItem } from "@/types";
import ErrorBanner from "@/components/ui/ErrorBanner";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";
// PRESETS      — list of crop aspect-ratio presets (Free, Instagram, Twitter, YouTube, etc.)
//                each entry has: label, aspect ratio, and target output width/height
// PRESET_SUFFIX — maps a preset label → filename suffix appended when saving a cropped copy
//                 e.g. "Instagram 1:1" → "_inst_1:1"
// Kept in lib/constants so any future crop-related component or export tool shares the same definitions.
import { PRESETS, PRESET_SUFFIX } from "@/lib/constants/cropPresets";

//It calculates a centered crop box that fits within the image while respecting a given aspect ratio.
function makeCenteredCrop(
  aspect: number,
  imgW: number,
  imgH: number,
): PixelCrop {
  let w = imgW;
  let h = w / aspect;
  if (h > imgH) {
    h = imgH;
    w = h * aspect;
  }
  return {
    unit: "px",
    x: (imgW - w) / 2,
    y: (imgH - h) / 2,
    width: w,
    height: h,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

interface CropToolProps {
  image: ImageItem;
}

export default function CropTool({ image }: CropToolProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const [activePreset, setActivePreset] = useState<string>("Free");

  const [isSavingCopy, setIsSavingCopy] = useState(false);
  const [isSavingOverwrite, setIsSavingOverwrite] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const imgRef = useRef<HTMLImageElement>(null);

  const imageUrl = getCldImageUrl({ src: image.publicId });

  useEffect(() => {
    if (completedCrop && completedCrop.width > 0 && completedCrop.height > 0) {
      setIsPreviewLoading(true);
    }
  }, [completedCrop]);

  const getScaledCrop = useCallback(() => {
    if (!completedCrop || !imgRef.current) return null;
    const { naturalWidth, naturalHeight, width, height } = imgRef.current;
    const scaleX = naturalWidth / width;
    const scaleY = naturalHeight / height;
    return {
      x: Math.round(completedCrop.x * scaleX),
      y: Math.round(completedCrop.y * scaleY),
      w: Math.round(completedCrop.width * scaleX),
      h: Math.round(completedCrop.height * scaleY),
    };
  }, [completedCrop]);

  const previewUrl = useCallback(() => {
    const scaled = getScaledCrop();
    if (!scaled) return imageUrl;
    const { x, y, w, h } = scaled;
    if (w === 0 || h === 0) return imageUrl;
    return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/c_crop,x_${x},y_${y},w_${w},h_${h}/${image.publicId}`;
  }, [getScaledCrop, image, imageUrl]);

  const handlePreset = (label: string, newAspect: number | undefined) => {
    setActivePreset(label);
    setAspect(newAspect);
    setSaveSuccess(null);
    setSaveError(null);

    if (!newAspect || !imgRef.current) {
      setCrop(undefined);
      setCompletedCrop(undefined);
      return;
    }

    const { width, height } = imgRef.current;
    const defaultCrop = makeCenteredCrop(newAspect, width, height);
    setCrop(defaultCrop);
    setCompletedCrop(defaultCrop);
  };

  const handleSave = async (mode: "copy" | "overwrite") => {
    const scaled = getScaledCrop();
    if (!scaled) return;
    const { x, y, w, h } = scaled;
    if (w === 0 || h === 0) {
      setSaveError("Please draw a crop area first.");
      return;
    }

    setSaveError(null);
    setSaveSuccess(null);
    if (mode === "copy") setIsSavingCopy(true);
    else setIsSavingOverwrite(true);

    try {
      const copyTitle =
        image.title + (PRESET_SUFFIX[activePreset] ?? "_cropped");
      await axios.post("/api/image-crop", {
        imageId: image.id,
        x,
        y,
        w,
        h,
        mode,
        title: copyTitle,
      });
      const msg =
        mode === "copy"
          ? "Saved as a new copy in your library."
          : "Original image overwritten successfully.";
      setSaveSuccess(msg);
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err: any) {
      setSaveError(err?.response?.data?.error ?? "Failed to save crop.");
    } finally {
      setIsSavingCopy(false);
      setIsSavingOverwrite(false);
    }
  };

  const handleDownload = async () => {
    const url = previewUrl();
    setIsDownloading(true);
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `${image.title}-cropped.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    } finally {
      setIsDownloading(false);
    }
  };

  const busy = isSavingCopy || isSavingOverwrite || isDownloading;
  const hasCrop =
    completedCrop && completedCrop.width > 0 && completedCrop.height > 0;

  return (
    <div>
      <style>{`
        @keyframes previewScan {
          0%   { top: 0%;    opacity: 0; }
          4%   { opacity: 1; }
          96%  { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes previewGlow {
          0%, 100% { opacity: 0.25; transform: scale(1); }
          50%      { opacity: 0.65; transform: scale(1.18); }
        }
        @keyframes previewDot {
          0%, 75%, 100% { transform: scale(0); opacity: 0; }
          40%           { transform: scale(1); opacity: 1; }
        }
        @keyframes previewCornerPulse {
          0%, 100% { opacity: 0.3; }
          50%      { opacity: 1; }
        }
        @keyframes previewShimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes previewSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes previewSpinReverse {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes previewFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── Preset buttons ── */}
      <div className="flex flex-wrap gap-2 mb-6">
        {PRESETS.map((preset) => {
          const active = activePreset === preset.label;
          return (
            <Button
              key={preset.label}
              variant={active ? "cyan" : "ghost"}
              size="xs"
              onClick={() => handlePreset(preset.label, preset.aspect)}
              style={
                active
                  ? {
                      background: "rgba(34,211,238,0.18)",
                      border: "1px solid rgba(34,211,238,0.4)",
                      color: "#22D3EE",
                    }
                  : undefined
              }
            >
              {preset.label}
            </Button>
          );
        })}
      </div>

      {/* ── Crop canvas + preview ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Left: crop canvas */}
        <div
          className="rounded-xl overflow-hidden flex items-center justify-center p-4"
          style={{
            background: "#0B1220",
            border: "1px solid rgba(34,211,238,0.1)",
          }}
        >
          <ReactCrop
            crop={crop}
            onChange={(c) => setCrop(c)}
            onComplete={(c) => setCompletedCrop(c)}
            aspect={aspect}
            style={{ maxHeight: "60vh" }}
          >
            <img
              ref={imgRef}
              src={imageUrl}
              alt={image.title}
              style={{ maxHeight: "60vh", maxWidth: "100%", display: "block" }}
            />
          </ReactCrop>
        </div>

        {/* Right: live preview */}
        <div
          className="rounded-xl overflow-hidden flex flex-col items-center justify-center p-4 gap-3"
          style={{
            background: "#0B1220",
            border: "1px solid rgba(34,211,238,0.1)",
          }}
        >
          <span
            className="text-xs font-mono tracking-widest uppercase self-start"
            style={{ color: "rgba(34,211,238,0.5)" }}
          >
            Preview
          </span>
          {hasCrop ? (
            <>
              {isPreviewLoading && (
                <div
                  className="relative w-full rounded-xl overflow-hidden flex items-center justify-center"
                  style={{
                    minHeight: "260px",
                    background:
                      "linear-gradient(145deg, #060d1b 0%, #091525 100%)",
                    animation: "previewFadeIn 0.25s ease-out",
                  }}
                >
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage:
                        "radial-gradient(circle, rgba(34,211,238,0.065) 1px, transparent 1px)",
                      backgroundSize: "18px 18px",
                    }}
                  />
                  <div
                    className="absolute"
                    style={{
                      width: "200px",
                      height: "200px",
                      borderRadius: "50%",
                      background:
                        "radial-gradient(circle, rgba(34,211,238,0.09) 0%, transparent 70%)",
                      animation: "previewGlow 2.6s ease-in-out infinite",
                    }}
                  />
                  <div
                    className="absolute inset-0"
                    style={{
                      background:
                        "linear-gradient(108deg, transparent 38%, rgba(34,211,238,0.03) 50%, transparent 62%)",
                      backgroundSize: "200% 100%",
                      animation: "previewShimmer 2.8s ease-in-out infinite",
                    }}
                  />
                  <div
                    className="absolute left-5 right-5"
                    style={{
                      height: "1px",
                      background:
                        "linear-gradient(90deg, transparent 0%, rgba(34,211,238,0.35) 20%, rgba(34,211,238,0.85) 50%, rgba(34,211,238,0.35) 80%, transparent 100%)",
                      boxShadow:
                        "0 0 6px rgba(34,211,238,0.55), 0 0 18px rgba(34,211,238,0.18)",
                      animation: "previewScan 2.2s ease-in-out infinite",
                    }}
                  />
                  {[
                    {
                      top: 12,
                      left: 12,
                      borderTop: true,
                      borderLeft: true,
                      delay: "0s",
                    },
                    {
                      top: 12,
                      right: 12,
                      borderTop: true,
                      borderRight: true,
                      delay: "0.15s",
                    },
                    {
                      bottom: 12,
                      left: 12,
                      borderBottom: true,
                      borderLeft: true,
                      delay: "0.3s",
                    },
                    {
                      bottom: 12,
                      right: 12,
                      borderBottom: true,
                      borderRight: true,
                      delay: "0.45s",
                    },
                  ].map((c, i) => (
                    <div
                      key={i}
                      className="absolute"
                      style={{
                        width: 18,
                        height: 18,
                        ...(c.top !== undefined && { top: c.top }),
                        ...(c.bottom !== undefined && { bottom: c.bottom }),
                        ...(c.left !== undefined && { left: c.left }),
                        ...(c.right !== undefined && { right: c.right }),
                        borderTop: c.borderTop
                          ? "1.5px solid rgba(34,211,238,0.7)"
                          : undefined,
                        borderBottom: c.borderBottom
                          ? "1.5px solid rgba(34,211,238,0.7)"
                          : undefined,
                        borderLeft: c.borderLeft
                          ? "1.5px solid rgba(34,211,238,0.7)"
                          : undefined,
                        borderRight: c.borderRight
                          ? "1.5px solid rgba(34,211,238,0.7)"
                          : undefined,
                        animation: `previewCornerPulse 2.6s ease-in-out ${c.delay} infinite`,
                      }}
                    />
                  ))}
                  <div className="relative z-10 flex flex-col items-center gap-4">
                    <div className="relative" style={{ width: 52, height: 52 }}>
                      <div
                        className="absolute inset-0 rounded-full"
                        style={{ border: "1.5px solid rgba(34,211,238,0.08)" }}
                      />
                      <div
                        className="absolute inset-0 rounded-full"
                        style={{
                          border: "1.5px solid transparent",
                          borderTopColor: "rgba(34,211,238,0.85)",
                          borderRightColor: "rgba(34,211,238,0.25)",
                          animation: "previewSpin 1.1s linear infinite",
                        }}
                      />
                      <div
                        className="absolute inset-2 rounded-full"
                        style={{ border: "1px solid rgba(34,211,238,0.06)" }}
                      />
                      <div
                        className="absolute inset-2 rounded-full"
                        style={{
                          border: "1px solid transparent",
                          borderTopColor: "rgba(34,211,238,0.5)",
                          borderLeftColor: "rgba(34,211,238,0.15)",
                          animation: "previewSpinReverse 0.75s linear infinite",
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div
                          style={{
                            width: 5,
                            height: 5,
                            borderRadius: "50%",
                            background: "rgba(34,211,238,0.9)",
                            boxShadow: "0 0 6px rgba(34,211,238,0.7)",
                            animation: "previewGlow 2.6s ease-in-out infinite",
                          }}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col items-center gap-2">
                      <span
                        className="text-[10px] font-mono tracking-[0.22em] uppercase"
                        style={{ color: "rgba(34,211,238,0.65)" }}
                      >
                        Rendering Preview
                      </span>
                      <div className="flex gap-1.5">
                        {[0, 0.22, 0.44].map((delay, i) => (
                          <div
                            key={i}
                            style={{
                              width: 3,
                              height: 3,
                              borderRadius: "50%",
                              background: "rgba(34,211,238,0.6)",
                              animation: `previewDot 1.5s ease-in-out ${delay}s infinite`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <img
                src={previewUrl()}
                alt="Crop preview"
                className="rounded-lg object-contain"
                onLoad={() => setIsPreviewLoading(false)}
                onError={() => setIsPreviewLoading(false)}
                style={{
                  maxHeight: "52vh",
                  maxWidth: "100%",
                  display: isPreviewLoading ? "none" : "block",
                }}
              />
              {!isPreviewLoading && (
                <p
                  className="text-[10px] font-mono"
                  style={{ color: "rgba(186,230,255,0.3)" }}
                >
                  {completedCrop
                    ? `${Math.round(completedCrop.width)} × ${Math.round(completedCrop.height)} px (display)`
                    : ""}
                </p>
              )}
            </>
          ) : (
            <p
              className="text-xs font-mono"
              style={{ color: "rgba(186,230,255,0.25)" }}
            >
              Draw a crop area to see preview
            </p>
          )}
        </div>
      </div>

      {/* ── Feedback ── */}
      {saveError && <ErrorBanner message={saveError} />}
      {saveSuccess && (
        <div
          className="px-4 py-3 rounded-lg text-sm mb-4"
          style={{
            background: "rgba(34,211,238,0.07)",
            border: "1px solid rgba(34,211,238,0.2)",
            color: "#22D3EE",
          }}
        >
          {saveSuccess}
        </div>
      )}

      {/* ── Action buttons ── */}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="cyan"
          size="sm"
          onClick={() => handleSave("copy")}
          loading={isSavingCopy}
          disabled={busy || !hasCrop}
          className="font-semibold"
        >
          {isSavingCopy && <Spinner />}
          Save as Copy
        </Button>

        <Button
          variant="danger"
          size="sm"
          onClick={() => handleSave("overwrite")}
          loading={isSavingOverwrite}
          disabled={busy || !hasCrop}
          className="font-semibold"
        >
          {isSavingOverwrite && <Spinner />}
          Override Original
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={handleDownload}
          loading={isDownloading}
          disabled={busy || !hasCrop}
          className="font-semibold"
        >
          {isDownloading && <Spinner />}
          <Download size={13} />
          Download
        </Button>
      </div>
    </div>
  );
}

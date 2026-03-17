"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import ReactCrop, { type Crop, type PixelCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { getCldImageUrl } from "next-cloudinary";
import { Download } from "lucide-react";
import { ImageItem } from "@/types";
import ErrorBanner from "@/components/ui/ErrorBanner";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";

import { PRESETS, PRESET_SUFFIX } from "@/lib/constants/cropPresets";
import { useImageSave } from "@/hooks/useImageSave";
import ProcessingSkeleton from "@/components/ui/ProcessingSkeleton";
import EditorShell from "@/components/playground/EditorShell";

// Calculates a centered crop box that fits within imgW × imgH while preserving the given aspect ratio.
// Returns a PixelCrop ready to pass directly to react-image-crop.
function makeCenteredCrop(aspect: number, imgW: number, imgH: number): PixelCrop {
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
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  const imgRef = useRef<HTMLImageElement>(null);
  const imageUrl = getCldImageUrl({ src: image.publicId });

  // useImageSave — shared save/download state + handlers.
  // Extracted to hooks/ — identical pattern used in BgRemoveTool.
  const {
    isSavingCopy,
    isSavingOverwrite,
    isDownloading,
    saveError,
    saveSuccess,
    save,
    download,
    clearFeedback,
  } = useImageSave({
    endpoint: "/api/image-crop",
    downloadFilename: `${image.title}-cropped.png`,
  });

  useEffect(() => {
    if (completedCrop && completedCrop.width > 0 && completedCrop.height > 0) {
      setIsPreviewLoading(true);
    }
  }, [completedCrop]);

  // Scales the display-space crop coordinates to natural (full-resolution) image coordinates.
  // Needed because react-image-crop operates in CSS pixels, but Cloudinary needs real pixels.
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

  // Builds a Cloudinary crop URL for the current crop selection — used for the live preview.
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
    clearFeedback();

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

  // Validates the scaled crop, then delegates save to the shared hook.
  const handleSave = async (mode: "copy" | "overwrite") => {
    const scaled = getScaledCrop();
    if (!scaled) return;
    const { x, y, w, h } = scaled;
    if (w === 0 || h === 0) return;

    const copyTitle = image.title + (PRESET_SUFFIX[activePreset] ?? "_cropped");
    await save(mode, { imageId: image.id, x, y, w, h, title: copyTitle });
  };

  const busy = isSavingCopy || isSavingOverwrite || isDownloading;
  const hasCrop =
    completedCrop && completedCrop.width > 0 && completedCrop.height > 0;

  return (
    <div>
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
      <EditorShell
        rightLabel="Preview"
        leftPanel={
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
        }
        rightPanel={
          hasCrop ? (
            <>
              {isPreviewLoading && (
                <ProcessingSkeleton
                  label="Rendering Preview"
                  keyframePrefix="preview"
                />
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
          )
        }
      />

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
          onClick={() => download(previewUrl())}
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

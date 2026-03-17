"use client";

import React, { useState } from "react";
import axios from "axios";
import { getCldImageUrl } from "next-cloudinary";
import { Download, Wand2 } from "lucide-react";
import { ImageItem } from "@/types";
import ErrorBanner from "@/components/ui/ErrorBanner";
import Spinner from "@/components/ui/Spinner";
import Button from "@/components/ui/Button";

// BgOutput — union type "transparent" | "white"; kept in lib/constants to stay in sync with the API.
import { type BgOutput } from "@/lib/constants/bgRemove";

// useImageSave — shared save/download state + handlers for playground tools.
// Extracted to hooks/ — identical pattern was duplicated in CropTool and BgRemoveTool.
import { useImageSave } from "@/hooks/useImageSave";

// ProcessingSkeleton — animated loading indicator shown while a transformation runs.
// Extracted to components/ui/ — identical animation was duplicated in CropTool and BgRemoveTool.
import ProcessingSkeleton from "@/components/ui/ProcessingSkeleton";

// EditorShell — shared two-panel grid layout (original left, result right).
// Extracted to components/playground/ — identical layout was duplicated in CropTool and BgRemoveTool.
import EditorShell from "@/components/playground/EditorShell";

// ─── Component ────────────────────────────────────────────────────────────────

interface BgRemoveToolProps {
  image: ImageItem;
}

export default function BgRemoveTool({ image }: BgRemoveToolProps) {
  const [fineEdges, setFineEdges] = useState(false);
  const [bgOutput, setBgOutput] = useState<BgOutput>("transparent");

  // isProcessing and resultUrl are specific to BgRemoveTool (no equivalent in CropTool).
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultLoading, setResultLoading] = useState(false);
  const [processError, setProcessError] = useState<string | null>(null);

  const imageUrl = getCldImageUrl({ src: image.publicId });

  // useImageSave — shared save/download state + handlers.
  // Extracted to hooks/ — identical pattern used in CropTool.
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
    endpoint: "/api/image-bg-remove",
    downloadFilename: `${image.title}-bg-removed.png`,
  });

  const busy = isProcessing || isSavingCopy || isSavingOverwrite || isDownloading;

  // Calls the API to pre-warm the bg-removed derived version and returns its URL.
  // Uses mode "preview" so nothing is written to the DB.
  const handleRemove = async () => {
    clearFeedback();
    setProcessError(null);
    setResultUrl(null);
    setIsProcessing(true);
    try {
      const res = await axios.post<{ url: string }>("/api/image-bg-remove", {
        imageId: image.id,
        fineEdges,
        bgOutput,
        mode: "preview",
      });
      setResultUrl(res.data.url);
      setResultLoading(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setProcessError(e?.response?.data?.error ?? "Background removal failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div>
      {/* ── Options row ── */}
      <div className="flex flex-wrap items-center gap-4 mb-6">

        {/* Background output toggle — Transparent vs White */}
        <div className="flex items-center gap-1">
          {(["transparent", "white"] as BgOutput[]).map((opt) => {
            const active = bgOutput === opt;
            return (
              <button
                key={opt}
                disabled={busy}
                onClick={() => {
                  setBgOutput(opt);
                  // Reset result — stale result no longer matches the new output mode
                  setResultUrl(null);
                  clearFeedback();
                  setProcessError(null);
                }}
                className="px-3 py-1.5 text-xs font-mono rounded-lg transition-all"
                style={{
                  background: active ? "rgba(34,211,238,0.18)" : "rgba(34,211,238,0.05)",
                  border: active ? "1px solid rgba(34,211,238,0.4)" : "1px solid rgba(34,211,238,0.1)",
                  color: active ? "#22D3EE" : "rgba(186,230,255,0.4)",
                  cursor: busy ? "not-allowed" : "pointer",
                  opacity: busy ? 0.5 : 1,
                }}
              >
                {opt === "transparent" ? "Transparent" : "White BG"}
              </button>
            );
          })}
        </div>

        {/* Fine Edges toggle */}
        <label
          className="flex items-center gap-2 cursor-pointer select-none"
          title="Enable for images with fur, feathers, or fine edge detail. Not needed for human hair."
        >
          <input
            type="checkbox"
            checked={fineEdges}
            onChange={(e) => {
              setFineEdges(e.target.checked);
              setResultUrl(null);
              clearFeedback();
              setProcessError(null);
            }}
            className="checkbox checkbox-xs"
            style={{ accentColor: "#22D3EE" }}
            disabled={busy}
          />
          <span
            className="text-xs font-mono"
            style={{ color: "rgba(186,230,255,0.55)" }}
          >
            Fine Edges
          </span>
          <span
            className="text-[10px] font-mono px-1.5 py-0.5 rounded"
            style={{
              background: "rgba(34,211,238,0.06)",
              border: "1px solid rgba(34,211,238,0.1)",
              color: "rgba(34,211,238,0.4)",
            }}
          >
            fur / feathers
          </span>
        </label>
      </div>

      {/* ── Image panels ── */}
      <EditorShell
        leftLabel="Original"
        rightLabel="Result"
        leftPanel={
          <img
            src={imageUrl}
            alt={image.title}
            className="rounded-lg object-contain"
            style={{ maxHeight: "52vh", maxWidth: "100%", display: "block" }}
          />
        }
        rightPanel={
          <>
            {/* Processing skeleton — shown while API is running */}
            {isProcessing && (
              <ProcessingSkeleton
                label="Removing Background"
                keyframePrefix="bg"
              />
            )}

            {/* Result image on checkerboard — shows transparency */}
            {resultUrl && (
              <>
                {resultLoading && (
                  <div
                    className="w-full rounded-xl flex items-center justify-center"
                    style={{ minHeight: "120px", background: "rgba(34,211,238,0.04)" }}
                  >
                    <Spinner />
                  </div>
                )}
                <div
                  className="rounded-lg overflow-hidden"
                  style={{
                    // Checkerboard only for transparent mode — reveals alpha areas.
                    // White mode fills transparency itself so a plain dark bg is fine.
                    ...(bgOutput === "transparent"
                      ? {
                          backgroundImage:
                            "linear-gradient(45deg,#2a2a2a 25%,transparent 25%)," +
                            "linear-gradient(-45deg,#2a2a2a 25%,transparent 25%)," +
                            "linear-gradient(45deg,transparent 75%,#2a2a2a 75%)," +
                            "linear-gradient(-45deg,transparent 75%,#2a2a2a 75%)",
                          backgroundSize: "16px 16px",
                          backgroundPosition: "0 0,0 8px,8px -8px,-8px 0px",
                          backgroundColor: "#1e1e1e",
                        }
                      : { backgroundColor: "#0B1220" }),
                    display: resultLoading ? "none" : "block",
                  }}
                >
                  <img
                    src={resultUrl}
                    alt="Background removed"
                    className="object-contain"
                    onLoad={() => setResultLoading(false)}
                    onError={() => setResultLoading(false)}
                    style={{ maxHeight: "52vh", maxWidth: "100%", display: "block" }}
                  />
                </div>
              </>
            )}

            {/* Empty state */}
            {!isProcessing && !resultUrl && (
              <p
                className="text-xs font-mono"
                style={{ color: "rgba(186,230,255,0.25)" }}
              >
                Click Remove Background to see result
              </p>
            )}
          </>
        }
      />

      {/* ── Feedback ── */}
      {(saveError || processError) && (
        <ErrorBanner message={saveError ?? processError!} />
      )}
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
          onClick={handleRemove}
          loading={isProcessing}
          disabled={busy}
          className="font-semibold"
        >
          {isProcessing ? <Spinner /> : <Wand2 size={13} />}
          {isProcessing ? "Removing…" : "Remove Background"}
        </Button>

        <Button
          variant="cyan"
          size="sm"
          onClick={() => save("copy", { imageId: image.id, fineEdges, bgOutput, title: `${image.title}_bg_removed` })}
          loading={isSavingCopy}
          disabled={busy || !resultUrl}
          className="font-semibold"
        >
          {isSavingCopy && <Spinner />}
          Save as Copy
        </Button>

        <Button
          variant="danger"
          size="sm"
          onClick={() => save("overwrite", { imageId: image.id, fineEdges, bgOutput, title: `${image.title}_bg_removed` })}
          loading={isSavingOverwrite}
          disabled={busy || !resultUrl}
          className="font-semibold"
        >
          {isSavingOverwrite && <Spinner />}
          Override Original
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={() => resultUrl && download(resultUrl)}
          loading={isDownloading}
          disabled={busy || !resultUrl}
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

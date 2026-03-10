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

// ─── Component ────────────────────────────────────────────────────────────────

interface BgRemoveToolProps {
  image: ImageItem;
}

export default function BgRemoveTool({ image }: BgRemoveToolProps) {
  const [fineEdges, setFineEdges] = useState(false);
  const [bgOutput, setBgOutput] = useState<BgOutput>("transparent");

  const [isProcessing, setIsProcessing] = useState(false);
  const [isSavingCopy, setIsSavingCopy] = useState(false);
  const [isSavingOverwrite, setIsSavingOverwrite] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultLoading, setResultLoading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  const imageUrl = getCldImageUrl({ src: image.publicId });

  const busy = isProcessing || isSavingCopy || isSavingOverwrite || isDownloading;

  // Calls the API to pre-warm the bg-removed derived version and returns its URL.
  // Uses saveMode "preview" so nothing is written to the DB.
  const handleRemove = async () => {
    setSaveError(null);
    setSaveSuccess(null);
    setResultUrl(null);
    setIsProcessing(true);
    try {
      const res = await axios.post<{ url: string }>("/api/image-bg-remove", {
        imageId: image.id,
        fineEdges,
        bgOutput,
        saveMode: "preview",
      });
      setResultUrl(res.data.url);
      setResultLoading(true);
    } catch (err: any) {
      setSaveError(err?.response?.data?.error ?? "Background removal failed.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Uploads the bg-removed version as a new asset and creates a new DB row.
  const handleSave = async (mode: "copy" | "overwrite") => {
    if (!resultUrl) return;
    setSaveError(null);
    setSaveSuccess(null);
    if (mode === "copy") setIsSavingCopy(true);
    else setIsSavingOverwrite(true);

    try {
      await axios.post("/api/image-bg-remove", {
        imageId: image.id,
        fineEdges,
        bgOutput,
        saveMode: mode,
        title: `${image.title}_bg_removed`,
      });
      const msg =
        mode === "copy"
          ? "Saved as a new copy in your library."
          : "Original image overwritten successfully.";
      setSaveSuccess(msg);
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err: any) {
      setSaveError(err?.response?.data?.error ?? "Failed to save.");
    } finally {
      setIsSavingCopy(false);
      setIsSavingOverwrite(false);
    }
  };

  // Downloads the bg-removed PNG from the result URL to the user's device.
  const handleDownload = async () => {
    if (!resultUrl) return;
    setIsDownloading(true);
    try {
      const res = await fetch(resultUrl);
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `${image.title}-bg-removed.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div>
      <style>{`
        @keyframes bgScan {
          0%   { top: 0%;    opacity: 0; }
          4%   { opacity: 1; }
          96%  { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes bgGlow {
          0%, 100% { opacity: 0.25; transform: scale(1); }
          50%      { opacity: 0.65; transform: scale(1.18); }
        }
        @keyframes bgDot {
          0%, 75%, 100% { transform: scale(0); opacity: 0; }
          40%           { transform: scale(1); opacity: 1; }
        }
        @keyframes bgCornerPulse {
          0%, 100% { opacity: 0.3; }
          50%      { opacity: 1; }
        }
        @keyframes bgShimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes bgSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes bgSpinReverse {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes bgFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

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
                  setSaveError(null);
                  setSaveSuccess(null);
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
              setSaveError(null);
              setSaveSuccess(null);
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
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">

        {/* ── Left: original image ── */}
        <div
          className="rounded-xl overflow-hidden flex flex-col gap-3 items-center justify-center p-4"
          style={{
            background: "#0B1220",
            border: "1px solid rgba(34,211,238,0.1)",
          }}
        >
          <span
            className="text-xs font-mono tracking-widest uppercase self-start"
            style={{ color: "rgba(34,211,238,0.5)" }}
          >
            Original
          </span>
          <img
            src={imageUrl}
            alt={image.title}
            className="rounded-lg object-contain"
            style={{ maxHeight: "52vh", maxWidth: "100%", display: "block" }}
          />
        </div>

        {/* ── Right: result panel ── */}
        <div
          className="rounded-xl overflow-hidden flex flex-col gap-3 items-center justify-center p-4"
          style={{
            background: "#0B1220",
            border: "1px solid rgba(34,211,238,0.1)",
          }}
        >
          <span
            className="text-xs font-mono tracking-widest uppercase self-start"
            style={{ color: "rgba(34,211,238,0.5)" }}
          >
            Result
          </span>

          {/* Processing skeleton — shown while API is running */}
          {isProcessing && (
            <div
              className="relative w-full rounded-xl overflow-hidden flex items-center justify-center"
              style={{
                minHeight: "260px",
                background: "linear-gradient(145deg, #060d1b 0%, #091525 100%)",
                animation: "bgFadeIn 0.25s ease-out",
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
                  animation: "bgGlow 2.6s ease-in-out infinite",
                }}
              />
              <div
                className="absolute inset-0"
                style={{
                  background:
                    "linear-gradient(108deg, transparent 38%, rgba(34,211,238,0.03) 50%, transparent 62%)",
                  backgroundSize: "200% 100%",
                  animation: "bgShimmer 2.8s ease-in-out infinite",
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
                  animation: "bgScan 2.2s ease-in-out infinite",
                }}
              />
              {[
                { top: 12, left: 12,  borderTop: true,    borderLeft: true,  delay: "0s"    },
                { top: 12, right: 12, borderTop: true,    borderRight: true, delay: "0.15s" },
                { bottom: 12, left: 12,  borderBottom: true, borderLeft: true,  delay: "0.3s"  },
                { bottom: 12, right: 12, borderBottom: true, borderRight: true, delay: "0.45s" },
              ].map((c, i) => (
                <div
                  key={i}
                  className="absolute"
                  style={{
                    width: 18, height: 18,
                    ...(c.top    !== undefined && { top:    c.top }),
                    ...(c.bottom !== undefined && { bottom: c.bottom }),
                    ...(c.left   !== undefined && { left:   c.left }),
                    ...(c.right  !== undefined && { right:  c.right }),
                    borderTop:    c.borderTop    ? "1.5px solid rgba(34,211,238,0.7)" : undefined,
                    borderBottom: c.borderBottom ? "1.5px solid rgba(34,211,238,0.7)" : undefined,
                    borderLeft:   c.borderLeft   ? "1.5px solid rgba(34,211,238,0.7)" : undefined,
                    borderRight:  c.borderRight  ? "1.5px solid rgba(34,211,238,0.7)" : undefined,
                    animation: `bgCornerPulse 2.6s ease-in-out ${c.delay} infinite`,
                  }}
                />
              ))}
              <div className="relative z-10 flex flex-col items-center gap-4">
                <div className="relative" style={{ width: 52, height: 52 }}>
                  <div className="absolute inset-0 rounded-full" style={{ border: "1.5px solid rgba(34,211,238,0.08)" }} />
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      border: "1.5px solid transparent",
                      borderTopColor: "rgba(34,211,238,0.85)",
                      borderRightColor: "rgba(34,211,238,0.25)",
                      animation: "bgSpin 1.1s linear infinite",
                    }}
                  />
                  <div className="absolute inset-2 rounded-full" style={{ border: "1px solid rgba(34,211,238,0.06)" }} />
                  <div
                    className="absolute inset-2 rounded-full"
                    style={{
                      border: "1px solid transparent",
                      borderTopColor: "rgba(34,211,238,0.5)",
                      borderLeftColor: "rgba(34,211,238,0.15)",
                      animation: "bgSpinReverse 0.75s linear infinite",
                    }}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div
                      style={{
                        width: 5, height: 5, borderRadius: "50%",
                        background: "rgba(34,211,238,0.9)",
                        boxShadow: "0 0 6px rgba(34,211,238,0.7)",
                        animation: "bgGlow 2.6s ease-in-out infinite",
                      }}
                    />
                  </div>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <span
                    className="text-[10px] font-mono tracking-[0.22em] uppercase"
                    style={{ color: "rgba(34,211,238,0.65)" }}
                  >
                    Removing Background
                  </span>
                  <div className="flex gap-1.5">
                    {[0, 0.22, 0.44].map((delay, i) => (
                      <div
                        key={i}
                        style={{
                          width: 3, height: 3, borderRadius: "50%",
                          background: "rgba(34,211,238,0.6)",
                          animation: `bgDot 1.5s ease-in-out ${delay}s infinite`,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
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
          onClick={() => handleSave("copy")}
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
          onClick={() => handleSave("overwrite")}
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
          onClick={handleDownload}
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

"use client";

import { useState } from "react";
import axios from "axios";

interface UseImageSaveOptions {
  // The API endpoint to POST to (e.g. "/api/image-crop" or "/api/image-bg-remove").
  endpoint: string;
  // Filename used when the user triggers a download (e.g. "my-image-cropped.png").
  downloadFilename: string;
}

interface UseImageSaveReturn {
  isSavingCopy: boolean;
  isSavingOverwrite: boolean;
  isDownloading: boolean;
  saveError: string | null;
  saveSuccess: string | null;
  // Posts to the endpoint with { ...payload, mode }. Sets success/error feedback automatically.
  save: (mode: "copy" | "overwrite", payload: Record<string, unknown>) => Promise<void>;
  // Fetches the given URL as a Blob and triggers a browser download.
  download: (url: string) => Promise<void>;
  // Clears saveError and saveSuccess — call when tool options change to discard stale feedback.
  clearFeedback: () => void;
}

// Encapsulates the save-copy / save-overwrite / download state and handlers
// shared by all playground tools (CropTool, BgRemoveTool, and future tools).
// Extracted to hooks/ — prevents duplicating ~40 lines of identical logic per tool.
export function useImageSave({
  endpoint,
  downloadFilename,
}: UseImageSaveOptions): UseImageSaveReturn {
  const [isSavingCopy, setIsSavingCopy] = useState(false);
  const [isSavingOverwrite, setIsSavingOverwrite] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Posts to the endpoint with the given payload + mode, then sets success/error state.
  // Auto-clears the success message after 4 seconds.
  const save = async (
    mode: "copy" | "overwrite",
    payload: Record<string, unknown>,
  ) => {
    setSaveError(null);
    setSaveSuccess(null);
    if (mode === "copy") setIsSavingCopy(true);
    else setIsSavingOverwrite(true);

    try {
      await axios.post(endpoint, { ...payload, mode });
      const msg =
        mode === "copy"
          ? "Saved as a new copy in your library."
          : "Original image overwritten successfully.";
      setSaveSuccess(msg);
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } };
      setSaveError(e?.response?.data?.error ?? "Failed to save.");
    } finally {
      if (mode === "copy") setIsSavingCopy(false);
      else setIsSavingOverwrite(false);
    }
  };

  // Fetches the URL as a Blob and triggers a browser download with the configured filename.
  const download = async (url: string) => {
    setIsDownloading(true);
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = downloadFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(link.href);
    } finally {
      setIsDownloading(false);
    }
  };

  // Clears both feedback states — call when the user changes options that would make
  // the current success/error stale (e.g. switching crop preset, toggling bg output mode).
  const clearFeedback = () => {
    setSaveError(null);
    setSaveSuccess(null);
  };

  return {
    isSavingCopy,
    isSavingOverwrite,
    isDownloading,
    saveError,
    saveSuccess,
    save,
    download,
    clearFeedback,
  };
}

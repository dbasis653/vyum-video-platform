"use client";

import React, { useEffect, useRef, useState } from "react";
import { CldImage } from "next-cloudinary";
import { UploadIcon, DownloadIcon } from "lucide-react";

const socialFormats = {
  "Instagram Square (1:1)": { width: 1080, height: 1080, aspectRatio: "1:1" },
  "Instagram Portrait (4:5)": { width: 1080, height: 1350, aspectRatio: "4:5" },
  "Twitter Post (16:9)": { width: 1200, height: 675, aspectRatio: "16:9" },
  "Twitter Header (3:1)": { width: 1500, height: 500, aspectRatio: "3:1" },
  "Facebook Cover (205:78)": { width: 820, height: 312, aspectRatio: "205:78" },
};

type SocialFormat = keyof typeof socialFormats;

export default function ImageUpload() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<SocialFormat>(
    "Instagram Square (1:1)",
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (uploadedImage) setIsTransforming(true);
  }, [uploadedImage, selectedFormat]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) {
      alert("Please select an image file first.");
      return;
    }

    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("title", title.trim() || "Untitled");

    try {
      const response = await fetch("/api/image-upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload image failed");

      const data: { publicId: string } = await response.json();
      setUploadedImage(data.publicId);
    } catch (error) {
      console.log("upload failed", error);
      alert("Upload image failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownload = () => {
    if (!imageRef.current) return;

    fetch(imageRef.current.src)
      .then((response) => response.blob())
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `${selectedFormat.replace(/\s+/g, "-").toLowerCase()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      });
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* HUD page header */}
      <div className="flex items-center gap-3 mb-7">
        <div className="w-0.5 h-4 rounded-full" style={{ background: "#3B82F6" }} />
        <span className="text-xs font-mono tracking-widest uppercase" style={{ color: "#22D3EE" }}>
          Image Upload
        </span>
        <div className="flex-1 h-px" style={{ background: "rgba(34,211,238,0.1)" }} />
      </div>

      {/* Upload card */}
      <div
        className="rounded-2xl p-6 mb-6"
        style={{
          background: "#0f1929",
          border: "1px solid rgba(34,211,238,0.12)",
        }}
      >
        <div className="flex flex-col gap-5">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono" style={{ color: "rgba(186,230,255,0.55)" }}>
              Title <span style={{ color: "#f87171" }}>*</span>
            </label>
            <input
              type="text"
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
              style={{
                background: "#132033",
                border: "1px solid rgba(34,211,238,0.15)",
                color: "#bfdbfe",
              }}
              placeholder="Enter image title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* File picker */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono" style={{ color: "rgba(186,230,255,0.55)" }}>
              Image File
            </label>
            <input
              type="file"
              onChange={handleFileChange}
              disabled={isUploading}
              className="file-input file-input-bordered file-input-primary w-full"
            />
            {selectedFile && (
              <p className="text-[10px] font-mono mt-0.5" style={{ color: "rgba(186,230,255,0.35)" }}>
                Selected: {selectedFile.name}
              </p>
            )}
          </div>

          {/* Upload button */}
          <button
            type="button"
            onClick={handleFileUpload}
            disabled={isUploading || !selectedFile}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: isUploading || !selectedFile ? "rgba(34,211,238,0.15)" : "#22D3EE",
              color: isUploading || !selectedFile ? "rgba(34,211,238,0.4)" : "#0B1220",
              cursor: isUploading || !selectedFile ? "not-allowed" : "pointer",
            }}
          >
            {isUploading ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Uploading…
              </>
            ) : (
              <>
                <UploadIcon size={15} />
                Upload Image
              </>
            )}
          </button>

          {isUploading && <progress className="progress progress-primary w-full" />}
        </div>
      </div>

      {/* Format + preview card */}
      {uploadedImage && (
        <div
          className="rounded-2xl p-6"
          style={{
            background: "#0f1929",
            border: "1px solid rgba(34,211,238,0.12)",
          }}
        >
          {/* Format selector */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-0.5 h-4 rounded-full" style={{ background: "#3B82F6" }} />
            <span className="text-xs font-mono tracking-widest uppercase" style={{ color: "#22D3EE" }}>
              Social Format
            </span>
            <div className="flex-1 h-px" style={{ background: "rgba(34,211,238,0.1)" }} />
          </div>

          <select
            className="select select-bordered w-full mb-6"
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value as SocialFormat)}
          >
            {Object.keys(socialFormats).map((format) => (
              <option key={format} value={format}>
                {format}
              </option>
            ))}
          </select>

          {/* Preview */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-0.5 h-4 rounded-full" style={{ background: "#3B82F6" }} />
            <span className="text-xs font-mono tracking-widest uppercase" style={{ color: "#22D3EE" }}>
              Preview
            </span>
            <div className="flex-1 h-px" style={{ background: "rgba(34,211,238,0.1)" }} />
          </div>

          <div
            className="relative flex justify-center rounded-xl overflow-hidden"
            style={{ background: "#0B1220", border: "1px solid rgba(34,211,238,0.08)" }}
          >
            {isTransforming && (
              <div
                className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10"
                style={{ background: "rgba(11,18,32,0.75)" }}
              >
                <svg className="animate-spin w-7 h-7" fill="none" viewBox="0 0 24 24" style={{ color: "#22D3EE" }}>
                  <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                <span className="text-xs font-mono" style={{ color: "rgba(34,211,238,0.5)" }}>Transforming…</span>
              </div>
            )}
            <CldImage
              width={socialFormats[selectedFormat].width}
              height={socialFormats[selectedFormat].height}
              src={uploadedImage}
              sizes="100vw"
              alt="transformed image"
              crop="fill"
              aspectRatio={socialFormats[selectedFormat].aspectRatio}
              gravity="auto"
              ref={imageRef}
              onLoad={() => setIsTransforming(false)}
            />
          </div>

          {/* Download */}
          <div className="flex justify-end mt-5">
            <button
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-all"
              style={{ background: "#3B82F6", color: "#0B1220" }}
              onClick={handleDownload}
            >
              <DownloadIcon size={15} />
              Download for {selectedFormat}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

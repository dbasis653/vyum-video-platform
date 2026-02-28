//It tells Next.js:
//This component must run in the browser (client-side), not on the server.
"use client";

import React, { useEffect, useState, useRef } from "react";
import { CldImage } from "next-cloudinary";
import { DownloadIcon } from "lucide-react";

const socialFormats = {
  "Instagram Square (1:1)": { width: 1080, height: 1080, aspectRatio: "1:1" },
  "Instagram Portrait (4:5)": { width: 1080, height: 1350, aspectRatio: "4:5" },
  "Twitter Post (16:9)": { width: 1200, height: 675, aspectRatio: "16:9" },
  "Twitter Header (3:1)": { width: 1500, height: 500, aspectRatio: "3:1" },
  "Facebook Cover (205:78)": { width: 820, height: 312, aspectRatio: "205:78" },
};

type SocialFormat = keyof typeof socialFormats;

export default function SocialShare() {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<SocialFormat>(
    "Instagram Square (1:1)",
  );
  const [isUploading, setIsUploading] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (uploadedImage) {
      setIsTransforming(true);
    }
  }, [uploadedImage, selectedFormat]);

  //UPLOADING THE IMAGE TO CLOUDINARY
  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    console.log("upload start");

    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);

    console.log("will collect formData now");
    const formData = new FormData();
    formData.append("file", file);
    //appending with the backend

    try {
      console.log("Post request sent to /api/image-upload");

      const response = await fetch("/api/image-upload", {
        method: "POST",
        body: formData,
      });

      console.log("fetch complete");

      if (!response.ok) throw new Error("Upload image failed");

      const data = await response.json();
      setUploadedImage(data.publicId);
    } catch (error) {
      console.log("upload is failled", error);
      alert("Upload image failed");
    } finally {
      setIsUploading(false);
    }
  };

  //DOWNLOAD
  const handleDownload = () => {
    if (!imageRef.current) return;

    //it will download the element
    fetch(imageRef.current.src)
      .then((response) => response.blob())
      .then((blob) => {
        //This creates a temporary browser URL like: http://localhost:3000/abcd-1234
        //file stored in browser memory (RAM).
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        //Without link.download, browser would just open the image in a new tab.
        link.download = `${selectedFormat.replace(/\s+/g, "-").toLowerCase()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        document.body.removeChild(link);
      });
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* HUD page header */}
      <div className="flex items-center gap-3 mb-7">
        <div className="w-0.5 h-4 rounded-full" style={{ background: "#3B82F6" }} />
        <span className="text-xs font-mono tracking-widest uppercase" style={{ color: "#22D3EE" }}>
          Social Media Image Creator
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
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono" style={{ color: "rgba(186,230,255,0.55)" }}>
              Choose an image file
            </label>
            <input
              type="file"
              onChange={handleFileUpload}
              className="file-input file-input-bordered file-input-primary w-full"
            />
          </div>

          {isUploading && (
            <div className="flex flex-col gap-2">
              <progress className="progress progress-primary w-full" />
              <span className="text-[10px] font-mono" style={{ color: "rgba(34,211,238,0.45)" }}>
                Uploading to cloud…
              </span>
            </div>
          )}
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

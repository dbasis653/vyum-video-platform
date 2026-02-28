"use client";

//file upload using AXIOS instead of FETCH()

import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import { UploadIcon } from "lucide-react";

function VideoUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);

  const router = useRouter();

  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!file) return;
    if (file.size > MAX_FILE_SIZE) {
      alert("File size exceeds 100MB limit.");
      return;
    }

    setIsUploading(true);
    setUploadSuccess(false);
    const formData = new FormData();
    //It creates an empty formData() container

    //and these creates keys and values
    //fundamentally, we are Creating key-value pairs inside the FormData object
    formData.append("file", file);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("originalSize", file.size.toString());

    try {
      const response = await axios.post("/api/video-upload", formData);

      //check for 200 reponse
      setTitle("");
      setDescription("");
      setFile(null);
      setFileInputKey((prev) => prev + 1);
      setUploadSuccess(true);
    } catch (error) {
      console.log(
        "failled trying to upload the video using post method",
        error,
      );
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      {/* HUD page header */}
      <div className="flex items-center gap-3 mb-7">
        <div className="w-0.5 h-4 rounded-full" style={{ background: "#3B82F6" }} />
        <span className="text-xs font-mono tracking-widest uppercase" style={{ color: "#22D3EE" }}>
          Video Upload
        </span>
        <div className="flex-1 h-px" style={{ background: "rgba(34,211,238,0.1)" }} />
      </div>

      {/* Form card */}
      <div
        className="rounded-2xl p-6"
        style={{
          background: "#0f1929",
          border: "1px solid rgba(34,211,238,0.12)",
        }}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Title */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono" style={{ color: "rgba(186,230,255,0.55)" }}>
              Title <span style={{ color: "#f87171" }}>*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setUploadSuccess(false);
              }}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none transition-colors"
              style={{
                background: "#132033",
                border: "1px solid rgba(34,211,238,0.15)",
                color: "#bfdbfe",
              }}
              required
            />
          </div>

          {/* Description */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono" style={{ color: "rgba(186,230,255,0.55)" }}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => {
                setDescription(e.target.value);
                setUploadSuccess(false);
              }}
              rows={3}
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none transition-colors"
              style={{
                background: "#132033",
                border: "1px solid rgba(34,211,238,0.15)",
                color: "#bfdbfe",
              }}
            />
          </div>

          {/* File picker */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono" style={{ color: "rgba(186,230,255,0.55)" }}>
              Video File
            </label>
            <input
              key={fileInputKey}
              type="file"
              accept="video/*"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setUploadSuccess(false);
              }}
              className="file-input file-input-bordered w-full"
              required
            />
            <p className="text-[10px] font-mono" style={{ color: "rgba(186,230,255,0.25)" }}>
              Max 100 MB · MP4, MOV, WebM
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isUploading}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-lg text-sm font-semibold transition-all"
            style={{
              background: isUploading ? "rgba(34,211,238,0.15)" : "#22D3EE",
              color: isUploading ? "rgba(34,211,238,0.4)" : "#0B1220",
              cursor: isUploading ? "not-allowed" : "pointer",
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
                Upload Video
              </>
            )}
          </button>
        </form>

        {/* Success banner */}
        {uploadSuccess && (
          <div
            className="mt-5 flex items-center gap-2.5 px-4 py-3 rounded-lg text-sm"
            style={{
              background: "rgba(34,211,238,0.08)",
              border: "1px solid rgba(34,211,238,0.2)",
              color: "#22D3EE",
            }}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Your video has been added to your own little cloud
          </div>
        )}
      </div>
    </div>
  );
}

export default VideoUpload;

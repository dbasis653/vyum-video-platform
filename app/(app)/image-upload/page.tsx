"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadIcon } from "lucide-react";
import SectionHeader from "@/components/ui/SectionHeader";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";

export default function ImageUpload() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

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

      const data: { id: string; publicId: string } = await response.json();
      // Navigate to the playground using the DB UUID (playground API looks up by UUID, not publicId)
      router.push(`/playground/${data.id}`);
    } catch (error) {
      console.log("upload failed", error);
      alert("Upload image failed");
    } finally {
      setIsUploading(false);
    }
  };


  return (
    <div className="max-w-3xl mx-auto">
      <SectionHeader label="Image Upload" />

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
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleFileUpload}
            loading={isUploading}
            disabled={!selectedFile}
            className="w-full font-semibold"
          >
            {isUploading ? (
              <>
                <Spinner className="w-4 h-4" />
                Uploading…
              </>
            ) : (
              <>
                <UploadIcon size={15} />
                Upload Image
              </>
            )}
          </Button>

          {isUploading && <progress className="progress progress-primary w-full" />}
        </div>
      </div>

    </div>
  );
}

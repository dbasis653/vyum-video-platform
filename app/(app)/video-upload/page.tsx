"use client";

//file upload using AXIOS instead of FETCH()

import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

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
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Upload Video</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="label">
            <span className="label-text">Title</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setUploadSuccess(false);
            }}
            className="input input-bordered w-full"
            required
          />
        </div>
        <div>
          <label className="label">
            <span className="label-text">Description</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              setUploadSuccess(false);
            }}
            className="textarea textarea-bordered w-full"
          />
        </div>
        <div>
          <label className="label">
            <span className="label-text">Video File</span>
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
        </div>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isUploading}
        >
          {isUploading ? (
            <>
              <span className="loading loading-spinner loading-sm"></span>
              Uploading...
            </>
          ) : (
            "Upload Video"
          )}
        </button>
      </form>
      {uploadSuccess && (
        <div className="mt-4 p-4 rounded-lg bg-green-100 text-green-800 text-sm">
          Your video has been added to your own little cloud
        </div>
      )}
    </div>
  );
}

export default VideoUpload;

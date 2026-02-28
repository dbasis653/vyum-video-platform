"use client";

import React, { useState, useRef, useCallback } from "react";
import { getCldImageUrl } from "next-cloudinary";
import { Download, SquarePen } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import axios from "axios";
import { ImageItem } from "@/types";

dayjs.extend(relativeTime);

interface ImageCardProps {
  image: ImageItem;
  onUpdate: (updated: ImageItem) => void;
  onDelete: (id: string) => void;
}

const ImageCard: React.FC<ImageCardProps> = ({ image, onUpdate, onDelete }) => {
  const previewDialogRef = useRef<HTMLDialogElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [editTitle, setEditTitle] = useState(image.title);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const getThumbnailUrl = useCallback((publicId: string) => {
    return getCldImageUrl({
      src: publicId,
      width: 200,
      height: 150,
      crop: "fill",
      gravity: "auto",
    });
  }, []);

  const getFullImageUrl = useCallback((publicId: string) => {
    return getCldImageUrl({ src: publicId });
  }, []);

  const openModal = () => {
    setEditTitle(image.title);
    setModalError(null);
    dialogRef.current?.showModal();
  };

  const closeModal = () => dialogRef.current?.close();

  const handleDownload = () => {
    const url = getFullImageUrl(image.publicId);
    fetch(url)
      .then((res) => res.blob())
      .then((blob) => {
        const link = document.createElement("a");
        link.href = window.URL.createObjectURL(blob);
        link.download = `${image.title}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(link.href);
      });
  };

  const handleSave = async () => {
    if (!editTitle.trim()) {
      setModalError("Title is required.");
      return;
    }
    setIsSaving(true);
    setModalError(null);
    try {
      const response = await axios.patch(`/api/images/${image.id}`, {
        title: editTitle.trim(),
      });
      onUpdate(response.data);
      closeModal();
    } catch (err: any) {
      setModalError(err?.response?.data?.error ?? "Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Delete this image? This cannot be undone.")) return;
    setIsDeleting(true);
    setModalError(null);
    try {
      await axios.delete(`/api/images/${image.id}`);
      onDelete(image.id);
      closeModal();
    } catch (err: any) {
      setModalError(err?.response?.data?.error ?? "Failed to delete image.");
    } finally {
      setIsDeleting(false);
    }
  };

  const busy = isSaving || isDeleting;

  const Spinner = () => (
    <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );

  return (
    <>
      {/* ── Card ── */}
      <div
        className="relative rounded-xl overflow-hidden cursor-pointer w-full group transition-all duration-300"
        style={{
          background: "#0f1929",
          border: "1px solid rgba(34,211,238,0.12)",
        }}
        tabIndex={0}
        onClick={() => previewDialogRef.current?.showModal()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ")
            previewDialogRef.current?.showModal();
        }}
      >
        {/* Thumbnail */}
        <div className="aspect-video overflow-hidden">
          <img
            src={getThumbnailUrl(image.publicId)}
            alt={image.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          />
        </div>

        {/* Meta */}
        <div className="p-2">
          <h2 className="font-bold text-xs truncate" style={{ color: "#bfdbfe" }}>
            {image.title}
          </h2>
          <p className="text-[10px] font-mono mt-0.5" style={{ color: "rgba(186,230,255,0.35)" }}>
            {image.width} × {image.height}
          </p>
          <div className="flex justify-end gap-1 mt-1.5">
            <button
              className="flex items-center justify-center w-5 h-5 rounded transition-all"
              style={{
                background: "rgba(34,211,238,0.06)",
                border: "1px solid rgba(34,211,238,0.1)",
                color: "rgba(186,230,255,0.5)",
              }}
              title="Edit image"
              onClick={(e) => { e.stopPropagation(); openModal(); }}
            >
              <SquarePen size={10} />
            </button>
            <button
              className="flex items-center justify-center w-5 h-5 rounded transition-all"
              style={{
                background: "rgba(34,211,238,0.1)",
                border: "1px solid rgba(34,211,238,0.18)",
                color: "#22D3EE",
              }}
              title="Download image"
              onClick={(e) => { e.stopPropagation(); handleDownload(); }}
            >
              <Download size={10} />
            </button>
          </div>
        </div>
      </div>

      {/* ── Preview modal ── */}
      <dialog ref={previewDialogRef} className="modal">
        <div
          className="modal-box max-w-2xl"
          style={{
            background: "#0f1929",
            border: "1px solid rgba(34,211,238,0.15)",
          }}
        >
          <img
            src={getFullImageUrl(image.publicId)}
            alt={image.title}
            className="w-auto mx-auto block rounded-xl object-contain max-h-[60vh] max-w-full"
          />
          <div className="flex justify-between items-center mt-4">
            <h3 className="font-bold text-sm" style={{ color: "#bfdbfe" }}>
              {image.title}
            </h3>
            <div className="flex gap-2">
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
                style={{
                  background: "rgba(34,211,238,0.06)",
                  border: "1px solid rgba(34,211,238,0.12)",
                  color: "rgba(186,230,255,0.55)",
                }}
                title="Edit"
                onClick={() => { previewDialogRef.current?.close(); openModal(); }}
              >
                <SquarePen size={12} />
                Edit
              </button>
              <button
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all"
                style={{
                  background: "rgba(34,211,238,0.12)",
                  border: "1px solid rgba(34,211,238,0.22)",
                  color: "#22D3EE",
                }}
                title="Download"
                onClick={handleDownload}
              >
                <Download size={12} />
                Download
              </button>
            </div>
          </div>
          <div className="modal-action mt-2">
            <form method="dialog">
              <button
                className="px-4 py-1.5 rounded-lg text-xs font-mono"
                style={{
                  border: "1px solid rgba(34,211,238,0.12)",
                  color: "rgba(186,230,255,0.4)",
                }}
              >
                Close
              </button>
            </form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      {/* ── Edit modal ── */}
      <dialog ref={dialogRef} className="modal">
        <div
          className="modal-box"
          style={{
            background: "#0f1929",
            border: "1px solid rgba(34,211,238,0.15)",
          }}
        >
          <h3
            className="text-xs font-mono tracking-widest uppercase mb-5"
            style={{ color: "#22D3EE" }}
          >
            Edit Image
          </h3>

          <div className="flex flex-col gap-1.5 mb-4">
            <label className="text-xs font-mono" style={{ color: "rgba(186,230,255,0.5)" }}>
              Title <span style={{ color: "#f87171" }}>*</span>
            </label>
            <input
              type="text"
              className="w-full rounded-lg px-3 py-2.5 text-sm outline-none"
              style={{
                background: "#132033",
                border: "1px solid rgba(34,211,238,0.15)",
                color: "#bfdbfe",
              }}
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              disabled={busy}
            />
          </div>

          {modalError && (
            <p className="text-xs mb-3 font-mono" style={{ color: "#f87171" }}>
              {modalError}
            </p>
          )}

          <div className="modal-action flex-wrap gap-2">
            <button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all"
              style={{
                background: "rgba(248,113,113,0.07)",
                border: "1px solid rgba(248,113,113,0.18)",
                color: "rgba(248,113,113,0.75)",
              }}
              onClick={handleDelete}
              disabled={busy}
            >
              {isDeleting && <Spinner />}
              Delete
            </button>
            <div className="flex-1" />
            <button
              className="px-3 py-1.5 rounded-lg text-xs font-mono transition-all"
              style={{
                border: "1px solid rgba(34,211,238,0.12)",
                color: "rgba(186,230,255,0.4)",
              }}
              onClick={closeModal}
              disabled={busy}
            >
              Cancel
            </button>
            <button
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: busy ? "rgba(34,211,238,0.15)" : "#22D3EE",
                color: busy ? "rgba(34,211,238,0.4)" : "#0B1220",
                cursor: busy ? "not-allowed" : "pointer",
              }}
              onClick={handleSave}
              disabled={busy}
            >
              {isSaving && <Spinner />}
              Save
            </button>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  );
};

export default ImageCard;

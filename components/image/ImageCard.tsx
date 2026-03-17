"use client";

import React, { useState, useRef } from "react";
import { getCldImageUrl } from "next-cloudinary";
import { Download, SquarePen, Trash2 } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import axios from "axios";
import { useRouter } from "next/navigation";
import { ImageItem } from "@/types";
import ImagePreviewModal from "@/components/image/ImagePreviewModal";
import EditModalFooter from "@/components/ui/EditModalFooter";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import IconButton from "@/components/ui/IconButton";
import Spinner from "@/components/ui/Spinner";

dayjs.extend(relativeTime);

interface ImageCardProps {
  image: ImageItem;
  onUpdate: (updated: ImageItem) => void;
  onDelete: (id: string) => void;
}

const ImageCard: React.FC<ImageCardProps> = ({ image, onUpdate, onDelete }) => {
  const router = useRouter();
  const previewDialogRef = useRef<HTMLDialogElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const confirmDialogRef = useRef<HTMLDialogElement>(null);
  const [editTitle, setEditTitle] = useState(image.title);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const navigateToPlayground = () => {
    setIsNavigating(true);
    router.push(`/playground/${image.id}`);
  };

  // Navigates to the Playground with the BG Remove tool pre-selected via query param
  const navigateToPlaygroundBgRemove = () => {
    setIsNavigating(true);
    router.push(`/playground/${image.id}?tool=bg-remove`);
  };

  const thumbnailUrl = getCldImageUrl({
    src: image.publicId,
    width: 200,
    height: 150,
    crop: "fill",
    gravity: "auto",
  });
  const fullImageUrl = getCldImageUrl({ src: image.publicId });

  const openModal = () => {
    setEditTitle(image.title);
    setModalError(null);
    dialogRef.current?.showModal();
  };

  const closeModal = () => dialogRef.current?.close();

  const handleDownload = () => {
    fetch(fullImageUrl)
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
    setIsDeleting(true);
    setModalError(null);
    try {
      await axios.delete(`/api/images/${image.id}`);
      onDelete(image.id);
      confirmDialogRef.current?.close();
      closeModal();
    } catch (err: any) {
      setModalError(err?.response?.data?.error ?? "Failed to delete image.");
      confirmDialogRef.current?.close();
    } finally {
      setIsDeleting(false);
    }
  };

  const busy = isSaving || isDeleting;

  return (
    <>
      {/* ── Card ── */}
      <div
        className="relative rounded-xl overflow-hidden cursor-pointer w-full group transition-all duration-300 hover:shadow-[0_4px_24px_rgba(34,211,238,0.1)] active:scale-[0.99]"
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
            src={thumbnailUrl}
            alt={image.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
          />
        </div>

        {/* Meta */}
        <div className="p-2">
          <h2
            className="font-bold text-xs truncate"
            style={{ color: "#bfdbfe" }}
          >
            {image.title}
          </h2>
          <p
            className="text-[10px] font-mono mt-0.5"
            style={{ color: "rgba(186,230,255,0.35)" }}
          >
            {image.width} × {image.height}
          </p>
          <div className="flex justify-end gap-1 mt-1.5">
            {/* Open in Playground */}
            <IconButton
              variant="ghost"
              iconSize="sm"
              title="Open in Playground"
              disabled={isNavigating}
              onClick={(e) => {
                e.stopPropagation();
                navigateToPlayground();
              }}
            >
              {isNavigating ? <Spinner /> : <SquarePen size={10} />}
            </IconButton>

            {/* Download */}
            <IconButton
              variant="cyan"
              iconSize="sm"
              title="Download image"
              onClick={(e) => {
                e.stopPropagation();
                handleDownload();
              }}
            >
              <Download size={10} />
            </IconButton>

            {/* Delete */}
            <IconButton
              variant="danger"
              iconSize="sm"
              title="Delete image"
              onClick={(e) => {
                e.stopPropagation();
                confirmDialogRef.current?.showModal();
              }}
            >
              <Trash2 size={10} />
            </IconButton>
          </div>
        </div>
      </div>

      {/* ── Confirm delete dialog ── */}
      <ConfirmDialog
        dialogRef={confirmDialogRef}
        title="Delete Image"
        message="This image will be permanently deleted from your library and Cloudinary. This cannot be undone."
        confirmLabel="Delete"
        isConfirming={isDeleting}
        onConfirm={handleDelete}
      />

      {/* ── Preview modal ── */}
      <ImagePreviewModal
        dialogRef={previewDialogRef}
        image={image}
        imageUrl={fullImageUrl}
        onEdit={openModal}
        onDownload={handleDownload}
        onCrop={navigateToPlayground}
        onBgRemove={navigateToPlaygroundBgRemove}
        onPlayground={navigateToPlayground}
      />

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
            <label
              className="text-xs font-mono"
              style={{ color: "rgba(186,230,255,0.5)" }}
            >
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

          <EditModalFooter
            onDelete={() => confirmDialogRef.current?.showModal()}
            onCancel={closeModal}
            onSave={handleSave}
            isSaving={isSaving}
            isDeleting={isDeleting}
          />
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>
    </>
  );
};

export default ImageCard;

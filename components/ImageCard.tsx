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

  return (
    <>
      {/* Card */}
      <div
        className="card bg-base-100 shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer w-full"
        tabIndex={0}
        onClick={() => previewDialogRef.current?.showModal()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") previewDialogRef.current?.showModal();
        }}
      >
        <figure className="aspect-video">
          <img
            src={getThumbnailUrl(image.publicId)}
            alt={image.title}
            className="w-full h-full object-cover"
          />
        </figure>
        <div className="card-body p-2">
          <h2 className="font-bold text-sm truncate">{image.title}</h2>
          <p className="text-xs text-base-content opacity-60">
            {image.width} × {image.height}
          </p>
          <p className="text-xs text-base-content opacity-60">
            {dayjs(image.createdAt).fromNow()}
          </p>
          <div className="flex justify-end gap-1 mt-1">
            <button
              className="btn btn-ghost btn-xs"
              title="Edit image"
              onClick={(e) => { e.stopPropagation(); openModal(); }}
            >
              <SquarePen size={13} />
            </button>
            <button
              className="btn btn-primary btn-xs"
              title="Download image"
              onClick={(e) => { e.stopPropagation(); handleDownload(); }}
            >
              <Download size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Preview modal */}
      <dialog ref={previewDialogRef} className="modal">
        <div className="modal-box max-w-2xl">
          <img
            src={getFullImageUrl(image.publicId)}
            alt={image.title}
            className="w-auto mx-auto block rounded-lg object-contain max-h-[60vh] max-w-full"
          />
          <div className="flex justify-between items-center mt-4">
            <h3 className="font-bold text-lg">{image.title}</h3>
            <div className="flex gap-2">
              <button
                className="btn btn-ghost btn-sm"
                title="Edit"
                onClick={() => { previewDialogRef.current?.close(); openModal(); }}
              >
                <SquarePen size={16} />
              </button>
              <button
                className="btn btn-primary btn-sm"
                title="Download"
                onClick={handleDownload}
              >
                <Download size={16} />
              </button>
            </div>
          </div>
          <div className="modal-action mt-2">
            <form method="dialog">
              <button className="btn btn-ghost btn-sm">Cancel</button>
            </form>
          </div>
        </div>
        <form method="dialog" className="modal-backdrop">
          <button>close</button>
        </form>
      </dialog>

      {/* Edit modal */}
      <dialog ref={dialogRef} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">Edit Image</h3>
          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-semibold">
                Title <span className="text-error">*</span>
              </span>
            </label>
            <input
              type="text"
              className="input input-bordered w-full"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              disabled={busy}
            />
          </div>
          {modalError && <p className="text-error text-sm mb-3">{modalError}</p>}
          <div className="modal-action flex-wrap gap-2">
            <button className="btn btn-error btn-sm" onClick={handleDelete} disabled={busy}>
              {isDeleting && <span className="loading loading-spinner loading-xs" />}
              Delete
            </button>
            <div className="flex-1" />
            <button className="btn btn-ghost btn-sm" onClick={closeModal} disabled={busy}>
              Cancel
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleSave} disabled={busy}>
              {isSaving && <span className="loading loading-spinner loading-xs" />}
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

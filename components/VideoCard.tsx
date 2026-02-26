import React, { useState, useRef, useCallback } from "react";
import { getCldImageUrl, getCldVideoUrl } from "next-cloudinary";
import { Download, Clock, FileDown, FileUp, SquarePen } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { filesize } from "filesize";
import axios from "axios";
import { Video } from "@/types";

dayjs.extend(relativeTime);

interface VideoCardProps {
  video: Video;
  onDownload: (url: string, title: string) => void;
  onUpdate: (updated: Video) => void;
  onDelete: (id: string) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({ video, onDownload, onUpdate, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  const dialogRef = useRef<HTMLDialogElement>(null);
  const [editTitle, setEditTitle] = useState(video.title);
  const [editDescription, setEditDescription] = useState(video.description ?? "");
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const getThumbnailUrl = useCallback((publicId: string) => {
    return getCldImageUrl({
      src: publicId,
      width: 400,
      height: 300,
      crop: "fill",
      gravity: "auto",
      format: "jpg",
      quality: "auto",
      assetType: "video",
    });
  }, []);

  const getFullVideoUrl = useCallback((publicId: string) => {
    return getCldVideoUrl({ src: publicId });
  }, []);

  const getPreviewVideoUrl = useCallback((publicId: string) => {
    return getCldVideoUrl({
      src: publicId,
      width: 400,
      height: 225,
      rawTransformations: ["e_preview:duration_15:max_seg_9:min_seg_dur_1"],
    });
  }, []);

  const formatSize = useCallback((size: number) => filesize(size), []);

  const formatDuration = useCallback((seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.round(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
  }, []);

  const compressionPercentage = Math.round(
    (1 - Number(video.compressedSize) / Number(video.originalSize)) * 100
  );

  const handlePreviewError = () => setPreviewError(true);

  const openModal = () => {
    setEditTitle(video.title);
    setEditDescription(video.description ?? "");
    setModalError(null);
    dialogRef.current?.showModal();
  };

  const closeModal = () => dialogRef.current?.close();

  const handleSave = async () => {
    if (!editTitle.trim()) {
      setModalError("Title is required.");
      return;
    }
    setIsSaving(true);
    setModalError(null);
    try {
      const response = await axios.patch(`/api/videos/${video.id}`, {
        title: editTitle.trim(),
        description: editDescription,
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
    if (!window.confirm("Delete this video? This cannot be undone.")) return;
    setIsDeleting(true);
    setModalError(null);
    try {
      await axios.delete(`/api/videos/${video.id}`);
      onDelete(video.id);
      closeModal();
    } catch (err: any) {
      setModalError(err?.response?.data?.error ?? "Failed to delete video.");
    } finally {
      setIsDeleting(false);
    }
  };

  const busy = isSaving || isDeleting;

  return (
    <>
      <div
        className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300"
        onMouseEnter={() => { setIsHovered(true); setPreviewError(false); }}
        onMouseLeave={() => setIsHovered(false)}
      >
        <figure className="aspect-video relative">
          {isHovered ? (
            previewError ? (
              <div className="w-full h-full flex items-center justify-center bg-gray-200">
                <p className="text-red-500">Preview not available</p>
              </div>
            ) : (
              <video
                src={getPreviewVideoUrl(video.publicId)}
                autoPlay
                muted
                loop
                className="w-full h-full object-cover"
                onError={handlePreviewError}
              />
            )
          ) : (
            <img
              src={getThumbnailUrl(video.publicId)}
              alt={video.title}
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute bottom-2 right-2 bg-base-100 bg-opacity-70 px-2 py-1 rounded-lg text-sm flex items-center">
            <Clock size={16} className="mr-1" />
            {formatDuration(video.duration)}
          </div>
        </figure>
        <div className="card-body p-4">
          <h2 className="card-title text-lg font-bold">{video.title}</h2>
          <p className="text-sm text-base-content opacity-70 mb-4">{video.description}</p>
          <p className="text-sm text-base-content opacity-70 mb-4">
            Uploaded {dayjs(video.createdAt).fromNow()}
          </p>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center">
              <FileUp size={18} className="mr-2 text-primary" />
              <div>
                <div className="font-semibold">Original</div>
                <div>{formatSize(Number(video.originalSize))}</div>
              </div>
            </div>
            <div className="flex items-center">
              <FileDown size={18} className="mr-2 text-secondary" />
              <div>
                <div className="font-semibold">Compressed</div>
                <div>{formatSize(Number(video.compressedSize))}</div>
              </div>
            </div>
          </div>
          <div className="flex justify-between items-center mt-4">
            <div className="text-sm font-semibold">
              Compression: <span className="text-accent">{compressionPercentage}%</span>
            </div>
            <div className="flex gap-2">
              <button
                className="btn btn-ghost btn-sm"
                onClick={openModal}
                title="Edit video"
              >
                <SquarePen size={16} />
              </button>
              <button
                className="btn btn-primary btn-sm"
                onClick={() => onDownload(getFullVideoUrl(video.publicId), video.title)}
                title="Download video"
              >
                <Download size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <dialog ref={dialogRef} className="modal">
        <div className="modal-box">
          <h3 className="font-bold text-lg mb-4">Edit Video</h3>

          <div className="form-control mb-3">
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

          <div className="form-control mb-4">
            <label className="label">
              <span className="label-text font-semibold">Description</span>
            </label>
            <textarea
              className="textarea textarea-bordered w-full"
              rows={3}
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              disabled={busy}
            />
          </div>

          {modalError && (
            <p className="text-error text-sm mb-3">{modalError}</p>
          )}

          <div className="modal-action flex-wrap gap-2">
            <button
              className="btn btn-error btn-sm"
              onClick={handleDelete}
              disabled={busy}
            >
              {isDeleting && <span className="loading loading-spinner loading-xs" />}
              Delete
            </button>
            <div className="flex-1" />
            <button className="btn btn-ghost btn-sm" onClick={closeModal} disabled={busy}>
              Cancel
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSave}
              disabled={busy}
            >
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

export default VideoCard;

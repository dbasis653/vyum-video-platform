import React, { useState, useRef, useCallback } from "react";
import { getCldImageUrl, getCldVideoUrl } from "next-cloudinary";
import { Download, Clock, FileDown, FileUp, SquarePen } from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import { filesize } from "filesize";
import axios from "axios";
import { Video } from "@/types";
import VideoPreviewModal from "@/components/video/VideoPreviewModal";
import EditModalFooter from "@/components/ui/EditModalFooter";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import IconButton from "@/components/ui/IconButton";

dayjs.extend(relativeTime);

interface VideoCardProps {
  video: Video;
  onDownload: (url: string, title: string) => void;
  onUpdate: (updated: Video) => void;
  onDelete: (id: string) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({
  video,
  onDownload,
  onUpdate,
  onDelete,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  const previewDialogRef = useRef<HTMLDialogElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const confirmDialogRef = useRef<HTMLDialogElement>(null);
  const [editTitle, setEditTitle] = useState(video.title);
  const [editDescription, setEditDescription] = useState(
    video.description ?? "",
  );
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
    (1 - Number(video.compressedSize) / Number(video.originalSize)) * 100,
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
    setIsDeleting(true);
    setModalError(null);
    try {
      await axios.delete(`/api/videos/${video.id}`);
      onDelete(video.id);
      confirmDialogRef.current?.close();
      closeModal();
    } catch (err: any) {
      setModalError(err?.response?.data?.error ?? "Failed to delete video.");
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
        className="relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 group hover:shadow-[0_4px_24px_rgba(34,211,238,0.1)] active:scale-[0.99]"
        style={{
          background: "#0f1929",
          border: "1px solid rgba(34,211,238,0.13)",
        }}
        tabIndex={0}
        onClick={() => previewDialogRef.current?.showModal()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ")
            previewDialogRef.current?.showModal();
        }}
        onMouseEnter={() => {
          setIsHovered(true);
          setPreviewError(false);
        }}
        onMouseLeave={() => setIsHovered(false)}
      >
        {/* Thumbnail / preview */}
        <div className="aspect-video relative overflow-hidden">
          {isHovered ? (
            previewError ? (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: "#132033" }}
              >
                <p className="text-xs font-mono" style={{ color: "rgba(248,113,113,0.6)" }}>
                  Preview unavailable
                </p>
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
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
          )}

          {/* Duration badge */}
          <div
            className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md text-xs font-mono"
            style={{
              background: "rgba(7,13,26,0.82)",
              border: "1px solid rgba(34,211,238,0.2)",
              color: "#22D3EE",
            }}
          >
            <Clock size={11} />
            {formatDuration(video.duration)}
          </div>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col gap-3">
          {/* Title + meta */}
          <div>
            <h2 className="font-bold text-sm leading-snug truncate" style={{ color: "#bfdbfe" }}>
              {video.title}
            </h2>
            {video.description && (
              <p className="text-xs mt-1 line-clamp-2" style={{ color: "rgba(186,230,255,0.42)" }}>
                {video.description}
              </p>
            )}
            <p className="text-xs mt-1 font-mono" style={{ color: "rgba(186,230,255,0.28)" }}>
              {dayjs(video.createdAt).fromNow()}
            </p>
          </div>

          {/* Size stats */}
          <div
            className="grid grid-cols-2 gap-2 rounded-lg p-3 text-xs"
            style={{
              background: "rgba(34,211,238,0.04)",
              border: "1px solid rgba(34,211,238,0.08)",
            }}
          >
            <div className="flex items-center gap-2">
              <FileUp size={13} style={{ color: "rgba(34,211,238,0.45)" }} />
              <div>
                <div className="font-mono" style={{ color: "rgba(186,230,255,0.38)" }}>Original</div>
                <div className="font-semibold" style={{ color: "#bfdbfe" }}>
                  {formatSize(Number(video.originalSize))}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FileDown size={13} style={{ color: "#22D3EE" }} />
              <div>
                <div className="font-mono" style={{ color: "rgba(186,230,255,0.38)" }}>Compressed</div>
                <div className="font-semibold" style={{ color: "#22D3EE" }}>
                  {formatSize(Number(video.compressedSize))}
                </div>
              </div>
            </div>
          </div>

          {/* Compression badge + actions */}
          <div className="flex items-center justify-between">
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold"
              style={{
                background: "rgba(34,211,238,0.1)",
                border: "1px solid rgba(34,211,238,0.18)",
                color: "#22D3EE",
              }}
            >
              -{compressionPercentage}% compressed
            </span>

            <div className="flex gap-1.5">
              {/* Edit */}
              <IconButton
                variant="ghost"
                iconSize="md"
                title="Edit video"
                onClick={(e) => { e.stopPropagation(); openModal(); }}
              >
                <SquarePen size={13} />
              </IconButton>

              {/* Download */}
              <IconButton
                variant="cyan"
                iconSize="md"
                title="Download video"
                onClick={(e) => {
                  e.stopPropagation();
                  onDownload(getFullVideoUrl(video.publicId), video.title);
                }}
              >
                <Download size={13} />
              </IconButton>
            </div>
          </div>
        </div>
      </div>

      {/* ── Confirm delete dialog ── */}
      <ConfirmDialog
        dialogRef={confirmDialogRef}
        title="Delete Video"
        message="This video will be permanently deleted from your library and Cloudinary. This cannot be undone."
        confirmLabel="Delete"
        isConfirming={isDeleting}
        onConfirm={handleDelete}
      />

      {/* ── Preview modal ── */}
      <VideoPreviewModal
        dialogRef={previewDialogRef}
        video={video}
        videoUrl={getFullVideoUrl(video.publicId)}
        onEdit={openModal}
        onDownload={() => onDownload(getFullVideoUrl(video.publicId), video.title)}
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
            Edit Video
          </h3>

          <div className="flex flex-col gap-4 mb-4">
            <div className="flex flex-col gap-1.5">
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
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-mono" style={{ color: "rgba(186,230,255,0.5)" }}>
                Description
              </label>
              <textarea
                className="w-full rounded-lg px-3 py-2.5 text-sm outline-none resize-none"
                style={{
                  background: "#132033",
                  border: "1px solid rgba(34,211,238,0.15)",
                  color: "#bfdbfe",
                }}
                rows={3}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                disabled={busy}
              />
            </div>
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

export default VideoCard;

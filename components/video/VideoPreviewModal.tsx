import React from "react";
import { Download, SquarePen } from "lucide-react";
import { Video } from "@/types";
import Button from "@/components/ui/Button";

interface VideoPreviewModalProps {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  video: Video;
  videoUrl: string;
  onEdit: () => void;
  onDownload: () => void;
}

export default function VideoPreviewModal({
  dialogRef,
  video,
  videoUrl,
  onEdit,
  onDownload,
}: VideoPreviewModalProps) {
  return (
    <dialog ref={dialogRef} className="modal">
      <div
        className="modal-box max-w-3xl"
        style={{
          background: "#0f1929",
          border: "1px solid rgba(34,211,238,0.15)",
        }}
      >
        <video
          src={videoUrl}
          controls
          className="w-full rounded-xl max-h-[60vh] object-contain"
          style={{ background: "#070d1a" }}
        />
        <div className="flex justify-between items-center mt-4">
          <h3 className="font-bold text-sm" style={{ color: "#bfdbfe" }}>
            {video.title}
          </h3>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="xs"
              onClick={() => {
                dialogRef.current?.close();
                onEdit();
              }}
            >
              <SquarePen size={12} />
              Edit
            </Button>

            <Button variant="cyan" size="xs" onClick={onDownload}>
              <Download size={12} />
              Download
            </Button>
          </div>
        </div>
        <div className="modal-action mt-2">
          <form method="dialog">
            <Button variant="cancel" size="xs">
              Close
            </Button>
          </form>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
}

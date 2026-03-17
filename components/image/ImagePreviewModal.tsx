import React, { useState } from "react";
import {
  Download,
  Settings,
  Scissors,
  LayoutDashboard,
  Wand2,
} from "lucide-react";
import { ImageItem } from "@/types";
import Button from "@/components/ui/Button";
import Spinner from "@/components/ui/Spinner";

interface ImagePreviewModalProps {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  image: ImageItem;
  imageUrl: string;
  onEdit: () => void;
  onDownload: () => void;
  onCrop: () => void;
  onBgRemove: () => void;
  onPlayground: () => void;
}

export default function ImagePreviewModal({
  dialogRef,
  image,
  imageUrl,
  onEdit,
  onDownload,
  onCrop,
  onBgRemove,
  onPlayground,
}: ImagePreviewModalProps) {
  const [isNavigating, setIsNavigating] = useState(false);

  return (
    <dialog ref={dialogRef} className="modal">
      <div
        className="modal-box max-w-2xl"
        style={{
          background: "#0f1929",
          border: "1px solid rgba(34,211,238,0.15)",
        }}
      >
        {/* ── Image display ── */}
        <img
          src={imageUrl}
          alt={image.title}
          className="w-auto mx-auto block rounded-xl object-contain max-h-[60vh] max-w-full"
        />

        <div className="flex justify-between items-center mt-4">
          <h3 className="font-bold text-sm" style={{ color: "#bfdbfe" }}>
            {image.title}
          </h3>
          <div className="flex gap-2">
            {/* ── Settings ── */}
            <Button
              variant="ghost"
              size="xs"
              onClick={() => {
                dialogRef.current?.close();
                onEdit();
              }}
            >
              <Settings size={12} />
              Settings
            </Button>

            {/* ── Crop — navigates to Playground with Crop tool active ── */}
            <Button
              variant="ghost"
              size="xs"
              disabled={isNavigating}
              onClick={() => {
                setIsNavigating(true);
                dialogRef.current?.close();
                onCrop();
              }}
            >
              {isNavigating ? <Spinner /> : <Scissors size={12} />}
              Crop
            </Button>

            {/* ── BG Remove — navigates to Playground with BG Remove tool active ── */}
            <Button
              variant="ghost"
              size="xs"
              disabled={isNavigating}
              onClick={() => {
                setIsNavigating(true);
                dialogRef.current?.close();
                onBgRemove();
              }}
            >
              {isNavigating ? <Spinner /> : <Wand2 size={12} />}
              BG Remove
            </Button>

            {/* ── Playground ── */}
            <Button
              variant="ghost"
              size="xs"
              disabled={isNavigating}
              onClick={() => {
                setIsNavigating(true);
                dialogRef.current?.close();
                onPlayground();
              }}
            >
              {isNavigating ? <Spinner /> : <LayoutDashboard size={12} />}
              Playground
            </Button>

            {/* ── Download ── */}
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

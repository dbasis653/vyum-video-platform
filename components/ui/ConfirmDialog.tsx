"use client";

import React from "react";
import { AlertTriangle } from "lucide-react";
import Spinner from "./Spinner";
import Button from "./Button";

interface ConfirmDialogProps {
  dialogRef: React.RefObject<HTMLDialogElement | null>;
  title: string;
  message: string;
  confirmLabel?: string;
  isConfirming?: boolean;
  onConfirm: () => void;
}

export default function ConfirmDialog({
  dialogRef,
  title,
  message,
  confirmLabel = "Confirm",
  isConfirming = false,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <dialog ref={dialogRef} className="modal">
      <div
        className="modal-box max-w-sm"
        style={{
          background: "#0f1929",
          border: "1px solid rgba(248,113,113,0.22)",
        }}
      >
        {/* Icon + title */}
        <div className="flex items-center gap-3 mb-4">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
            style={{
              background: "rgba(248,113,113,0.1)",
              border: "1px solid rgba(248,113,113,0.22)",
            }}
          >
            <AlertTriangle size={16} style={{ color: "#f87171" }} />
          </div>
          <h3 className="font-bold text-sm" style={{ color: "#fca5a5" }}>
            {title}
          </h3>
        </div>

        <p
          className="text-xs leading-relaxed mb-6"
          style={{ color: "rgba(186,230,255,0.55)" }}
        >
          {message}
        </p>

        <div className="flex justify-end gap-2">
          <Button
            variant="cancel"
            size="sm"
            disabled={isConfirming}
            onClick={() => dialogRef.current?.close()}
          >
            Cancel
          </Button>

          <Button
            variant="danger"
            size="sm"
            loading={isConfirming}
            onClick={onConfirm}
            className="font-semibold"
            style={{
              background: isConfirming
                ? "rgba(248,113,113,0.06)"
                : "rgba(248,113,113,0.14)",
              color: isConfirming ? "rgba(248,113,113,0.35)" : "#f87171",
            }}
          >
            {isConfirming && <Spinner />}
            {confirmLabel}
          </Button>
        </div>
      </div>
      <form method="dialog" className="modal-backdrop">
        <button>close</button>
      </form>
    </dialog>
  );
}

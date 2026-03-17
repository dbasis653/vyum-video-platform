import React from "react";

interface EditorShellProps {
  // Content for the left panel (e.g. crop canvas, original image).
  leftPanel: React.ReactNode;
  // Content for the right panel (e.g. live preview, result image).
  rightPanel: React.ReactNode;
  // Optional label shown in the top-left corner of the left panel.
  leftLabel?: string;
  // Optional label shown in the top-left corner of the right panel.
  rightLabel?: string;
}

// Shared two-panel editing layout used by all playground tools.
// Extracted to components/playground/ — the identical grid and panel styles were
// duplicated in CropTool and BgRemoveTool. Every future tool gets this for free.
export default function EditorShell({
  leftPanel,
  rightPanel,
  leftLabel,
  rightLabel,
}: EditorShellProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* ── Left panel ── */}
      <div
        className="rounded-xl overflow-hidden flex flex-col gap-3 items-center justify-center p-4"
        style={{
          background: "#0B1220",
          border: "1px solid rgba(34,211,238,0.1)",
        }}
      >
        {leftLabel && (
          <span
            className="text-xs font-mono tracking-widest uppercase self-start"
            style={{ color: "rgba(34,211,238,0.5)" }}
          >
            {leftLabel}
          </span>
        )}
        {leftPanel}
      </div>

      {/* ── Right panel ── */}
      <div
        className="rounded-xl overflow-hidden flex flex-col gap-3 items-center justify-center p-4"
        style={{
          background: "#0B1220",
          border: "1px solid rgba(34,211,238,0.1)",
        }}
      >
        {rightLabel && (
          <span
            className="text-xs font-mono tracking-widest uppercase self-start"
            style={{ color: "rgba(34,211,238,0.5)" }}
          >
            {rightLabel}
          </span>
        )}
        {rightPanel}
      </div>
    </div>
  );
}

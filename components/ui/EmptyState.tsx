import { ReactNode } from "react";

interface EmptyStateProps {
  icon: ReactNode;
  message: string;
}

export default function EmptyState({ icon, message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center py-16 gap-3">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{
          background: "rgba(34,211,238,0.06)",
          border: "1px solid rgba(34,211,238,0.12)",
        }}
      >
        {icon}
      </div>
      <p className="text-xs font-mono" style={{ color: "rgba(186,230,255,0.28)" }}>
        {message}
      </p>
    </div>
  );
}

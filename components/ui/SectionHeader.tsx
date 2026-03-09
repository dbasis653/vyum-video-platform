import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";

interface SectionHeaderProps {
  label: string;
  className?: string;
  back?: string;
}

export default function SectionHeader({ label, className = "mb-7", back }: SectionHeaderProps) {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="w-0.5 h-4 rounded-full" style={{ background: "#3B82F6" }} />
      <span className="text-xs font-mono tracking-widest uppercase" style={{ color: "#22D3EE" }}>
        {label}
      </span>
      <div className="flex-1 h-px" style={{ background: "rgba(34,211,238,0.1)" }} />
      {back && (
        <Link
          href={back}
          className="flex items-center gap-1.5 text-xs font-mono tracking-wider transition-opacity hover:opacity-75"
          style={{ color: "rgba(34,211,238,0.55)" }}
        >
          <ArrowLeftIcon size={12} />
          Back
        </Link>
      )}
    </div>
  );
}

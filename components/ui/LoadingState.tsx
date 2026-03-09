export default function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
      <svg className="animate-spin w-7 h-7" fill="none" viewBox="0 0 24 24" style={{ color: "#22D3EE" }}>
        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
      <span className="text-xs font-mono tracking-widest" style={{ color: "rgba(34,211,238,0.4)" }}>Loading…</span>
    </div>
  );
}

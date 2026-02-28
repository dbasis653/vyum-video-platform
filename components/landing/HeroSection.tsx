import Image from "next/image";
import Link from "next/link";

export default function HeroSection() {
  return (
    <section
      className="relative w-full h-screen overflow-hidden flex flex-col items-center justify-center"
      style={{ background: "#070d1a" }}
    >
      {/* ── Dot grid ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(rgba(34,211,238,0.07) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      {/* ── Center radial glow ── */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[720px] h-[420px] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse, rgba(34,211,238,0.06) 0%, transparent 70%)",
        }}
      />

      {/* ── HUD corner brackets ── */}
      <div className="absolute top-7 left-7 w-9 h-9 border-t-2 border-l-2 border-blue-400/25" />
      <div className="absolute top-7 right-7 w-9 h-9 border-t-2 border-r-2 border-blue-400/25" />
      <div className="absolute bottom-7 left-7 w-9 h-9 border-b-2 border-l-2 border-blue-400/25" />
      <div className="absolute bottom-7 right-7 w-9 h-9 border-b-2 border-r-2 border-blue-400/25" />

      {/* ── Top status label ── */}
      <div className="absolute top-7 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
        <span
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{ background: "#3B82F6" }}
        />
        <span
          className="text-[10px] font-mono tracking-[0.35em] uppercase"
          style={{ color: "rgba(34,211,238,0.4)" }}
        >
          Media Engine
        </span>
      </div>

      {/* ── Main center content ── */}
      <div className="relative z-10 flex flex-col items-center">

        {/* VYUM logo */}
        <Image
          src="/images/vyum-logo.png"
          alt="VYUM"
          width={340}
          height={136}
          className="object-contain"
          style={{ filter: "drop-shadow(0 0 48px rgba(34,211,238,0.22))" }}
          priority
        />

        {/* Content Vault sub-label */}
        <Image
          src="/images/content-vault.png"
          alt="Content Vault"
          width={190}
          height={48}
          className="object-contain -mt-2"
          style={{ opacity: 0.55 }}
        />

        {/* Divider */}
        <div className="flex items-center gap-3 my-7">
          <div
            className="w-20 h-px"
            style={{ background: "rgba(34,211,238,0.18)" }}
          />
          <div
            className="w-1 h-1 rounded-full"
            style={{ background: "rgba(34,211,238,0.5)" }}
          />
          <div
            className="w-20 h-px"
            style={{ background: "rgba(34,211,238,0.18)" }}
          />
        </div>

        {/* Tagline */}
        <p
          className="text-[11px] font-mono tracking-[0.5em] uppercase mb-8"
          style={{ color: "rgba(186,230,255,0.38)" }}
        >
          Compress&nbsp;&nbsp;·&nbsp;&nbsp;Crop&nbsp;&nbsp;·&nbsp;&nbsp;Share
        </p>

        {/* CTA buttons */}
        <div className="flex gap-4">
          <Link
            href="/sign-in"
            className="px-9 py-2.5 rounded-full text-xs font-bold tracking-widest uppercase transition-opacity hover:opacity-85"
            style={{ background: "#3B82F6", color: "#0B1220" }}
          >
            Sign In
          </Link>
          <Link
            href="/sign-up"
            className="px-9 py-2.5 rounded-full text-xs font-bold tracking-widest uppercase transition-colors hover:border-blue-400/50"
            style={{
              border: "1px solid rgba(34,211,238,0.28)",
              color: "#22D3EE",
            }}
          >
            Get Started
          </Link>
        </div>
      </div>

      {/* ── Bottom mock media tiles ── */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-end gap-3 z-10">

        {/* Video tile */}
        <div
          className="relative w-36 h-[76px] rounded-lg overflow-hidden flex items-center justify-center"
          style={{
            background: "rgba(34,211,238,0.03)",
            border: "1px solid rgba(34,211,238,0.1)",
          }}
        >
          {/* Simulated video frame bars */}
          <div className="absolute inset-0 flex gap-[2px] p-2 opacity-70">
            {[0.25, 0.55, 0.38, 0.65, 0.3, 0.5].map((op, i) => (
              <div
                key={i}
                className="flex-1 rounded-sm"
                style={{ background: `rgba(34,211,238,${op})` }}
              />
            ))}
          </div>
          {/* Play button */}
          <div
            className="relative z-10 w-7 h-7 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(34,211,238,0.12)",
              border: "1px solid rgba(34,211,238,0.28)",
            }}
          >
            <div
              className="ml-0.5"
              style={{
                width: 0,
                height: 0,
                borderTop: "5px solid transparent",
                borderBottom: "5px solid transparent",
                borderLeft: "8px solid rgba(34,211,238,0.72)",
              }}
            />
          </div>
          <span
            className="absolute bottom-1.5 right-2 text-[8px] font-mono tracking-widest"
            style={{ color: "rgba(34,211,238,0.28)" }}
          >
            VIDEO
          </span>
        </div>

        {/* Center: compression waveform tile (taller) */}
        <div
          className="w-44 h-[96px] rounded-lg flex flex-col items-center justify-center gap-2"
          style={{
            background: "rgba(34,211,238,0.045)",
            border: "1px solid rgba(34,211,238,0.14)",
          }}
        >
          <div className="flex items-end gap-[3px] h-7">
            {[10, 22, 14, 26, 18, 24, 12, 20, 16].map((h, i) => (
              <div
                key={i}
                className="w-[3px] rounded-full animate-pulse"
                style={{
                  height: `${h}px`,
                  background: "rgba(34,211,238,0.5)",
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
          <span
            className="text-[9px] font-mono tracking-[0.28em] uppercase"
            style={{ color: "rgba(34,211,238,0.38)" }}
          >
            Compressing
          </span>
        </div>

        {/* Image / crop tile */}
        <div
          className="relative w-36 h-[76px] rounded-lg overflow-hidden flex items-center justify-center"
          style={{
            background: "rgba(34,211,238,0.03)",
            border: "1px solid rgba(34,211,238,0.1)",
          }}
        >
          {/* Crop grid */}
          <div
            className="absolute inset-2 border border-dashed"
            style={{ borderColor: "rgba(34,211,238,0.14)" }}
          >
            <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
              {Array.from({ length: 9 }).map((_, i) => (
                <div
                  key={i}
                  className="border"
                  style={{ borderColor: "rgba(34,211,238,0.07)" }}
                />
              ))}
            </div>
            {/* Crop corner markers */}
            <div
              className="absolute top-0 left-0 w-2 h-2 border-t border-l"
              style={{ borderColor: "rgba(34,211,238,0.55)" }}
            />
            <div
              className="absolute top-0 right-0 w-2 h-2 border-t border-r"
              style={{ borderColor: "rgba(34,211,238,0.55)" }}
            />
            <div
              className="absolute bottom-0 left-0 w-2 h-2 border-b border-l"
              style={{ borderColor: "rgba(34,211,238,0.55)" }}
            />
            <div
              className="absolute bottom-0 right-0 w-2 h-2 border-b border-r"
              style={{ borderColor: "rgba(34,211,238,0.55)" }}
            />
          </div>
          <span
            className="absolute bottom-1.5 right-2 text-[8px] font-mono tracking-widest"
            style={{ color: "rgba(34,211,238,0.28)" }}
          >
            IMAGE
          </span>
        </div>
      </div>

      {/* ── Bottom status line ── */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2.5 z-10">
        <div
          className="w-20 h-px"
          style={{ background: "rgba(34,211,238,0.1)" }}
        />
        <span
          className="text-[9px] font-mono tracking-widest"
          style={{ color: "rgba(34,211,238,0.18)" }}
        >
          VYUM · READY
        </span>
        <div
          className="w-20 h-px"
          style={{ background: "rgba(34,211,238,0.1)" }}
        />
      </div>
    </section>
  );
}

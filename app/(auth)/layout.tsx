export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      {/* ── Left branding panel (hidden on mobile) ── */}
      <div
        className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden"
        style={{ background: "linear-gradient(135deg, #060c18 0%, #0e1e38 50%, #060c18 100%)" }}
      >
        {/* Decorative radial glow */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(34,211,238,0.12) 0%, transparent 70%)" }}
        />
        {/* Extra bottom glow */}
        <div
          className="absolute bottom-0 left-0 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(34,211,238,0.08) 0%, transparent 70%)" }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <span className="text-3xl">🌿</span>
          <span className="text-2xl font-bold tracking-tight" style={{ color: "#22D3EE" }}>
            VYUM
          </span>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 space-y-8">
          <div className="space-y-4">
            <h1 className="text-5xl font-bold leading-tight text-white">
              Compress smarter.
              <br />
              <span style={{ color: "#22D3EE" }}>Share faster.</span>
            </h1>
            <p className="text-base leading-relaxed" style={{ color: "rgba(186,230,255,0.55)" }}>
              Your all-in-one platform for media optimization and social-ready cropping.
            </p>
          </div>

          <ul className="space-y-3">
            {[
              "Lossless video & image compression",
              "Social media crop presets",
              "Secure cloud storage",
              "Instant shareable links",
            ].map((feature) => (
              <li key={feature} className="flex items-center gap-3">
                <span
                  className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(34,211,238,0.15)" }}
                >
                  <svg
                    className="w-3 h-3"
                    style={{ color: "#22D3EE" }}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </span>
                <span className="text-sm" style={{ color: "rgba(186,230,255,0.75)" }}>
                  {feature}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer credit */}
        <p className="relative z-10 text-xs" style={{ color: "rgba(34,211,238,0.25)" }}>
          © 2026 VYUM
        </p>
      </div>

      {/* ── Right auth panel ── */}
      <div
        className="flex-1 flex items-center justify-center p-6 min-h-screen"
        style={{ background: "#0B1220" }}
      >
        {children}
      </div>
    </div>
  );
}

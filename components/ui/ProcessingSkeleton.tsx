interface CornerDef {
  top?: number;
  bottom?: number;
  left?: number;
  right?: number;
  borderTop?: boolean;
  borderBottom?: boolean;
  borderLeft?: boolean;
  borderRight?: boolean;
  delay: string;
}

interface ProcessingSkeletonProps {
  // Label shown below the spinner (e.g. "Rendering Preview", "Removing Background").
  label: string;
  // Prefix for @keyframes names — prevents name collisions if two skeletons render simultaneously.
  // Defaults to "proc".
  keyframePrefix?: string;
}

// Animated full-panel loading indicator shown while an async image transformation renders.
// Extracted to components/ui/ — the exact same animation was duplicated in CropTool and BgRemoveTool.
// keyframePrefix namespaces the @keyframes rules so multiple instances on the same page don't clash.
export default function ProcessingSkeleton({
  label,
  keyframePrefix = "proc",
}: ProcessingSkeletonProps) {
  const p = keyframePrefix;

  const corners: CornerDef[] = [
    { top: 12, left: 12,   borderTop: true,    borderLeft: true,  delay: "0s"    },
    { top: 12, right: 12,  borderTop: true,    borderRight: true, delay: "0.15s" },
    { bottom: 12, left: 12,  borderBottom: true, borderLeft: true,  delay: "0.3s"  },
    { bottom: 12, right: 12, borderBottom: true, borderRight: true, delay: "0.45s" },
  ];

  return (
    <div
      className="relative w-full rounded-xl overflow-hidden flex items-center justify-center"
      style={{
        minHeight: "260px",
        background: "linear-gradient(145deg, #060d1b 0%, #091525 100%)",
        animation: `${p}FadeIn 0.25s ease-out`,
      }}
    >
      {/* ── Keyframe definitions ── */}
      <style>{`
        @keyframes ${p}Scan {
          0%   { top: 0%;    opacity: 0; }
          4%   { opacity: 1; }
          96%  { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes ${p}Glow {
          0%, 100% { opacity: 0.25; transform: scale(1); }
          50%      { opacity: 0.65; transform: scale(1.18); }
        }
        @keyframes ${p}Dot {
          0%, 75%, 100% { transform: scale(0); opacity: 0; }
          40%           { transform: scale(1); opacity: 1; }
        }
        @keyframes ${p}CornerPulse {
          0%, 100% { opacity: 0.3; }
          50%      { opacity: 1; }
        }
        @keyframes ${p}Shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }
        @keyframes ${p}Spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes ${p}SpinReverse {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes ${p}FadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── Dot grid background ── */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(34,211,238,0.065) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      />

      {/* ── Radial glow ── */}
      <div
        className="absolute"
        style={{
          width: "200px",
          height: "200px",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, rgba(34,211,238,0.09) 0%, transparent 70%)",
          animation: `${p}Glow 2.6s ease-in-out infinite`,
        }}
      />

      {/* ── Shimmer overlay ── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(108deg, transparent 38%, rgba(34,211,238,0.03) 50%, transparent 62%)",
          backgroundSize: "200% 100%",
          animation: `${p}Shimmer 2.8s ease-in-out infinite`,
        }}
      />

      {/* ── Scan line ── */}
      <div
        className="absolute left-5 right-5"
        style={{
          height: "1px",
          background:
            "linear-gradient(90deg, transparent 0%, rgba(34,211,238,0.35) 20%, rgba(34,211,238,0.85) 50%, rgba(34,211,238,0.35) 80%, transparent 100%)",
          boxShadow:
            "0 0 6px rgba(34,211,238,0.55), 0 0 18px rgba(34,211,238,0.18)",
          animation: `${p}Scan 2.2s ease-in-out infinite`,
        }}
      />

      {/* ── Corner brackets ── */}
      {corners.map((c, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            width: 18,
            height: 18,
            ...(c.top    !== undefined && { top:    c.top    }),
            ...(c.bottom !== undefined && { bottom: c.bottom }),
            ...(c.left   !== undefined && { left:   c.left   }),
            ...(c.right  !== undefined && { right:  c.right  }),
            borderTop:    c.borderTop    ? "1.5px solid rgba(34,211,238,0.7)" : undefined,
            borderBottom: c.borderBottom ? "1.5px solid rgba(34,211,238,0.7)" : undefined,
            borderLeft:   c.borderLeft   ? "1.5px solid rgba(34,211,238,0.7)" : undefined,
            borderRight:  c.borderRight  ? "1.5px solid rgba(34,211,238,0.7)" : undefined,
            animation: `${p}CornerPulse 2.6s ease-in-out ${c.delay} infinite`,
          }}
        />
      ))}

      {/* ── Spinner + label ── */}
      <div className="relative z-10 flex flex-col items-center gap-4">
        <div className="relative" style={{ width: 52, height: 52 }}>
          <div
            className="absolute inset-0 rounded-full"
            style={{ border: "1.5px solid rgba(34,211,238,0.08)" }}
          />
          <div
            className="absolute inset-0 rounded-full"
            style={{
              border: "1.5px solid transparent",
              borderTopColor: "rgba(34,211,238,0.85)",
              borderRightColor: "rgba(34,211,238,0.25)",
              animation: `${p}Spin 1.1s linear infinite`,
            }}
          />
          <div
            className="absolute inset-2 rounded-full"
            style={{ border: "1px solid rgba(34,211,238,0.06)" }}
          />
          <div
            className="absolute inset-2 rounded-full"
            style={{
              border: "1px solid transparent",
              borderTopColor: "rgba(34,211,238,0.5)",
              borderLeftColor: "rgba(34,211,238,0.15)",
              animation: `${p}SpinReverse 0.75s linear infinite`,
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              style={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                background: "rgba(34,211,238,0.9)",
                boxShadow: "0 0 6px rgba(34,211,238,0.7)",
                animation: `${p}Glow 2.6s ease-in-out infinite`,
              }}
            />
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <span
            className="text-[10px] font-mono tracking-[0.22em] uppercase"
            style={{ color: "rgba(34,211,238,0.65)" }}
          >
            {label}
          </span>
          <div className="flex gap-1.5">
            {[0, 0.22, 0.44].map((delay, i) => (
              <div
                key={i}
                style={{
                  width: 3,
                  height: 3,
                  borderRadius: "50%",
                  background: "rgba(34,211,238,0.6)",
                  animation: `${p}Dot 1.5s ease-in-out ${delay}s infinite`,
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

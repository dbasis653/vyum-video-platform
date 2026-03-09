const shimmer = { background: "rgba(34,211,238,0.07)" };
const shimmerDim = { background: "rgba(34,211,238,0.05)" };
const borderStyle = { border: "1px solid rgba(34,211,238,0.1)" };

function SkeletonImageCard() {
  return (
    <div
      className="rounded-xl overflow-hidden w-full animate-pulse"
      style={{ background: "#0f1929", ...borderStyle }}
    >
      <div className="aspect-video" style={shimmerDim} />
      <div className="p-2 flex flex-col gap-1.5">
        <div className="h-2.5 w-3/4 rounded" style={shimmer} />
        <div className="h-2 w-1/2 rounded" style={shimmerDim} />
        <div className="flex justify-end gap-1 mt-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="w-5 h-5 rounded" style={shimmer} />
          ))}
        </div>
      </div>
    </div>
  );
}

function SkeletonVideoCard() {
  return (
    <div
      className="rounded-2xl overflow-hidden animate-pulse"
      style={{ background: "#0f1929", ...borderStyle }}
    >
      <div className="aspect-video" style={shimmerDim} />
      <div className="p-4 flex flex-col gap-2.5">
        <div className="h-3 w-2/3 rounded" style={shimmer} />
        <div className="h-2.5 w-1/3 rounded" style={shimmerDim} />
        <div className="flex justify-between items-center mt-1">
          <div className="h-2 w-20 rounded" style={shimmerDim} />
          <div className="flex gap-1.5">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="w-7 h-7 rounded-lg" style={shimmer} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface SkeletonGridProps {
  variant: "image" | "video";
  count?: number;
}

export default function SkeletonGrid({ variant, count }: SkeletonGridProps) {
  const n = count ?? (variant === "image" ? 12 : 6);

  if (variant === "image") {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {Array.from({ length: n }).map((_, i) => (
          <SkeletonImageCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: n }).map((_, i) => (
        <SkeletonVideoCard key={i} />
      ))}
    </div>
  );
}

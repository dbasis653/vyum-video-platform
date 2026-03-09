interface ErrorBannerProps {
  message: string;
}

export default function ErrorBanner({ message }: ErrorBannerProps) {
  return (
    <div
      className="px-4 py-3 rounded-lg text-sm"
      style={{
        background: "rgba(248,113,113,0.07)",
        border: "1px solid rgba(248,113,113,0.18)",
        color: "#fca5a5",
      }}
    >
      {message}
    </div>
  );
}

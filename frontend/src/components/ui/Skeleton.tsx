"use client";

interface SkeletonProps {
  variant?: "card" | "text" | "circle" | "stat";
  count?: number;
  className?: string;
}

function SkeletonBlock({
  className = "",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`skeleton rounded-lg ${className}`}
      style={{
        background:
          "linear-gradient(90deg, #f3f4f6 25%, #e5e7eb 50%, #f3f4f6 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

export default function Skeleton({
  variant = "text",
  count = 1,
  className = "",
}: SkeletonProps) {
  const items = Array.from({ length: count });

  if (variant === "card") {
    return (
      <div className={`space-y-4 ${className}`}>
        {items.map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-100 p-5"
          >
            <div className="flex items-center gap-3">
              <SkeletonBlock className="w-12 h-12 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <SkeletonBlock className="h-4 w-3/4" />
                <SkeletonBlock className="h-3 w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "stat") {
    return (
      <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 ${className}`}>
        {items.map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-gray-100 p-4"
          >
            <SkeletonBlock className="w-8 h-8 rounded-lg mb-3" />
            <SkeletonBlock className="h-7 w-16 mb-1" />
            <SkeletonBlock className="h-3 w-12" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === "circle") {
    return (
      <div className={`flex gap-3 ${className}`}>
        {items.map((_, i) => (
          <SkeletonBlock key={i} className="w-10 h-10 rounded-full" />
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {items.map((_, i) => (
        <SkeletonBlock
          key={i}
          className="h-4"
          style={{
            width: `${80 - i * 15}%`,
          }}
        />
      ))}
    </div>
  );
}

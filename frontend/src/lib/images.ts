const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");
const STORAGE_URL_HINTS = [
  "/uploads/",
  "/announcements/",
  "/organizations/",
  "/logos/",
  "/users/",
  "X-Amz-Algorithm",
  "X-Amz-Signature",
];

function shouldProxySource(source: string): boolean {
  if (source.startsWith("/uploads/") || source.startsWith("s3://")) {
    return true;
  }

  if (!/^https?:\/\//i.test(source)) {
    return true;
  }

  return STORAGE_URL_HINTS.some((hint) => source.includes(hint));
}

export function getDisplayImageUrl(source: string | null | undefined): string | null {
  if (!source) return null;

  if (
    source.startsWith("data:") ||
    source.startsWith("blob:") ||
    source.includes("/upload/proxy?source=")
  ) {
    return source;
  }

  if (!shouldProxySource(source)) {
    return source;
  }

  if (!API_BASE) return source;
  return `${API_BASE}/upload/proxy?source=${encodeURIComponent(source)}`;
}

const RAW_API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");
export const API_ORIGIN = RAW_API_URL.endsWith("/api") ? RAW_API_URL.slice(0, -4) : RAW_API_URL;

export function assetUrl(value?: string, fallback = "/institute-logo-official.png") {
  if (!value) return fallback;
  if (value.startsWith("/uploads/")) return `${API_ORIGIN}${value}`;
  return value;
}

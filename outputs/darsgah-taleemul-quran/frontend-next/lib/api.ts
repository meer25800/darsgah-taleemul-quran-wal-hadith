"use client";

import axios from "axios";

function normalizeApiUrl(value?: string) {
  const raw = (value || "http://localhost:5000/api").replace(/\/+$/, "");
  return raw.endsWith("/api") ? raw : `${raw}/api`;
}

export const API_URL = normalizeApiUrl(process.env.NEXT_PUBLIC_API_URL);

export const api = axios.create({ baseURL: API_URL, timeout: 8000, withCredentials: true });

declare global {
  interface Window {
    AndroidDownloader?: {
      download: (url: string, filename: string, mimeType: string, token: string) => void;
      open: (url: string, title: string, token: string) => void;
    };
    Capacitor?: {
      isNativePlatform?: () => boolean;
    };
  }
}

/** Android WebView cannot render PDFs in an iframe, so it must use DownloadManager. */
export function isNativeDocumentApp() {
  if (typeof window === "undefined") return false;
  if (window.AndroidDownloader || window.Capacitor?.isNativePlatform?.()) return true;
  const agent = navigator.userAgent || "";
  return /\bAndroid\b/i.test(agent) && (/\bwv\b/i.test(agent) || /Version\/4\.0/i.test(agent));
}

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("darsgah_token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function downloadFile(path: string, filename: string) {
  const url = `${API_URL}${path.startsWith("/") ? path : `/${path}`}`;
  return downloadFromUrl(url, filename, mimeTypeFor(filename));
}

/** Uses Android's DownloadManager in the APK and a browser download everywhere else. */
export async function downloadFromUrl(url: string, filename: string, mimeType = "application/pdf") {
  if (typeof window === "undefined") return;
  const token = localStorage.getItem("darsgah_token") || "";
  const absoluteUrl = new URL(url, window.location.origin).toString();
  if (window.AndroidDownloader) {
    window.AndroidDownloader.download(absoluteUrl, filename, mimeType, token);
    return;
  }

  // This fallback still activates Android's DownloadListener when the JavaScript
  // bridge has not finished attaching, rather than leaving the PDF in a blank iframe.
  if (isNativeDocumentApp()) {
    window.location.assign(absoluteUrl);
    return;
  }

  // Same-origin document proxy URLs do not need an authenticated API request.
  if (absoluteUrl.startsWith(window.location.origin)) {
    const link = document.createElement("a");
    link.href = absoluteUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    return;
  }

  const { data } = await axios.get(absoluteUrl, {
    responseType: "blob",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    withCredentials: true
  });
  const blobUrl = window.URL.createObjectURL(new Blob([data]));
  const link = document.createElement("a");
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  // Safari and Android Chrome may cancel a download when the object URL is
  // revoked in the same event loop as the synthetic click.
  window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1_000);
}

/** Opens a protected PDF in the native Android reader when the APK is installed. */
export function openDocumentInApp(url: string, title: string) {
  if (typeof window === "undefined" || !window.AndroidDownloader) return false;
  const token = localStorage.getItem("darsgah_token") || "";
  const absoluteUrl = new URL(url, window.location.origin).toString();
  window.AndroidDownloader.open(absoluteUrl, title, token);
  return true;
}

function mimeTypeFor(filename: string) {
  const normalized = filename.toLowerCase().split("?")[0];
  if (normalized.endsWith(".png")) return "image/png";
  if (normalized.endsWith(".jpg") || normalized.endsWith(".jpeg")) return "image/jpeg";
  if (normalized.endsWith(".webp")) return "image/webp";
  if (normalized.endsWith(".doc")) return "application/msword";
  if (normalized.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (normalized.endsWith(".ppt")) return "application/vnd.ms-powerpoint";
  if (normalized.endsWith(".pptx")) return "application/vnd.openxmlformats-officedocument.presentationml.presentation";
  if (normalized.endsWith(".mp3")) return "audio/mpeg";
  if (normalized.endsWith(".mp4")) return "video/mp4";
  return "application/pdf";
}

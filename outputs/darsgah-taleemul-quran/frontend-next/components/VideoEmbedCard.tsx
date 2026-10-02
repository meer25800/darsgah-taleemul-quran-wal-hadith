"use client";

import { useState } from "react";
import Image from "next/image";
import { Play } from "lucide-react";
import { assetUrl } from "@/lib/assets";
import { Card } from "@/components/ui/card";

export function VideoEmbedCard({ video }: { video: any }) {
  const [open, setOpen] = useState(false);
  const embedUrl = video.embedUrl || youtubeEmbedUrl(video.youtubeVideoId) || youtubeEmbedUrl(extractYouTubeVideoId(video.youtubeUrl));
  const thumbnailUrl = safeThumbnailUrl(video);
  return (
    <Card className="overflow-hidden p-0">
      <div className="relative aspect-video overflow-hidden bg-emerald-950">
        {open && embedUrl ? (
          <iframe loading="lazy" src={embedUrl} title={video.title} className="h-full w-full" allowFullScreen />
        ) : (
          <button type="button" onClick={() => embedUrl && setOpen(true)} className="group h-full w-full" disabled={!embedUrl}>
            <Image src={thumbnailUrl} alt={video.title || "Institute video"} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover opacity-90 transition group-hover:scale-105" />
            <span className="absolute inset-0 grid place-items-center bg-black/25"><span className="rounded-full bg-red-600 p-5 text-white shadow-soft"><Play fill="currentColor" /></span></span>
          </button>
        )}
      </div>
      <div className="p-4">
        <strong className="block">{video.title}</strong>
        <p className="mt-2 text-sm text-emerald-700">{video.description}</p>
      </div>
    </Card>
  );
}

function safeThumbnailUrl(video: any) {
  const values = [
    video.thumbnailUrl,
    youtubeThumbnailUrl(video.youtubeVideoId),
    youtubeThumbnailUrl(extractYouTubeVideoId(video.youtubeUrl)),
    youtubeThumbnailUrl(extractYouTubeVideoId(video.embedUrl))
  ];
  for (const value of values) {
    const src = safeImageValue(value);
    if (src) return src;
  }
  return "/institute-logo-official.png";
}

function safeImageValue(value?: string | null) {
  const raw = String(value || "").trim();
  if (!raw || ["none", "null", "undefined"].includes(raw.toLowerCase())) return "";
  if (raw.startsWith("/")) return assetUrl(raw);
  try {
    const url = new URL(raw);
    return ["http:", "https:"].includes(url.protocol) ? raw : "";
  } catch {
    return "";
  }
}

function extractYouTubeVideoId(value?: string | null) {
  try {
    const url = new URL(String(value || "").trim());
    const host = url.hostname.toLowerCase();
    if (!["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtu.be", "youtube-nocookie.com", "www.youtube-nocookie.com"].includes(host)) return "";
    const id = host.includes("youtu.be")
      ? url.pathname.split("/").filter(Boolean)[0]
      : url.pathname.startsWith("/watch")
        ? url.searchParams.get("v")
        : url.pathname.startsWith("/embed/") || url.pathname.startsWith("/shorts/")
          ? url.pathname.split("/").filter(Boolean)[1]
          : "";
    return /^[A-Za-z0-9_-]{11}$/.test(id || "") ? String(id) : "";
  } catch {
    return "";
  }
}

function youtubeEmbedUrl(id?: string | null) {
  return id ? `https://www.youtube.com/embed/${id}` : "";
}

function youtubeThumbnailUrl(id?: string | null) {
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "";
}

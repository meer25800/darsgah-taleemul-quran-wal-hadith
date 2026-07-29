const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be", "www.youtu.be", "youtube-nocookie.com", "www.youtube-nocookie.com"]);

export function extractYouTubeVideoId(value = "") {
  try {
    const url = new URL(String(value).trim());
    const host = url.hostname.toLowerCase();
    if (!YOUTUBE_HOSTS.has(host)) return null;

    let id = "";
    if (host.includes("youtu.be")) id = url.pathname.split("/").filter(Boolean)[0] || "";
    else if (url.pathname.startsWith("/watch")) id = url.searchParams.get("v") || "";
    else if (url.pathname.startsWith("/embed/") || url.pathname.startsWith("/shorts/")) id = url.pathname.split("/").filter(Boolean)[1] || "";

    return /^[A-Za-z0-9_-]{11}$/.test(id) ? id : null;
  } catch {
    return null;
  }
}

export function youtubeEmbedUrl(id) {
  return `https://www.youtube.com/embed/${id}`;
}

export function youtubeThumbnailUrl(id) {
  return `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
}

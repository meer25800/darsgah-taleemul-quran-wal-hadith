import { NextRequest, NextResponse } from "next/server";

const RAW_API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/+$/, "");
const API_ORIGIN = RAW_API_URL.endsWith("/api") ? RAW_API_URL.slice(0, -4) : RAW_API_URL;
const ALLOWED_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "res.cloudinary.com",
  apiOriginHost()
]);

export async function GET(req: NextRequest) {
  const source = req.nextUrl.searchParams.get("url") || "";
  const download = req.nextUrl.searchParams.get("download") === "1";
  const title = safeFilename(req.nextUrl.searchParams.get("title") || "document");
  const target = normalizeDocumentUrl(source);

  if (!target) {
    return NextResponse.json({ message: "Invalid document URL" }, { status: 400 });
  }

  try {
    const upstream = await fetch(target, { cache: "no-store" });
    if (!upstream.ok || !upstream.body) {
      return NextResponse.json({ message: "Document is not available" }, { status: upstream.status || 404 });
    }

    const contentType = upstream.headers.get("content-type") || contentTypeFromUrl(target);
    const extension = extensionFromContentType(contentType) || extensionFromUrl(target);
    const filename = `${title}${extension && !title.toLowerCase().endsWith(extension) ? extension : ""}`;

    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${filename}"`,
        "Cache-Control": "private, max-age=60",
        "X-Content-Type-Options": "nosniff"
      }
    });
  } catch (error) {
    console.error("Document proxy failed:", error);
    return NextResponse.json({ message: "Document reader is temporarily unavailable" }, { status: 502 });
  }
}

function normalizeDocumentUrl(value: string) {
  const raw = value.trim();
  if (!raw || ["none", "null", "undefined"].includes(raw.toLowerCase())) return "";

  const absolute = raw.startsWith("/") ? `${API_ORIGIN}${raw}` : raw;
  try {
    const url = new URL(absolute);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    if (!ALLOWED_HOSTS.has(url.hostname) && !url.hostname.endsWith(".cloudinary.com")) return "";
    return url.toString();
  } catch {
    return "";
  }
}

function safeFilename(value: string) {
  return value.replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "document";
}

function contentTypeFromUrl(url: string) {
  const path = new URL(url).pathname.toLowerCase();
  if (path.endsWith(".pdf")) return "application/pdf";
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  if (path.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
}

function extensionFromContentType(contentType: string) {
  if (contentType.includes("pdf")) return ".pdf";
  if (contentType.includes("png")) return ".png";
  if (contentType.includes("jpeg")) return ".jpg";
  if (contentType.includes("webp")) return ".webp";
  return "";
}

function extensionFromUrl(url: string) {
  const match = new URL(url).pathname.match(/\.(pdf|png|jpe?g|webp)$/i);
  return match ? `.${match[1].toLowerCase().replace("jpeg", "jpg")}` : "";
}

function apiOriginHost() {
  try {
    return new URL(API_ORIGIN).hostname;
  } catch {
    return "";
  }
}

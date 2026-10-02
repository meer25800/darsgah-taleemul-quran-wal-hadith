"use client";

import Image from "next/image";
import Link from "next/link";
import { Download, Eye, FileQuestion, LoaderCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { downloadFile } from "@/lib/api";

type DocumentKind = "book" | "resource" | "syllabus";

export function DocumentCard({ item, kind, detailsHref }: { item: any; kind: DocumentKind; detailsHref: string }) {
  const [downloading, setDownloading] = useState(false);
  const fileUrl = item?.fileUrl || item?.previewUrl || item?.file?.url || item?.files?.[0]?.url || "";
  const available = item?.fileAvailable !== false && Boolean(fileUrl || item?.externalUrl);
  const plural = kind === "book" ? "books" : kind === "resource" ? "resources" : "syllabus";
  const cover = "/open-book-cover.svg";
  const metadata = [
    item?.category,
    item?.language,
    item?.className,
    item?.subjectName,
    Number(item?.pageCount) > 0 ? `${item.pageCount} pages` : "",
    item?.fileSizeBytes > 0 ? formatBytes(item.fileSizeBytes) : ""
  ].filter(Boolean);

  async function download() {
    if (!available || downloading) return;
    setDownloading(true);
    try {
      await downloadFile(`/${plural}/${item._id}/download`, documentFilename(item, fileUrl));
    } finally {
      setDownloading(false);
    }
  }

  return (
    <article id={`${kind}-${item._id}`} className="group flex h-full min-w-0 flex-col overflow-hidden rounded-lg border border-emerald-950/10 bg-white shadow-soft">
      <div className="relative aspect-[4/3] overflow-hidden bg-emerald-50">
        <Image
          src={cover}
          alt={item?.title ? `${item.title} cover` : "Islamic learning document cover"}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          className="object-cover transition duration-300 group-hover:scale-[1.02]"
        />
        <span className={cn("absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-bold", available ? "bg-emerald-700 text-white" : "bg-amber-100 text-amber-900")}>
          {available ? "Available" : "Unavailable"}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-4">
        <h3 className="break-words text-lg font-black text-emeraldInk">{item?.title || "Untitled document"}</h3>
        {(item?.author || item?.publisher) && (
          <p className="mt-1 text-sm text-emerald-700">{[item.author, item.publisher].filter(Boolean).join(" | ")}</p>
        )}
        {metadata.length > 0 && <p className="mt-2 text-xs leading-5 text-emerald-800">{metadata.join(" | ")}</p>}
        {item?.description && <p className="mt-3 line-clamp-3 text-sm leading-6 text-slate-700">{item.description}</p>}
        {!available && (
          <p className="mt-3 flex items-start gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-900">
            <FileQuestion className="mt-0.5 shrink-0" size={16} />
            This document is currently unavailable. Please contact the institute administration.
          </p>
        )}
        <div className="mt-auto grid gap-2 pt-4 min-[390px]:grid-cols-3">
          {available ? (
            <>
              <Link className="touch-target inline-flex items-center justify-center gap-2 rounded-full bg-palm px-3 py-2 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-palm" href={`/reader/${kind}/${item._id}`}>
                <Eye size={16} /> Read Online
              </Link>
              <button type="button" disabled={downloading} onClick={download} className="touch-target inline-flex items-center justify-center gap-2 rounded-full border border-palm px-3 py-2 text-sm font-semibold text-palm disabled:cursor-wait disabled:opacity-60">
                {downloading ? <LoaderCircle className="animate-spin" size={16} /> : <Download size={16} />} Download
              </button>
            </>
          ) : (
            <span className="touch-target inline-flex items-center justify-center rounded-full bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-500 min-[390px]:col-span-2">Document unavailable</span>
          )}
          <Link className="touch-target inline-flex items-center justify-center rounded-full border px-3 py-2 text-sm font-semibold text-emeraldInk" href={detailsHref}>View Details</Link>
        </div>
      </div>
    </article>
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.ceil(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes >= 10 * 1024 * 1024 ? 0 : 1)} MB`;
}

function documentFilename(item: any, fileUrl: string) {
  const title = String(item?.title || "darsgah-document").replace(/[^a-z0-9._-]+/gi, "-");
  const fromUrl = fileUrl.split("?")[0].match(/\.(pdf|png|jpe?g|webp|docx?|pptx?|mp3|mp4)$/i)?.[1];
  const fromType = String(item?.fileType || "").replace(/^\./, "").toLowerCase();
  const extension = fromUrl || (/^(pdf|png|jpe?g|webp|docx?|pptx?|mp3|mp4)$/.test(fromType) ? fromType : "pdf");
  return title.toLowerCase().endsWith(`.${extension}`) ? title : `${title}.${extension}`;
}

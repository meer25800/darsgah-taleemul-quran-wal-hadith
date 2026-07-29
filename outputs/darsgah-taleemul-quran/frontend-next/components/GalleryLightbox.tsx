"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Download, Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { assetUrl } from "@/lib/assets";

type GalleryItem = { _id: string; title: string; description?: string; imageUrl?: string; category?: string };

export function GalleryLightbox({ items }: { items: GalleryItem[] }) {
  const photos = useMemo(() => items.filter((item) => item.imageUrl), [items]);
  const [index, setIndex] = useState<number | null>(null);
  const [zoom, setZoom] = useState(1);
  const current = index === null ? null : photos[index];

  function close() {
    setIndex(null);
    setZoom(1);
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-3">
        {photos.map((item, photoIndex) => (
          <button key={item._id} onClick={() => setIndex(photoIndex)} className="overflow-hidden rounded-2xl border bg-white text-left shadow-soft">
            <Image src={assetUrl(item.imageUrl)} alt={item.title} width={520} height={320} loading="lazy" className="h-48 w-full object-cover" />
            <span className="block p-4">
              <span className="flex items-center justify-between gap-2 font-bold text-emeraldInk">{item.title}<Maximize2 size={16} /></span>
              <span className="mt-2 block text-sm text-emerald-700">{item.description}</span>
            </span>
          </button>
        ))}
      </div>
      {current && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/85 p-4">
          <button onClick={close} className="absolute right-4 top-4 rounded-full bg-white px-4 py-2 font-bold text-emeraldInk">Close</button>
          <button onClick={() => setIndex((index! - 1 + photos.length) % photos.length)} className="absolute left-4 rounded-full bg-white px-4 py-2 font-bold text-emeraldInk">Prev</button>
          <button onClick={() => setIndex((index! + 1) % photos.length)} className="absolute right-4 rounded-full bg-white px-4 py-2 font-bold text-emeraldInk">Next</button>
          <div className="max-h-[86vh] max-w-5xl overflow-auto rounded-2xl bg-white p-3">
            <Image src={assetUrl(current.imageUrl)} alt={current.title} width={1200} height={800} className="origin-center object-contain transition-transform" style={{ transform: `scale(${zoom})` }} />
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              <div><strong>{current.title}</strong><p className="text-sm text-emerald-700">{current.description}</p></div>
              <div className="flex gap-2">
                <button onClick={() => setZoom((value) => Math.min(value + 0.2, 2))} className="rounded-full border px-3 py-2"><ZoomIn size={16} /></button>
                <button onClick={() => setZoom((value) => Math.max(value - 0.2, 0.6))} className="rounded-full border px-3 py-2"><ZoomOut size={16} /></button>
                <a href={assetUrl(current.imageUrl)} download className="rounded-full bg-palm px-3 py-2 text-white"><Download size={16} /></a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

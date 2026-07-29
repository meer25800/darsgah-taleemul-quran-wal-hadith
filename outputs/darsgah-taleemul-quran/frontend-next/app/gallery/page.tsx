import { GalleryLightbox } from "@/components/GalleryLightbox";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function getGallery() {
  const res = await fetch(`${API_URL}/gallery?limit=48`, { cache: "no-store" });
  if (!res.ok) return [];
  return (await res.json()).items || [];
}

export default async function GalleryPage() {
  const gallery = await getGallery();
  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-black text-emeraldInk">Institute Gallery</h1>
      <p className="mt-2 text-emerald-700">Quran classes, events, competitions, parent meetings, and institute activities.</p>
      <div className="mt-6"><GalleryLightbox items={gallery} /></div>
    </main>
  );
}

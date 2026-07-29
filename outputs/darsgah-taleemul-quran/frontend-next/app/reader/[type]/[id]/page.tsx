import Link from "next/link";
import { assetUrl } from "@/lib/assets";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function getItem(type: string, id: string) {
  const path = type === "resource" ? "resources" : type === "syllabus" ? "syllabus" : "books";
  const res = await fetch(`${API_URL}/${path}/${id}/view`, { cache: "no-store" });
  if (!res.ok) return null;
  const data = await res.json();
  return data.item;
}

export default async function ReaderPage({ params }: { params: Promise<{ type: string; id: string }> }) {
  const { type, id } = await params;
  const item = await getItem(type, id);
  const path = type === "resource" ? "resources" : type === "syllabus" ? "syllabus" : "books";
  const rawFile = item?.previewUrl || item?.fileUrl || item?.file?.url || item?.files?.[0]?.url;
  const fileUrl = assetUrl(rawFile, "");
  const files = item?.files?.length ? item.files : item?.file?.url ? [item.file] : [];
  const isImage = Boolean(fileUrl && /\.(png|jpg|jpeg|webp)$/i.test(fileUrl.split("?")[0]));
  const readerUrl = documentUrl(fileUrl, item?.title || "document");
  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <Link href="/" className="text-sm font-semibold text-palm">Back to home</Link>
      <h1 className="mt-4 text-3xl font-black text-emeraldInk">{item?.title || "Reader"}</h1>
      <p className="mt-2 text-emerald-700">{item?.description}</p>
      <div className="mt-4 flex gap-2">
        {type !== "syllabus" && <a className="rounded-full bg-palm px-4 py-2 font-semibold text-white" href={`${API_URL}/${path}/${id}/download`}>Download</a>}
        {type === "syllabus" && fileUrl && <a className="rounded-full bg-palm px-4 py-2 font-semibold text-white" href={documentUrl(fileUrl, item?.title || "syllabus", true)}>Download File</a>}
        <Link className="rounded-full border px-4 py-2 font-semibold text-emeraldInk" href={`/${path}`}>View all</Link>
      </div>
      <section className="mt-6 min-h-[70vh] overflow-hidden rounded-2xl border bg-white shadow-soft">
        {item?.textContent ? (
          <article className="prose max-w-none p-6 text-emeraldInk whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: sanitizeHtml(item.textContent) }} />
        ) : files.length > 1 ? (
          <div className="grid gap-4 p-4">
            {files.map((file: any) => {
              const url = assetUrl(file.url, "");
              const image = /\.(png|jpg|jpeg|webp)$/i.test(url.split("?")[0]);
              const proxiedUrl = documentUrl(url, file.originalName || item?.title || "document");
              return image ? <img key={file.url} src={proxiedUrl} alt={file.originalName || item?.title} className="mx-auto max-h-[78vh] w-auto rounded-xl object-contain" /> : <iframe key={file.url} src={proxiedUrl} title={file.originalName || item?.title} className="h-[78vh] w-full rounded-xl" />;
            })}
          </div>
        ) : fileUrl && isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={readerUrl} alt={item?.title || "Syllabus image"} className="mx-auto max-h-[78vh] w-auto object-contain p-4" />
        ) : fileUrl ? (
          <iframe src={readerUrl} title={item?.title || "Document reader"} className="h-[78vh] w-full" />
        ) : (
          <div className="grid min-h-[60vh] place-items-center p-8 text-center">
            <div>
              <p className="text-xl font-bold text-emeraldInk">Online file will appear here after admin uploads it.</p>
              <p className="mt-2 text-emerald-700">The metadata is already stored in MongoDB and can be edited from the admin dashboard.</p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}

function sanitizeHtml(value: string) {
  return value.replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "");
}

function documentUrl(fileUrl: string, title: string, download = false) {
  const params = new URLSearchParams({ url: fileUrl, title });
  if (download) params.set("download", "1");
  return `/api/document?${params.toString()}`;
}

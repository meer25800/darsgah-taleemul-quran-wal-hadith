import Link from "next/link";
import sanitizeHtmlLibrary from "sanitize-html";
import { DocumentPdfViewerClient } from "@/components/DocumentPdfViewerClient";
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
  const downloadHref = fileUrl ? documentUrl(fileUrl, item?.title || "document", true) : `${API_URL}/${path}/${id}/download`;
  const available = Boolean(item && (fileUrl || item?.textContent || files.length));
  return (
    <main className="mx-auto max-w-6xl px-3 py-6 sm:px-4 sm:py-10">
      <Link href="/" className="text-sm font-semibold text-palm">Back to home</Link>
      <h1 className="mt-4 break-words text-2xl font-black text-emeraldInk sm:text-3xl">{item?.title || "Reader"}</h1>
      <p className="mt-2 text-emerald-700">{item?.description}</p>
      <div className="mt-4 flex flex-col gap-2 min-[380px]:flex-row">
        {fileUrl && <a className="touch-target inline-flex items-center justify-center rounded-full bg-palm px-4 py-2 font-semibold text-white" href={downloadHref}>Download</a>}
        <Link className="touch-target inline-flex items-center justify-center rounded-full border px-4 py-2 font-semibold text-emeraldInk" href={`/${path}`}>View all</Link>
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
              return image
                ? <img key={file.url} src={proxiedUrl} alt={file.originalName || item?.title} className="mx-auto max-h-[78vh] w-auto rounded-xl object-contain" />
                : <DocumentPdfViewerClient key={file.url} src={proxiedUrl} title={file.originalName || item?.title || "Document"} downloadHref={documentUrl(url, file.originalName || item?.title || "document", true)} />;
            })}
          </div>
        ) : fileUrl && isImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={readerUrl} alt={item?.title || "Syllabus image"} className="mx-auto max-h-[78vh] w-auto object-contain p-4" />
        ) : fileUrl ? (
          <DocumentPdfViewerClient src={readerUrl} title={item?.title || "Document"} downloadHref={downloadHref} />
        ) : !available ? (
          <div className="grid min-h-[60vh] place-items-center p-8 text-center">
            <div>
              <p className="text-xl font-bold text-emeraldInk">This document is currently unavailable. Please contact the institute administration.</p>
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function sanitizeHtml(value: string) {
  return sanitizeHtmlLibrary(value, {
    allowedTags: ["p", "br", "strong", "b", "em", "i", "u", "h2", "h3", "h4", "ul", "ol", "li", "table", "thead", "tbody", "tr", "th", "td", "blockquote"],
    allowedAttributes: {},
    disallowedTagsMode: "discard"
  });
}

function documentUrl(fileUrl: string, title: string, download = false) {
  const params = new URLSearchParams({ url: fileUrl, title });
  if (download) params.set("download", "1");
  return `/api/document?${params.toString()}`;
}

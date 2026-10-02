"use client";

import { Download, Expand, ExternalLink, Printer } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { downloadFromUrl, isNativeDocumentApp, openDocumentInApp } from "@/lib/api";

export function DocumentPdfViewer({
  src,
  title,
  downloadHref
}: {
  src: string;
  title: string;
  downloadHref: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  // Keep the initial server and client markup identical. Android-only UI is
  // enabled after hydration, when the Capacitor bridge is definitely available.
  const [isAndroidApp, setIsAndroidApp] = useState(false);

  useEffect(() => {
    setIsAndroidApp(isNativeDocumentApp());
  }, []);

  function filename() {
    return `${title.replace(/[^a-z0-9._-]+/gi, "-").replace(/^-+|-+$/g, "") || "darsgah-document"}.pdf`;
  }

  async function enterFullscreen() {
    await containerRef.current?.requestFullscreen?.();
  }

  async function downloadDocument() {
    await downloadFromUrl(downloadHref, filename());
  }

  function openDocument() {
    if (openDocumentInApp(src, title)) return;
    void downloadDocument();
  }

  return (
    <div ref={containerRef} className="pdf-viewer min-w-0 bg-zinc-100">
      <div className="sticky top-[57px] z-20 border-b bg-white/95 p-2 shadow-sm backdrop-blur sm:top-[65px]">
        <div className="flex flex-wrap items-center justify-center gap-2">
          <ToolbarButton label="Fullscreen" onClick={enterFullscreen}>
            <Expand size={18} />
          </ToolbarButton>
          <ToolbarButton label="Print" onClick={() => window.print()}>
            <Printer size={18} />
          </ToolbarButton>
          {!isAndroidApp && (
            <a
              className="touch-target inline-flex items-center justify-center gap-2 rounded-lg border bg-white px-3 text-sm font-semibold text-emeraldInk"
              href={src}
              target="_blank"
              rel="noreferrer"
            >
              <ExternalLink size={18} /> Open separately
            </a>
          )}
          <button
            type="button"
            className="touch-target inline-flex items-center justify-center gap-2 rounded-lg bg-palm px-3 text-sm font-semibold text-white"
            onClick={isAndroidApp ? openDocument : downloadDocument}
          >
            <Download size={18} /> {isAndroidApp ? "Open in app" : "Download"}
          </button>
        </div>
        <p className="mt-1 text-center text-xs text-emerald-800">
          Use the PDF toolbar for page navigation, zoom, search, fit-to-width and print.
        </p>
      </div>

      <div className="mx-auto min-h-[70vh] max-w-6xl overflow-hidden bg-zinc-200 p-2 sm:p-4">
        {isAndroidApp ? (
          <div className="grid min-h-[50vh] place-items-center p-6 text-center">
            <div className="max-w-md">
              <h2 className="text-xl font-black text-emeraldInk">Open this document</h2>
              <p className="mt-2 text-sm leading-6 text-slate-700">Read the PDF inside the Darsgah app, or save a copy in your Downloads folder.</p>
              <div className="mt-5 flex flex-col justify-center gap-3 min-[380px]:flex-row">
                <button type="button" onClick={openDocument} className="touch-target inline-flex items-center justify-center gap-2 rounded-full bg-palm px-5 py-3 font-bold text-white">
                  <ExternalLink size={18} /> Read online
                </button>
                <button type="button" onClick={downloadDocument} className="touch-target inline-flex items-center justify-center gap-2 rounded-full border border-palm px-5 py-3 font-bold text-palm">
                  <Download size={18} /> Save to Downloads
                </button>
              </div>
            </div>
          </div>
        ) : (
          <iframe
            src={`${src}#toolbar=1&navpanes=0&view=FitH`}
            title={`${title} PDF reader`}
            className="h-[76vh] min-h-[560px] w-full border-0 bg-white"
            loading="eager"
          />
        )}
        <noscript>
          <p className="p-6 text-center">
            JavaScript is required for the online reader. <a href={downloadHref}>Download the document instead.</a>
          </p>
        </noscript>
      </div>
    </div>
  );
}

function ToolbarButton({
  label,
  children,
  onClick
}: {
  label: string;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="touch-target inline-flex items-center justify-center rounded-lg border bg-white px-3 text-sm font-semibold text-emeraldInk transition hover:bg-emerald-50"
    >
      {children}
    </button>
  );
}

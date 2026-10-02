import { DocumentPdfViewer } from "@/components/DocumentPdfViewer";

export function DocumentPdfViewerClient(props: { src: string; title: string; downloadHref: string }) {
  return <DocumentPdfViewer {...props} />;
}

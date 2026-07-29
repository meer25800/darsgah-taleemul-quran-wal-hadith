import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { assetUrl } from "@/lib/assets";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function getResources() {
  const res = await fetch(`${API_URL}/public/resources?limit=100`, { cache: "no-store" });
  if (!res.ok) return [];
  return (await res.json()).items || [];
}

export default async function ResourcesPage() {
  const resources = await getResources();
  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-black text-emeraldInk">Resources</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {resources.map((resource: any) => (
          <Card key={resource._id} className="overflow-hidden p-0">
            <Image src={assetUrl(resource.thumbnailUrl)} alt={resource.title} width={520} height={300} className="h-44 w-full object-cover" />
            <div className="p-4">
              <strong className="text-lg">{resource.title}</strong>
              <p className="mt-1 text-sm text-emerald-700">{resource.category} | {resource.fileType?.toUpperCase?.()} | {resource.fileSize || "-"}</p>
              <p className="mt-1 text-xs">Uploaded by {resource.uploadedBy || "Institute"} | Views: {resource.views || 0} | Downloads: {resource.downloads || 0}</p>
              <p className="mt-2 text-sm">{resource.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/reader/resource/${resource._id}`} className="rounded-full bg-palm px-3 py-2 text-sm font-semibold text-white">Preview</Link>
                <a href={`${API_URL}/resources/${resource._id}/download`} className="rounded-full border border-palm px-3 py-2 text-sm font-semibold text-palm">Download</a>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}

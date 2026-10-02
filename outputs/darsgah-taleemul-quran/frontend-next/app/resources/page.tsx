import { Card } from "@/components/ui/card";
import { DocumentCard } from "@/components/DocumentCard";

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
        {resources.length ? resources.map((resource: any) => <DocumentCard key={resource._id} item={resource} kind="resource" detailsHref={`/resources#resource-${resource._id}`} />) : <Card>No resources are available yet.</Card>}
      </div>
    </main>
  );
}

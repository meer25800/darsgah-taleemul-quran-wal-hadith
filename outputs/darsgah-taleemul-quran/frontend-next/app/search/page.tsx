import Link from "next/link";
import { Card } from "@/components/ui/card";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function search(q: string) {
  if (!q) return [];
  const res = await fetch(`${API_URL}/search?q=${encodeURIComponent(q)}`, { cache: "no-store" });
  if (!res.ok) return [];
  return (await res.json()).results || [];
}

function resultHref(item: any) {
  if (item.type === "books" || item.type === "library") return `/reader/book/${item.id}`;
  if (item.type === "resources") return `/reader/resource/${item.id}`;
  if (item.type === "syllabus") return `/reader/syllabus/${item.id}`;
  if (item.type === "gallery") return `/gallery?open=${item.id}`;
  if (item.type === "videos") return `/#videos`;
  if (item.type === "notices" || item.type === "events") return `/#notices-events`;
  if (item.type === "admissions") return `/#admissions`;
  return "/";
}

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const params = await searchParams;
  const q = params.q || "";
  const results = await search(q);
  return (
    <main className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-black text-emeraldInk">Global Search</h1>
      <form className="mt-5 flex gap-2 rounded-full border bg-white p-2 shadow-soft">
        <input name="q" defaultValue={q} placeholder="Search everything" className="min-w-0 flex-1 rounded-full px-4 py-2 outline-none" />
        <button className="rounded-full bg-palm px-5 py-2 font-semibold text-white">Search</button>
      </form>
      <div className="mt-6 grid gap-3">
        {results.map((item: any) => (
          <Card key={`${item.type}-${item.id}`}>
            <p className="text-xs font-bold uppercase text-palm">{item.type}</p>
            <h2 className="mt-1 text-xl font-bold">{item.title}</h2>
            <p className="mt-1 text-sm text-emerald-700">{item.description}</p>
            <Link className="mt-3 inline-block rounded-full border px-3 py-2 text-sm font-semibold" href={resultHref(item)}>Open section</Link>
          </Card>
        ))}
        {q && !results.length && <Card>No matching records found.</Card>}
      </div>
    </main>
  );
}

import Link from "next/link";
import { Card } from "@/components/ui/card";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function getSyllabus() {
  const res = await fetch(`${API_URL}/public/syllabus?limit=100`, { cache: "no-store" });
  if (!res.ok) return [];
  return (await res.json()).items || [];
}

export default async function SyllabusPage() {
  const items = await getSyllabus();
  const classes = ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5", "Class 6", "Class 7", "Class 8"];
  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-black text-emeraldInk">Class-wise Syllabus</h1>
      <p className="mt-2 text-emerald-700">PDF and image syllabus files uploaded by admin or faculty are available for online reading.</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {classes.map((className) => {
          const classItems = items.filter((item: any) => item.className === className);
          return (
            <Card key={className}>
              <h2 className="text-xl font-bold text-emeraldInk">{className}</h2>
              <div className="mt-3 grid gap-2">
                {classItems.length ? classItems.map((item: any) => (
                  <Link key={item._id} href={`/reader/syllabus/${item._id}`} className="rounded-xl border px-3 py-2 text-sm font-semibold text-palm hover:bg-emerald-50">
                    {item.title} <span className="text-xs text-emerald-700">({item.type || "file"})</span>
                  </Link>
                )) : <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-700">No syllabus uploaded yet.</p>}
              </div>
            </Card>
          );
        })}
      </div>
    </main>
  );
}

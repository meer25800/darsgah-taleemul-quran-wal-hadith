import Image from "next/image";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { assetUrl } from "@/lib/assets";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

async function getBooks() {
  const res = await fetch(`${API_URL}/public/books?limit=100`, { cache: "no-store" });
  if (!res.ok) return [];
  return (await res.json()).items || [];
}

export default async function BooksPage() {
  const books = await getBooks();
  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="text-3xl font-black text-emeraldInk">Islamic Digital Library</h1>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {books.map((book: any) => (
          <Card key={book._id} className="overflow-hidden p-0">
            <Image src={assetUrl(book.coverUrl || book.thumbnailUrl)} alt={book.title} width={520} height={300} className="h-44 w-full object-cover" />
            <div className="p-4">
              <strong className="text-lg">{book.title}</strong>
              <p className="mt-1 text-sm text-emerald-700">{book.author} | {book.category} | {book.language}</p>
              <p className="mt-1 text-xs">Publisher: {book.publisher || "Darsgah"} | Pages: {book.pages || "-"} | Size: {book.fileSize || "-"}</p>
              <p className="mt-2 text-sm">{book.description}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/reader/book/${book._id}`} className="rounded-full bg-palm px-3 py-2 text-sm font-semibold text-white">Read Online</Link>
                <a href={`${API_URL}/books/${book._id}/download`} className="rounded-full border border-palm px-3 py-2 text-sm font-semibold text-palm">Download PDF</a>
                <button className="rounded-full border px-3 py-2 text-sm font-semibold">Bookmark</button>
                <button className="rounded-full border px-3 py-2 text-sm font-semibold">Share</button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}

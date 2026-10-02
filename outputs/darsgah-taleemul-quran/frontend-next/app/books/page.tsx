import { Card } from "@/components/ui/card";
import { DocumentCard } from "@/components/DocumentCard";

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
        {books.length ? books.map((book: any) => <DocumentCard key={book._id} item={book} kind="book" detailsHref={`/books#book-${book._id}`} />) : <Card>No books are available yet.</Card>}
      </div>
    </main>
  );
}

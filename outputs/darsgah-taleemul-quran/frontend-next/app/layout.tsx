import type { Metadata } from "next";
import Link from "next/link";
import { AuthProvider } from "@/lib/auth";
import { LogoBadge } from "@/components/LogoBadge";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: "Darsgah Taleemul Quran Wal Hadith",
  description: "Official Islamic institute portal for Darsgah Taleemul Quran Wal Hadith Kongamdara Pattan",
  openGraph: {
    title: "Darsgah Taleemul Quran Wal Hadith",
    description: "Admissions, Islamic library, resources, portals, notices and institute updates.",
    type: "website"
  },
  twitter: {
    card: "summary",
    title: "Darsgah Taleemul Quran Wal Hadith",
    description: "Official institute portal for Kongamdara Pattan."
  },
  alternates: { canonical: "/" },
  icons: { icon: "/institute-logo-badge.png", apple: "/institute-logo-badge.png" }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <header className="web-header sticky top-0 z-40 border-b border-emerald-900/10 bg-white/90 backdrop-blur">
            <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2 focus:font-bold focus:text-palm">Skip to content</a>
            <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-2 sm:px-4">
              <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-3" aria-label="Darsgah home">
                <LogoBadge size={48} className="h-10 w-10 sm:h-12 sm:w-12" />
                <span className="min-w-0 leading-tight">
                  <strong className="block text-wrap text-xs sm:text-sm md:text-base">DARSGAH TALEEMUL QURAN</strong>
                  <span className="block text-[10px] text-palm sm:text-xs">WAL HADITH KONGAMDARA PATTAN</span>
                </span>
              </Link>
              <nav className="hidden items-center gap-4 text-sm font-semibold text-emeraldInk md:flex" aria-label="Primary navigation">
                <Link href="/#admissions">Admissions</Link>
                <Link href="/#books">Books</Link>
                <Link href="/#resources">Resources</Link>
                <Link href="/privacy">Privacy</Link>
                <Link href="/login/admin">Login</Link>
              </nav>
              <details className="relative md:hidden">
                <summary className="touch-target grid cursor-pointer list-none place-items-center rounded-full border border-emerald-900/10 px-3 text-sm font-bold text-palm">Menu</summary>
                <nav className="absolute right-0 mt-2 grid w-56 gap-1 rounded-2xl border bg-white p-2 text-sm font-semibold text-emeraldInk shadow-2xl" aria-label="Mobile navigation">
                  <Link className="rounded-xl px-3 py-3 hover:bg-emerald-50" href="/#admissions">Admissions</Link>
                  <Link className="rounded-xl px-3 py-3 hover:bg-emerald-50" href="/#books">Books</Link>
                  <Link className="rounded-xl px-3 py-3 hover:bg-emerald-50" href="/#resources">Resources</Link>
                  <Link className="rounded-xl px-3 py-3 hover:bg-emerald-50" href="/privacy">Privacy</Link>
                  <Link className="rounded-xl bg-palm px-3 py-3 text-white" href="/login/admin">Login</Link>
                </nav>
              </details>
            </div>
          </header>
          <div id="main-content">{children}</div>
        </AuthProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { AuthProvider } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Darsgah Taleemul Quran Wal Hadith",
  description: "Institute management ERP portal"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <header className="sticky top-0 z-40 border-b border-emerald-900/10 bg-white/90 backdrop-blur">
            <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
              <Link href="/" className="flex items-center gap-3">
                <Image src="/institute-logo.png" alt="Institute logo" width={52} height={52} className="rounded-full border-2 border-gold" />
                <span>
                  <strong className="block text-sm md:text-base">DARSGAH TALEEMUL QURAN</strong>
                  <span className="text-xs text-palm">WAL HADITH KONGAMDARA PATTAN</span>
                </span>
              </Link>
              <nav className="hidden items-center gap-4 text-sm font-semibold text-emeraldInk md:flex">
                <Link href="/#admissions">Admissions</Link>
                <Link href="/#books">Books</Link>
                <Link href="/#resources">Resources</Link>
                <Link href="/privacy">Privacy</Link>
                <Link href="/login/admin">Login</Link>
              </nav>
            </div>
          </header>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}

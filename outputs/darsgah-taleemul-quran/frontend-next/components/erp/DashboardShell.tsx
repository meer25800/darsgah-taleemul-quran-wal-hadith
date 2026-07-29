"use client";

import Image from "next/image";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function DashboardShell({ title, children }: { title: string; children: React.ReactNode }) {
  const { logout } = useAuth();
  return (
    <main className="min-h-[calc(100vh-78px)] bg-ivory px-4 py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Image src="/institute-logo.png" alt="Institute logo" width={72} height={72} className="rounded-full border-2 border-gold bg-white" />
            <div><h1 className="text-3xl font-black text-emeraldInk">{title}</h1><p className="text-palm">Live institute database portal</p></div>
          </div>
          <Button variant="outline" onClick={logout}>Logout</Button>
        </div>
        {children}
      </div>
    </main>
  );
}

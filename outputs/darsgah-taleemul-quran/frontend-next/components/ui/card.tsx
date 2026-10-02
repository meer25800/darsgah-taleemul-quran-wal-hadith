import { cn } from "@/lib/utils";
import React from "react";

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn("min-w-0 rounded-2xl border border-emerald-900/10 bg-white p-4 shadow-soft sm:p-5", className)}>{children}</div>;
}

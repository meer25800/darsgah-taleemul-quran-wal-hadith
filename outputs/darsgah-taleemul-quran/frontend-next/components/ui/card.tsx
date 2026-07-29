import { cn } from "@/lib/utils";
import React from "react";

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={cn("rounded-2xl border border-emerald-900/10 bg-white p-5 shadow-soft", className)}>{children}</div>;
}

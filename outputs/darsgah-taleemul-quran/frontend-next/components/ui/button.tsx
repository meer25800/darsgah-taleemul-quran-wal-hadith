import { cn } from "@/lib/utils";
import React from "react";

export function Button({ className, variant = "default", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "outline" | "dark" }) {
  return (
    <button
      className={cn(
        "touch-target inline-flex items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:pointer-events-none disabled:opacity-60",
        variant === "default" && "bg-palm text-white shadow-soft",
        variant === "outline" && "border border-palm bg-white text-palm",
        variant === "dark" && "bg-emeraldInk text-white",
        className
      )}
      {...props}
    />
  );
}

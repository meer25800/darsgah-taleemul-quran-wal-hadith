import { cn } from "@/lib/utils";
import React from "react";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const { className, type, value, checked, ...rest } = props;
  const normalizedValue = type === "file" ? undefined : value === null || value === undefined ? "" : value;
  const normalizedChecked = type === "checkbox" || type === "radio" ? Boolean(checked) : undefined;
  const controlledProps =
    type === "checkbox" || type === "radio"
      ? { checked: normalizedChecked }
      : type === "file"
        ? {}
        : { value: normalizedValue };

  return (
    <input
      {...rest}
      {...controlledProps}
      type={type}
      className={cn("w-full rounded-xl border border-emerald-900/10 bg-white px-4 py-3 text-emeraldInk outline-none focus:border-skySeal", className)}
    />
  );
}

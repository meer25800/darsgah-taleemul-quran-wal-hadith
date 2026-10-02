import Image from "next/image";
import { cn } from "@/lib/utils";

type LogoBadgeProps = {
  className?: string;
  imageClassName?: string;
  size?: number;
  priority?: boolean;
  alt?: string;
};

export function LogoBadge({ className, imageClassName, size = 64, priority = false, alt = "Darsgah institute logo" }: LogoBadgeProps) {
  return (
    <span
      className={cn("logo-badge inline-grid shrink-0 place-items-center overflow-hidden rounded-full bg-white", className)}
      style={className ? undefined : { width: size, height: size }}
    >
      <Image
        src="/institute-logo-badge.png"
        alt={alt}
        width={size}
        height={size}
        priority={priority}
        className={cn("h-full w-full object-contain", imageClassName)}
      />
    </span>
  );
}

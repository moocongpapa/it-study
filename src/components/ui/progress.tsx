"use client";

import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

export function Progress({ value = 0, className, label = "진행률" }: { value?: number; className?: string; label?: string }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <ProgressPrimitive.Root
      value={safeValue}
      aria-label={label}
      className={cn("relative h-1.5 w-full overflow-hidden rounded-full bg-slate-100", className)}
    >
      <ProgressPrimitive.Indicator
        className="block h-full rounded-full bg-brand-700 transition-transform duration-500"
        style={{ transform: `translateX(-${100 - safeValue}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

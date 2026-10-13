"use client";

import * as ProgressPrimitive from "@radix-ui/react-progress";
import { cn } from "@/lib/utils";

export function Progress({ value = 0, className }: { value?: number; className?: string }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return (
    <ProgressPrimitive.Root
      value={safeValue}
      className={cn("relative h-1.5 w-full overflow-hidden rounded-full bg-white/10", className)}
    >
      <ProgressPrimitive.Indicator
        className="block h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-400 transition-transform duration-500"
        style={{ transform: `translateX(-${100 - safeValue}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;

export function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return <TabsPrimitive.List className={cn("flex gap-1 rounded-lg bg-slate-100 p-1", className)} {...props} />;
}

export function TabsTrigger({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      className={cn("rounded-lg px-3 py-2 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30 data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm", className)}
      {...props}
    />
  );
}

export const TabsContent = TabsPrimitive.Content;

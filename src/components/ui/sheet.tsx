"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetTitle = DialogPrimitive.Title;
export const SheetDescription = DialogPrimitive.Description;
export const SheetClose = DialogPrimitive.Close;

export function SheetContent({
  className,
  children,
  side = "right",
  showCloseButton = true,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content> & { side?: "right" | "left"; showCloseButton?: boolean }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-slate-900/25 data-[state=open]:animate-in" />
      <DialogPrimitive.Content
        className={cn(
          "sheet-viewport fixed inset-y-0 z-50 flex min-h-0 w-full max-w-[620px] flex-col overflow-hidden border-slate-200 bg-white shadow-sm focus:outline-none",
          side === "right" ? "right-0 border-l" : "left-0 border-r",
          className,
        )}
        {...props}
      >
        {children}
        {showCloseButton ? <DialogPrimitive.Close
          className="absolute right-3 top-[max(.75rem,env(safe-area-inset-top))] z-10 grid size-11 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/30"
          aria-label="닫기"
        >
          <X className="size-5" />
        </DialogPrimitive.Close> : null}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

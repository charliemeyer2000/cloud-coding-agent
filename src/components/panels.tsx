import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex h-full min-h-0 flex-col overflow-hidden rounded-sm border",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function PanelHeader({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-2 border-b bg-secondary px-2.5 py-1.5 font-mono text-xs font-semibold tracking-tight text-secondary-foreground uppercase",
        className,
      )}
    >
      {children}
    </div>
  );
}

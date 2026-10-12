import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 px-6 py-12 text-center",
        className
      )}
    >
      {Icon && (
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--adm-surface-2)] text-[var(--adm-muted)]">
          <Icon className="h-6 w-6" />
        </span>
      )}
      <p className="text-sm font-semibold text-[var(--adm-fg)]">{title}</p>
      {description && (
        <p className="max-w-sm text-xs text-[var(--adm-muted)]">{description}</p>
      )}
    </div>
  );
}

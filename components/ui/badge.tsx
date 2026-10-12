import { cn } from "@/lib/utils";

type Variant = "default" | "success" | "warning" | "danger" | "info" | "muted";

const VARIANTS: Record<Variant, string> = {
  default: "bg-[var(--adm-surface-2)] text-[var(--adm-fg)] border-[var(--adm-border)]",
  success: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 dark:text-emerald-400",
  warning: "bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400",
  danger: "bg-red-500/15 text-red-600 border-red-500/30 dark:text-red-400",
  info: "bg-blue-500/15 text-blue-600 border-blue-500/30 dark:text-blue-400",
  muted: "bg-transparent text-[var(--adm-muted)] border-[var(--adm-border)]",
};

export function Badge({
  className,
  variant = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: Variant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
        VARIANTS[variant],
        className
      )}
      {...props}
    />
  );
}

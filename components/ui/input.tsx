import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

export function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-10 w-full rounded-lg border border-[var(--adm-border)] bg-[var(--adm-surface)] px-3 text-sm text-[var(--adm-fg)] placeholder:text-[var(--adm-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--adm-ring)] disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
}

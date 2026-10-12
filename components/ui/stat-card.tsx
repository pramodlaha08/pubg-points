import { Card, CardContent } from "./card";
import { Skeleton } from "./skeleton";
import type { LucideIcon } from "lucide-react";

export function StatCard({
  title,
  value,
  icon: Icon,
  hint,
  loading = false,
}: {
  title: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  loading?: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wide text-[var(--adm-muted)]">
            {title}
          </p>
          {loading ? (
            <Skeleton className="mt-2 h-8 w-16" />
          ) : (
            <p className="mt-1 text-3xl font-bold tabular-nums">{value}</p>
          )}
          {hint && !loading && (
            <p className="mt-1 text-xs text-[var(--adm-muted)]">{hint}</p>
          )}
        </div>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--adm-surface-2)] text-[var(--adm-primary)]">
          <Icon className="h-5 w-5" />
        </span>
      </CardContent>
    </Card>
  );
}

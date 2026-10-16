import { AlertTriangle, CheckCircle2 } from "lucide-react";

export default function InlineAlert({
  tone,
  children,
}: {
  tone: "warning" | "success";
  children: React.ReactNode;
}) {
  const styles =
    tone === "warning"
      ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-300"
      : "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  return (
    <div className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-sm ${styles}`}>
      {tone === "warning" ? (
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      ) : (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      )}
      <div className="space-y-1">{children}</div>
    </div>
  );
}

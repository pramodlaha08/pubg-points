"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";

export function ScreenshotViewer({
  files,
  label,
}: {
  files: File[];
  label?: string;
}) {
  const [urls, setUrls] = useState<string[]>([]);
  const [active, setActive] = useState<number | null>(null);

  // Object URLs must be created (and revoked) inside an effect so a StrictMode
  // remount always ends up with live URLs.
  useEffect(() => {
    const next = files.map((file) => URL.createObjectURL(file));
    setUrls(next);
    return () => {
      next.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  if (!files.length) return null;

  return (
    <div className="rounded-lg border border-[var(--adm-border)] p-3">
      <p className="mb-2 text-xs font-medium text-[var(--adm-fg)]">
        {label ?? "Screenshot(s)"}{" "}
        <span className="text-[var(--adm-muted)]">— click to zoom</span>
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {urls.map((url, index) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={url}
            src={url}
            alt={`Screenshot ${index + 1}`}
            onClick={() => setActive(index)}
            className="h-44 w-auto shrink-0 cursor-zoom-in rounded-md border border-[var(--adm-border)] object-contain"
          />
        ))}
      </div>

      {active !== null && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-4"
          onClick={() => setActive(null)}
        >
          <button
            type="button"
            aria-label="Close"
            onClick={() => setActive(null)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={urls[active]}
            alt={`Screenshot ${active + 1}`}
            className="max-h-full max-w-full rounded-lg object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

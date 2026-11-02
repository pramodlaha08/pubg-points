"use client";

import { useEffect, useRef, useState } from "react";
import { Copy, ExternalLink, RotateCcw, Save } from "lucide-react";
import BroadcastOverlay from "@/components/overlays/BroadcastOverlay";
import {
  DEFAULT_BROADCAST_LAYOUT,
  LAYOUT_KEYS,
  LAYOUT_LABELS,
  cloneLayout,
} from "@/lib/broadcastLayout";
import type {
  BroadcastLayout,
  BroadcastLayoutEntry,
  BroadcastLayoutKey,
  BroadcastState,
} from "@/types/broadcast";

interface OverlayLayoutEditorProps {
  broadcast: BroadcastState;
  layout: BroadcastLayout;
  selectedKey: BroadcastLayoutKey;
  dirty: boolean;
  saving: boolean;
  onSelect: (key: BroadcastLayoutKey) => void;
  onChange: (layout: BroadcastLayout) => void;
  onSave: () => void;
  onReset: () => void;
}

const FIELDS: {
  key: keyof BroadcastLayoutEntry;
  label: string;
  min: number;
  max: number;
  step: number;
  suffix: string;
  hint?: string;
}[] = [
  { key: "x", label: "Horizontal", min: 0, max: 100, step: 0.5, suffix: "%" },
  { key: "y", label: "Vertical", min: 0, max: 100, step: 0.5, suffix: "%" },
  {
    key: "width",
    label: "Width",
    min: 0,
    max: 100,
    step: 1,
    suffix: "%",
    hint: "0 = natural width",
  },
  { key: "scale", label: "Scale", min: 40, max: 200, step: 5, suffix: "%" },
];

export default function OverlayLayoutEditor({
  broadcast,
  layout,
  selectedKey,
  dirty,
  saving,
  onSelect,
  onChange,
  onSave,
  onReset,
}: OverlayLayoutEditorProps) {
  const holderRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(960);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const element = holderRef.current;
    if (!element) return;
    const measure = () => setCanvasWidth(element.clientWidth || 960);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const scale = canvasWidth / 1920;
  const selected = layout[selectedKey];

  const updateField = (field: keyof BroadcastLayoutEntry, value: number) => {
    onChange({
      ...layout,
      [selectedKey]: { ...selected, [field]: value },
    });
  };

  const copyUrl = async () => {
    try {
      await navigator.clipboard.writeText(
        `${window.location.origin}/pointstable`
      );
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-white">Drag to place</p>
            <p className="text-xs text-[var(--adm-muted)]">
              Grab any block in the 16:9 preview. Save to push it to OBS.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={copyUrl}
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--adm-border)] px-3 py-2 text-xs font-semibold text-[var(--adm-muted)] transition hover:text-white"
            >
              <Copy className="h-3.5 w-3.5" />
              {copied ? "Copied" : "Copy OBS URL"}
            </button>
            <a
              href="/pointstable"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--adm-border)] px-3 py-2 text-xs font-semibold text-[var(--adm-muted)] transition hover:text-white"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Open overlay
            </a>
            <a
              href="/pointstable/classic"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--adm-border)] px-3 py-2 text-xs font-semibold text-[var(--adm-muted)] transition hover:text-white"
            >
              Classic
            </a>
          </div>
        </div>

        <div
          ref={holderRef}
          className="w-full overflow-hidden rounded-xl border border-[var(--adm-border)] bg-[#0B0D10]"
          style={{ aspectRatio: "16 / 9" }}
        >
          <div
            className="origin-top-left"
            style={{
              width: 1920,
              height: 1080,
              transform: `scale(${scale})`,
            }}
          >
            <BroadcastOverlay
              broadcast={broadcast}
              layout={layout}
              editing
              selectedKey={selectedKey}
              onSelect={onSelect}
              onLayoutChange={onChange}
              design="editorial"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="rounded-xl border border-[var(--adm-border)] bg-[var(--adm-surface)] p-3">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-[var(--adm-muted)]">
            Blocks
          </p>
          <div className="space-y-1">
            {LAYOUT_KEYS.map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => onSelect(key)}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                  selectedKey === key
                    ? "bg-amber-400/15 font-semibold text-amber-300"
                    : "text-[var(--adm-fg)] hover:bg-white/5"
                }`}
              >
                <span>{LAYOUT_LABELS[key]}</span>
                <span className="text-[10px] tabular-nums text-[var(--adm-muted)]">
                  {layout[key].x.toFixed(0)},{layout[key].y.toFixed(0)}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-[var(--adm-border)] bg-[var(--adm-surface)] p-3">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--adm-muted)]">
              {LAYOUT_LABELS[selectedKey]}
            </p>
            <button
              type="button"
              onClick={() =>
                onChange({
                  ...layout,
                  [selectedKey]: cloneLayout({
                    [selectedKey]: DEFAULT_BROADCAST_LAYOUT[selectedKey],
                  })[selectedKey],
                })
              }
              className="text-[11px] font-semibold text-[var(--adm-muted)] hover:text-white"
            >
              Reset block
            </button>
          </div>

          <div className="space-y-3">
            {FIELDS.map((field) => (
              <label key={field.key} className="block">
                <span className="mb-1 flex items-center justify-between text-xs text-[var(--adm-muted)]">
                  <span>{field.label}</span>
                  <span className="tabular-nums text-[var(--adm-fg)]">
                    {selected[field.key]}
                    {field.suffix}
                  </span>
                </span>
                <input
                  type="range"
                  min={field.min}
                  max={field.max}
                  step={field.step}
                  value={selected[field.key]}
                  onChange={(event) =>
                    updateField(field.key, Number(event.target.value))
                  }
                  className="w-full accent-amber-400"
                />
                {field.hint ? (
                  <span className="mt-0.5 block text-[10px] text-[var(--adm-muted)]">
                    {field.hint}
                  </span>
                ) : null}
              </label>
            ))}
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={!dirty || saving}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-amber-400 px-4 py-2.5 text-sm font-bold text-black transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            {saving ? "Saving..." : dirty ? "Save layout" : "Saved"}
          </button>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--adm-border)] px-3 py-2.5 text-sm font-semibold text-[var(--adm-muted)] transition hover:text-white"
            title="Reset every block to the default layout"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

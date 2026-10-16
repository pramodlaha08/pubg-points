"use client";

import type { OverlaySurface, OverlayWatermark } from "@/lib/tableSettings";
import {
  backgroundImageLayerStyle,
  hasBackgroundImage,
  watermarkStyle,
} from "@/lib/overlayTheme";

export function SurfaceBackground({ surface }: { surface: OverlaySurface }) {
  if (!hasBackgroundImage(surface)) return null;
  return <div style={backgroundImageLayerStyle(surface)} aria-hidden />;
}

export function Watermark({ watermark }: { watermark: OverlayWatermark }) {
  if (!watermark.enabled || !watermark.image) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={watermark.image}
      alt=""
      aria-hidden
      style={watermarkStyle(watermark)}
    />
  );
}

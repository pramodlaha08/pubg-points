import type { CSSProperties } from "react";
import {
  hexToRgba,
  type OverlayPosition,
  type OverlaySurface,
  type OverlayTypography,
  type OverlayWatermark,
} from "@/lib/tableSettings";

export const SCANLINE_BG =
  "repeating-linear-gradient(180deg, rgba(255,255,255,0.7), rgba(255,255,255,0.7) 1px, transparent 1px, transparent 6px)";

interface SurfaceColors {
  panelFrom: string;
  panelTo: string;
  border: string;
  borderSoft: string;
}

export function panelSurfaceStyle(
  surface: OverlaySurface,
  colors: SurfaceColors,
  overrides: CSSProperties = {}
): CSSProperties {
  const base: CSSProperties = { borderRadius: surface.radius, ...overrides };
  const border =
    surface.style === "none" || surface.borderWidth <= 0
      ? "none"
      : `${surface.borderWidth}px solid ${colors.border}`;
  const shadow = surface.shadow
    ? `0 0 0 1px ${colors.borderSoft}, 0 16px 36px rgba(0,0,0,0.45)`
    : undefined;

  switch (surface.style) {
    case "solid":
      return { ...base, background: colors.panelFrom, border, boxShadow: shadow };
    case "gradient": {
      const from = surface.gradientFrom || colors.panelFrom;
      const to = surface.gradientTo || colors.panelTo;
      return {
        ...base,
        backgroundImage: `linear-gradient(${surface.gradientAngle}deg, ${from} 0%, ${to} 100%)`,
        border,
        boxShadow: shadow,
      };
    }
    case "glass":
      return {
        ...base,
        background: hexToRgba(colors.panelFrom, surface.opacity),
        backdropFilter: `blur(${surface.blur}px)`,
        WebkitBackdropFilter: `blur(${surface.blur}px)`,
        border,
        boxShadow: shadow,
      };
    case "none":
      return { ...base, background: "transparent", border: "none", boxShadow: "none" };
    case "transparent":
    default:
      return { ...base, background: "transparent", border, boxShadow: shadow };
  }
}

export function hasBackgroundImage(surface: OverlaySurface): boolean {
  return Boolean(surface.backgroundImage && surface.style !== "none");
}

export function backgroundImageLayerStyle(
  surface: OverlaySurface
): CSSProperties {
  return {
    position: "absolute",
    inset: 0,
    backgroundImage: `url(${surface.backgroundImage})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    opacity: surface.backgroundImageOpacity,
    filter: surface.backgroundImageBlur
      ? `blur(${surface.backgroundImageBlur}px)`
      : undefined,
    pointerEvents: "none",
    zIndex: 0,
  };
}

export function watermarkStyle(w: OverlayWatermark): CSSProperties {
  return {
    position: "absolute",
    width: w.size,
    height: "auto",
    opacity: w.opacity,
    pointerEvents: "none",
    zIndex: 30,
    ...(w.corner.startsWith("top") ? { top: w.offset } : { bottom: w.offset }),
    ...(w.corner.endsWith("left") ? { left: w.offset } : { right: w.offset }),
  };
}

export function typographyStyle(t: OverlayTypography): CSSProperties {
  return {
    fontFamily: t.fontFamily ? t.fontFamily : undefined,
    letterSpacing: t.letterSpacing ? `${t.letterSpacing}em` : undefined,
  };
}

export function fontScale(t: OverlayTypography, extra = 1): number {
  return t.fontScale * extra;
}

export function displayName(name: string, t: OverlayTypography): string {
  return t.uppercase ? name.toUpperCase() : name;
}

export function positionStyle(
  position: OverlayPosition,
  inline: boolean
): CSSProperties {
  if (inline) return {};
  const style: CSSProperties = { position: "fixed" };
  const transforms: string[] = [];

  if (position.vertical === "top") style.top = position.offsetY;
  else if (position.vertical === "bottom") style.bottom = position.offsetY;
  else {
    style.top = "50%";
    transforms.push("translateY(-50%)");
  }

  if (position.horizontal === "left") style.left = position.offsetX;
  else if (position.horizontal === "right") style.right = position.offsetX;
  else {
    style.left = "50%";
    transforms.push("translateX(-50%)");
  }

  if (transforms.length) style.transform = transforms.join(" ");
  return style;
}

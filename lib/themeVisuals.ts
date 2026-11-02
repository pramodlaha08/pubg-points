import type { CSSProperties } from "react";
import type { ThemeMotion, ThemePattern } from "@/lib/tableSettings";

const toRgba = (hex: string, alpha: number) => {
  const value = hex.replace("#", "");
  if (!/^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(value)) return hex;
  const full =
    value.length === 3
      ? value
          .split("")
          .map((char) => char + char)
          .join("")
      : value;
  const number = Number.parseInt(full, 16);
  return `rgba(${(number >> 16) & 255}, ${(number >> 8) & 255}, ${
    number & 255
  }, ${alpha})`;
};

export const themeCut = (size: number) =>
  `polygon(0 0, calc(100% - ${size}px) 0, 100% ${size}px, 100% 100%, ${size}px 100%, 0 calc(100% - ${size}px))`;

export const themePatternStyle = (
  pattern: ThemePattern,
  accent: string
): CSSProperties => {
  const line = toRgba(accent, 0.14);
  const soft = toRgba(accent, 0.07);
  switch (pattern) {
    case "chevron":
      return {
        backgroundImage: `repeating-linear-gradient(135deg, ${line} 0 1px, transparent 1px 18px), repeating-linear-gradient(45deg, ${soft} 0 1px, transparent 1px 18px)`,
        backgroundSize: "26px 26px",
      };
    case "scan":
      return {
        backgroundImage: `repeating-linear-gradient(180deg, ${line} 0 1px, transparent 1px 7px)`,
      };
    case "hex":
      return {
        backgroundImage: `linear-gradient(60deg, ${line} 0 1px, transparent 1px 20px), linear-gradient(120deg, ${soft} 0 1px, transparent 1px 20px)`,
        backgroundSize: "24px 44px",
      };
    case "diagonal":
      return {
        backgroundImage: `repeating-linear-gradient(135deg, ${line} 0 1px, transparent 1px 16px), repeating-linear-gradient(135deg, ${soft} 0 8px, transparent 8px 32px)`,
        backgroundSize: "32px 32px",
      };
    case "dots":
      return {
        backgroundImage: `radial-gradient(circle, ${line} 0 1px, transparent 1.5px)`,
        backgroundSize: "14px 14px",
      };
    case "circuit":
      return {
        backgroundImage: `linear-gradient(90deg, ${line} 0 1px, transparent 1px), linear-gradient(0deg, ${line} 0 1px, transparent 1px), radial-gradient(circle at 20px 20px, ${toRgba(accent, 0.28)} 0 2px, transparent 2.5px)`,
        backgroundSize: "40px 40px, 40px 40px, 40px 40px",
      };
    case "rays":
      return {
        backgroundImage: `repeating-conic-gradient(from 0deg at 50% 50%, ${line} 0deg 1deg, transparent 1deg 12deg)`,
      };
    case "rings":
      return {
        backgroundImage: `repeating-radial-gradient(circle at 50% 50%, ${line} 0 1px, transparent 1px 20px)`,
      };
    case "stripes":
      return {
        backgroundImage: `repeating-linear-gradient(90deg, ${line} 0 1px, transparent 1px 20px), repeating-linear-gradient(90deg, ${soft} 0 7px, transparent 7px 40px)`,
      };
    case "triangles":
      return {
        backgroundImage: `linear-gradient(45deg, ${line} 25%, transparent 25% 75%, ${line} 75%), linear-gradient(-45deg, ${soft} 25%, transparent 25% 75%, ${soft} 75%)`,
        backgroundSize: "24px 24px",
      };
    case "waves":
      return {
        backgroundImage: `repeating-radial-gradient(ellipse at 50% 120%, transparent 0 18px, ${line} 18px 19px, transparent 19px 36px)`,
      };
    case "crosshatch":
      return {
        backgroundImage: `repeating-linear-gradient(45deg, ${line} 0 1px, transparent 1px 16px), repeating-linear-gradient(-45deg, ${soft} 0 1px, transparent 1px 16px)`,
      };
    case "mosaic":
      return {
        backgroundImage: `conic-gradient(from 90deg at 50% 50%, ${line} 25%, transparent 0 50%, ${line} 0 75%, transparent 0)`,
        backgroundSize: "24px 24px",
      };
    default:
      return {
        backgroundImage: `linear-gradient(${line} 1px, transparent 1px), linear-gradient(90deg, ${line} 1px, transparent 1px)`,
        backgroundSize: "22px 22px",
      };
  }
};

export type ThemeRowMotion = {
  opacity: number;
  x?: number;
  y?: number;
  scale?: number;
  rotate?: number;
  filter?: string;
};

export const themeRowMotion = (motion: ThemeMotion): ThemeRowMotion => {
  switch (motion) {
    case "pulse":
      return { opacity: 0, scale: 0.97 };
    case "glitch":
      return { opacity: 0, x: 12, filter: "blur(2px)" };
    case "sweep":
      return { opacity: 0, x: -22 };
    case "rise":
      return { opacity: 0, y: 22 };
    case "zoom":
      return { opacity: 0, scale: 0.9 };
    case "drift":
      return { opacity: 0, x: 18, rotate: 0.5 };
    case "flash":
      return { opacity: 0, filter: "brightness(2.2)" };
    case "cascade":
      return { opacity: 0, y: -14, rotate: -1 };
    case "slide":
      return { opacity: 0, x: 28 };
    default:
      return { opacity: 0, x: -16 };
  }
};

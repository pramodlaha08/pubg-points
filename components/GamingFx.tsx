"use client";

export const GAMING_FX_CSS = `
@keyframes fxPan {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}
@keyframes fxShine {
  0% { transform: translateX(-140%) skewX(-18deg); }
  55%, 100% { transform: translateX(260%) skewX(-18deg); }
}
@keyframes fxPulse {
  0%, 100% { opacity: 0.4; }
  50% { opacity: 1; }
}
@keyframes fxFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}
@keyframes fxScan {
  0% { transform: translateY(-130%); }
  100% { transform: translateY(130%); }
}
@keyframes fxGlow {
  0%, 100% { box-shadow: 0 0 4px 0 var(--fx-glow, rgba(255,255,255,0.4)); }
  50% { box-shadow: 0 0 16px 2px var(--fx-glow, rgba(255,255,255,0.9)); }
}
@keyframes fxGrid {
  0% { background-position: 0 0; }
  100% { background-position: 44px 44px; }
}
`;

export const fxPan = (duration = 6) => ({
  backgroundSize: "200% 200%",
  animation: `fxPan ${duration}s linear infinite`,
});

export function Shine({
  delay = 0,
  duration = 3.4,
}: {
  readonly delay?: number;
  readonly duration?: number;
}) {
  return (
    <span className="pointer-events-none absolute inset-0 overflow-hidden">
      <span
        className="absolute bottom-0 left-0 top-0 w-1/3"
        style={{
          background:
            "linear-gradient(105deg, transparent, rgba(255,255,255,0.5), transparent)",
          animation: `fxShine ${duration}s ease-in-out ${delay}s infinite`,
        }}
      />
    </span>
  );
}

"use client";

import { useEffect } from "react";

// Overlay routes sit on top of the game capture, so the page background must be
// fully transparent for OBS browser sources.
export default function OverlayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const previous = document.body.style.background;
    document.body.style.background = "transparent";
    document.body.classList.add("overflow-hidden");
    return () => {
      document.body.style.background = previous;
      document.body.classList.remove("overflow-hidden");
    };
  }, []);

  return <>{children}</>;
}

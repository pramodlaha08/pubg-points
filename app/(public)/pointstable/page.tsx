"use client";

import BroadcastOverlay from "@/components/overlays/BroadcastOverlay";
import { useBroadcast } from "@/hooks/useBroadcast";

export default function Team() {
  const { broadcast } = useBroadcast();

  if (!broadcast) {
    return (
      <main className="broadcast-page fixed inset-0 h-screen w-full overflow-hidden" />
    );
  }

  return <BroadcastOverlay broadcast={broadcast} design="editorial" />;
}

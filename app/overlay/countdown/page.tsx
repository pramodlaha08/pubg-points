"use client";

import { useBroadcast } from "@/hooks/useBroadcast";
import { EditorialCountdown } from "@/components/overlays/EditorialPanels";

export default function CountdownOverlay() {
  const { broadcast } = useBroadcast();

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute left-1/2 top-10 -translate-x-1/2">
        <EditorialCountdown
          state={broadcast?.countdown}
          serverTime={broadcast?.serverTime}
        />
      </div>
    </div>
  );
}

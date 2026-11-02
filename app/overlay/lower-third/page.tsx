"use client";

import { useBroadcast } from "@/hooks/useBroadcast";
import { EditorialLowerThird } from "@/components/overlays/EditorialPanels";

export default function LowerThirdOverlay() {
  const { broadcast } = useBroadcast();

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden">
      <div className="absolute bottom-16 left-12">
        <EditorialLowerThird state={broadcast?.lowerThird} />
      </div>
    </div>
  );
}

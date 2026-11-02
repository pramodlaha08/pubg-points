"use client";

import { useEffect, useState } from "react";
import { useBroadcast } from "@/hooks/useBroadcast";
import { useKillFeed } from "@/hooks/useKillFeed";
import { EditorialKillFeed } from "@/components/overlays/EditorialPanels";

export default function KillFeedOverlay() {
  const { broadcast } = useBroadcast();
  const { events } = useKillFeed();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (broadcast?.overlays.killFeed === false) return null;

  return (
    <div className="pointer-events-none fixed bottom-12 right-10">
      <EditorialKillFeed events={events} now={now} />
    </div>
  );
}

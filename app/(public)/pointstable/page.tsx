import TeamTable from "@/components/TeamTable2";
import GamingEliminationNotification from "@/components/GamingEliminationNotification";

export default function Team() {
  return (
    <main className="broadcast-page fixed inset-0 w-full h-screen overflow-hidden">
      {/* Gaming Elimination Notification System */}
      <GamingEliminationNotification />

      {/* YouTube landscape ratio container (16:9) */}
      <div className="absolute inset-0" style={{ aspectRatio: "16/9" }}>
        {/* Bottom-right positioning for OBS overlay */}
        <div className="absolute top-[250px] -right-[4px] w-fit h-fit">
          <div className=" backdrop-blur-sm rounded-lg shadow-2xl p-2">
            <TeamTable themeColor="" />
          </div>
        </div>
      </div>
    </main>
  );
}

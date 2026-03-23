import TeamTable from "@/components/TeamTable2";
import GamingEliminationNotification from "@/components/GamingEliminationNotification";

export default function Team() {
  return (
    <main className="broadcast-page fixed inset-0 w-full h-screen bg-green-500 overflow-hidden">
      {/* Gaming Elimination Notification System */}
      <GamingEliminationNotification />

      {/* YouTube landscape ratio container (16:9) for better chroma key */}
      <div
        className="absolute inset-0 bg-green-500"
        style={{ aspectRatio: "16/9" }}
      >
        {/* Bottom-right positioning for OBS overlay */}
        <div className="absolute bottom-48 right-8 w-fit h-fit">
          <div className=" backdrop-blur-sm rounded-lg shadow-2xl p-2">
            <TeamTable themeColor="#80171C" />
          </div>
        </div>
      </div>
    </main>
  );
}

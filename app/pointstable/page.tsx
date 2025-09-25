import TeamTable from "@/components/TeamTable2";

export default function Team() {
  return (
    <main className="min-h-screen w-full bg-green-500 ">
      {/* YouTube landscape ratio container (16:9) for better chroma key */}
      <div
        className="absolute inset-0 bg-green-500"
        style={{ aspectRatio: "16/9" }}
      >
        {/* Bottom-right positioning for OBS overlay */}
        <div className="absolute bottom-0 right-4 w-fit h-fit">
          <div className=" backdrop-blur-sm rounded-lg shadow-2xl p-2">
            <TeamTable />
          </div>
        </div>
      </div>
    </main>
  );
}

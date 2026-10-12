import MatchTable from "@/components/MatchTable";

export default function MatchPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold text-center text-white mb-8">
        Overall Match Standings
      </h1>
      <MatchTable />
    </div>
  );
}

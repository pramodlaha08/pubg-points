import MatchTable from "@/components/MatchTable";

export default function MatchRoundPage({ params }: { params: { id: string } }) {
  const matchId = Number.parseInt(params.id, 10);

  return (
    <div>
      <h1 className="text-3xl font-bold text-center text-red-400 mb-8">
        Match {matchId} Standings
      </h1>
      <MatchTable matchId={matchId} />
    </div>
  );
}

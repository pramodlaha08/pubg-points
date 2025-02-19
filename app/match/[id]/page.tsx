import { FC } from "react";
import MatchTable from "@/components/MatchTable";

// Define the props interface, ensuring that params is a Promise
interface MatchRoundPageProps {
  params: Promise<{ id: string }>; // params is now a Promise
}

const MatchRoundPage: FC<MatchRoundPageProps> = async ({ params }) => {
  // Wait for params to resolve
  const resolvedParams = await params;
  const matchId = Number.parseInt(resolvedParams.id, 10);

  return (
    <div>
      <h1 className="text-3xl font-bold text-center text-red-400 mb-8">
        Match {matchId} Standings
      </h1>
      <MatchTable matchId={matchId} />
    </div>
  );
};

export default MatchRoundPage;

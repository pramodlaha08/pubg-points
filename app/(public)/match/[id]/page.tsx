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

  return <MatchTable matchId={matchId} />;
};

export default MatchRoundPage;

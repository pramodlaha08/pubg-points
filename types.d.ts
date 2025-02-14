interface Team {
  _id: string;
  name: string;
  slot: number;
  totalPoints: number;
  currentRound: number;
  rounds: Array<{
    roundNumber: number;
    kills: number;
    killPoints: number;
    position: number;
    positionPoints: number;
    eliminationCount: number;
    eliminatedPlayers: number[];
    status: string;
  }>;
  isEliminated: boolean;
}

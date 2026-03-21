export const navigationLinks = [
  {
    title: "Administration",
    icon: "⚙️",
    links: [
      { name: "Points Table", path: "/pointstable" },
      { name: "Match Points", path: "/match" },

      // ... other admin links ...
    ],
  },

  {
    title: "Controllers",
    icon: "👤",
    links: [
      { name: "Elimination/Kill", path: "/controller" },
      { name: "Assign Position", path: "/positions" },
      { name: "Commentator Live", path: "/commentator" },
    ],
  },
  {
    title: "Teams",
    icon: "🏆",
    links: [
      { name: "Create Team", path: "/teams/create" },
      { name: "Delete Team", path: "/teams/delete" },
    ],
  },
  {
    title: "Rounds",
    icon: "🏆",
    links: [
      { name: "Create/Delete", path: "/rounds" },
      { name: "Leaderboard", path: "/leaderboard" },
    ],
  },
];

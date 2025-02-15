export const navigationLinks = [
  {
    title: "Administration",
    icon: "⚙️",
    links: [
      { name: "Points Table", path: "/pointstable" },
      { name: "Elimination/Kill", path: "/controller" },
      // ... other admin links ...
    ],
  },

  {
    title: "Controllers",
    icon: "👤",
    links: [
      { name: "Elimination/Kill", path: "/controller" },
      { name: "Assign Position", path: "/positions" },
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
];

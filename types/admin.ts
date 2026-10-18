export type AdminRole = "admin" | "scorer" | "commentator" | "viewer";

export interface AdminAccount {
  id: string;
  username: string;
  role: AdminRole;
  isActive: boolean;
  createdAt: string;
}

export const ADMIN_ROLES: AdminRole[] = [
  "admin",
  "scorer",
  "commentator",
  "viewer",
];

export const ROLE_LABELS: Record<AdminRole, string> = {
  admin: "Admin",
  scorer: "Scorer",
  commentator: "Commentator",
  viewer: "Viewer",
};

export const isAdminRole = (role: AdminRole | null | undefined): boolean =>
  role === "admin";

export const canScoreRole = (role: AdminRole | null | undefined): boolean =>
  role === "admin" || role === "scorer";

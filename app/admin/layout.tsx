import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AdminShell from "@/components/admin/AdminShell";
import { TournamentProvider } from "@/components/providers/TournamentProvider";
import { AuthProvider } from "@/components/providers/AuthProvider";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const loggedIn = cookieStore.get("pubg_admin")?.value === "1";

  if (!loggedIn) {
    redirect("/login?next=/admin/overview");
  }

  return (
    <AuthProvider>
      <TournamentProvider>
        <AdminShell>{children}</AdminShell>
      </TournamentProvider>
    </AuthProvider>
  );
}

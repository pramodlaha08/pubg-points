"use client";

import { use } from "react";
import { useTeams } from "@/hooks/useTeams";
import { PageHeader } from "@/components/ui/page-header";
import TeamForm from "@/components/admin/TeamForm";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { ToastContainer } from "@/utils/ToastifyNotification";

export default function EditTeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { teams, isLoading } = useTeams();
  const team = teams.find((t) => t._id === id);

  return (
    <div className="space-y-6">
      <ToastContainer />
      <PageHeader title="Edit Team" description="Update team details" />
      <div className="max-w-xl">
        {isLoading ? (
          <div className="space-y-3">
            <Skeleton className="h-32 w-32 rounded-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : team ? (
          <TeamForm
            mode="edit"
            teamId={team._id}
            initial={{ name: team.name, slot: team.slot, logo: team.logo }}
          />
        ) : (
          <EmptyState
            title="Team not found"
            description="It may have been deleted. Go back to the teams list."
          />
        )}
      </div>
    </div>
  );
}

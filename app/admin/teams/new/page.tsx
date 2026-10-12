import { PageHeader } from "@/components/ui/page-header";
import TeamForm from "@/components/admin/TeamForm";
import { ToastContainer } from "@/utils/ToastifyNotification";

export default function NewTeamPage() {
  return (
    <div className="space-y-6">
      <ToastContainer />
      <PageHeader
        title="Add Team"
        description="Register a new team and lock its slot"
      />
      <div className="max-w-xl">
        <TeamForm mode="create" />
      </div>
    </div>
  );
}

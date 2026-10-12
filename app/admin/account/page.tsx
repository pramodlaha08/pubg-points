import { Card, CardContent, CardTitle } from "@/components/ui/card";

export default function AccountPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Account</h1>
        <p className="text-sm text-[var(--adm-muted)]">
          Admin session and credentials
        </p>
      </div>

      <Card>
        <CardContent className="space-y-1">
          <CardTitle>Signed in as admin</CardTitle>
          <p className="text-sm text-[var(--adm-muted)]">
            Password changes are available on the Table Design page during this
            phase, and will move here in a later update.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

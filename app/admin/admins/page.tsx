"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import { KeyRound, Plus, RefreshCw, Trash2, UserCog } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/components/providers/AuthProvider";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/ui/table";
import {
  notifyError,
  notifySuccess,
  ToastContainer,
} from "@/utils/ToastifyNotification";
import {
  ADMIN_ROLES,
  ROLE_LABELS,
  type AdminAccount,
  type AdminRole,
} from "@/types/admin";

const errorMessage = (error: unknown, fallback: string) =>
  (isAxiosError(error)
    ? (error.response?.data?.message as string | undefined)
    : undefined) || fallback;

const ROLE_HINT: Record<AdminRole, string> = {
  admin: "Full control, including managing accounts",
  scorer: "Live scoring, positions, rounds and auto scoring",
  commentator: "Read-only access for commentary",
  viewer: "Read-only access",
};

const roleVariant = (role: AdminRole) =>
  role === "admin" ? "danger" : role === "scorer" ? "info" : "muted";

export default function AdminsPage() {
  const router = useRouter();
  const { isAdmin, ready } = useAuth();

  const [admins, setAdmins] = useState<AdminAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    username: "",
    password: "",
    role: "scorer" as AdminRole,
  });

  const [resetTarget, setResetTarget] = useState<AdminAccount | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    if (ready && !isAdmin) {
      router.replace("/admin/overview");
    }
  }, [ready, isAdmin, router]);

  const loadAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/admin");
      setAdmins((response.data?.data as AdminAccount[]) ?? []);
    } catch (error) {
      notifyError(errorMessage(error, "Could not load admin accounts"));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (ready && isAdmin) void loadAdmins();
  }, [ready, isAdmin, loadAdmins]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.username.trim() || !form.password) {
      notifyError("Username and password are required");
      return;
    }
    setSaving(true);
    try {
      await api.post("/admin", {
        username: form.username.trim(),
        password: form.password,
        role: form.role,
      });
      notifySuccess(`Account "${form.username.trim()}" created`);
      setForm({ username: "", password: "", role: "scorer" });
      await loadAdmins();
    } catch (error) {
      notifyError(errorMessage(error, "Could not create the account"));
    } finally {
      setSaving(false);
    }
  };

  const updateAdmin = async (
    id: string,
    patch: { role?: AdminRole; isActive?: boolean }
  ) => {
    try {
      const response = await api.patch(`/admin/${id}`, patch);
      const updated = response.data?.data as AdminAccount;
      setAdmins((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      notifySuccess("Account updated");
    } catch (error) {
      notifyError(errorMessage(error, "Could not update the account"));
      await loadAdmins();
    }
  };

  const handleReset = async () => {
    if (!resetTarget) return;
    if (resetPassword.length < 6) {
      notifyError("Password must be at least 6 characters");
      return;
    }
    setResetting(true);
    try {
      await api.post(`/admin/${resetTarget.id}/reset-password`, {
        newPassword: resetPassword,
      });
      notifySuccess(`Password reset for "${resetTarget.username}"`);
      setResetTarget(null);
      setResetPassword("");
    } catch (error) {
      notifyError(errorMessage(error, "Could not reset the password"));
    } finally {
      setResetting(false);
    }
  };

  const handleDelete = async (account: AdminAccount) => {
    if (
      !window.confirm(
        `Delete the account "${account.username}"? This cannot be undone.`
      )
    ) {
      return;
    }
    try {
      await api.delete(`/admin/${account.id}`);
      setAdmins((prev) => prev.filter((item) => item.id !== account.id));
      notifySuccess(`Deleted "${account.username}"`);
    } catch (error) {
      notifyError(errorMessage(error, "Could not delete the account"));
    }
  };

  if (!ready || !isAdmin) {
    return (
      <div className="py-20 text-center text-sm text-[var(--adm-muted)]">
        Checking permissions…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ToastContainer />
      <PageHeader
        title="Admins & Roles"
        description="Manage who can sign in and what each account is allowed to do"
        actions={
          <Button variant="outline" size="sm" onClick={loadAdmins}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      <Card>
        <CardContent>
          <form
            onSubmit={handleCreate}
            className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end"
          >
            <div className="w-full sm:w-48">
              <label className="mb-1 block text-xs font-medium text-[var(--adm-muted)]">
                Username
              </label>
              <Input
                value={form.username}
                autoComplete="off"
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, username: event.target.value }))
                }
                placeholder="e.g. scorer1"
              />
            </div>
            <div className="w-full sm:w-48">
              <label className="mb-1 block text-xs font-medium text-[var(--adm-muted)]">
                Password
              </label>
              <Input
                type="password"
                autoComplete="new-password"
                value={form.password}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, password: event.target.value }))
                }
                placeholder="min 6 characters"
              />
            </div>
            <div className="w-full sm:w-48">
              <label className="mb-1 block text-xs font-medium text-[var(--adm-muted)]">
                Role
              </label>
              <Select
                value={form.role}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    role: event.target.value as AdminRole,
                  }))
                }
              >
                {ADMIN_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {ROLE_LABELS[role]}
                  </option>
                ))}
              </Select>
            </div>
            <Button type="submit" disabled={saving}>
              <Plus className="h-4 w-4" />
              {saving ? "Creating..." : "Add account"}
            </Button>
          </form>
          <p className="mt-2 text-xs text-[var(--adm-muted)]">
            {ROLE_HINT[form.role]}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                <TH>Username</TH>
                <TH className="w-40">Role</TH>
                <TH className="w-28">Status</TH>
                <TH className="w-56">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {loading ? (
                <TR>
                  <TD colSpan={4} className="py-8 text-center text-[var(--adm-muted)]">
                    Loading accounts…
                  </TD>
                </TR>
              ) : admins.length === 0 ? (
                <TR>
                  <TD colSpan={4} className="py-8 text-center text-[var(--adm-muted)]">
                    No admin accounts yet.
                  </TD>
                </TR>
              ) : (
                admins.map((account) => (
                  <TR key={account.id}>
                    <TD className="font-medium">
                      <span className="inline-flex items-center gap-2">
                        <UserCog className="h-4 w-4 text-[var(--adm-muted)]" />
                        {account.username}
                      </span>
                    </TD>
                    <TD>
                      <div className="flex items-center gap-2">
                        <Select
                          className="h-8 w-28 text-xs"
                          value={account.role}
                          onChange={(event) =>
                            updateAdmin(account.id, {
                              role: event.target.value as AdminRole,
                            })
                          }
                        >
                          {ADMIN_ROLES.map((role) => (
                            <option key={role} value={role}>
                              {ROLE_LABELS[role]}
                            </option>
                          ))}
                        </Select>
                        <Badge variant={roleVariant(account.role)}>
                          {ROLE_LABELS[account.role]}
                        </Badge>
                      </div>
                    </TD>
                    <TD>
                      <button
                        type="button"
                        onClick={() =>
                          updateAdmin(account.id, {
                            isActive: !account.isActive,
                          })
                        }
                        title="Toggle active"
                      >
                        <Badge variant={account.isActive ? "success" : "muted"}>
                          {account.isActive ? "Active" : "Disabled"}
                        </Badge>
                      </button>
                    </TD>
                    <TD>
                      <div className="flex flex-wrap gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setResetTarget(account);
                            setResetPassword("");
                          }}
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                          Reset
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-red-500"
                          onClick={() => handleDelete(account)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </div>
                    </TD>
                  </TR>
                ))
              )}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <Modal
        open={Boolean(resetTarget)}
        onClose={() => setResetTarget(null)}
        title={`Reset password${resetTarget ? ` — ${resetTarget.username}` : ""}`}
        footer={
          <>
            <Button variant="outline" onClick={() => setResetTarget(null)}>
              Cancel
            </Button>
            <Button onClick={handleReset} disabled={resetting}>
              {resetting ? "Saving..." : "Set password"}
            </Button>
          </>
        }
      >
        <label className="mb-1 block text-xs font-medium text-[var(--adm-muted)]">
          New password (min 6 characters)
        </label>
        <Input
          type="password"
          autoComplete="new-password"
          value={resetPassword}
          onChange={(event) => setResetPassword(event.target.value)}
          placeholder="New password"
        />
      </Modal>
    </div>
  );
}

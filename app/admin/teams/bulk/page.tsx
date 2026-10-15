"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import { ClipboardPaste, Upload } from "lucide-react";
import { api } from "@/lib/api";
import { useTeams } from "@/hooks/useTeams";
import {
  parseTeamList,
  STATUS_LABEL,
  type ParsedTeamStatus,
} from "@/lib/parseTeamList";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EmptyState } from "@/components/ui/empty-state";
import {
  notifyError,
  notifySuccess,
  ToastContainer,
} from "@/utils/ToastifyNotification";

const STATUS_VARIANT: Record<
  ParsedTeamStatus,
  "success" | "info" | "muted" | "danger" | "warning"
> = {
  new: "success",
  update: "info",
  unchanged: "muted",
  conflict: "danger",
  duplicate: "warning",
  invalid: "danger",
};

const PLACEHOLDER = `Paste your slot list here, e.g.

➟ 𝐓𝐈𝐌𝐄 : 08:40 PM
➟ 𝐌𝐀𝐏 : 𝐄 | 𝐌 | E | R
SLOT 03 TNS
SLOT 04 13R
SLOT 05 UNC
...

The time/map header lines are ignored.`;

export default function BulkImportPage() {
  const router = useRouter();
  const { teams, refresh } = useTeams();
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const rows = useMemo(
    () =>
      parseTeamList(
        text,
        teams.map((team) => ({ slot: team.slot, name: team.name }))
      ),
    [text, teams]
  );

  const counts = useMemo(() => {
    const base: Record<ParsedTeamStatus, number> = {
      new: 0,
      update: 0,
      unchanged: 0,
      conflict: 0,
      duplicate: 0,
      invalid: 0,
    };
    for (const row of rows) base[row.status] += 1;
    return base;
  }, [rows]);

  const importable = rows.filter(
    (row) => row.status === "new" || row.status === "update"
  );

  const handleImport = async () => {
    if (importable.length === 0) {
      return notifyError("Nothing to import");
    }
    setSubmitting(true);
    try {
      const response = await api.post("/team/bulk", {
        teams: importable.map((row) => ({ slot: row.slot, name: row.name })),
      });
      const summary = response.data?.data?.summary;
      notifySuccess(
        `Imported: ${summary?.created ?? 0} created, ${
          summary?.updated ?? 0
        } updated${summary?.skipped ? `, ${summary.skipped} skipped` : ""}`
      );
      await refresh();
      setText("");
      router.push("/admin/teams");
    } catch (error) {
      const message = isAxiosError(error)
        ? (error.response?.data?.message as string | undefined)
        : undefined;
      notifyError(message || "Bulk import failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <ToastContainer />
      <PageHeader
        title="Bulk Import"
        description="Paste a slot list to create or rename teams in one go"
        actions={
          <Button
            size="sm"
            onClick={handleImport}
            disabled={submitting || importable.length === 0}
          >
            <Upload className="h-4 w-4" />
            {submitting ? "Importing..." : `Import ${importable.length || ""}`.trim()}
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardPaste className="h-4 w-4 text-[var(--adm-primary)]" />
              Paste list
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder={PLACEHOLDER}
              rows={16}
              spellCheck={false}
              className="font-mono text-xs leading-relaxed"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Preview</CardTitle>
            {rows.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {counts.new > 0 && (
                  <Badge variant="success">{counts.new} new</Badge>
                )}
                {counts.update > 0 && (
                  <Badge variant="info">{counts.update} update</Badge>
                )}
                {counts.unchanged > 0 && (
                  <Badge variant="muted">{counts.unchanged} same</Badge>
                )}
                {counts.conflict > 0 && (
                  <Badge variant="danger">{counts.conflict} conflict</Badge>
                )}
                {counts.duplicate > 0 && (
                  <Badge variant="warning">{counts.duplicate} dup</Badge>
                )}
                {counts.invalid > 0 && (
                  <Badge variant="danger">{counts.invalid} invalid</Badge>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent className="p-0">
            {rows.length === 0 ? (
              <EmptyState
                icon={ClipboardPaste}
                title="Nothing to preview"
                description="Paste your slot list on the left to see what will be imported."
              />
            ) : (
              <Table>
                <THead>
                  <TR className="hover:bg-transparent">
                    <TH className="w-14">Slot</TH>
                    <TH>Team</TH>
                    <TH className="w-24">Result</TH>
                    <TH>Note</TH>
                  </TR>
                </THead>
                <TBody>
                  {rows.map((row, index) => (
                    <TR key={`${row.raw}-${index}`}>
                      <TD className="font-semibold text-[var(--adm-muted)]">
                        {row.slot ?? "-"}
                      </TD>
                      <TD className="font-medium">{row.name || "—"}</TD>
                      <TD>
                        <Badge variant={STATUS_VARIANT[row.status]}>
                          {STATUS_LABEL[row.status]}
                        </Badge>
                      </TD>
                      <TD className="text-xs text-[var(--adm-muted)]">
                        {row.note ?? ""}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-[var(--adm-muted)]">
        New teams get a temporary placeholder logo — set real logos later via
        Edit. Existing slots are renamed but keep their logo, points and rounds.
      </p>
    </div>
  );
}

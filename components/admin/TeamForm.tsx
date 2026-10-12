"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { isAxiosError } from "axios";
import { ImagePlus } from "lucide-react";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { notifyError, notifySuccess } from "@/utils/ToastifyNotification";

export interface TeamFormInitial {
  name: string;
  slot: number;
  logo: string;
}

export default function TeamForm({
  mode,
  teamId,
  initial,
}: {
  mode: "create" | "edit";
  teamId?: string;
  initial?: TeamFormInitial;
}) {
  const router = useRouter();
  const [name, setName] = useState(initial?.name ?? "");
  const [slot, setSlot] = useState(initial ? String(initial.slot) : "");
  const [logo, setLogo] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(initial?.logo || null);
  const [submitting, setSubmitting] = useState(false);

  const handleFile = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setLogo(file);
    setPreview(URL.createObjectURL(file));
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return notifyError("Team name is required");
    if (!slot || Number(slot) < 1) return notifyError("Slot must be a positive number");
    if (mode === "create" && !logo) return notifyError("Team logo is required");

    setSubmitting(true);
    try {
      const payload = new FormData();
      payload.append("name", name.trim());
      payload.append("slot", slot);
      if (logo) payload.append("logo", logo);

      if (mode === "create") {
        await api.post("/team", payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        notifySuccess("Team created successfully");
      } else {
        await api.put(`/team/${teamId}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        notifySuccess("Team updated successfully");
      }
      router.push("/admin/teams");
    } catch (error) {
      const message = isAxiosError(error)
        ? (error.response?.data?.message as string | undefined)
        : undefined;
      notifyError(message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center gap-3">
            <label
              htmlFor="logo"
              className="group relative flex h-32 w-32 cursor-pointer items-center justify-center overflow-hidden rounded-full border-2 border-dashed border-[var(--adm-border)] bg-[var(--adm-surface-2)]"
            >
              {preview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={preview}
                  alt="Team logo preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex flex-col items-center gap-1 text-[var(--adm-muted)]">
                  <ImagePlus className="h-6 w-6" />
                  <span className="text-xs">Upload logo</span>
                </span>
              )}
              <input
                id="logo"
                type="file"
                accept="image/*"
                onChange={handleFile}
                className="hidden"
              />
            </label>
            <p className="text-xs text-[var(--adm-muted)]">
              {mode === "create"
                ? "PNG or JPG, square recommended"
                : "Leave empty to keep the current logo"}
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="name" className="text-sm font-medium">
              Team Name
            </label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter team name"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="slot" className="text-sm font-medium">
              Slot Number
            </label>
            <Input
              id="slot"
              type="number"
              min={1}
              value={slot}
              onChange={(e) => setSlot(e.target.value)}
              placeholder="Enter slot number"
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/admin/teams")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting
                ? "Saving..."
                : mode === "create"
                  ? "Create Team"
                  : "Save Changes"}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

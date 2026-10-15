"use client";

import { useEffect, useState } from "react";
import { isAxiosError } from "axios";
import { Image as ImageIcon, RotateCcw, Save } from "lucide-react";
import { api } from "@/lib/api";
import { useBranding } from "@/components/providers/BrandingProvider";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  notifyError,
  notifySuccess,
  ToastContainer,
} from "@/utils/ToastifyNotification";

const errorMessage = (error: unknown, fallback: string) =>
  (isAxiosError(error)
    ? (error.response?.data?.message as string | undefined)
    : undefined) || fallback;

function useObjectUrl(file: File | null) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    if (!file) {
      setUrl("");
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  return url;
}

export default function SystemBrandingPage() {
  const { branding, refresh } = useBranding();
  const [systemName, setSystemName] = useState(branding.systemName);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [faviconFile, setFaviconFile] = useState<File | null>(null);
  const [clearLogo, setClearLogo] = useState(false);
  const [clearFavicon, setClearFavicon] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setSystemName(branding.systemName);
  }, [branding.systemName]);

  const logoPreviewUrl = useObjectUrl(logoFile);
  const faviconPreviewUrl = useObjectUrl(faviconFile);

  const effectiveLogo = logoFile
    ? logoPreviewUrl
    : clearLogo
    ? ""
    : branding.logoUrl;
  const effectiveFavicon = faviconFile
    ? faviconPreviewUrl
    : clearFavicon
    ? ""
    : branding.faviconUrl;

  const handleSave = async () => {
    setSaving(true);
    try {
      const form = new FormData();
      form.append("systemName", systemName);
      if (logoFile) form.append("logo", logoFile);
      if (faviconFile) form.append("favicon", faviconFile);
      if (clearLogo) form.append("clearLogo", "true");
      if (clearFavicon) form.append("clearFavicon", "true");
      await api.put("/system/branding", form);
      await refresh();
      setLogoFile(null);
      setFaviconFile(null);
      setClearLogo(false);
      setClearFavicon(false);
      notifySuccess("Branding updated");
    } catch (error) {
      notifyError(errorMessage(error, "Could not save branding"));
    } finally {
      setSaving(false);
    }
  };

  const reset = () => {
    setSystemName(branding.systemName);
    setLogoFile(null);
    setFaviconFile(null);
    setClearLogo(false);
    setClearFavicon(false);
  };

  return (
    <div className="space-y-6">
      <ToastContainer />
      <PageHeader
        title="System Branding"
        description="Change the system name and the logo shown across the app and browser tab"
        actions={
          <>
            <Button size="sm" variant="outline" onClick={reset}>
              <RotateCcw className="h-4 w-4" />
              Reset
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? "Saving..." : "Save changes"}
            </Button>
          </>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>System name</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-sm">
            <label className="mb-1 block text-xs font-medium text-[var(--adm-muted)]">
              Displayed everywhere (sidebar, header, browser tab)
            </label>
            <Input
              value={systemName}
              maxLength={60}
              onChange={(event) => setSystemName(event.target.value)}
              placeholder="e.g. Tournament Control"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Logo</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-[var(--adm-border)] bg-[var(--adm-surface-2)]">
              {effectiveLogo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={effectiveLogo}
                  alt="Logo preview"
                  className="h-16 w-16 object-contain"
                />
              ) : (
                <ImageIcon className="h-8 w-8 text-[var(--adm-muted)]" />
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--adm-border)] px-3 py-2 text-sm hover:bg-[var(--adm-surface-2)]">
                <ImageIcon className="h-4 w-4" />
                Choose logo
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setLogoFile(file);
                    if (file) setClearLogo(false);
                    event.target.value = "";
                  }}
                />
              </label>
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 dark:text-red-400"
                onClick={() => {
                  setLogoFile(null);
                  setClearLogo(true);
                }}
              >
                Remove logo
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tab icon (favicon)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-[var(--adm-border)] bg-[var(--adm-surface-2)]">
              {effectiveFavicon ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={effectiveFavicon}
                  alt="Favicon preview"
                  className="h-10 w-10 object-contain"
                />
              ) : (
                <ImageIcon className="h-8 w-8 text-[var(--adm-muted)]" />
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-[var(--adm-border)] px-3 py-2 text-sm hover:bg-[var(--adm-surface-2)]">
                <ImageIcon className="h-4 w-4" />
                Choose favicon
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0] ?? null;
                    setFaviconFile(file);
                    if (file) setClearFavicon(false);
                    event.target.value = "";
                  }}
                />
              </label>
              <Button
                size="sm"
                variant="outline"
                className="text-red-600 dark:text-red-400"
                onClick={() => {
                  setFaviconFile(null);
                  setClearFavicon(true);
                }}
              >
                Remove favicon
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-[var(--adm-muted)]">
        PNG, JPEG, WEBP, SVG or ICO up to 4&nbsp;MB. If Cloudinary is not
        configured the image is stored inline so it stays available on every
        device.
      </p>
    </div>
  );
}

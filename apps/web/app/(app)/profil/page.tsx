"use client";

import { useEffect, useState } from "react";
import { useWorkforceStats, useUserSettings, useUpdateUserSettings } from "@/lib/hooks";
import { useAuth } from "@/lib/auth-store";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Badge,
  Label,
  Select,
  Spinner,
  PageHeader,
} from "@/components/ui";
import { cn } from "@aktensystem/ui";
import { formatDuration } from "@/lib/format";

/** Theme client-seitig anwenden (system folgt der OS-Einstellung). */
function applyTheme(theme: string) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const dark = theme === "dark" || (theme === "system" && window.matchMedia?.("(prefers-color-scheme: dark)").matches);
  root.classList.toggle("dark", dark);
}

export default function ProfilPage() {
  const user = useAuth((s) => s.user);
  const stats = useWorkforceStats("week");
  const { data: settings, isLoading } = useUserSettings();
  const update = useUpdateUserSettings();

  const membership = user?.memberships?.[0];
  const myHours = stats.data?.topActive?.find((t) => t.userId === user?.id)?.seconds ?? 0;
  const initials = (user?.globalName ?? user?.username ?? "?").slice(0, 2).toUpperCase();

  useEffect(() => {
    if (!settings?.theme) return;
    applyTheme(settings.theme);
    try {
      localStorage.setItem("theme", settings.theme);
    } catch {
      /* ignore */
    }
  }, [settings?.theme]);

  function setTheme(theme: string) {
    applyTheme(theme);
    try {
      localStorage.setItem("theme", theme);
    } catch {
      /* localStorage nicht verfügbar — ignorieren */
    }
    update.mutate({ theme });
  }
  function toggle(key: "notifyDispatch" | "notifyChat", value: boolean) {
    update.mutate({ [key]: value });
  }

  if (!user) return <Card><CardBody className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner /> Lädt…</CardBody></Card>;

  return (
    <div>
      <PageHeader title="Mein Profil" subtitle="Identität, Dienstzeit und Einstellungen" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[300px_1fr]">
        {/* Identität */}
        <div className="space-y-4">
          <Card>
            <CardBody className="space-y-3 text-center">
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                {initials}
              </div>
              <div>
                <div className="text-lg font-semibold">{user.globalName ?? user.username}</div>
                {user.isPlatformAdmin && <Badge tone="purple">Plattform-Admin</Badge>}
              </div>
              <dl className="space-y-1 text-left text-sm text-muted-foreground">
                <Row k="Fraktion" v={membership?.faction?.shortName ?? "—"} />
                <Row k="Rang" v={membership?.rank?.name ?? "—"} />
                <Row k="Rufzeichen" v={membership?.callsign ?? "—"} />
                <Row k="Freigabe" v={user.clearance} />
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="grid grid-cols-2 gap-3 text-center">
              <div>
                <div className="text-2xl font-semibold">{formatDuration(myHours)}</div>
                <div className="text-xs text-muted-foreground">Dienst (Woche)</div>
              </div>
              <div>
                <div className="text-2xl font-semibold">{(user.memberships ?? []).length}</div>
                <div className="text-xs text-muted-foreground">Mitgliedschaften</div>
              </div>
            </CardBody>
          </Card>
        </div>

        {/* Einstellungen */}
        <Card>
          <CardHeader><CardTitle>Einstellungen</CardTitle></CardHeader>
          <CardBody className="space-y-5">
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner /> Lädt…</div>
            ) : (
              <>
                <div>
                  <Label>Erscheinungsbild</Label>
                  <Select value={settings?.theme ?? "system"} onChange={(e) => setTheme(e.target.value)} className="max-w-xs">
                    <option value="system">System</option>
                    <option value="dark">Dunkel</option>
                    <option value="light">Hell</option>
                  </Select>
                </div>

                <ToggleRow
                  label="Dispatch-Benachrichtigungen"
                  hint="Alarme & Einsatzhinweise"
                  checked={settings?.notifyDispatch ?? true}
                  onChange={(v) => toggle("notifyDispatch", v)}
                />
                <ToggleRow
                  label="Chat-Benachrichtigungen"
                  hint="Neue LEO-Chat-Nachrichten"
                  checked={settings?.notifyChat ?? true}
                  onChange={(v) => toggle("notifyChat", v)}
                />

                {update.isPending && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Spinner /> Speichert…</div>}
              </>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt>{k}</dt>
      <dd className="text-foreground">{v}</dd>
    </div>
  );
}

function ToggleRow({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={cn("relative h-6 w-11 rounded-full transition-colors", checked ? "bg-primary" : "bg-muted")}
      >
        <span className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform", checked ? "translate-x-5" : "translate-x-0.5")} />
      </button>
    </label>
  );
}

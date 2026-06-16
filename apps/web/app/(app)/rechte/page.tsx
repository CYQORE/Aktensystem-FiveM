"use client";

import { useEffect, useState } from "react";
import { useAdminFactions, useFactionRanks, useSetRankGrants } from "@/lib/hooks";
import { useAuth } from "@/lib/auth-store";
import type { AdminRank, RankGrant } from "@/lib/types";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Badge,
  Select,
  Skeleton,
  EmptyState,
  ErrorState,
  PageHeader,
} from "@/components/ui";
import { cn } from "@aktensystem/ui";

// Zuweisbare Subjekte (lesbare Labels) und Kern-Aktionen.
const SUBJECTS: { key: string; label: string }[] = [
  { key: "Citizen", label: "Bürger" },
  { key: "Vehicle", label: "Fahrzeuge" },
  { key: "CaseFile", label: "Akten" },
  { key: "Document", label: "Dokumente" },
  { key: "EvidenceItem", label: "Beweismittel" },
  { key: "CourtCase", label: "Gericht" },
  { key: "PenalCode", label: "Strafkatalog" },
  { key: "Warrant", label: "Haftbefehle" },
  { key: "Bolo", label: "Fahndungen" },
  { key: "Fine", label: "Bußgelder" },
  { key: "Inmate", label: "Strafvollzug" },
  { key: "DispatchCall", label: "Dispatch" },
  { key: "Unit", label: "Einheiten" },
  { key: "RadioChannel", label: "Funk" },
  { key: "Tag", label: "Tags" },
  { key: "PlatformModule", label: "Module" },
];
const ACTIONS: { key: string; label: string }[] = [
  { key: "read", label: "Lesen" },
  { key: "create", label: "Anlegen" },
  { key: "update", label: "Ändern" },
  { key: "delete", label: "Löschen" },
];
const k = (action: string, subject: string) => `${action}:${subject}`;

export default function RechtePage() {
  const isAdmin = useAuth((s) => s.user?.isPlatformAdmin ?? false);
  const { data: factions, isLoading, error } = useAdminFactions();
  const [factionId, setFactionId] = useState("");

  useEffect(() => {
    if (!factionId && factions && factions.length > 0) setFactionId(factions[0].id);
  }, [factions, factionId]);

  if (!isAdmin) {
    return (
      <div>
        <PageHeader title="Rollen & Rechte" />
        <EmptyState title="Nur für Plattform-Admins" hint="Rechteverwaltung ist Admins vorbehalten." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Rollen & Rechte" subtitle="Berechtigungen pro Fraktion und Rang verteilen" />

      {isLoading ? (
        <Skeleton className="h-10 w-64" />
      ) : error ? (
        <ErrorState error={error} />
      ) : !factions || factions.length === 0 ? (
        <EmptyState title="Keine Fraktionen" />
      ) : (
        <>
          <div className="mb-4 max-w-xs">
            <Select value={factionId} onChange={(e) => setFactionId(e.target.value)}>
              {factions.map((f) => (
                <option key={f.id} value={f.id}>{f.shortName} · {f.name}</option>
              ))}
            </Select>
          </div>
          {factionId && <RankList factionId={factionId} />}
        </>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        Vergebene Rechte gelten zusätzlich zu den Basisrechten und werden jedem Mitglied dieses Rangs gewährt.
        „Voll-Admin" gibt alle Rechte (verantwortungsvoll vergeben).
      </p>
    </div>
  );
}

function RankList({ factionId }: { factionId: string }) {
  const { data: ranks, isLoading, error } = useFactionRanks(factionId);
  if (isLoading) return <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-40" />)}</div>;
  if (error) return <ErrorState error={error} />;
  if (!ranks || ranks.length === 0) return <EmptyState title="Keine Ränge" hint="Diese Fraktion hat keine Ränge." />;
  return (
    <div className="space-y-4">
      {ranks.map((r) => <RankEditor key={r.id} factionId={factionId} rank={r} />)}
    </div>
  );
}

function RankEditor({ factionId, rank }: { factionId: string; rank: AdminRank }) {
  const save = useSetRankGrants(factionId);
  const initial = new Set((rank.grants ?? []).map((g) => k(g.action, g.subject)));
  const [sel, setSel] = useState<Set<string>>(initial);
  // Nach Refetch (z. B. anderer Admin speichert) lokalen Stand mit Server abgleichen.
  const initialKey = [...initial].sort().join(",");
  useEffect(() => {
    setSel(new Set((rank.grants ?? []).map((g) => k(g.action, g.subject))));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialKey]);
  const fullAdmin = sel.has(k("manage", "all"));
  // Änderungserkennung
  const dirty = sel.size !== initial.size || [...sel].some((x) => !initial.has(x));

  function toggle(key: string) {
    setSel((s) => {
      const n = new Set(s);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });
  }
  function setAdmin(on: boolean) {
    setSel(on ? new Set([k("manage", "all")]) : new Set());
  }
  function persist() {
    const grants: RankGrant[] = [...sel].map((key) => {
      const [action, subject] = key.split(":");
      return { action, subject };
    });
    save.mutate({ rankId: rank.id, grants });
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          {rank.name} <Badge tone="gray">Lvl {rank.level}</Badge>
        </CardTitle>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-1.5 text-sm">
            <input type="checkbox" checked={fullAdmin} onChange={(e) => setAdmin(e.target.checked)} />
            Voll-Admin
          </label>
          <Button size="sm" onClick={persist} disabled={!dirty || save.isPending}>
            {save.isPending ? "Speichert…" : "Speichern"}
          </Button>
        </div>
      </CardHeader>
      <CardBody>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="px-2 py-1.5">Bereich</th>
                {ACTIONS.map((a) => <th key={a.key} className="px-2 py-1.5 text-center">{a.label}</th>)}
              </tr>
            </thead>
            <tbody>
              {SUBJECTS.map((s) => (
                <tr key={s.key} className="border-t border-border">
                  <td className="px-2 py-1.5">{s.label}</td>
                  {ACTIONS.map((a) => {
                    const key = k(a.key, s.key);
                    return (
                      <td key={a.key} className="px-2 py-1.5 text-center">
                        <input
                          type="checkbox"
                          disabled={fullAdmin}
                          checked={fullAdmin || sel.has(key)}
                          onChange={() => toggle(key)}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {fullAdmin && <p className={cn("mt-2 text-xs text-amber-500")}>Voll-Admin aktiv — alle Rechte gewährt.</p>}
      </CardBody>
    </Card>
  );
}

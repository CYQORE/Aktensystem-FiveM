"use client";

import { useState, useMemo } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Button,
  Table,
  THead,
  TR,
  TH,
  TD,
  Skeleton,
  EmptyState,
  ErrorState,
  PageHeader,
  Badge,
} from "@/components/ui";
import { useWorkforceStats } from "@/lib/hooks";
import { formatDuration } from "@/lib/format";
import type { WorkforceStats } from "@/lib/types";

type Period = "week" | "month" | "year";

const PERIODS: { value: Period; label: string }[] = [
  { value: "week", label: "Woche" },
  { value: "month", label: "Monat" },
  { value: "year", label: "Jahr" },
];

function PeriodSwitcher({
  period,
  onChange,
}: {
  period: Period;
  onChange: (p: Period) => void;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border border-border p-1">
      {PERIODS.map((p) => (
        <Button
          key={p.value}
          size="sm"
          variant={period === p.value ? "primary" : "ghost"}
          onClick={() => onChange(p.value)}
        >
          {p.label}
        </Button>
      ))}
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string }) {
  return (
    <Card>
      <CardBody>
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="mt-2 text-2xl font-semibold tabular-nums">{value}</p>
      </CardBody>
    </Card>
  );
}

function MiniBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
    </div>
  );
}

function short(id: string, len = 8): string {
  if (!id) return "—";
  return id.length > len ? id.slice(0, len) : id;
}

export default function WorkforcePage() {
  const [period, setPeriod] = useState<Period>("week");
  const { data, isLoading, error } = useWorkforceStats(period);

  const stats = data as WorkforceStats | undefined;

  const maxUserSeconds = useMemo(
    () => Math.max(0, ...(stats?.topActive ?? []).map((u) => u.seconds)),
    [stats]
  );
  const maxFactionSeconds = useMemo(
    () => Math.max(0, ...(stats?.perFaction ?? []).map((f) => f.seconds)),
    [stats]
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dienstzeit"
        subtitle="Statistik der erfassten Dienststunden nach Zeitraum"
        actions={<PeriodSwitcher period={period} onChange={setPeriod} />}
      />

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      ) : error ? (
        <ErrorState error={error} />
      ) : !stats ||
        ((stats.topActive?.length ?? 0) === 0 &&
          (stats.perFaction?.length ?? 0) === 0 &&
          (stats.totalSeconds ?? 0) === 0) ? (
        <EmptyState
          title="Keine Dienstzeiten erfasst"
          hint="Für den gewählten Zeitraum liegen noch keine Daten vor."
        />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <KpiCard
              label="Gesamtstunden"
              value={formatDuration(stats.totalSeconds ?? 0)}
            />
            <KpiCard
              label="Schnitt / Mitarbeiter"
              value={formatDuration(stats.avgSecondsPerUser ?? 0)}
            />
            <KpiCard
              label="Anzahl Mitarbeiter"
              value={String(stats.topActive?.length ?? 0)}
            />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top aktive Mitarbeiter</CardTitle>
            </CardHeader>
            <CardBody>
              {(stats.topActive?.length ?? 0) === 0 ? (
                <EmptyState
                  title="Keine aktiven Mitarbeiter"
                  hint="Im gewählten Zeitraum wurde keine Dienstzeit erfasst."
                />
              ) : (
                <Table>
                  <THead>
                    <TR>
                      <TH>#</TH>
                      <TH>Mitarbeiter</TH>
                      <TH>Dienstzeit</TH>
                      <TH>Auslastung</TH>
                    </TR>
                  </THead>
                  <tbody>
                    {stats.topActive!.map((u, i) => (
                      <TR key={u.userId}>
                        <TD>
                          <Badge tone={i === 0 ? "amber" : "gray"}>{i + 1}</Badge>
                        </TD>
                        <TD className="font-mono text-sm">{short(u.userId)}</TD>
                        <TD className="tabular-nums">{formatDuration(u.seconds)}</TD>
                        <TD className="w-1/3 min-w-[120px]">
                          <MiniBar value={u.seconds} max={maxUserSeconds} />
                        </TD>
                      </TR>
                    ))}
                  </tbody>
                </Table>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dienststunden pro Fraktion</CardTitle>
            </CardHeader>
            <CardBody>
              {(stats.perFaction?.length ?? 0) === 0 ? (
                <EmptyState
                  title="Keine Fraktionsdaten"
                  hint="Im gewählten Zeitraum wurden keiner Fraktion Dienststunden zugeordnet."
                />
              ) : (
                <Table>
                  <THead>
                    <TR>
                      <TH>Fraktion</TH>
                      <TH>Dienstzeit</TH>
                      <TH>Auslastung</TH>
                    </TR>
                  </THead>
                  <tbody>
                    {stats.perFaction!.map((f) => (
                      <TR key={f.factionId}>
                        <TD className="font-mono text-sm">{short(f.factionId)}</TD>
                        <TD className="tabular-nums">{formatDuration(f.seconds)}</TD>
                        <TD className="w-1/2 min-w-[120px]">
                          <MiniBar value={f.seconds} max={maxFactionSeconds} />
                        </TD>
                      </TR>
                    ))}
                  </tbody>
                </Table>
              )}
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}

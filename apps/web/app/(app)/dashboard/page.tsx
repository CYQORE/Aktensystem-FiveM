"use client";

import { useMemo } from "react";
import {
  useDispatchCalls,
  useUnits,
  useCaseFiles,
  useWorkforceStats,
} from "@/lib/hooks";
import type {
  DispatchCall,
  Unit,
  CaseFile,
  WorkforceStats,
} from "@/lib/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Badge,
  Table,
  THead,
  TR,
  TH,
  TD,
  Spinner,
  Skeleton,
  EmptyState,
  ErrorState,
  PageHeader,
} from "@/components/ui";
import { formatDuration, relativeTime } from "@/lib/format";

type BadgeTone = "default" | "blue" | "green" | "amber" | "red" | "purple" | "gray";

const PRIORITY_TONE: Record<string, BadgeTone> = {
  P1: "red",
  P2: "amber",
  P3: "blue",
  P4: "gray",
};

function KpiCard({
  label,
  value,
  badge,
  isLoading,
  error,
}: {
  label: string;
  value: string | number;
  badge: { text: string; tone: BadgeTone };
  isLoading: boolean;
  error?: unknown;
}) {
  return (
    <Card>
      <CardBody>
        <div className="flex items-start justify-between gap-2">
          <span className="text-sm font-medium text-muted-foreground">{label}</span>
          <Badge tone={badge.tone}>{badge.text}</Badge>
        </div>
        <div className="mt-3">
          {isLoading ? (
            <Skeleton className="h-9 w-20" />
          ) : error ? (
            <span className="text-2xl font-semibold text-red-500">—</span>
          ) : (
            <span className="text-3xl font-bold tabular-nums tracking-tight">{value}</span>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

export default function DashboardPage() {
  const calls = useDispatchCalls();
  const units = useUnits();
  const caseFiles = useCaseFiles();
  const stats = useWorkforceStats("week");

  const callsData = (calls.data ?? []) as DispatchCall[];
  const unitsData = (units.data ?? []) as Unit[];
  const caseFilesData = (caseFiles.data ?? []) as CaseFile[];
  const statsData = stats.data as WorkforceStats | undefined;

  const openCalls = useMemo(
    () => callsData.filter((c) => c.status !== "ABGESCHLOSSEN").length,
    [callsData],
  );

  const activeUnits = useMemo(
    () => unitsData.filter((u) => u.status !== "AUSSER_DIENST").length,
    [unitsData],
  );

  const recentCalls = useMemo(
    () => callsData.slice(0, 5),
    [callsData],
  );

  const topActive = useMemo(
    () => statsData?.topActive ?? [],
    [statsData],
  );

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" subtitle="Live-Lage & Kennzahlen" />

      {/* KPI-Karten */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard
          label="Offene Einsätze"
          value={openCalls}
          badge={{ text: "Dispatch", tone: "red" }}
          isLoading={calls.isLoading}
          error={calls.error}
        />
        <KpiCard
          label="Aktive Einheiten"
          value={activeUnits}
          badge={{ text: "Im Dienst", tone: "green" }}
          isLoading={units.isLoading}
          error={units.error}
        />
        <KpiCard
          label="Akten"
          value={caseFilesData.length}
          badge={{ text: "Gesamt", tone: "blue" }}
          isLoading={caseFiles.isLoading}
          error={caseFiles.error}
        />
        <KpiCard
          label="Dienststunden (Woche)"
          value={statsData ? formatDuration(statsData.totalSeconds) : "—"}
          badge={{ text: "Woche", tone: "purple" }}
          isLoading={stats.isLoading}
          error={stats.error}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Aktuelle Einsätze */}
        <Card>
          <CardHeader>
            <CardTitle>Aktuelle Einsätze</CardTitle>
          </CardHeader>
          <CardBody>
            {calls.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : calls.error ? (
              <ErrorState error={calls.error} />
            ) : recentCalls.length === 0 ? (
              <EmptyState title="Keine Einsätze" hint="Aktuell sind keine Einsätze erfasst." />
            ) : (
              <ul className="divide-y divide-border">
                {recentCalls.map((call) => (
                  <li
                    key={call.id}
                    className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <Badge tone={PRIORITY_TONE[call.priority] ?? "gray"}>
                      {call.priority}
                    </Badge>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{call.category}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {call.location}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {relativeTime(call.createdAt)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        {/* Top aktive Mitarbeiter */}
        <Card>
          <CardHeader>
            <CardTitle>Top aktive Mitarbeiter</CardTitle>
          </CardHeader>
          <CardBody>
            {stats.isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Spinner />
              </div>
            ) : stats.error ? (
              <ErrorState error={stats.error} />
            ) : topActive.length === 0 ? (
              <EmptyState title="Keine Daten" hint="Für diese Woche liegen keine Werte vor." />
            ) : (
              <Table>
                <THead>
                  <TR>
                    <TH>Mitarbeiter</TH>
                    <TH>Dienstzeit</TH>
                  </TR>
                </THead>
                <tbody>
                  {topActive.map((entry) => (
                    <TR key={entry.userId}>
                      <TD>
                        <span className="font-mono text-xs">
                          {entry.userId.slice(0, 8)}
                        </span>
                      </TD>
                      <TD>
                        <span className="tabular-nums">
                          {formatDuration(entry.seconds)}
                        </span>
                      </TD>
                    </TR>
                  ))}
                </tbody>
              </Table>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

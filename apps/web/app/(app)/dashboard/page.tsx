"use client";

import { useMemo } from "react";
import Link from "next/link";
import {
  useDispatchCalls,
  useUnits,
  useWorkforceStats,
  useDashboardStats,
} from "@/lib/hooks";
import type {
  DispatchCall,
  Unit,
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
  const stats = useWorkforceStats("week");
  const ds = useDashboardStats();

  const callsData = (calls.data ?? []) as DispatchCall[];
  const statsData = stats.data as WorkforceStats | undefined;
  const d = ds.data;

  const recentCalls = useMemo(() => callsData.slice(0, 5), [callsData]);
  const topActive = useMemo(() => statsData?.topActive ?? [], [statsData]);

  const kpis: { label: string; value: number; tone: BadgeTone; text: string; href: string }[] = [
    { label: "Offene Einsätze", value: d?.openCalls ?? 0, tone: "red", text: "Dispatch", href: "/dispatch" },
    { label: "Einheiten im Dienst", value: d?.activeUnits ?? 0, tone: "green", text: "Live", href: "/units" },
    { label: "Aktive Haftbefehle", value: d?.activeWarrants ?? 0, tone: "amber", text: "Fahndung", href: "/haftbefehle" },
    { label: "Fahndungen (BOLO)", value: d?.activeBolos ?? 0, tone: "amber", text: "BOLO", href: "/fahndung" },
    { label: "Offene Bußgelder", value: d?.unpaidFines ?? 0, tone: "amber", text: "Forderung", href: "/bussgelder" },
    { label: "In Haft", value: d?.activeInmates ?? 0, tone: "purple", text: "Vollzug", href: "/strafvollzug" },
    { label: "Bürger", value: d?.citizens ?? 0, tone: "blue", text: "Register", href: "/citizens" },
    { label: "Akten", value: d?.caseFiles ?? 0, tone: "blue", text: "Gesamt", href: "/case-files" },
  ];

  return (
    <div className="space-y-8">
      <PageHeader title="Dashboard" subtitle="Live-Lage & Kennzahlen" />

      {/* KPI-Karten (Aggregat in einem Request) */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {kpis.map((k) => (
          <Link key={k.label} href={k.href} className="transition-transform hover:-translate-y-0.5">
            <KpiCard
              label={k.label}
              value={k.value}
              badge={{ text: k.text, tone: k.tone }}
              isLoading={ds.isLoading}
              error={ds.error}
            />
          </Link>
        ))}
      </div>

      {/* Dienststunden-Leiste */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <KpiCard
          label="Dienststunden (Woche, gesamt)"
          value={statsData ? formatDuration(statsData.totalSeconds) : "—"}
          badge={{ text: "Woche", tone: "purple" }}
          isLoading={stats.isLoading}
          error={stats.error}
        />
        <KpiCard
          label="Ø Dienstzeit je Mitarbeiter"
          value={statsData ? formatDuration(statsData.avgSecondsPerUser) : "—"}
          badge={{ text: "Schnitt", tone: "gray" }}
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

"use client";

import { useMemo } from "react";
import { useUnits, useSetUnitStatus } from "@/lib/hooks";
import { useSocket } from "@/lib/ws";
import type { Unit } from "@/lib/types";
import { relativeTime } from "@/lib/format";
import {
  Badge,
  Card,
  CardBody,
  EmptyState,
  ErrorState,
  PageHeader,
  Select,
  Skeleton,
  StatusDot,
  Table,
  TD,
  TH,
  THead,
  TR,
} from "@/components/ui";

/** Alle Status-Werte (UnitStatus) für die Inline-Auswahl. */
const UNIT_STATUSES = [
  "FREI",
  "STREIFE",
  "VERKEHRSKONTROLLE",
  "EINSATZ",
  "VERFOLGUNG",
  "KRANKENHAUS",
  "PAUSE",
  "AUSSER_DIENST",
] as const;

type StatusTone =
  | "default"
  | "blue"
  | "green"
  | "amber"
  | "red"
  | "purple"
  | "gray";

/** Mappt einen UnitStatus auf den StatusDot-/Badge-Ton. */
function statusTone(status: string): StatusTone {
  switch (status) {
    case "FREI":
      return "green";
    case "EINSATZ":
    case "VERFOLGUNG":
      return "red";
    case "STREIFE":
    case "VERKEHRSKONTROLLE":
      return "blue";
    case "PAUSE":
    case "KRANKENHAUS":
      return "amber";
    case "AUSSER_DIENST":
      return "gray";
    default:
      return "default";
  }
}

/** Lesbares Label für einen UnitStatus. */
function statusLabel(status: string): string {
  return status.replace(/_/g, " ");
}

/** Standort: lesbare Zone bevorzugt, sonst gerundete Koordinaten. */
function formatPosition(u: Unit): string {
  if (u.zone) return u.zone;
  if (u.x == null || u.y == null) return "—";
  return `${Math.round(u.x)}, ${Math.round(u.y)}`;
}

/** Kennzahl-Kachel für die Kopfzeile. */
function StatPill({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: StatusTone;
}) {
  return (
    <Card>
      <CardBody className="flex items-center gap-3 py-3">
        <StatusDot tone={tone} />
        <div className="flex flex-col">
          <span className="text-2xl font-semibold tabular-nums leading-none">
            {value}
          </span>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      </CardBody>
    </Card>
  );
}

export default function UnitsPage() {
  const { data, isLoading, error, refetch } = useUnits();
  const setStatus = useSetUnitStatus();

  // Live-Updates: bei Status-/Positionsänderung neu laden.
  useSocket({
    "unit:status": () => refetch(),
    "unit:position": () => refetch(),
  });

  const units = (data ?? []) as Unit[];

  const counters = useMemo(() => {
    const total = units.length;
    const onDuty = units.filter((u) => u.status !== "AUSSER_DIENST").length;
    const onMission = units.filter(
      (u) => u.status === "EINSATZ" || u.status === "VERFOLGUNG"
    ).length;
    return { total, onDuty, onMission };
  }, [units]);

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Leitstellenblatt" subtitle="Aktive Kräfte live" />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatPill label="Gesamt" value={counters.total} tone="default" />
        <StatPill label="Im Dienst" value={counters.onDuty} tone="green" />
        <StatPill label="Im Einsatz" value={counters.onMission} tone="red" />
      </div>

      <Card>
        <CardBody className="p-0">
          {isLoading ? (
            <div className="flex flex-col gap-2 p-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="p-4">
              <ErrorState error={error} />
            </div>
          ) : units.length === 0 ? (
            <div className="p-4">
              <EmptyState
                title="Keine Einheiten im Dienst"
                hint="Sobald Kräfte sich anmelden, erscheinen sie hier live."
              />
            </div>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Rufname</TH>
                  <TH>Fraktion</TH>
                  <TH>Funkkanal</TH>
                  <TH>Sektor</TH>
                  <TH>Status</TH>
                  <TH>Position</TH>
                  <TH>Zuletzt</TH>
                </TR>
              </THead>
              <tbody>
                {units.map((u) => {
                  const tone = statusTone(u.status);
                  const color = u.faction?.color ?? undefined;
                  return (
                    <TR key={u.id}>
                      <TD className="font-medium">{u.callsign}</TD>
                      <TD>
                        {u.faction?.shortName ? (
                          <Badge
                            tone="gray"
                            style={
                              color ? { backgroundColor: color } : undefined
                            }
                          >
                            {u.faction.shortName}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TD>
                      <TD>
                        {u.channel ? (
                          <span className="tabular-nums">{u.channel}</span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TD>
                      <TD>
                        {u.sector ?? u.sectorId ?? (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TD>
                      <TD>
                        <div className="flex items-center gap-2">
                          <StatusDot tone={tone} />
                          <Select
                            value={u.status}
                            disabled={setStatus.isPending}
                            onChange={(e) =>
                              setStatus.mutate({
                                unitId: u.id,
                                status: e.target.value,
                              })
                            }
                          >
                            {UNIT_STATUSES.map((s) => (
                              <option key={s} value={s}>
                                {statusLabel(s)}
                              </option>
                            ))}
                          </Select>
                        </div>
                      </TD>
                      <TD className="tabular-nums">{formatPosition(u)}</TD>
                      <TD className="text-muted-foreground">
                        {u.lastSeenAt ? relativeTime(u.lastSeenAt) : "—"}
                      </TD>
                    </TR>
                  );
                })}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

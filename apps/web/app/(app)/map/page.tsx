"use client";

import { useState, useMemo } from "react";
import { useUnits } from "@/lib/hooks";
import { useSocket } from "@/lib/ws";
import type { Unit } from "@/lib/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Spinner,
  Skeleton,
  EmptyState,
  ErrorState,
  PageHeader,
  Badge,
  StatusDot,
} from "@/components/ui";

type UnitPosition = {
  callsign: string;
  x: number;
  y: number;
  heading: number;
  status: string;
};

// GTA V Welt-Koordinaten -> Prozent-Position auf der abstrakten Karte.
function toPct(x: number, y: number): { left: number; top: number } {
  const rawLeft = ((x + 4000) / 8500) * 100;
  const rawTop = ((8000 - y) / 12000) * 100;
  const clamp = (v: number) => Math.min(100, Math.max(0, v));
  return { left: clamp(rawLeft), top: clamp(rawTop) };
}

// Status -> Marker-Farbe (FREI grün, EINSATZ/VERFOLGUNG rot, sonst blau).
function statusColor(status: string): { dot: string; ring: string; tone: "green" | "red" | "blue" } {
  if (status === "FREI") return { dot: "#22c55e", ring: "rgba(34,197,94,0.35)", tone: "green" };
  if (status === "EINSATZ" || status === "VERFOLGUNG")
    return { dot: "#ef4444", ring: "rgba(239,68,68,0.35)", tone: "red" };
  return { dot: "#3b82f6", ring: "rgba(59,130,246,0.35)", tone: "blue" };
}

const LEGEND: { label: string; tone: "green" | "red" | "blue"; hint: string }[] = [
  { label: "Frei", tone: "green", hint: "FREI" },
  { label: "Im Einsatz", tone: "red", hint: "EINSATZ / VERFOLGUNG" },
  { label: "Sonstige", tone: "blue", hint: "Streife, Kontrolle, …" },
];

export default function MapPage() {
  const { data: units, isLoading, error } = useUnits();

  const [positions, setPositions] = useState<Record<string, UnitPosition>>({});
  const [initialized, setInitialized] = useState(false);

  // Initiale Positionen aus den Einheiten ableiten (nur mit Koordinaten).
  const initialPositions = useMemo(() => {
    const acc: Record<string, UnitPosition> = {};
    for (const u of (units ?? []) as Unit[]) {
      const anyU = u as unknown as { id: string; callsign?: string; x?: number; y?: number; heading?: number; status?: string };
      if (typeof anyU.x === "number" && typeof anyU.y === "number") {
        acc[anyU.id] = {
          callsign: anyU.callsign ?? anyU.id,
          x: anyU.x,
          y: anyU.y,
          heading: typeof anyU.heading === "number" ? anyU.heading : 0,
          status: anyU.status ?? "STREIFE",
        };
      }
    }
    return acc;
  }, [units]);

  if (units && !initialized) {
    setPositions(initialPositions);
    setInitialized(true);
  }

  // Live-Updates der Positionen via WebSocket.
  useSocket(
    {
      "unit:position": (payload: unknown) => {
        const p = payload as {
          unitId: string;
          callsign?: string;
          x: number;
          y: number;
          heading?: number;
          status?: string;
        };
        if (!p || typeof p.unitId !== "string") return;
        setPositions((prev) => ({
          ...prev,
          [p.unitId]: {
            callsign: p.callsign ?? prev[p.unitId]?.callsign ?? p.unitId,
            x: p.x,
            y: p.y,
            heading: typeof p.heading === "number" ? p.heading : prev[p.unitId]?.heading ?? 0,
            status: p.status ?? prev[p.unitId]?.status ?? "STREIFE",
          },
        }));
      },
      "unit:status": (payload: unknown) => {
        const p = payload as { unitId: string; status?: string };
        if (!p || typeof p.unitId !== "string" || !p.status) return;
        setPositions((prev) =>
          prev[p.unitId] ? { ...prev, [p.unitId]: { ...prev[p.unitId], status: p.status! } } : prev
        );
      },
    },
    ["global"]
  );

  const markers = useMemo(() => Object.entries(positions), [positions]);

  const gridBackground: React.CSSProperties = {
    backgroundColor: "#0a0e17",
    backgroundImage:
      "linear-gradient(rgba(148,163,184,0.10) 1px, transparent 1px)," +
      "linear-gradient(90deg, rgba(148,163,184,0.10) 1px, transparent 1px)," +
      "linear-gradient(rgba(148,163,184,0.04) 1px, transparent 1px)," +
      "linear-gradient(90deg, rgba(148,163,184,0.04) 1px, transparent 1px)",
    backgroundSize: "80px 80px, 80px 80px, 16px 16px, 16px 16px",
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Live-Karte" subtitle="Echtzeit-Positionen der Einheiten" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto]">
        {/* Karten-Panel */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>Stadtkarte · Los Santos</CardTitle>
            <Badge tone="gray">{markers.length} Einheiten</Badge>
          </CardHeader>
          <CardBody>
            {isLoading ? (
              <div className="relative min-h-[600px] w-full overflow-hidden rounded-lg" style={gridBackground}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Spinner />
                </div>
                <div className="absolute left-4 top-4 flex flex-col gap-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-28" />
                </div>
              </div>
            ) : error ? (
              <ErrorState error={error} />
            ) : markers.length === 0 ? (
              <div className="relative min-h-[600px] w-full overflow-hidden rounded-lg border border-border" style={gridBackground}>
                <div className="absolute inset-0 flex items-center justify-center">
                  <EmptyState title="Keine Positionsdaten" hint="Es sind derzeit keine Einheiten mit Koordinaten verfügbar." />
                </div>
              </div>
            ) : (
              <div
                className="relative min-h-[600px] w-full overflow-hidden rounded-lg border border-border aspect-[4/5]"
                style={gridBackground}
              >
                {markers.map(([unitId, pos]) => {
                  const { left, top } = toPct(pos.x, pos.y);
                  const c = statusColor(pos.status);
                  return (
                    <div
                      key={unitId}
                      className="absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-1.5"
                      style={{ left: `${left}%`, top: `${top}%` }}
                      title={`${pos.callsign} · ${pos.status}`}
                    >
                      {/* Heading-Pfeil */}
                      <span
                        className="absolute -top-3 left-1/2 -translate-x-1/2 text-[10px] leading-none"
                        style={{
                          transform: `translateX(-50%) rotate(${pos.heading}deg)`,
                          color: c.dot,
                        }}
                        aria-hidden
                      >
                        ▲
                      </span>
                      {/* Punkt */}
                      <span
                        className="block h-3 w-3 shrink-0 rounded-full ring-4"
                        style={{ backgroundColor: c.dot, boxShadow: `0 0 0 4px ${c.ring}` }}
                      />
                      {/* Rufname-Label */}
                      <span className="whitespace-nowrap rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-medium text-white">
                        {pos.callsign}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardBody>
        </Card>

        {/* Legende */}
        <Card className="lg:w-64">
          <CardHeader>
            <CardTitle>Legende</CardTitle>
          </CardHeader>
          <CardBody>
            <ul className="flex flex-col gap-3">
              {LEGEND.map((item) => (
                <li key={item.label} className="flex items-center gap-3">
                  <StatusDot tone={item.tone} />
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">{item.label}</span>
                    <span className="text-xs text-muted-foreground">{item.hint}</span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-6 border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">
                Positionen werden in Echtzeit über WebSocket aktualisiert. Der Heading-Pfeil zeigt die
                Blickrichtung der Einheit.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

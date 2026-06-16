"use client";

import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import { useUnits } from "@/lib/hooks";
import { useSocket } from "@/lib/ws";
import type { Unit } from "@/lib/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Spinner,
  ErrorState,
  PageHeader,
  Badge,
  StatusDot,
  Button,
} from "@/components/ui";

type UnitPosition = {
  callsign: string;
  x: number;
  y: number;
  heading: number;
  status: string;
};

// Welt-Grenzen der hinterlegten GTA-V-Karte (zum Kalibrieren anpassen).
const MAP = { MIN_X: -4000, MAX_X: 4500, MIN_Y: -4000, MAX_Y: 8000 };

function toPct(x: number, y: number): { left: number; top: number } {
  const rawLeft = ((x - MAP.MIN_X) / (MAP.MAX_X - MAP.MIN_X)) * 100;
  const rawTop = ((MAP.MAX_Y - y) / (MAP.MAX_Y - MAP.MIN_Y)) * 100;
  const clamp = (v: number) => Math.min(100, Math.max(0, v));
  return { left: clamp(rawLeft), top: clamp(rawTop) };
}

function statusColor(status: string): { dot: string; ring: string } {
  if (status === "FREI") return { dot: "#22c55e", ring: "rgba(34,197,94,0.35)" };
  if (status === "EINSATZ" || status === "VERFOLGUNG")
    return { dot: "#ef4444", ring: "rgba(239,68,68,0.35)" };
  return { dot: "#3b82f6", ring: "rgba(59,130,246,0.35)" };
}

const LEGEND: { label: string; tone: "green" | "red" | "blue"; hint: string }[] = [
  { label: "Frei", tone: "green", hint: "FREI" },
  { label: "Im Einsatz", tone: "red", hint: "EINSATZ / VERFOLGUNG" },
  { label: "Sonstige", tone: "blue", hint: "Streife, Kontrolle, …" },
];

const MIN_ZOOM = 1;
const MAX_ZOOM = 6;

export default function MapPage() {
  const { data: units, isLoading, error } = useUnits();

  const [positions, setPositions] = useState<Record<string, UnitPosition>>({});
  const [initialized, setInitialized] = useState(false);
  // Eigene Spielerposition (direkt aus der FiveM-NUI via postMessage)
  const [self, setSelf] = useState<{ x: number; y: number; heading: number } | null>(null);

  // Zoom + Pan
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const viewportRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ active: boolean; sx: number; sy: number; px: number; py: number }>({
    active: false, sx: 0, sy: 0, px: 0, py: 0,
  });

  const initialPositions = useMemo(() => {
    const acc: Record<string, UnitPosition> = {};
    for (const u of (units ?? []) as Unit[]) {
      const a = u as unknown as { id: string; callsign?: string; x?: number; y?: number; heading?: number; status?: string };
      if (typeof a.x === "number" && typeof a.y === "number") {
        acc[a.id] = {
          callsign: a.callsign ?? a.id, x: a.x, y: a.y,
          heading: typeof a.heading === "number" ? a.heading : 0,
          status: a.status ?? "STREIFE",
        };
      }
    }
    return acc;
  }, [units]);

  if (units && !initialized) {
    setPositions(initialPositions);
    setInitialized(true);
  }

  useSocket(
    {
      "unit:position": (payload: unknown) => {
        const p = payload as { unitId: string; callsign?: string; x: number; y: number; heading?: number; status?: string };
        if (!p || typeof p.unitId !== "string") return;
        setPositions((prev) => ({
          ...prev,
          [p.unitId]: {
            callsign: p.callsign ?? prev[p.unitId]?.callsign ?? p.unitId,
            x: p.x, y: p.y,
            heading: typeof p.heading === "number" ? p.heading : prev[p.unitId]?.heading ?? 0,
            status: p.status ?? prev[p.unitId]?.status ?? "STREIFE",
          },
        }));
      },
      "unit:status": (payload: unknown) => {
        const p = payload as { unitId: string; status?: string };
        if (!p || typeof p.unitId !== "string" || !p.status) return;
        setPositions((prev) => (prev[p.unitId] ? { ...prev, [p.unitId]: { ...prev[p.unitId], status: p.status! } } : prev));
      },
    },
    ["global"]
  );

  // Eigene Position aus der NUI (Lua-Client -> index.html -> iframe postMessage)
  useEffect(() => {
    function onMsg(e: MessageEvent) {
      const d = e.data as { type?: string; x?: number; y?: number; heading?: number };
      if (d && d.type === "s6mdt:self" && typeof d.x === "number" && typeof d.y === "number") {
        setSelf({ x: d.x, y: d.y, heading: typeof d.heading === "number" ? d.heading : 0 });
      }
    }
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  // Zoom per Mausrad (nativer Listener, damit preventDefault greift)
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    function onWheel(e: WheelEvent) {
      e.preventDefault();
      setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z * (e.deltaY < 0 ? 1.15 : 0.87))));
    }
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // Pan per Maus ziehen
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    drag.current = { active: true, sx: e.clientX, sy: e.clientY, px: pan.x, py: pan.y };
  }, [pan]);
  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!drag.current.active) return;
    setPan({ x: drag.current.px + (e.clientX - drag.current.sx), y: drag.current.py + (e.clientY - drag.current.sy) });
  }, []);
  const endDrag = useCallback(() => { drag.current.active = false; }, []);

  function resetView() { setZoom(1); setPan({ x: 0, y: 0 }); }

  const markers = useMemo(() => Object.entries(positions), [positions]);
  const inv = 1 / zoom; // Gegen-Skalierung, damit Marker konstant groß bleiben

  const mapBg: React.CSSProperties = {
    backgroundColor: "#0a0e17",
    backgroundImage: "url('/gta-map.png')",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Live-Karte" subtitle="Echtzeit-Positionen der Einheiten" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto]">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <CardTitle>Stadtkarte · Los Santos</CardTitle>
            <div className="flex items-center gap-2">
              <Badge tone="gray">{markers.length} Einheiten</Badge>
              {self && <Badge tone="blue">eigene Position aktiv</Badge>}
            </div>
          </CardHeader>
          <CardBody>
            {isLoading ? (
              <div className="relative aspect-[3/4] min-h-[600px] w-full overflow-hidden rounded-lg" style={mapBg}>
                <div className="absolute inset-0 flex items-center justify-center"><Spinner /></div>
              </div>
            ) : error ? (
              <ErrorState error={error} />
            ) : (
              <div
                ref={viewportRef}
                className="relative aspect-[3/4] min-h-[600px] w-full cursor-grab overflow-hidden rounded-lg border border-border active:cursor-grabbing"
                onMouseDown={onMouseDown}
                onMouseMove={onMouseMove}
                onMouseUp={endDrag}
                onMouseLeave={endDrag}
              >
                {/* Welt (Karte + Marker), wird gezoomt/verschoben */}
                <div
                  className="absolute inset-0"
                  style={{ ...mapBg, transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "center center" }}
                >
                  {markers.map(([unitId, pos]) => {
                    const { left, top } = toPct(pos.x, pos.y);
                    const c = statusColor(pos.status);
                    return (
                      <div key={unitId} className="absolute z-10 -translate-x-1/2 -translate-y-1/2" style={{ left: `${left}%`, top: `${top}%` }}>
                        <div className="flex items-center gap-1.5" style={{ transform: `scale(${inv})`, transformOrigin: "left center" }} title={`${pos.callsign} · ${pos.status}`}>
                          <span className="block h-3 w-3 shrink-0 rounded-full" style={{ backgroundColor: c.dot, boxShadow: `0 0 0 4px ${c.ring}` }} />
                          <span className="whitespace-nowrap rounded bg-black/70 px-1.5 py-0.5 text-[11px] font-medium text-white">{pos.callsign}</span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Eigene Position */}
                  {self && (() => {
                    const { left, top } = toPct(self.x, self.y);
                    return (
                      <div className="absolute z-20 -translate-x-1/2 -translate-y-1/2" style={{ left: `${left}%`, top: `${top}%` }}>
                        <div style={{ transform: `scale(${inv})`, transformOrigin: "center" }} className="flex flex-col items-center">
                          <span className="relative block h-3.5 w-3.5 rounded-full bg-cyan-300" style={{ boxShadow: "0 0 0 5px rgba(103,232,249,0.35)" }}>
                            <span className="absolute inset-0 animate-ping rounded-full bg-cyan-300/60" />
                          </span>
                          <span className="mt-1 whitespace-nowrap rounded bg-cyan-500/90 px-1.5 py-0.5 text-[11px] font-semibold text-white">Du</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Zoom-Steuerung (nicht mitgezoomt) */}
                <div className="absolute right-3 top-3 z-30 flex flex-col gap-1">
                  <Button size="icon" variant="secondary" onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z * 1.3))}>+</Button>
                  <Button size="icon" variant="secondary" onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z * 0.77))}>−</Button>
                  <Button size="icon" variant="secondary" onClick={resetView} title="Ansicht zurücksetzen">⟳</Button>
                </div>

                {/* dezenter Hinweis statt zentriertem Text */}
                {markers.length === 0 && !self && (
                  <div className="absolute bottom-3 left-3 z-30 rounded-md bg-black/60 px-2.5 py-1.5 text-xs text-white/80">
                    Keine Einheiten — Positionen erscheinen live, sobald jemand im Dienst ist.
                  </div>
                )}
              </div>
            )}
          </CardBody>
        </Card>

        <Card className="lg:w-64">
          <CardHeader><CardTitle>Legende</CardTitle></CardHeader>
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
              <li className="flex items-center gap-3">
                <span className="inline-block h-2 w-2 rounded-full bg-cyan-300" />
                <div className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">Du</span>
                  <span className="text-xs text-muted-foreground">eigene Position</span>
                </div>
              </li>
            </ul>
            <div className="mt-6 border-t border-border pt-4">
              <p className="text-xs text-muted-foreground">
                Mausrad = zoomen, ziehen = verschieben, ⟳ = zurücksetzen. Fahrzeuge von Police/EMS/
                Feuerwehr erscheinen hier live, sobald sie im Dienst sind.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

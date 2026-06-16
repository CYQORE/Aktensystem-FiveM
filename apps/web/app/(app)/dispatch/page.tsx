"use client";

import { useState, useMemo, useEffect } from "react";
import {
  useDispatchCalls,
  useCreateCall,
  useAssignUnit,
  useUpdateCallStatus,
  useUnits,
} from "@/lib/hooks";
import type { DispatchCall, Unit } from "@/lib/types";
import { cn } from "@aktensystem/ui";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Badge,
  Input,
  Textarea,
  Select,
  Label,
  Spinner,
  Skeleton,
  EmptyState,
  ErrorState,
  PageHeader,
} from "@/components/ui";
import { relativeTime } from "@/lib/format";
import { useSocket } from "@/lib/ws";

const BOARD_COLUMNS: { status: string; label: string }[] = [
  { status: "OFFEN", label: "Offen" },
  { status: "DISPATCHED", label: "Disponiert" },
  { status: "UNTERWEGS", label: "Unterwegs" },
  { status: "VOR_ORT", label: "Vor Ort" },
];

const EMERGENCY_LINES: { value: string; label: string }[] = [
  { value: "POLICE_911", label: "Polizei 911" },
  { value: "NON_EMERGENCY_311", label: "Nicht-Notruf 311" },
  { value: "EMS_112", label: "Rettungsdienst 112" },
  { value: "BEHOERDENTELEFON", label: "Behördentelefon" },
];

const PRIORITIES: { value: string; label: string }[] = [
  { value: "P1", label: "P1 · Höchste" },
  { value: "P2", label: "P2 · Hoch" },
  { value: "P3", label: "P3 · Mittel" },
  { value: "P4", label: "P4 · Niedrig" },
];

function priorityTone(priority: string): "red" | "amber" | "blue" | "gray" {
  switch (priority) {
    case "P1":
      return "red";
    case "P2":
      return "amber";
    case "P3":
      return "blue";
    default:
      return "gray";
  }
}

interface AlertItem {
  id: string;
  number: number;
  kind: string;
  callsign: string;
  location: string;
  addedAt: number;
}

/** Kurzer Alarm-Ton (WebAudio) bei Panic. */
function alarmBeep() {
  try {
    const Ctx =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g);
    g.connect(ctx.destination);
    o.type = "square";
    o.frequency.value = 880;
    g.gain.setValueAtTime(0.08, ctx.currentTime);
    o.start();
    o.stop(ctx.currentTime + 0.3);
    o.onended = () => void ctx.close();
  } catch {
    /* Audio nicht verfügbar (Autoplay-Policy) — ignorieren */
  }
}

interface NewCallForm {
  line: string;
  location: string;
  category: string;
  description: string;
  priority: string;
}

const EMPTY_FORM: NewCallForm = {
  line: "POLICE_911",
  location: "",
  category: "",
  description: "",
  priority: "P3",
};

interface CallCardProps {
  call: DispatchCall;
  freeUnits: Unit[];
  isAssigning: boolean;
  onDragStart: (callId: string) => void;
  onAssign: (callId: string, unitId: string) => void;
}

function CallCard({ call, freeUnits, isAssigning, onDragStart, onAssign }: CallCardProps) {
  const [showAssign, setShowAssign] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState("");

  const assignments = call.assignments ?? [];

  function handleAssign() {
    if (!selectedUnit) return;
    onAssign(call.id, selectedUnit);
    setSelectedUnit("");
    setShowAssign(false);
  }

  return (
    <div
      draggable
      onDragStart={() => onDragStart(call.id)}
      className="cursor-grab rounded-lg border border-border bg-card/60 p-3 shadow-sm transition-colors hover:border-foreground/20 active:cursor-grabbing"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-sm font-semibold text-foreground">
          #{call.number}
        </span>
        <Badge tone={priorityTone(call.priority)}>{call.priority}</Badge>
      </div>

      <div className="mt-2 text-sm font-medium text-foreground">{call.category}</div>
      <div className="mt-0.5 text-xs text-muted-foreground">{call.location}</div>

      {assignments.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {assignments.map((a) => (
            <Badge key={a.unit?.id ?? a.unitId} tone="purple">
              {a.unit?.callsign ?? a.unitId}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-[11px] text-muted-foreground">
          {relativeTime(call.createdAt)}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowAssign((v) => !v)}
        >
          Zuweisen
        </Button>
      </div>

      {showAssign && (
        <div className="mt-2 flex items-center gap-2 border-t border-border pt-2">
          <Select
            value={selectedUnit}
            onChange={(e) => setSelectedUnit(e.target.value)}
            className="flex-1"
          >
            <option value="">Einheit wählen…</option>
            {freeUnits.map((u) => (
              <option key={u.id} value={u.id}>
                {u.callsign} · {u.status}
              </option>
            ))}
          </Select>
          <Button
            variant="secondary"
            size="sm"
            onClick={handleAssign}
            disabled={!selectedUnit || isAssigning}
          >
            OK
          </Button>
        </div>
      )}
    </div>
  );
}

export default function DispatchPage() {
  const { data: calls, isLoading, error, refetch } = useDispatchCalls();
  const { data: units } = useUnits();
  const createCall = useCreateCall();
  const assignUnit = useAssignUnit();
  const updateStatus = useUpdateCallStatus();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewCallForm>(EMPTY_FORM);
  const [dragCallId, setDragCallId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  useSocket({
    "dispatch:created": () => refetch(),
    "dispatch:updated": () => refetch(),
    "dispatch:assigned": () => refetch(),
    "dispatch:alert": (payload) => {
      const p = payload as { call: DispatchCall; kind: string; callsign: string; location: string };
      setAlerts((a) =>
        [
          { id: p.call.id, number: p.call.number, kind: p.kind, callsign: p.callsign, location: p.location, addedAt: Date.now() },
          ...a,
        ].slice(0, 5),
      );
      if (p.kind === "PANIC") alarmBeep();
      void refetch();
    },
  });

  // Jeder Alarm blendet 45s nach SEINER Entstehung aus (unabhängig von neuen).
  const hasAlerts = alerts.length > 0;
  useEffect(() => {
    if (!hasAlerts) return;
    const id = setInterval(() => {
      const cutoff = Date.now() - 45_000;
      setAlerts((a) => a.filter((x) => x.addedAt > cutoff));
    }, 5_000);
    return () => clearInterval(id);
  }, [hasAlerts]);

  const freeUnits = useMemo(
    () => (units ?? []).filter((u) => u.status === "FREI" || u.status === "STREIFE"),
    [units]
  );

  const callsByStatus = useMemo(() => {
    const map: Record<string, DispatchCall[]> = {};
    for (const col of BOARD_COLUMNS) map[col.status] = [];
    for (const call of calls ?? []) {
      if (map[call.status]) map[call.status].push(call);
    }
    return map;
  }, [calls]);

  function updateField<K extends keyof NewCallForm>(key: K, value: NewCallForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function handleCreate() {
    if (!form.location.trim() || !form.category.trim()) return;
    createCall.mutate({
      line: form.line,
      location: form.location,
      category: form.category,
      description: form.description,
      priority: form.priority,
      status: "OFFEN",
    });
    setForm(EMPTY_FORM);
    setShowForm(false);
  }

  function handleDrop(status: string) {
    if (dragCallId) {
      updateStatus.mutate({ callId: dragCallId, status });
    }
    setDragCallId(null);
    setDragOverCol(null);
  }

  function handleAssign(callId: string, unitId: string) {
    assignUnit.mutate({ callId, unitId });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dispatch"
        subtitle="CAD-Einsatzleitstand · Notrufe verwalten und Einheiten disponieren"
        actions={
          <Button variant="primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Abbrechen" : "Neuer Notruf"}
          </Button>
        }
      />

      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((a) => (
            <div
              key={a.id}
              className={cn(
                "flex items-center justify-between gap-3 rounded-lg border-2 px-4 py-3 animate-pulse",
                a.kind === "PANIC"
                  ? "border-red-500 bg-red-500/10 text-red-600 dark:text-red-400"
                  : "border-amber-500 bg-amber-500/10 text-amber-600 dark:text-amber-400",
              )}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{a.kind === "PANIC" ? "🚨" : "🚓"}</span>
                <div>
                  <div className="font-semibold">
                    {a.kind === "PANIC" ? "10-99 PANIC — Beamter in Not" : "Backup angefordert"} · Einheit {a.callsign}
                  </div>
                  <div className="text-xs opacity-80">#{a.number} · {a.location}</div>
                </div>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setAlerts((arr) => arr.filter((x) => x.id !== a.id))}>
                Quittieren
              </Button>
            </div>
          ))}
        </div>
      )}

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Neuer Notruf</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label>Leitung</Label>
                <Select
                  value={form.line}
                  onChange={(e) => updateField("line", e.target.value)}
                >
                  {EMERGENCY_LINES.map((l) => (
                    <option key={l.value} value={l.value}>
                      {l.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Priorität</Label>
                <Select
                  value={form.priority}
                  onChange={(e) => updateField("priority", e.target.value)}
                >
                  {PRIORITIES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Ort</Label>
                <Input
                  value={form.location}
                  onChange={(e) => updateField("location", e.target.value)}
                  placeholder="z. B. Vinewood Blvd 12"
                />
              </div>
              <div>
                <Label>Kategorie</Label>
                <Input
                  value={form.category}
                  onChange={(e) => updateField("category", e.target.value)}
                  placeholder="z. B. Verkehrsunfall"
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Beschreibung</Label>
                <Textarea
                  value={form.description}
                  onChange={(e) => updateField("description", e.target.value)}
                  placeholder="Details zum Einsatz…"
                  rows={3}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setShowForm(false)}>
                Abbrechen
              </Button>
              <Button
                variant="primary"
                onClick={handleCreate}
                disabled={
                  createCall.isPending ||
                  !form.location.trim() ||
                  !form.category.trim()
                }
              >
                {createCall.isPending ? "Wird angelegt…" : "Notruf anlegen"}
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {BOARD_COLUMNS.map((col) => (
            <div key={col.status} className="space-y-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-24 w-full" />
            </div>
          ))}
        </div>
      ) : error ? (
        <ErrorState error={error} />
      ) : (calls ?? []).length === 0 ? (
        <EmptyState
          title="Keine aktiven Einsätze"
          hint="Lege über „Neuer Notruf“ einen Einsatz an, um das Board zu füllen."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {BOARD_COLUMNS.map((col) => {
            const colCalls = callsByStatus[col.status] ?? [];
            const isOver = dragOverCol === col.status;
            return (
              <Card
                key={col.status}
                className={isOver ? "border-foreground/40 ring-1 ring-foreground/20" : ""}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverCol(col.status);
                }}
                onDragLeave={() => setDragOverCol((c) => (c === col.status ? null : c))}
                onDrop={(e) => {
                  e.preventDefault();
                  handleDrop(col.status);
                }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between gap-2">
                    <span>{col.label}</span>
                    <Badge tone="gray">{colCalls.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardBody>
                  <div className="space-y-3">
                    {colCalls.length === 0 ? (
                      <div className="rounded-lg border border-dashed border-border py-8 text-center text-xs text-muted-foreground">
                        Karten hierher ziehen
                      </div>
                    ) : (
                      colCalls.map((call) => (
                        <CallCard
                          key={call.id}
                          call={call}
                          freeUnits={freeUnits}
                          isAssigning={assignUnit.isPending}
                          onDragStart={setDragCallId}
                          onAssign={handleAssign}
                        />
                      ))
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {updateStatus.isPending && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Spinner /> Status wird aktualisiert…
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useInmates,
  useBookJail,
  useReleaseInmate,
  useCitizens,
} from "@/lib/hooks";
import type { Inmate } from "@/lib/types";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Badge,
  Input,
  Textarea,
  Select,
  Label,
  Skeleton,
  EmptyState,
  ErrorState,
  PageHeader,
} from "@/components/ui";
import { cn } from "@aktensystem/ui";
import { formatDate } from "@/lib/format";

const STATUS_FILTERS = [
  { key: "ACTIVE", label: "In Haft" },
  { key: "RELEASED", label: "Entlassen" },
  { key: "ALL", label: "Alle" },
];
const STATUS_TONE: Record<string, "red" | "amber" | "green" | "gray"> = {
  INCARCERATED: "red", BOOKED: "amber", RELEASED: "green", PAROLE: "amber", TRANSFERRED: "gray",
};
const STATUS_LABEL: Record<string, string> = {
  INCARCERATED: "Inhaftiert", BOOKED: "Gebucht", RELEASED: "Entlassen", PAROLE: "Bewährung", TRANSFERRED: "Verlegt",
};

function remaining(releaseAt?: string | null): string {
  if (!releaseAt) return "—";
  const ms = new Date(releaseAt).getTime() - Date.now();
  if (ms <= 0) return "abgelaufen";
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min} Min`;
  return `${Math.floor(min / 60)} Std ${min % 60} Min`;
}

export default function StrafvollzugPage() {
  const [status, setStatus] = useState("ACTIVE");
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading, error } = useInmates(status);
  const release = useReleaseInmate();

  return (
    <div>
      <PageHeader
        title="Strafvollzug"
        subtitle="Haft — Einsperren passiert in-game über die Lua-Bridge"
        actions={<Button onClick={() => setShowForm((s) => !s)}>{showForm ? "Abbrechen" : "+ In Haft nehmen"}</Button>}
      />

      {showForm && <JailForm onClose={() => setShowForm(false)} />}

      <div className="mb-3 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setStatus(f.key)}
            className={cn(
              "rounded-md border px-3 py-1 text-sm",
              status === f.key ? "border-primary bg-primary/10 font-medium" : "border-border text-muted-foreground hover:bg-accent",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : error ? (
        <ErrorState error={error} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="Keine Insassen" hint="Niemand in Haft." />
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {data.map((i: Inmate) => {
            const active = i.status === "INCARCERATED" || i.status === "BOOKED";
            return (
              <Card key={i.id}>
                <CardBody className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-medium">
                        {i.citizen ? (
                          <Link href={`/citizens/${i.citizen.id}`} className="hover:underline">
                            {i.citizen.lastName}, {i.citizen.firstName}
                          </Link>
                        ) : "Unbekannt"}
                      </div>
                      <div className="text-xs text-muted-foreground">Buchung #{i.bookingNumber}{i.cell ? ` · Zelle ${i.cell}` : ""}</div>
                    </div>
                    <Badge tone={STATUS_TONE[i.status] ?? "gray"}>{STATUS_LABEL[i.status] ?? i.status}</Badge>
                  </div>
                  {i.reason && <p className="text-sm text-muted-foreground">{i.reason}</p>}
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    <span>⏱ Eingewiesen {formatDate(i.intakeAt)}</span>
                    {active && <span>⛓ Rest: {remaining(i.releaseAt)}</span>}
                    {i.queued === false && active && <Badge tone="amber">nicht in-game (kein Identifier)</Badge>}
                  </div>
                  {active && (
                    <Button size="sm" variant="outline" disabled={release.isPending} onClick={() => release.mutate(i.id)}>
                      Freilassen
                    </Button>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function JailForm({ onClose }: { onClose: () => void }) {
  const [citizenId, setCitizenId] = useState("");
  const [csearch, setCsearch] = useState("");
  const [minutes, setMinutes] = useState("30");
  const [reason, setReason] = useState("");
  const [cell, setCell] = useState("");
  const { data: citizens } = useCitizens(csearch);
  const book = useBookJail();

  function submit() {
    const m = Number(minutes);
    if (!citizenId || !m || !reason) return;
    book.mutate(
      { citizenId, minutes: m, reason, cell: cell || undefined },
      { onSuccess: onClose },
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader><CardTitle>In Haft nehmen</CardTitle></CardHeader>
      <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label>Person *</Label>
          <Input placeholder="Person suchen…" value={csearch} onChange={(e) => setCsearch(e.target.value)} className="mb-2" />
          <Select value={citizenId} onChange={(e) => setCitizenId(e.target.value)}>
            <option value="">— Person wählen —</option>
            {(citizens ?? []).map((c) => <option key={c.id} value={c.id}>{c.lastName}, {c.firstName}</option>)}
          </Select>
        </div>
        <div><Label>Dauer (Minuten) *</Label><Input type="number" min={1} max={600} value={minutes} onChange={(e) => setMinutes(e.target.value)} /></div>
        <div><Label>Zelle (optional)</Label><Input value={cell} onChange={(e) => setCell(e.target.value)} /></div>
        <div className="sm:col-span-2"><Label>Grund *</Label><Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} /></div>
        <div className="flex gap-2 sm:col-span-2">
          <Button onClick={submit} disabled={!citizenId || !Number(minutes) || !reason || book.isPending}>In Haft nehmen</Button>
          <Button variant="ghost" onClick={onClose}>Abbrechen</Button>
        </div>
      </CardBody>
    </Card>
  );
}

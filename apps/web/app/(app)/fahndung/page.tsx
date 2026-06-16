"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useBolos,
  useCreateBolo,
  useResolveBolo,
  useDeleteBolo,
  useCitizens,
} from "@/lib/hooks";
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
import { relativeTime } from "@/lib/format";

export default function FahndungPage() {
  const [active, setActive] = useState("true");
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading, error } = useBolos(active);
  const resolve = useResolveBolo();
  const del = useDeleteBolo();

  return (
    <div>
      <PageHeader
        title="Fahndung / BOLO"
        subtitle="Be On The Lookout — Personen & Fahrzeuge zur Fahndung ausschreiben"
        actions={<Button onClick={() => setShowForm((s) => !s)}>{showForm ? "Abbrechen" : "+ Fahndung"}</Button>}
      />

      {showForm && <BoloForm onClose={() => setShowForm(false)} />}

      <div className="mb-3 flex gap-2">
        {[
          { k: "true", l: "Aktiv" },
          { k: "false", l: "Alle" },
        ].map((f) => (
          <button
            key={f.k}
            onClick={() => setActive(f.k)}
            className={cn(
              "rounded-md border px-3 py-1 text-sm",
              active === f.k ? "border-primary bg-primary/10 font-medium" : "border-border text-muted-foreground hover:bg-accent",
            )}
          >
            {f.l}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28" />)}</div>
      ) : error ? (
        <ErrorState error={error} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="Keine Fahndungen" hint="Schreibe eine Person oder ein Fahrzeug zur Fahndung aus." />
      ) : (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {data.map((b) => (
            <Card key={b.id} className={cn(!b.active && "opacity-60")}>
              <CardBody className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium">🔎 {b.title}</div>
                  <Badge tone={b.active ? "red" : "gray"}>{b.active ? "Aktiv" : "Erledigt"}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{b.description}</p>
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {b.plate && <span className="rounded bg-secondary px-2 py-0.5 font-mono">🚗 {b.plate}</span>}
                  {b.citizenId && <Link href={`/citizens/${b.citizenId}`} className="rounded bg-secondary px-2 py-0.5 hover:underline">👤 Person</Link>}
                  <span className="ml-auto">{relativeTime(b.createdAt)}</span>
                </div>
                {b.active && (
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" variant="outline" onClick={() => resolve.mutate(b.id)} disabled={resolve.isPending}>Erledigt</Button>
                    <Button size="sm" variant="destructive" onClick={() => { if (confirm("Fahndung löschen?")) del.mutate(b.id); }}>Löschen</Button>
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function BoloForm({ onClose }: { onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [plate, setPlate] = useState("");
  const [citizenId, setCitizenId] = useState("");
  const [csearch, setCsearch] = useState("");
  const { data: citizens } = useCitizens(csearch);
  const create = useCreateBolo();

  function submit() {
    if (!title || !description) return;
    create.mutate(
      { title, description, plate: plate || undefined, citizenId: citizenId || undefined },
      { onSuccess: onClose },
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader><CardTitle>Fahndung ausschreiben</CardTitle></CardHeader>
      <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2"><Label>Titel *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="z. B. Flüchtiger nach Banküberfall" /></div>
        <div className="sm:col-span-2"><Label>Beschreibung *</Label><Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
        <div><Label>Kennzeichen (optional)</Label><Input value={plate} onChange={(e) => setPlate(e.target.value)} className="font-mono" placeholder="LS-1234" /></div>
        <div>
          <Label>Person (optional)</Label>
          <Input placeholder="Person suchen…" value={csearch} onChange={(e) => setCsearch(e.target.value)} className="mb-2" />
          <Select value={citizenId} onChange={(e) => setCitizenId(e.target.value)}>
            <option value="">— keine —</option>
            {(citizens ?? []).map((c) => <option key={c.id} value={c.id}>{c.lastName}, {c.firstName}</option>)}
          </Select>
        </div>
        <div className="flex gap-2 sm:col-span-2">
          <Button onClick={submit} disabled={!title || !description || create.isPending}>Ausschreiben</Button>
          <Button variant="ghost" onClick={onClose}>Abbrechen</Button>
        </div>
      </CardBody>
    </Card>
  );
}

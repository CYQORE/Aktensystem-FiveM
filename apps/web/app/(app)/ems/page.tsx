"use client";

import { useState } from "react";
import Link from "next/link";
import { useMedicalIncidents, useCreateMedicalIncident, useCitizens } from "@/lib/hooks";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Input,
  Textarea,
  Select,
  Label,
  Table,
  THead,
  TR,
  TH,
  TD,
  Skeleton,
  EmptyState,
  ErrorState,
  PageHeader,
} from "@/components/ui";
import { formatDate } from "@/lib/format";

export default function EmsPage() {
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading, error } = useMedicalIncidents();

  return (
    <div className="space-y-6">
      <PageHeader
        title="EMS / Medizin"
        subtitle="Rettungsdienst-Einsatzberichte"
        actions={<Button onClick={() => setShowForm((s) => !s)}>{showForm ? "Abbrechen" : "Neuer Bericht"}</Button>}
      />

      {showForm && <IncidentForm onClose={() => setShowForm(false)} />}

      <Card>
        <CardBody>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : error ? (
            <ErrorState error={error} />
          ) : !data || data.length === 0 ? (
            <EmptyState title="Keine Einsätze" hint="Lege den ersten Bericht an." />
          ) : (
            <Table>
              <THead>
                <TR><TH>Art</TH><TH>Patient</TH><TH>Ort</TH><TH>Ergebnis</TH><TH>Zeit</TH></TR>
              </THead>
              <tbody>
                {data.map((m) => (
                  <TR key={m.id}>
                    <TD className="font-medium">{m.type}</TD>
                    <TD>
                      {m.citizen ? (
                        <Link href={`/citizens/${m.citizen.id}`} className="hover:underline">{m.citizen.lastName}, {m.citizen.firstName}</Link>
                      ) : "—"}
                    </TD>
                    <TD>{m.location ?? "—"}</TD>
                    <TD className="max-w-xs truncate text-muted-foreground">{m.outcome ?? "—"}</TD>
                    <TD>{formatDate(m.at)}</TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function IncidentForm({ onClose }: { onClose: () => void }) {
  const [type, setType] = useState("");
  const [location, setLocation] = useState("");
  const [outcome, setOutcome] = useState("");
  const [citizenId, setCitizenId] = useState("");
  const [csearch, setCsearch] = useState("");
  const { data: citizens } = useCitizens(csearch);
  const create = useCreateMedicalIncident();

  function submit() {
    if (!type.trim()) return;
    create.mutate(
      { type, location: location || undefined, outcome: outcome || undefined, citizenId: citizenId || undefined },
      { onSuccess: onClose },
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>Neuer Einsatzbericht</CardTitle></CardHeader>
      <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div><Label>Art *</Label><Input value={type} onChange={(e) => setType(e.target.value)} placeholder="z. B. Reanimation, Schussverletzung" /></div>
        <div><Label>Ort</Label><Input value={location} onChange={(e) => setLocation(e.target.value)} /></div>
        <div className="sm:col-span-2">
          <Label>Patient (optional)</Label>
          <Input placeholder="Person suchen…" value={csearch} onChange={(e) => setCsearch(e.target.value)} className="mb-2" />
          <Select value={citizenId} onChange={(e) => setCitizenId(e.target.value)}>
            <option value="">— keiner —</option>
            {(citizens ?? []).map((c) => <option key={c.id} value={c.id}>{c.lastName}, {c.firstName}</option>)}
          </Select>
        </div>
        <div className="sm:col-span-2"><Label>Ergebnis / Notizen</Label><Textarea rows={2} value={outcome} onChange={(e) => setOutcome(e.target.value)} /></div>
        <div className="flex gap-2 sm:col-span-2">
          <Button onClick={submit} disabled={!type.trim() || create.isPending}>Speichern</Button>
          <Button variant="ghost" onClick={onClose}>Abbrechen</Button>
        </div>
      </CardBody>
    </Card>
  );
}

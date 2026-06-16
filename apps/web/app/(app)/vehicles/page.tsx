"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  useVehicles,
  useCreateVehicle,
  useUpdateVehicle,
  useCitizens,
  useVehicleByPlate,
  useAddVehicleActivity,
} from "@/lib/hooks";
import type { Vehicle } from "@/lib/types";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Badge,
  Input,
  Select,
  Label,
  Textarea,
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
import { relativeTime } from "@/lib/format";

const ACTIVITY_TYPES = [
  "Verkehrskontrolle",
  "Papierkontrolle",
  "Kennzeichen-Scan",
  "Beschlagnahme",
  "Sonstiges",
] as const;

function VehicleForm({ onClose }: { onClose: () => void }) {
  const [plate, setPlate] = useState("");
  const [model, setModel] = useState("");
  const [color, setColor] = useState("");
  const [ownerId, setOwnerId] = useState("");

  const { data: citizens } = useCitizens("");
  const create = useCreateVehicle();

  function handleSubmit() {
    if (!plate) return;
    create.mutate(
      { plate, model, color, ownerId: ownerId || undefined },
      {
        onSuccess: () => {
          setPlate("");
          setModel("");
          setColor("");
          setOwnerId("");
          onClose();
        },
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Neues Fahrzeug anlegen</CardTitle>
      </CardHeader>
      <CardBody>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="space-y-1.5">
            <Label htmlFor="plate">Kennzeichen *</Label>
            <Input
              id="plate"
              value={plate}
              onChange={(e) => setPlate(e.target.value)}
              placeholder="z. B. LS-1234"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="model">Modell</Label>
            <Input
              id="model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="z. B. Bravado Buffalo"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="color">Farbe</Label>
            <Input
              id="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              placeholder="z. B. Schwarz"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="owner">Halter</Label>
            <Select id="owner" value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
              <option value="">— kein Halter —</option>
              {(citizens ?? []).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.lastName}, {c.firstName}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Button onClick={handleSubmit} disabled={create.isPending || !plate}>
            {create.isPending ? "Wird angelegt…" : "Anlegen"}
          </Button>
          <Button variant="ghost" onClick={onClose} disabled={create.isPending}>
            Abbrechen
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function StatusBadges({ vehicle }: { vehicle: Vehicle }) {
  if (vehicle.stolen || vehicle.impounded) {
    return (
      <div className="flex flex-wrap gap-1.5">
        {vehicle.stolen && <Badge tone="red">Gestohlen</Badge>}
        {vehicle.impounded && <Badge tone="amber">Beschlagnahmt</Badge>}
      </div>
    );
  }
  return <Badge tone="green">OK</Badge>;
}

function VehicleRowActions({ vehicle }: { vehicle: Vehicle }) {
  const update = useUpdateVehicle(vehicle.id);

  return (
    <div className="flex flex-wrap justify-end gap-1.5">
      <Button
        variant="outline"
        size="sm"
        disabled={update.isPending}
        onClick={() => update.mutate({ stolen: !vehicle.stolen })}
      >
        {vehicle.stolen ? "freigeben" : "Als gestohlen melden"}
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={update.isPending}
        onClick={() => update.mutate({ impounded: !vehicle.impounded })}
      >
        {vehicle.impounded ? "freigeben" : "beschlagnahmen"}
      </Button>
    </div>
  );
}

export default function VehiclesPage() {
  return (
    <Suspense fallback={null}>
      <VehiclesInner />
    </Suspense>
  );
}

function VehiclesInner() {
  const params = useSearchParams();
  const [showForm, setShowForm] = useState(false);
  const [q, setQ] = useState("");
  const [plate, setPlate] = useState("");

  // Tiefenlink aus Bürgerprofil: /vehicles?plate=LS-1234
  useEffect(() => {
    const p = params.get("plate");
    if (p) setPlate(p.toUpperCase());
  }, [params]);

  const { data: vehicles, isLoading, error } = useVehicles(q);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fahrzeugregister"
        subtitle="Kennzeichen, Halter, Status, Streifen-Check"
        actions={
          <Button onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Formular schließen" : "Neues Fahrzeug"}
          </Button>
        }
      />

      {showForm && <VehicleForm onClose={() => setShowForm(false)} />}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <div className="max-w-sm">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Suche nach Kennzeichen, Modell, Halter…"
            />
          </div>

          <Card>
            <CardBody>
              {isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : error ? (
                <ErrorState error={error} />
              ) : !vehicles || vehicles.length === 0 ? (
                <EmptyState
                  title="Keine Fahrzeuge gefunden"
                  hint="Lege ein neues Fahrzeug an oder passe die Suche an."
                />
              ) : (
                <Table>
                  <THead>
                    <TR>
                      <TH>Kennzeichen</TH>
                      <TH>Modell</TH>
                      <TH>Halter</TH>
                      <TH>Status</TH>
                      <TH className="text-right">Aktionen</TH>
                    </TR>
                  </THead>
                  <tbody>
                    {vehicles.map((v) => (
                      <TR key={v.id} className="cursor-pointer" onClick={() => setPlate(v.plate)}>
                        <TD className="font-mono font-medium">{v.plate}</TD>
                        <TD>{v.model || "—"}</TD>
                        <TD>
                          {v.owner ? `${v.owner.lastName}, ${v.owner.firstName}` : "—"}
                        </TD>
                        <TD>
                          <StatusBadges vehicle={v} />
                        </TD>
                        <TD onClick={(e) => e.stopPropagation()}>
                          <VehicleRowActions vehicle={v} />
                        </TD>
                      </TR>
                    ))}
                  </tbody>
                </Table>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="space-y-3">
          <div>
            <Label>Streifen-Check (Kennzeichen)</Label>
            <Input
              value={plate}
              onChange={(e) => setPlate(e.target.value.toUpperCase())}
              placeholder="Kennzeichen eingeben…"
              className="font-mono"
            />
          </div>
          {plate.trim() ? <PlateLookup plate={plate.trim()} /> : (
            <Card><CardBody className="text-sm text-muted-foreground">Kennzeichen eingeben oder Fahrzeug in der Liste anklicken.</CardBody></Card>
          )}
        </div>
      </div>
    </div>
  );
}

function PlateLookup({ plate }: { plate: string }) {
  const { data, isLoading, error, isError } = useVehicleByPlate(plate);
  const add = useAddVehicleActivity(data?.id ?? "", plate);
  const [type, setType] = useState<string>(ACTIVITY_TYPES[0]);
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");

  if (isLoading) return <Card><CardBody className="text-sm text-muted-foreground">Lädt…</CardBody></Card>;
  if (isError || error) return <Card><CardBody className="text-sm text-muted-foreground">Kein Fahrzeug mit Kennzeichen <span className="font-mono">{plate}</span> gefunden.</CardBody></Card>;
  if (!data) return null;

  const flagged = data.stolen || data.impounded || (data.bolos?.length ?? 0) > 0;

  function logActivity() {
    if (!data) return;
    add.mutate(
      { activityType: type, location: location || undefined, notes: notes || undefined },
      { onSuccess: () => { setLocation(""); setNotes(""); } },
    );
  }

  return (
    <Card className={flagged ? "ring-1 ring-red-500/60" : undefined}>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="font-mono">{data.plate}</CardTitle>
        <StatusBadges vehicle={data} />
      </CardHeader>
      <CardBody className="space-y-3 text-sm">
        <div className="text-muted-foreground">
          <div>{data.model || "Unbekanntes Modell"}{data.color ? ` · ${data.color}` : ""}</div>
          <div>
            Halter:{" "}
            {data.owner ? (
              <Link href={`/citizens/${data.owner.id}`} className="text-foreground hover:underline">
                {data.owner.lastName}, {data.owner.firstName}
              </Link>
            ) : "—"}
          </div>
        </div>

        {(data.bolos?.length ?? 0) > 0 && (
          <div className="rounded-md border border-red-500/40 bg-red-500/5 p-2">
            <p className="mb-1 font-medium text-red-500">🔎 Aktive Fahndung</p>
            {data.bolos!.map((b) => (
              <div key={b.id} className="text-xs"><span className="font-medium">{b.title}</span> — {b.description}</div>
            ))}
          </div>
        )}

        <div className="space-y-2 border-t border-border pt-3">
          <p className="font-medium">Kontrolle protokollieren</p>
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            {ACTIVITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
          <Input placeholder="Ort (optional)" value={location} onChange={(e) => setLocation(e.target.value)} />
          <Textarea rows={2} placeholder="Notizen (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} />
          <Button size="sm" onClick={logActivity} disabled={add.isPending}>{add.isPending ? "Speichert…" : "Eintragen"}</Button>
        </div>

        <div className="border-t border-border pt-3">
          <p className="mb-1 font-medium">Verlauf</p>
          {(data.activities?.length ?? 0) === 0 ? (
            <p className="text-xs text-muted-foreground">Keine Einträge.</p>
          ) : (
            <ul className="space-y-1">
              {data.activities!.map((a) => (
                <li key={a.id} className="flex items-center justify-between text-xs">
                  <span>{a.activityType}{a.location ? ` · ${a.location}` : ""}{a.notes ? ` — ${a.notes}` : ""}</span>
                  <span className="text-muted-foreground">{relativeTime(a.createdAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardBody>
    </Card>
  );
}

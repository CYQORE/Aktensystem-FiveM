"use client";

import { useState } from "react";
import { useVehicles, useCreateVehicle, useUpdateVehicle, useCitizens } from "@/lib/hooks";
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
  const [showForm, setShowForm] = useState(false);
  const [q, setQ] = useState("");

  const { data: vehicles, isLoading, error } = useVehicles(q);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Fahrzeugregister"
        subtitle="Kennzeichen, Halter, Status"
        actions={
          <Button onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Formular schließen" : "Neues Fahrzeug"}
          </Button>
        }
      />

      {showForm && <VehicleForm onClose={() => setShowForm(false)} />}

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
                  <TH>Farbe</TH>
                  <TH>Halter</TH>
                  <TH>Status</TH>
                  <TH>Angelegt</TH>
                  <TH className="text-right">Aktionen</TH>
                </TR>
              </THead>
              <tbody>
                {vehicles.map((v) => (
                  <TR key={v.id}>
                    <TD className="font-mono font-medium">{v.plate}</TD>
                    <TD>{v.model || "—"}</TD>
                    <TD>{v.color || "—"}</TD>
                    <TD>
                      {v.owner ? `${v.owner.lastName}, ${v.owner.firstName}` : "—"}
                    </TD>
                    <TD>
                      <StatusBadges vehicle={v} />
                    </TD>
                    <TD>{formatDate(v.createdAt)}</TD>
                    <TD>
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
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useProperties,
  useCreateProperty,
  useDeleteProperty,
  useCitizens,
} from "@/lib/hooks";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
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
import { useAuth } from "@/lib/auth-store";
import { formatDate } from "@/lib/format";

export default function ImmobilienPage() {
  const isAdmin = useAuth((s) => s.user?.isPlatformAdmin ?? false);
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading, error } = useProperties(q);
  const del = useDeleteProperty();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Immobilien"
        subtitle="Grundstücke & Immobilien — Eigentümer, Adresse"
        actions={<Button onClick={() => setShowForm((s) => !s)}>{showForm ? "Abbrechen" : "Neue Immobilie"}</Button>}
      />

      {showForm && <PropertyForm onClose={() => setShowForm(false)} />}

      <div className="max-w-sm">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Suche nach Bezeichnung/Adresse…" />
      </div>

      <Card>
        <CardBody>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : error ? (
            <ErrorState error={error} />
          ) : !data || data.length === 0 ? (
            <EmptyState title="Keine Immobilien" hint="Lege die erste Immobilie an." />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Bezeichnung</TH>
                  <TH>Adresse</TH>
                  <TH>Eigentümer</TH>
                  <TH>Angelegt</TH>
                  {isAdmin && <TH className="text-right">Aktion</TH>}
                </TR>
              </THead>
              <tbody>
                {data.map((p) => (
                  <TR key={p.id}>
                    <TD className="font-medium">{p.label}</TD>
                    <TD>{p.address}</TD>
                    <TD>
                      {p.owner ? (
                        <Link href={`/citizens/${p.owner.id}`} className="hover:underline">
                          {p.owner.lastName}, {p.owner.firstName}
                        </Link>
                      ) : "—"}
                    </TD>
                    <TD>{formatDate(p.createdAt)}</TD>
                    {isAdmin && (
                      <TD className="text-right">
                        <Button size="sm" variant="destructive" onClick={() => { if (confirm(`"${p.label}" löschen?`)) del.mutate(p.id); }}>
                          Löschen
                        </Button>
                      </TD>
                    )}
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

function PropertyForm({ onClose }: { onClose: () => void }) {
  const [label, setLabel] = useState("");
  const [address, setAddress] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [csearch, setCsearch] = useState("");
  const { data: citizens } = useCitizens(csearch);
  const create = useCreateProperty();

  function submit() {
    if (!label.trim() || !address.trim()) return;
    create.mutate({ label, address, ownerId: ownerId || undefined }, { onSuccess: onClose });
  }

  return (
    <Card>
      <CardHeader><CardTitle>Neue Immobilie</CardTitle></CardHeader>
      <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div><Label>Bezeichnung *</Label><Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="z. B. Villa Vinewood 12" /></div>
        <div><Label>Adresse *</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Straße, Stadt" /></div>
        <div className="sm:col-span-2">
          <Label>Eigentümer (optional)</Label>
          <Input placeholder="Person suchen…" value={csearch} onChange={(e) => setCsearch(e.target.value)} className="mb-2" />
          <Select value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
            <option value="">— kein Eigentümer —</option>
            {(citizens ?? []).map((c) => <option key={c.id} value={c.id}>{c.lastName}, {c.firstName}</option>)}
          </Select>
        </div>
        <div className="flex gap-2 sm:col-span-2">
          <Button onClick={submit} disabled={!label.trim() || !address.trim() || create.isPending}>Anlegen</Button>
          <Button variant="ghost" onClick={onClose}>Abbrechen</Button>
        </div>
      </CardBody>
    </Card>
  );
}

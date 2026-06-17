"use client";

import { useState } from "react";
import { useBusinesses, useBusiness, useCreateBusiness, useBusinessAction, useCitizens } from "@/lib/hooks";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Badge,
  Input,
  Select,
  Label,
  Skeleton,
  EmptyState,
  ErrorState,
  PageHeader,
  Spinner,
} from "@/components/ui";
import { cn } from "@aktensystem/ui";

const TYPES = ["GENERAL", "RESTAURANT", "REAL_ESTATE", "MECHANIC", "SECURITY", "NEWS", "OTHER"] as const;
const money = (n: number) => `${n.toLocaleString("de-DE")} $`;

export default function UnternehmenPage() {
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const { data, isLoading, error } = useBusinesses(q);

  return (
    <div>
      <PageHeader
        title="Unternehmen"
        subtitle="Firmen, Mitarbeiter, Produkte"
        actions={<Button onClick={() => setShowForm((s) => !s)}>{showForm ? "Abbrechen" : "Neue Firma"}</Button>}
      />
      {showForm && <BusinessForm onClose={() => setShowForm(false)} />}
      <div className="mb-3 max-w-sm"><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Firma suchen…" /></div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_380px]">
        <div>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : error ? (
            <ErrorState error={error} />
          ) : !data || data.length === 0 ? (
            <EmptyState title="Keine Unternehmen" hint="Lege die erste Firma an." />
          ) : (
            <div className="space-y-2">
              {data.map((b) => (
                <Card key={b.id} className={cn("cursor-pointer", selected === b.id && "ring-1 ring-primary")} onClick={() => setSelected(b.id)}>
                  <CardBody className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">{b.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {b.type}{b.owner ? ` · ${b.owner.lastName}, ${b.owner.firstName}` : ""} · {b._count?.employees ?? 0} MA
                      </div>
                    </div>
                    <Badge tone="gray">{money(b.balance)}</Badge>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
        <div>{selected && <BusinessDetail id={selected} />}</div>
      </div>
    </div>
  );
}

function BusinessDetail({ id }: { id: string }) {
  const { data, isLoading } = useBusiness(id);
  const act = useBusinessAction(id);
  const [csearch, setCsearch] = useState("");
  const [empCitizen, setEmpCitizen] = useState("");
  const [role, setRole] = useState("");
  const [wage, setWage] = useState("");
  const [miName, setMiName] = useState("");
  const [miPrice, setMiPrice] = useState("");
  const { data: citizens } = useCitizens(csearch);

  if (isLoading || !data) return <Card><CardBody className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner /> Lädt…</CardBody></Card>;

  return (
    <Card className="sticky top-4">
      <CardHeader><CardTitle>{data.name}</CardTitle></CardHeader>
      <CardBody className="space-y-4 text-sm">
        <div className="text-muted-foreground">
          <div>Typ: {data.type}</div>
          {data.address && <div>Adresse: {data.address}</div>}
          <div>Kontostand: {money(data.balance)}</div>
        </div>

        <div>
          <p className="mb-1 font-medium">Mitarbeiter</p>
          {(data.employees ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground">Keine Mitarbeiter.</p>
          ) : (
            <ul className="space-y-1">
              {data.employees!.map((e) => (
                <li key={e.id} className="flex items-center justify-between">
                  <span>{e.citizen ? `${e.citizen.lastName}, ${e.citizen.firstName}` : "—"}{e.role ? ` · ${e.role}` : ""} · {money(e.wage)}</span>
                  <button className="text-xs text-muted-foreground hover:text-red-500" onClick={() => act.removeEmployee.mutate(e.id)}>✕</button>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-2 space-y-1.5 rounded-md border border-border p-2">
            <Input placeholder="Person suchen…" value={csearch} onChange={(e) => setCsearch(e.target.value)} className="h-8 text-xs" />
            <Select value={empCitizen} onChange={(e) => setEmpCitizen(e.target.value)} className="h-8 text-xs">
              <option value="">— Person —</option>
              {(citizens ?? []).map((c) => <option key={c.id} value={c.id}>{c.lastName}, {c.firstName}</option>)}
            </Select>
            <div className="flex gap-1.5">
              <Input placeholder="Rolle" value={role} onChange={(e) => setRole(e.target.value)} className="h-8 text-xs" />
              <Input type="number" placeholder="Lohn" value={wage} onChange={(e) => setWage(e.target.value)} className="h-8 w-24 text-xs" />
            </div>
            <Button size="sm" disabled={!empCitizen || act.addEmployee.isPending}
              onClick={() => act.addEmployee.mutate({ citizenId: empCitizen, role: role || undefined, wage: Number(wage) || 0 }, { onSuccess: () => { setEmpCitizen(""); setRole(""); setWage(""); } })}>
              + Mitarbeiter
            </Button>
          </div>
        </div>

        <div>
          <p className="mb-1 font-medium">Menü / Produkte</p>
          {(data.menuItems ?? []).length === 0 ? (
            <p className="text-xs text-muted-foreground">Keine Produkte.</p>
          ) : (
            <ul className="space-y-1">
              {data.menuItems!.map((mi) => (
                <li key={mi.id} className="flex items-center justify-between">
                  <span>{mi.name}{mi.category ? ` · ${mi.category}` : ""} — {money(mi.price)}</span>
                  <button className="text-xs text-muted-foreground hover:text-red-500" onClick={() => act.removeMenuItem.mutate(mi.id)}>✕</button>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-2 flex gap-1.5">
            <Input placeholder="Produkt" value={miName} onChange={(e) => setMiName(e.target.value)} className="h-8 text-xs" />
            <Input type="number" placeholder="Preis" value={miPrice} onChange={(e) => setMiPrice(e.target.value)} className="h-8 w-24 text-xs" />
            <Button size="sm" disabled={!miName.trim() || !miPrice || act.addMenuItem.isPending}
              onClick={() => act.addMenuItem.mutate({ name: miName, price: Number(miPrice) || 0 }, { onSuccess: () => { setMiName(""); setMiPrice(""); } })}>
              +
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

function BusinessForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("GENERAL");
  const [address, setAddress] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [csearch, setCsearch] = useState("");
  const { data: citizens } = useCitizens(csearch);
  const create = useCreateBusiness();

  function submit() {
    if (!name.trim()) return;
    create.mutate({ name, type, address: address || undefined, ownerId: ownerId || undefined }, { onSuccess: onClose });
  }

  return (
    <Card className="mb-4">
      <CardHeader><CardTitle>Neue Firma</CardTitle></CardHeader>
      <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
        <div><Label>Typ</Label>
          <Select value={type} onChange={(e) => setType(e.target.value)}>{TYPES.map((t) => <option key={t} value={t}>{t}</option>)}</Select>
        </div>
        <div><Label>Adresse</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} /></div>
        <div>
          <Label>Eigentümer</Label>
          <Input placeholder="Person suchen…" value={csearch} onChange={(e) => setCsearch(e.target.value)} className="mb-2" />
          <Select value={ownerId} onChange={(e) => setOwnerId(e.target.value)}>
            <option value="">— keiner —</option>
            {(citizens ?? []).map((c) => <option key={c.id} value={c.id}>{c.lastName}, {c.firstName}</option>)}
          </Select>
        </div>
        <div className="flex gap-2 sm:col-span-2">
          <Button onClick={submit} disabled={!name.trim() || create.isPending}>Anlegen</Button>
          <Button variant="ghost" onClick={onClose}>Abbrechen</Button>
        </div>
      </CardBody>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { useCustoms, useCreateCustoms, useSetCustomsStatus, useCitizens } from "@/lib/hooks";
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
import { cn } from "@aktensystem/ui";
import { formatDate } from "@/lib/format";

const money = (n: number) => `${n.toLocaleString("de-DE")} $`;
const STATUS_TONE: Record<string, "amber" | "green" | "red"> = { DECLARED: "amber", CLEARED: "green", SEIZED: "red" };
const FILTERS = [
  { key: "", label: "Alle" },
  { key: "DECLARED", label: "Angemeldet" },
  { key: "CLEARED", label: "Freigegeben" },
  { key: "SEIZED", label: "Beschlagnahmt" },
];

function goodsText(g: unknown): string {
  if (g && typeof g === "object" && "description" in g) return String((g as { description?: string }).description ?? "");
  return typeof g === "string" ? g : "";
}

export default function ZollPage() {
  const [status, setStatus] = useState("");
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading, error } = useCustoms(status);
  const setStat = useSetCustomsStatus();

  return (
    <div>
      <PageHeader
        title="Zoll"
        subtitle="Warenanmeldungen & Kontrollen"
        actions={<Button onClick={() => setShowForm((s) => !s)}>{showForm ? "Abbrechen" : "Neue Anmeldung"}</Button>}
      />
      {showForm && <CustomsForm onClose={() => setShowForm(false)} />}

      <div className="mb-3 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => setStatus(f.key)}
            className={cn("rounded-md border px-3 py-1 text-sm", status === f.key ? "border-primary bg-primary/10 font-medium" : "border-border text-muted-foreground hover:bg-accent")}>
            {f.label}
          </button>
        ))}
      </div>

      <Card>
        <CardBody>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : error ? (
            <ErrorState error={error} />
          ) : !data || data.length === 0 ? (
            <EmptyState title="Keine Anmeldungen" />
          ) : (
            <Table>
              <THead>
                <TR><TH>Ware</TH><TH>Wert</TH><TH>Anmelder</TH><TH>Status</TH><TH>Zeit</TH><TH className="text-right">Aktion</TH></TR>
              </THead>
              <tbody>
                {data.map((c) => (
                  <TR key={c.id}>
                    <TD className="max-w-xs truncate">{goodsText(c.goods)}</TD>
                    <TD className="font-mono">{money(c.declaredValue)}</TD>
                    <TD>{c.declarant ? `${c.declarant.lastName}, ${c.declarant.firstName}` : "—"}</TD>
                    <TD><Badge tone={STATUS_TONE[c.status] ?? "amber"}>{c.status}</Badge></TD>
                    <TD>{formatDate(c.at)}</TD>
                    <TD className="text-right">
                      <Select value={c.status} disabled={setStat.isPending}
                        onChange={(e) => setStat.mutate({ id: c.id, status: e.target.value })}
                        className="ml-auto h-8 max-w-[150px] text-xs">
                        {["DECLARED", "CLEARED", "SEIZED"].map((s) => <option key={s} value={s}>{s}</option>)}
                      </Select>
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

function CustomsForm({ onClose }: { onClose: () => void }) {
  const [goods, setGoods] = useState("");
  const [declaredValue, setDeclaredValue] = useState("");
  const [declarantId, setDeclarantId] = useState("");
  const [csearch, setCsearch] = useState("");
  const { data: citizens } = useCitizens(csearch);
  const create = useCreateCustoms();

  function submit() {
    if (!goods.trim()) return;
    create.mutate({ goods, declaredValue: Number(declaredValue) || 0, declarantId: declarantId || undefined }, { onSuccess: onClose });
  }

  return (
    <Card className="mb-4">
      <CardHeader><CardTitle>Neue Warenanmeldung</CardTitle></CardHeader>
      <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2"><Label>Ware *</Label><Input value={goods} onChange={(e) => setGoods(e.target.value)} placeholder="Beschreibung" /></div>
        <div><Label>Deklarierter Wert ($)</Label><Input type="number" value={declaredValue} onChange={(e) => setDeclaredValue(e.target.value)} /></div>
        <div>
          <Label>Anmelder (optional)</Label>
          <Input placeholder="Person suchen…" value={csearch} onChange={(e) => setCsearch(e.target.value)} className="mb-2" />
          <Select value={declarantId} onChange={(e) => setDeclarantId(e.target.value)}>
            <option value="">— keiner —</option>
            {(citizens ?? []).map((c) => <option key={c.id} value={c.id}>{c.lastName}, {c.firstName}</option>)}
          </Select>
        </div>
        <div className="flex gap-2 sm:col-span-2">
          <Button onClick={submit} disabled={!goods.trim() || create.isPending}>Anmelden</Button>
          <Button variant="ghost" onClick={onClose}>Abbrechen</Button>
        </div>
      </CardBody>
    </Card>
  );
}

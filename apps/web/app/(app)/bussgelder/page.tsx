"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useFines,
  useIssueFine,
  useFineAction,
  useCitizens,
  usePenalCodes,
} from "@/lib/hooks";
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
const STATUS_FILTERS = [
  { key: "UNPAID", label: "Offen" },
  { key: "PAID", label: "Bezahlt" },
  { key: "WAIVED", label: "Erlassen" },
  { key: "ALL", label: "Alle" },
];
const STATUS_TONE: Record<string, "amber" | "green" | "gray"> = {
  UNPAID: "amber", PAID: "green", WAIVED: "gray", CONTESTED: "amber",
};
const STATUS_LABEL: Record<string, string> = {
  UNPAID: "Offen", PAID: "Bezahlt", WAIVED: "Erlassen", CONTESTED: "Einspruch",
};

export default function BussgelderPage() {
  const [status, setStatus] = useState("UNPAID");
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading, error } = useFines(status);
  const pay = useFineAction("pay");
  const waive = useFineAction("waive");

  return (
    <div>
      <PageHeader
        title="Bußgelder"
        subtitle="Ausstellen — Geld wird in-game über die Lua-Bridge eingezogen"
        actions={<Button onClick={() => setShowForm((s) => !s)}>{showForm ? "Abbrechen" : "+ Bußgeld"}</Button>}
      />

      {showForm && <FineForm onClose={() => setShowForm(false)} />}

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
        <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
      ) : error ? (
        <ErrorState error={error} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="Keine Bußgelder" hint="Stelle das erste Bußgeld aus." />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Person</TH>
              <TH>Delikt</TH>
              <TH>Betrag</TH>
              <TH>Status</TH>
              <TH>Ausgestellt</TH>
              <TH className="text-right">Aktionen</TH>
            </TR>
          </THead>
          <tbody>
            {data.map((f) => (
              <TR key={f.id}>
                <TD className="font-medium">
                  {f.citizen ? (
                    <Link href={`/citizens/${f.citizen.id}`} className="hover:underline">
                      {f.citizen.lastName}, {f.citizen.firstName}
                    </Link>
                  ) : "—"}
                </TD>
                <TD>{f.penalCode?.title ?? "—"}</TD>
                <TD className="font-mono">{money(f.amount)}</TD>
                <TD><Badge tone={STATUS_TONE[f.status] ?? "gray"}>{STATUS_LABEL[f.status] ?? f.status}</Badge></TD>
                <TD>{formatDate(f.issuedAt)}</TD>
                <TD>
                  <div className="flex justify-end gap-1.5">
                    {f.status === "UNPAID" && (
                      <>
                        <Button size="sm" variant="outline" disabled={pay.isPending} onClick={() => pay.mutate(f.id)}>Bezahlt</Button>
                        <Button size="sm" variant="ghost" disabled={waive.isPending} onClick={() => waive.mutate(f.id)}>Erlassen</Button>
                      </>
                    )}
                  </div>
                </TD>
              </TR>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}

function FineForm({ onClose }: { onClose: () => void }) {
  const [citizenId, setCitizenId] = useState("");
  const [csearch, setCsearch] = useState("");
  const [penalCodeId, setPenalCodeId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [collectInGame, setCollectInGame] = useState(true);
  const { data: citizens } = useCitizens(csearch);
  const { data: codes } = usePenalCodes("", "");
  const issue = useIssueFine();

  function onPickCode(id: string) {
    setPenalCodeId(id);
    const pc = codes?.find((c) => c.id === id);
    if (pc && !amount) setAmount(String(pc.fineMin || pc.fineMax || ""));
  }
  function submit() {
    const amt = Number(amount);
    if (!citizenId || !amt) return;
    issue.mutate(
      { citizenId, penalCodeId: penalCodeId || undefined, amount: amt, reason: reason || undefined, collectInGame },
      { onSuccess: onClose },
    );
  }

  return (
    <Card className="mb-4">
      <CardHeader><CardTitle>Bußgeld ausstellen</CardTitle></CardHeader>
      <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label>Person *</Label>
          <Input placeholder="Person suchen…" value={csearch} onChange={(e) => setCsearch(e.target.value)} className="mb-2" />
          <Select value={citizenId} onChange={(e) => setCitizenId(e.target.value)}>
            <option value="">— Person wählen —</option>
            {(citizens ?? []).map((c) => <option key={c.id} value={c.id}>{c.lastName}, {c.firstName}</option>)}
          </Select>
        </div>
        <div>
          <Label>Delikt (optional, setzt Betrag)</Label>
          <Select value={penalCodeId} onChange={(e) => onPickCode(e.target.value)}>
            <option value="">— frei —</option>
            {(codes ?? []).map((p) => <option key={p.id} value={p.id}>{p.code} · {p.title}</option>)}
          </Select>
        </div>
        <div><Label>Betrag ($) *</Label><Input type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} /></div>
        <div className="sm:col-span-2"><Label>Grund (optional)</Label><Input value={reason} onChange={(e) => setReason(e.target.value)} /></div>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" checked={collectInGame} onChange={(e) => setCollectInGame(e.target.checked)} />
          Betrag in-game vom Spieler einziehen (Lua-Bridge)
        </label>
        <div className="flex gap-2 sm:col-span-2">
          <Button onClick={submit} disabled={!citizenId || !Number(amount) || issue.isPending}>Ausstellen</Button>
          <Button variant="ghost" onClick={onClose}>Abbrechen</Button>
        </div>
      </CardBody>
    </Card>
  );
}

"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  useCitizen,
  usePenalCodes,
  useCreateCitizenRecord,
  useCreateWarrant,
  useWarrantAction,
  useIssueFine,
  useFineAction,
  useBookJail,
} from "@/lib/hooks";
import type { Citizen, ThreatLevel } from "@/lib/types";
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
  Spinner,
  EmptyState,
  ErrorState,
  PageHeader,
} from "@/components/ui";
import { cn } from "@aktensystem/ui";
import { formatDate } from "@/lib/format";

const money = (n: number) => `${n.toLocaleString("de-DE")} $`;

const THREAT: Record<ThreatLevel, { label: string; tone: "green" | "amber" | "red" | "purple"; icon: string }> = {
  KEINE: { label: "Unbescholten", tone: "green", icon: "✓" },
  BEOBACHTEN: { label: "Beobachten", tone: "amber", icon: "👁" },
  GESUCHT: { label: "Gesucht", tone: "red", icon: "🚨" },
  GEFAEHRLICH: { label: "Gefährlich", tone: "purple", icon: "☠" },
};

const CLASS_LABEL: Record<string, string> = {
  INFRACTION: "Owi", MISDEMEANOR: "Vergehen", FELONY: "Verbrechen",
};
const CLASS_TONE: Record<string, "green" | "amber" | "red"> = {
  INFRACTION: "green", MISDEMEANOR: "amber", FELONY: "red",
};

const TABS = ["Übersicht", "Strafakten", "Anklagen", "Haftbefehle", "Fahrzeuge"] as const;
type Tab = (typeof TABS)[number];

export default function CitizenProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading, error } = useCitizen(id);
  const [tab, setTab] = useState<Tab>("Übersicht");
  const [showRecord, setShowRecord] = useState(false);
  const [showWarrant, setShowWarrant] = useState(false);
  const [showFine, setShowFine] = useState(false);
  const [showJail, setShowJail] = useState(false);

  if (isLoading)
    return (
      <Card><CardBody className="flex items-center gap-2 text-sm text-muted-foreground"><Spinner /> Lädt Bürgerakte…</CardBody></Card>
    );
  if (error) return <ErrorState error={error} />;
  if (!data) return <EmptyState title="Bürger nicht gefunden" />;

  const threat = THREAT[data.threatLevel ?? "KEINE"];
  const fullName = `${data.lastName}, ${data.firstName}`;

  return (
    <div>
      <PageHeader
        title={fullName}
        subtitle="Bürgerakte"
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setShowJail((s) => !s)}>+ Haft</Button>
            <Button variant="outline" onClick={() => setShowFine((s) => !s)}>+ Bußgeld</Button>
            <Button variant="outline" onClick={() => setShowWarrant((s) => !s)}>+ Haftbefehl</Button>
            <Button onClick={() => setShowRecord((s) => !s)}>+ Strafakte</Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        {/* Steckbrief */}
        <div className="space-y-4">
          <Card>
            <CardBody className="space-y-3">
              <div className="flex h-40 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                {data.photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={data.photo} alt={fullName} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-5xl text-muted-foreground">👤</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="font-medium">{fullName}</span>
                <Badge tone={threat.tone}>{threat.icon} {threat.label}</Badge>
              </div>
              <dl className="space-y-1 text-sm text-muted-foreground">
                <Row k="Geburtsdatum" v={data.dateOfBirth ? formatDate(data.dateOfBirth) : "—"} />
                <Row k="Geschlecht" v={data.gender ?? "—"} />
                <Row k="Telefon" v={data.phone ?? "—"} />
                <Row k="Adresse" v={data.address ?? "—"} />
                <Row k="CharID" v={data.fivemCharId ?? "—"} mono />
              </dl>
            </CardBody>
          </Card>

          <StatCard data={data} />
        </div>

        {/* Tabs + Inhalt */}
        <div className="space-y-4">
          {showRecord && <RecordForm citizenId={id} onClose={() => setShowRecord(false)} />}
          {showWarrant && <WarrantForm citizenId={id} onClose={() => setShowWarrant(false)} />}
          {showFine && <FineForm citizenId={id} onClose={() => setShowFine(false)} />}
          {showJail && <JailForm citizenId={id} onClose={() => setShowJail(false)} />}

          <div className="flex gap-1 border-b border-border">
            {TABS.map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={cn(
                  "border-b-2 px-3 py-2 text-sm",
                  tab === t
                    ? "border-primary font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {t}
              </button>
            ))}
          </div>

          {tab === "Übersicht" && <OverviewTab data={data} />}
          {tab === "Strafakten" && <RecordsTab data={data} />}
          {tab === "Anklagen" && <ChargesTab data={data} />}
          {tab === "Haftbefehle" && <WarrantsTab data={data} />}
          {tab === "Fahrzeuge" && <VehiclesTab data={data} />}
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <dt>{k}</dt>
      <dd className={cn("text-foreground", mono && "font-mono text-xs")}>{v}</dd>
    </div>
  );
}

function StatCard({ data }: { data: Citizen }) {
  const activeWarrants = (data.warrants ?? []).filter((w) => w.status === "ACTIVE").length;
  const stats = [
    { label: "Akten", value: data.caseFiles?.length ?? 0 },
    { label: "Anklagen", value: data.charges?.length ?? 0 },
    { label: "Haftbefehle", value: activeWarrants },
    { label: "Fahrzeuge", value: data.vehicles?.length ?? 0 },
  ];
  return (
    <Card>
      <CardBody className="grid grid-cols-2 gap-3 text-center">
        {stats.map((s) => (
          <div key={s.label}>
            <div className="text-2xl font-semibold">{s.value}</div>
            <div className="text-xs text-muted-foreground">{s.label}</div>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}

function OverviewTab({ data }: { data: Citizen }) {
  const active = (data.warrants ?? []).filter((w) => w.status === "ACTIVE");
  const bolos = (data.bolos ?? []).filter((b) => b.active);
  return (
    <div className="space-y-4">
      {active.length > 0 && (
        <Card>
          <CardHeader><CardTitle>⚠ Aktive Haftbefehle</CardTitle></CardHeader>
          <CardBody className="space-y-2">
            {active.map((w) => (
              <div key={w.id} className="flex items-center justify-between text-sm">
                <span>{w.title ?? w.reason}</span>
                <Badge tone={w.priority === "HIGH" ? "red" : w.priority === "LOW" ? "gray" : "amber"}>{w.priority}</Badge>
              </div>
            ))}
          </CardBody>
        </Card>
      )}
      {bolos.length > 0 && (
        <Card>
          <CardHeader><CardTitle>🔎 Fahndungen</CardTitle></CardHeader>
          <CardBody className="space-y-2">
            {bolos.map((b) => (
              <div key={b.id} className="text-sm"><span className="font-medium">{b.title}</span> — {b.description}</div>
            ))}
          </CardBody>
        </Card>
      )}
      <Card>
        <CardHeader><CardTitle>Letzte Akten</CardTitle></CardHeader>
        <CardBody>
          {(data.caseFiles ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">Keine Akten.</p>
          ) : (
            <ul className="space-y-1 text-sm">
              {data.caseFiles!.slice(0, 5).map((f) => (
                <li key={f.id} className="flex items-center justify-between">
                  <Link href={`/case-files/${f.id}`} className="hover:underline">{f.title}</Link>
                  <Badge tone="blue">{f.type}</Badge>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function RecordsTab({ data }: { data: Citizen }) {
  if (!data.caseFiles || data.caseFiles.length === 0) return <EmptyState title="Keine Strafakten" />;
  return (
    <div className="space-y-2">
      {data.caseFiles.map((f) => (
        <Card key={f.id}>
          <CardBody className="flex items-center justify-between">
            <div>
              <Link href={`/case-files/${f.id}`} className="font-medium hover:underline">{f.title}</Link>
              <div className="text-xs text-muted-foreground">{f.type} · {f.status}{f.createdAt ? ` · ${formatDate(f.createdAt)}` : ""}</div>
            </div>
            <Badge tone="blue">{f.securityLevel}</Badge>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

function ChargesTab({ data }: { data: Citizen }) {
  const charges = data.charges ?? [];
  const fines = data.fines ?? [];
  const pay = useFineAction("pay");
  const waive = useFineAction("waive");
  if (charges.length === 0 && fines.length === 0) return <EmptyState title="Keine Anklagen oder Bußgelder" />;
  return (
    <div className="space-y-4">
      {charges.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Anklagepunkte</CardTitle></CardHeader>
          <CardBody className="space-y-2">
            {charges.map((c) => (
              <div key={c.id} className="flex items-center justify-between text-sm">
                <span>
                  {c.count > 1 ? `${c.count}× ` : ""}
                  {c.penalCode ? `${c.penalCode.code} · ${c.penalCode.title}` : "Unbekannt"}
                  {c.notes ? <span className="text-muted-foreground"> — {c.notes}</span> : null}
                </span>
                {c.penalCode && <Badge tone={CLASS_TONE[c.penalCode.class] ?? "default"}>{CLASS_LABEL[c.penalCode.class] ?? c.penalCode.class}</Badge>}
              </div>
            ))}
          </CardBody>
        </Card>
      )}
      {fines.length > 0 && (
        <Card>
          <CardHeader><CardTitle>Bußgelder</CardTitle></CardHeader>
          <CardBody className="space-y-2">
            {fines.map((f) => (
              <div key={f.id} className="flex items-center justify-between gap-2 text-sm">
                <span>{f.penalCode?.title ?? "Bußgeld"}</span>
                <span className="flex items-center gap-2">
                  <span className="font-mono">{money(f.amount)}</span>
                  <Badge tone={f.status === "PAID" ? "green" : f.status === "WAIVED" ? "gray" : "amber"}>{f.status}</Badge>
                  {f.status === "UNPAID" && (
                    <>
                      <Button size="sm" variant="outline" disabled={pay.isPending} onClick={() => pay.mutate(f.id)}>Bezahlt</Button>
                      <Button size="sm" variant="ghost" disabled={waive.isPending} onClick={() => waive.mutate(f.id)}>Erlassen</Button>
                    </>
                  )}
                </span>
              </div>
            ))}
          </CardBody>
        </Card>
      )}
    </div>
  );
}

function WarrantsTab({ data }: { data: Citizen }) {
  const execute = useWarrantAction("execute");
  const cancel = useWarrantAction("cancel");
  const warrants = data.warrants ?? [];
  if (warrants.length === 0) return <EmptyState title="Keine Haftbefehle" />;
  return (
    <div className="space-y-2">
      {warrants.map((w) => (
        <Card key={w.id}>
          <CardBody className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-medium">{w.title ?? w.reason}</div>
                <div className="text-xs text-muted-foreground">{w.type} · {formatDate(w.issuedAt)}</div>
              </div>
              <Badge tone={w.status === "ACTIVE" ? "red" : w.status === "EXECUTED" ? "green" : "gray"}>{w.status}</Badge>
            </div>
            {w.reason && <p className="text-sm text-muted-foreground">{w.reason}</p>}
            {w.status === "ACTIVE" && (
              <div className="flex gap-2">
                <Button size="sm" onClick={() => execute.mutate(w.id)} disabled={execute.isPending}>Vollstrecken</Button>
                <Button size="sm" variant="outline" onClick={() => cancel.mutate(w.id)} disabled={cancel.isPending}>Widerrufen</Button>
              </div>
            )}
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

function VehiclesTab({ data }: { data: Citizen }) {
  if (!data.vehicles || data.vehicles.length === 0) return <EmptyState title="Keine Fahrzeuge" />;
  return (
    <div className="space-y-2">
      {data.vehicles.map((v) => (
        <Card key={v.id}>
          <CardBody className="flex items-center justify-between">
            <Link href={`/vehicles?plate=${v.plate}`} className="font-mono font-medium hover:underline">{v.plate}</Link>
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              {v.model ?? "—"}
              {v.stolen && <Badge tone="red">Gestohlen</Badge>}
              {v.impounded && <Badge tone="amber">Beschlagnahmt</Badge>}
            </span>
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

/* ---------------- Strafakte anlegen ---------------- */
function RecordForm({ citizenId, onClose }: { citizenId: string; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [charges, setCharges] = useState<Array<{ penalCodeId: string; count: number; notes: string }>>([]);
  const { data: codes } = usePenalCodes("", "");
  const create = useCreateCitizenRecord(citizenId);

  function addCharge() {
    const first = codes?.[0]?.id ?? "";
    setCharges((c) => [...c, { penalCodeId: first, count: 1, notes: "" }]);
  }
  function setCharge(i: number, patch: Partial<{ penalCodeId: string; count: number; notes: string }>) {
    setCharges((c) => c.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  }
  function submit() {
    create.mutate(
      {
        title,
        summary: summary || undefined,
        charges: charges.filter((c) => c.penalCodeId).map((c) => ({
          penalCodeId: c.penalCodeId, count: c.count, notes: c.notes || undefined,
        })),
      },
      { onSuccess: onClose },
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>Strafakte anlegen</CardTitle></CardHeader>
      <CardBody className="space-y-3">
        <div><Label>Titel *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="z. B. Raub Vespucci Beach" /></div>
        <div><Label>Sachverhalt</Label><Textarea rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} /></div>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Anklagepunkte</Label>
            <Button size="sm" variant="outline" onClick={addCharge}>+ Punkt</Button>
          </div>
          {charges.map((c, i) => (
            <div key={i} className="grid grid-cols-[1fr_70px_1fr_auto] items-end gap-2">
              <Select value={c.penalCodeId} onChange={(e) => setCharge(i, { penalCodeId: e.target.value })}>
                {(codes ?? []).map((p) => <option key={p.id} value={p.id}>{p.code} · {p.title}</option>)}
              </Select>
              <Input type="number" min={1} value={c.count} onChange={(e) => setCharge(i, { count: Number(e.target.value) || 1 })} />
              <Input placeholder="Notiz" value={c.notes} onChange={(e) => setCharge(i, { notes: e.target.value })} />
              <Button size="sm" variant="ghost" onClick={() => setCharges((arr) => arr.filter((_, j) => j !== i))}>✕</Button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Button onClick={submit} disabled={!title || create.isPending}>{create.isPending ? "Speichern…" : "Akte anlegen"}</Button>
          <Button variant="ghost" onClick={onClose}>Abbrechen</Button>
        </div>
      </CardBody>
    </Card>
  );
}

/* ---------------- Haftbefehl anlegen ---------------- */
function WarrantForm({ citizenId, onClose }: { citizenId: string; onClose: () => void }) {
  const [title, setTitle] = useState("");
  const [reason, setReason] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [type, setType] = useState("ARREST");
  const create = useCreateWarrant();

  function submit() {
    create.mutate(
      { citizenId, title, reason, priority, type },
      { onSuccess: onClose },
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>Haftbefehl ausstellen</CardTitle></CardHeader>
      <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2"><Label>Titel *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div className="sm:col-span-2"><Label>Begründung *</Label><Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} /></div>
        <div><Label>Priorität</Label>
          <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
            <option value="LOW">Niedrig</option><option value="MEDIUM">Mittel</option><option value="HIGH">Hoch</option>
          </Select>
        </div>
        <div><Label>Art</Label>
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="ARREST">Haftbefehl</option><option value="SEARCH">Durchsuchung</option><option value="BENCH">Vorführung</option>
          </Select>
        </div>
        <div className="flex gap-2 sm:col-span-2">
          <Button onClick={submit} disabled={!title || !reason || create.isPending}>Ausstellen</Button>
          <Button variant="ghost" onClick={onClose}>Abbrechen</Button>
        </div>
      </CardBody>
    </Card>
  );
}

/* ---------------- Bußgeld ausstellen (Geld in-game via Lua) ---------------- */
function FineForm({ citizenId, onClose }: { citizenId: string; onClose: () => void }) {
  const [penalCodeId, setPenalCodeId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [collectInGame, setCollectInGame] = useState(true);
  const { data: codes } = usePenalCodes("", "");
  const issue = useIssueFine();

  function onPickCode(id: string) {
    setPenalCodeId(id);
    const pc = codes?.find((c) => c.id === id);
    if (pc && !amount) setAmount(String(pc.fineMin || pc.fineMax || ""));
  }
  function submit() {
    const amt = Number(amount);
    if (!amt) return;
    issue.mutate(
      { citizenId, penalCodeId: penalCodeId || undefined, amount: amt, reason: reason || undefined, collectInGame },
      { onSuccess: onClose },
    );
  }

  return (
    <Card>
      <CardHeader><CardTitle>Bußgeld ausstellen</CardTitle></CardHeader>
      <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <Label>Delikt (optional)</Label>
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
          <Button onClick={submit} disabled={!Number(amount) || issue.isPending}>Ausstellen</Button>
          <Button variant="ghost" onClick={onClose}>Abbrechen</Button>
        </div>
      </CardBody>
    </Card>
  );
}

/* ---------------- In Haft nehmen (Jail in-game via Lua) ---------------- */
function JailForm({ citizenId, onClose }: { citizenId: string; onClose: () => void }) {
  const [minutes, setMinutes] = useState("30");
  const [reason, setReason] = useState("");
  const [cell, setCell] = useState("");
  const book = useBookJail();

  function submit() {
    const m = Number(minutes);
    if (!m || !reason) return;
    book.mutate({ citizenId, minutes: m, reason, cell: cell || undefined }, { onSuccess: onClose });
  }

  return (
    <Card>
      <CardHeader><CardTitle>In Haft nehmen</CardTitle></CardHeader>
      <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div><Label>Dauer (Minuten) *</Label><Input type="number" min={1} max={600} value={minutes} onChange={(e) => setMinutes(e.target.value)} /></div>
        <div><Label>Zelle (optional)</Label><Input value={cell} onChange={(e) => setCell(e.target.value)} /></div>
        <div className="sm:col-span-2"><Label>Grund *</Label><Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} /></div>
        <div className="flex gap-2 sm:col-span-2">
          <Button onClick={submit} disabled={!Number(minutes) || !reason || book.isPending}>In Haft nehmen</Button>
          <Button variant="ghost" onClick={onClose}>Abbrechen</Button>
        </div>
      </CardBody>
    </Card>
  );
}

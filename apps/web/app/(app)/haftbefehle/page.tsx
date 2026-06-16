"use client";

import { useState } from "react";
import Link from "next/link";
import {
  useWarrants,
  useWarrant,
  useCreateWarrant,
  useWarrantAction,
  useCitizens,
} from "@/lib/hooks";
import type { Warrant } from "@/lib/types";
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
  { key: "ACTIVE", label: "Aktiv" },
  { key: "EXECUTED", label: "Vollstreckt" },
  { key: "RECALLED", label: "Widerrufen" },
  { key: "ALL", label: "Alle" },
];
const PRIO_TONE: Record<string, "red" | "amber" | "gray"> = { HIGH: "red", MEDIUM: "amber", LOW: "gray" };
const STATUS_TONE: Record<string, "red" | "green" | "gray"> = { ACTIVE: "red", EXECUTED: "green", RECALLED: "gray", EXPIRED: "gray" };
const TYPE_LABEL: Record<string, string> = { ARREST: "Haftbefehl", SEARCH: "Durchsuchung", BENCH: "Vorführung" };

export default function HaftbefehlePage() {
  const [status, setStatus] = useState("ACTIVE");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading, error } = useWarrants(status, q);

  return (
    <div>
      <PageHeader
        title="Haftbefehle"
        subtitle="Ausstellen, vollstrecken, widerrufen"
        actions={<Button onClick={() => setShowForm((s) => !s)}>{showForm ? "Abbrechen" : "+ Haftbefehl"}</Button>}
      />

      {showForm && <WarrantForm onClose={() => setShowForm(false)} />}

      <div className="mb-3 flex flex-wrap items-center gap-2">
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
        <Input placeholder="Person suchen…" value={q} onChange={(e) => setQ(e.target.value)} className="ml-auto max-w-xs" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_360px]">
        <div>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : error ? (
            <ErrorState error={error} />
          ) : !data || data.length === 0 ? (
            <EmptyState title="Keine Haftbefehle" hint="Stelle den ersten Haftbefehl aus." />
          ) : (
            <div className="space-y-2">
              {data.map((w) => (
                <Card
                  key={w.id}
                  className={cn("cursor-pointer", selected === w.id && "ring-1 ring-primary")}
                  onClick={() => setSelected(w.id)}
                >
                  <CardBody className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-medium">{w.title ?? w.reason}</div>
                      <div className="text-xs text-muted-foreground">
                        {w.citizen ? `${w.citizen.lastName}, ${w.citizen.firstName}` : "—"} · {TYPE_LABEL[w.type] ?? w.type} · {formatDate(w.issuedAt)}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge tone={PRIO_TONE[w.priority] ?? "gray"}>{w.priority}</Badge>
                      <Badge tone={STATUS_TONE[w.status] ?? "gray"}>{w.status}</Badge>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div>{selected && <WarrantDetail id={selected} />}</div>
      </div>
    </div>
  );
}

function WarrantDetail({ id }: { id: string }) {
  const { data, isLoading } = useWarrant(id);
  const execute = useWarrantAction("execute");
  const cancel = useWarrantAction("cancel");
  if (isLoading || !data) return <Card><CardBody className="text-sm text-muted-foreground">Lädt…</CardBody></Card>;

  return (
    <Card className="sticky top-4">
      <CardHeader className="flex items-center justify-between">
        <CardTitle>{data.title ?? "Haftbefehl"}</CardTitle>
        <Badge tone={STATUS_TONE[data.status] ?? "gray"}>{data.status}</Badge>
      </CardHeader>
      <CardBody className="space-y-3 text-sm">
        {data.citizen && (
          <div>
            <Label>Person</Label>
            <Link href={`/citizens/${data.citizen.id}`} className="font-medium hover:underline">
              {data.citizen.lastName}, {data.citizen.firstName}
            </Link>
          </div>
        )}
        <div><Label>Art</Label><div>{TYPE_LABEL[data.type] ?? data.type}</div></div>
        <div><Label>Priorität</Label><Badge tone={PRIO_TONE[data.priority] ?? "gray"}>{data.priority}</Badge></div>
        <div><Label>Begründung</Label><p className="text-muted-foreground">{data.reason}</p></div>
        {data.caseFile && (
          <div><Label>Verknüpfte Akte</Label>
            <Link href={`/case-files/${data.caseFile.id}`} className="text-primary hover:underline">{data.caseFile.title}</Link>
          </div>
        )}
        <div><Label>Ausgestellt</Label><div className="text-muted-foreground">{formatDate(data.issuedAt)}</div></div>
        {data.status === "ACTIVE" && (
          <div className="flex gap-2 pt-1">
            <Button size="sm" onClick={() => execute.mutate(data.id)} disabled={execute.isPending}>Vollstrecken</Button>
            <Button size="sm" variant="outline" onClick={() => cancel.mutate(data.id)} disabled={cancel.isPending}>Widerrufen</Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

function WarrantForm({ onClose }: { onClose: () => void }) {
  const [citizenId, setCitizenId] = useState("");
  const [csearch, setCsearch] = useState("");
  const [title, setTitle] = useState("");
  const [reason, setReason] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [type, setType] = useState("ARREST");
  const { data: citizens } = useCitizens(csearch);
  const create = useCreateWarrant();

  function submit() {
    if (!citizenId || !title || !reason) return;
    create.mutate({ citizenId, title, reason, priority, type }, { onSuccess: onClose });
  }

  return (
    <Card className="mb-4">
      <CardHeader><CardTitle>Haftbefehl ausstellen</CardTitle></CardHeader>
      <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label>Person *</Label>
          <Input placeholder="Person suchen…" value={csearch} onChange={(e) => setCsearch(e.target.value)} className="mb-2" />
          <Select value={citizenId} onChange={(e) => setCitizenId(e.target.value)}>
            <option value="">— Person wählen —</option>
            {(citizens ?? []).map((c) => <option key={c.id} value={c.id}>{c.lastName}, {c.firstName}</option>)}
          </Select>
        </div>
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
          <Button onClick={submit} disabled={!citizenId || !title || !reason || create.isPending}>Ausstellen</Button>
          <Button variant="ghost" onClick={onClose}>Abbrechen</Button>
        </div>
      </CardBody>
    </Card>
  );
}

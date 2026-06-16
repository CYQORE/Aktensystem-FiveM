"use client";

import { useState } from "react";
import {
  useCourtCases,
  useCourtCase,
  useCreateCourtCase,
  useCourtAction,
  useCitizens,
} from "@/lib/hooks";
import type { CourtCase } from "@/lib/types";
import {
  Button,
  Card,
  CardHeader,
  CardTitle,
  CardBody,
  Badge,
  Input,
  Textarea,
  Select,
  Label,
  Spinner,
  StatusDot,
  EmptyState,
  ErrorState,
  PageHeader,
} from "@/components/ui";
import { formatDate } from "@/lib/format";

const COURT_CASE_TYPES = ["CRIMINAL", "CIVIL", "TRAFFIC", "APPEAL"] as const;
const HEARING_TYPES = [
  "ARRAIGNMENT",
  "PRELIMINARY",
  "TRIAL",
  "SENTENCING",
  "APPEAL",
] as const;
const VERDICT_TYPES = [
  "GUILTY",
  "NOT_GUILTY",
  "DISMISSED",
  "MISTRIAL",
  "PLEA",
] as const;
const SENTENCE_TYPES = [
  "PRISON",
  "FINE",
  "PROBATION",
  "COMMUNITY_SERVICE",
  "DEATH",
] as const;

type StatusTone = "default" | "blue" | "green" | "amber" | "red" | "purple" | "gray";

function statusTone(status: string): StatusTone {
  switch (status) {
    case "FILED":
      return "blue";
    case "SCHEDULED":
      return "amber";
    case "IN_TRIAL":
      return "purple";
    case "CLOSED":
      return "green";
    case "DISMISSED":
      return "gray";
    default:
      return "default";
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case "FILED":
      return "Eingereicht";
    case "SCHEDULED":
      return "Terminiert";
    case "IN_TRIAL":
      return "In Verhandlung";
    case "CLOSED":
      return "Abgeschlossen";
    case "DISMISSED":
      return "Eingestellt";
    default:
      return status;
  }
}

function typeLabel(type: string): string {
  switch (type) {
    case "CRIMINAL":
      return "Strafsache";
    case "CIVIL":
      return "Zivilsache";
    case "TRAFFIC":
      return "Verkehrssache";
    case "APPEAL":
      return "Berufung";
    default:
      return type;
  }
}

function defendantName(c: any): string | undefined {
  const d = c?.defendant;
  if (!d) return undefined;
  if (typeof d === "string") return d;
  const name = [d.firstName, d.lastName].filter(Boolean).join(" ").trim();
  return name || d.name || undefined;
}

export default function JusticePage() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);

  const cases = useCourtCases();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Gericht"
        subtitle="Verfahren, Verhandlungen, Urteile"
        actions={
          <Button variant="primary" onClick={() => setShowForm((v) => !v)}>
            Neues Verfahren
          </Button>
        }
      />

      {showForm && <NewCaseForm onDone={() => setShowForm(false)} refetch={cases.refetch} />}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Verfahren</CardTitle>
            </CardHeader>
            <CardBody>
              {cases.isLoading ? (
                <div className="flex justify-center py-8">
                  <Spinner />
                </div>
              ) : cases.error ? (
                <ErrorState error={cases.error} />
              ) : !cases.data || cases.data.length === 0 ? (
                <EmptyState
                  title="Keine Verfahren"
                  hint="Lege ein neues Verfahren an."
                />
              ) : (
                <ul className="space-y-2">
                  {cases.data.map((c: CourtCase) => {
                    const cc = c as any;
                    const active = cc.id === selectedId;
                    const def = defendantName(cc);
                    return (
                      <li key={cc.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedId(cc.id)}
                          className={`w-full rounded-lg border px-3 py-2 text-left transition-colors ${
                            active
                              ? "border-blue-500/60 bg-blue-500/10"
                              : "border-border hover:bg-white/5"
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-xs text-muted-foreground">
                              #{cc.number}
                            </span>
                            <Badge tone={statusTone(cc.status)}>
                              {statusLabel(cc.status)}
                            </Badge>
                          </div>
                          <div className="mt-1 truncate text-sm font-medium">
                            {cc.title}
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <Badge tone="gray">{typeLabel(cc.type)}</Badge>
                            {def && (
                              <span className="truncate text-xs text-muted-foreground">
                                {def}
                              </span>
                            )}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {selectedId ? (
            <CaseDetail id={selectedId} />
          ) : (
            <Card>
              <CardBody>
                <EmptyState
                  title="Verfahren wählen"
                  hint="Wähle links ein Verfahren aus, um Details zu sehen."
                />
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function NewCaseForm({
  onDone,
  refetch,
}: {
  onDone: () => void;
  refetch: () => void;
}) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<string>("CRIMINAL");
  const [defendantId, setDefendantId] = useState<string>("");

  const citizens = useCitizens("");
  const create = useCreateCourtCase();

  const citizenName = (c: any) =>
    [c.firstName, c.lastName].filter(Boolean).join(" ").trim() || c.name || c.id;

  const submit = async () => {
    if (!title.trim()) return;
    await create.mutateAsync({
      title: title.trim(),
      type,
      defendantId: defendantId || undefined,
    });
    setTitle("");
    setDefendantId("");
    setType("CRIMINAL");
    refetch();
    onDone();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Neues Verfahren</CardTitle>
      </CardHeader>
      <CardBody>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-1">
            <Label>Titel</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Bezeichnung des Verfahrens"
            />
          </div>
          <div>
            <Label>Typ</Label>
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              {COURT_CASE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {typeLabel(t)}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Angeklagter</Label>
            <Select
              value={defendantId}
              onChange={(e) => setDefendantId(e.target.value)}
              disabled={citizens.isLoading}
            >
              <option value="">— Optional —</option>
              {citizens.data?.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {citizenName(c)}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="mt-4 flex gap-2">
          <Button
            variant="primary"
            onClick={submit}
            disabled={create.isPending || !title.trim()}
          >
            {create.isPending ? "Speichern…" : "Anlegen"}
          </Button>
          <Button variant="ghost" onClick={onDone}>
            Abbrechen
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function CaseDetail({ id }: { id: string }) {
  const detail = useCourtCase(id);

  if (detail.isLoading) {
    return (
      <Card>
        <CardBody>
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        </CardBody>
      </Card>
    );
  }

  if (detail.error) {
    return (
      <Card>
        <CardBody>
          <ErrorState error={detail.error} />
        </CardBody>
      </Card>
    );
  }

  if (!detail.data) {
    return (
      <Card>
        <CardBody>
          <EmptyState title="Nicht gefunden" hint="Verfahren existiert nicht." />
        </CardBody>
      </Card>
    );
  }

  const c = detail.data as any;
  const def = defendantName(c);
  const hearings: any[] = c.hearings ?? [];
  const verdicts: any[] = c.verdicts ?? [];
  const sentences: any[] = c.sentences ?? [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <StatusDot tone={statusTone(c.status)} />
                <CardTitle>{c.title}</CardTitle>
              </div>
              <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-mono">#{c.number}</span>
                <Badge tone="gray">{typeLabel(c.type)}</Badge>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge tone={statusTone(c.status)}>{statusLabel(c.status)}</Badge>
              {def && (
                <span className="text-xs text-muted-foreground">
                  Angeklagter: {def}
                </span>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <HearingsSection caseId={id} hearings={hearings} refetch={detail.refetch} />
      <VerdictsSection caseId={id} verdicts={verdicts} refetch={detail.refetch} />
      <SentencesSection caseId={id} sentences={sentences} refetch={detail.refetch} />
    </div>
  );
}

function HearingsSection({
  caseId,
  hearings,
  refetch,
}: {
  caseId: string;
  hearings: any[];
  refetch: () => void;
}) {
  const [type, setType] = useState<string>("ARRAIGNMENT");
  const [scheduledAt, setScheduledAt] = useState("");
  const [room, setRoom] = useState("");
  const [notes, setNotes] = useState("");

  const action = useCourtAction(caseId, "hearings");

  const submit = async () => {
    if (!scheduledAt) return;
    await action.mutateAsync({
      type,
      scheduledAt: new Date(scheduledAt).toISOString(),
      room,
      notes,
    });
    setScheduledAt("");
    setRoom("");
    setNotes("");
    setType("ARRAIGNMENT");
    refetch();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Verhandlungen</CardTitle>
      </CardHeader>
      <CardBody>
        {hearings.length === 0 ? (
          <EmptyState title="Keine Verhandlungen" hint="Plane einen Termin." />
        ) : (
          <ol className="relative space-y-4 border-l border-border pl-5">
            {hearings.map((h, i) => (
              <li key={h.id ?? i} className="relative">
                <span className="absolute -left-[1.6rem] top-1 flex h-3 w-3 items-center justify-center">
                  <StatusDot tone="blue" />
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge tone="blue">{h.type}</Badge>
                  <span className="text-sm">{formatDate(h.scheduledAt)}</span>
                  {h.room && (
                    <span className="text-xs text-muted-foreground">
                      Saal: {h.room}
                    </span>
                  )}
                </div>
                {h.notes && (
                  <p className="mt-1 text-sm text-muted-foreground">{h.notes}</p>
                )}
              </li>
            ))}
          </ol>
        )}

        <div className="mt-6 grid gap-4 border-t border-border pt-4 md:grid-cols-2">
          <div>
            <Label>Typ</Label>
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              {HEARING_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Termin</Label>
            <Input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
            />
          </div>
          <div>
            <Label>Saal</Label>
            <Input value={room} onChange={(e) => setRoom(e.target.value)} />
          </div>
          <div>
            <Label>Notizen</Label>
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
        </div>
        <div className="mt-4">
          <Button
            variant="secondary"
            onClick={submit}
            disabled={action.isPending || !scheduledAt}
          >
            {action.isPending ? "Speichern…" : "Termin hinzufügen"}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function VerdictsSection({
  caseId,
  verdicts,
  refetch,
}: {
  caseId: string;
  verdicts: any[];
  refetch: () => void;
}) {
  const [type, setType] = useState<string>("GUILTY");
  const [summary, setSummary] = useState("");

  const action = useCourtAction(caseId, "verdicts");

  const submit = async () => {
    await action.mutateAsync({ type, summary });
    setSummary("");
    setType("GUILTY");
    refetch();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Urteil</CardTitle>
      </CardHeader>
      <CardBody>
        {verdicts.length === 0 ? (
          <EmptyState title="Kein Urteil" hint="Noch kein Urteil gefällt." />
        ) : (
          <ul className="space-y-3">
            {verdicts.map((v, i) => (
              <li
                key={v.id ?? i}
                className="rounded-lg border border-border p-3"
              >
                <Badge tone={v.type === "GUILTY" ? "red" : "green"}>
                  {v.type}
                </Badge>
                {v.summary && (
                  <p className="mt-2 text-sm text-muted-foreground">{v.summary}</p>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 grid gap-4 border-t border-border pt-4">
          <div>
            <Label>Urteilstyp</Label>
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              {VERDICT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Zusammenfassung</Label>
            <Textarea
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              placeholder="Begründung des Urteils"
            />
          </div>
        </div>
        <div className="mt-4">
          <Button
            variant="secondary"
            onClick={submit}
            disabled={action.isPending}
          >
            {action.isPending ? "Speichern…" : "Urteil erfassen"}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function SentencesSection({
  caseId,
  sentences,
  refetch,
}: {
  caseId: string;
  sentences: any[];
  refetch: () => void;
}) {
  const [type, setType] = useState<string>("PRISON");
  const [jailDays, setJailDays] = useState("");
  const [fineAmount, setFineAmount] = useState("");

  const action = useCourtAction(caseId, "sentences");

  const submit = async () => {
    await action.mutateAsync({
      type,
      jailDays: Number(jailDays) || undefined,
      fineAmount: Number(fineAmount) || undefined,
    });
    setJailDays("");
    setFineAmount("");
    setType("PRISON");
    refetch();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Strafmaß</CardTitle>
      </CardHeader>
      <CardBody>
        {sentences.length === 0 ? (
          <EmptyState title="Kein Strafmaß" hint="Noch kein Strafmaß festgelegt." />
        ) : (
          <ul className="space-y-3">
            {sentences.map((s, i) => (
              <li
                key={s.id ?? i}
                className="flex flex-wrap items-center gap-3 rounded-lg border border-border p-3"
              >
                <Badge tone="amber">{s.type}</Badge>
                {s.jailDays != null && (
                  <span className="text-sm">{s.jailDays} Hafttage</span>
                )}
                {s.fineAmount != null && (
                  <span className="text-sm">{s.fineAmount} € Geldstrafe</span>
                )}
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 grid gap-4 border-t border-border pt-4 md:grid-cols-3">
          <div>
            <Label>Typ</Label>
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              {SENTENCE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Hafttage</Label>
            <Input
              type="number"
              value={jailDays}
              onChange={(e) => setJailDays(e.target.value)}
              placeholder="0"
            />
          </div>
          <div>
            <Label>Geldstrafe (€)</Label>
            <Input
              type="number"
              value={fineAmount}
              onChange={(e) => setFineAmount(e.target.value)}
              placeholder="0"
            />
          </div>
        </div>
        <div className="mt-4">
          <Button
            variant="secondary"
            onClick={submit}
            disabled={action.isPending}
          >
            {action.isPending ? "Speichern…" : "Strafmaß hinzufügen"}
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

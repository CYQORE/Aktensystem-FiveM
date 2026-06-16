"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useCaseFiles,
  useEvidence,
  useEvidenceItem,
  useCreateEvidence,
  useAddCustody,
  useForensicDetail,
  useSaveForensicDetail,
} from "@/lib/hooks";
import type {
  CaseFile,
  EvidenceItem,
  CustodyEvent,
  ForensicDetail,
} from "@/lib/types";
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
  Skeleton,
  StatusDot,
  EmptyState,
  ErrorState,
  PageHeader,
} from "@/components/ui";
import { EvidenceViewer } from "@/components/evidence-viewer";
import { formatDate } from "@/lib/format";

const EVIDENCE_KINDS = [
  "Waffe",
  "Probe/DNA",
  "Dokument",
  "Sonstiges",
] as const;

const CUSTODY_ACTIONS = [
  "entnommen",
  "übergeben",
  "analysiert",
  "eingelagert",
] as const;

const KIND_TONE: Record<
  string,
  "default" | "blue" | "green" | "amber" | "red" | "purple" | "gray"
> = {
  Waffe: "red",
  "Probe/DNA": "purple",
  Dokument: "blue",
  Sonstiges: "gray",
};

function shortId(id: string): string {
  if (!id) return "—";
  return id.length > 8 ? id.slice(0, 8) : id;
}

export default function ForensicsPage() {
  const { data: caseFiles, isLoading, error } = useCaseFiles();
  const [caseFileId, setCaseFileId] = useState("");
  const [selectedEvidenceId, setSelectedEvidenceId] = useState<string | null>(
    null,
  );

  // Auswahl zurücksetzen, wenn Akte wechselt
  function changeCaseFile(id: string) {
    setCaseFileId(id);
    setSelectedEvidenceId(null);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Forensik"
        subtitle="Beweismittel, Chain of Custody, 3D-Analyse"
      />

      {/* Akten-Auswahl */}
      <Card>
        <CardHeader>
          <CardTitle>Forensikakte wählen</CardTitle>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <Skeleton className="h-10 w-full max-w-md" />
          ) : error ? (
            <ErrorState error={error} />
          ) : !caseFiles || caseFiles.length === 0 ? (
            <EmptyState
              title="Keine Akten vorhanden"
              hint="Lege zuerst eine Akte an, um Forensik zu nutzen."
            />
          ) : (
            <div className="max-w-md">
              <Label htmlFor="fx-case">Akte</Label>
              <Select
                id="fx-case"
                value={caseFileId}
                onChange={(e) => changeCaseFile(e.target.value)}
              >
                <option value="">— Akte auswählen —</option>
                {caseFiles.map((cf: CaseFile) => (
                  <option key={cf.id} value={cf.id}>
                    {cf.title}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </CardBody>
      </Card>

      {!caseFileId ? (
        <EmptyState
          title="Forensikakte wählen"
          hint="Wähle oben eine Akte, um Beweismittel zu verwalten."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* LINKS */}
          <div className="space-y-6">
            <EvidencePanel
              caseFileId={caseFileId}
              selectedEvidenceId={selectedEvidenceId}
              onSelect={setSelectedEvidenceId}
            />
            <ForensicDetailPanel caseFileId={caseFileId} />
          </div>

          {/* RECHTS */}
          <div className="space-y-6">
            {selectedEvidenceId ? (
              <EvidenceDetailPanel
                evidenceId={selectedEvidenceId}
                caseFileId={caseFileId}
              />
            ) : (
              <Card>
                <CardBody>
                  <EmptyState
                    title="Kein Beweismittel gewählt"
                    hint="Wähle links ein Beweismittel für 3D-Ansicht und Chain of Custody."
                  />
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function EvidencePanel({
  caseFileId,
  selectedEvidenceId,
  onSelect,
}: {
  caseFileId: string;
  selectedEvidenceId: string | null;
  onSelect: (id: string) => void;
}) {
  const { data, isLoading, error } = useEvidence(caseFileId);
  const create = useCreateEvidence(caseFileId);

  const [label, setLabel] = useState("");
  const [kind, setKind] = useState<string>(EVIDENCE_KINDS[0]);

  function submit() {
    if (!label.trim()) return;
    create.mutate(
      { caseFileId, label: label.trim(), kind },
      {
        onSuccess: () => {
          setLabel("");
          setKind(EVIDENCE_KINDS[0]);
        },
      },
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Beweismittel</CardTitle>
      </CardHeader>
      <CardBody className="space-y-4">
        {/* Liste */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : error ? (
          <ErrorState error={error} />
        ) : !data || data.length === 0 ? (
          <EmptyState
            title="Keine Beweismittel"
            hint="Lege unten das erste Beweismittel an."
          />
        ) : (
          <ul className="space-y-2">
            {data.map((ev: EvidenceItem) => {
              const active = ev.id === selectedEvidenceId;
              return (
                <li key={ev.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(ev.id)}
                    className={`flex w-full items-center justify-between gap-3 rounded-md border px-3 py-2 text-left transition-colors ${
                      active
                        ? "border-primary bg-muted"
                        : "border-border hover:bg-muted/50"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="truncate font-medium">{ev.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {ev.custody?.length ?? 0} Custody-Einträge
                      </div>
                    </div>
                    <Badge tone={KIND_TONE[ev.kind] ?? "default"}>
                      {ev.kind}
                    </Badge>
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {/* Anlage-Formular */}
        <div className="space-y-3 border-t border-border pt-4">
          <div>
            <Label htmlFor="ev-label">Bezeichnung</Label>
            <Input
              id="ev-label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="z.B. Tatwaffe Glock 17"
            />
          </div>
          <div>
            <Label htmlFor="ev-kind">Art</Label>
            <Select
              id="ev-kind"
              value={kind}
              onChange={(e) => setKind(e.target.value)}
            >
              {EVIDENCE_KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </Select>
          </div>
          <Button
            onClick={submit}
            disabled={create.isPending || !label.trim()}
          >
            {create.isPending ? <Spinner /> : null}
            Beweismittel anlegen
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

function ForensicDetailPanel({ caseFileId }: { caseFileId: string }) {
  const { data, isLoading, error } = useForensicDetail(caseFileId);
  const save = useSaveForensicDetail(caseFileId);

  const [form, setForm] = useState({
    dna: "",
    fingerprints: "",
    ballistics: "",
    toxicology: "",
    autopsy: "",
  });
  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (data) {
      setForm({
        dna: data.dna ?? "",
        fingerprints: data.fingerprints ?? "",
        ballistics: data.ballistics ?? "",
        toxicology: data.toxicology ?? "",
        autopsy: data.autopsy ?? "",
      });
    }
  }, [data]);

  const fields: { key: keyof typeof form; label: string }[] = useMemo(
    () => [
      { key: "dna", label: "DNA" },
      { key: "fingerprints", label: "Fingerabdrücke" },
      { key: "ballistics", label: "Ballistik" },
      { key: "toxicology", label: "Toxikologie" },
      { key: "autopsy", label: "Obduktion" },
    ],
    [],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Forensik-Detail</CardTitle>
      </CardHeader>
      <CardBody className="space-y-4">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : error ? (
          <ErrorState error={error} />
        ) : (
          <>
            {fields.map((f) => (
              <div key={f.key}>
                <Label htmlFor={`fd-${f.key}`}>{f.label}</Label>
                <Textarea
                  id={`fd-${f.key}`}
                  rows={3}
                  value={form[f.key]}
                  onChange={(e) => set(f.key, e.target.value)}
                  placeholder={`${f.label}-Befund…`}
                />
              </div>
            ))}
            <Button onClick={() => save.mutate(form)} disabled={save.isPending}>
              {save.isPending ? <Spinner /> : null}
              Speichern
            </Button>
          </>
        )}
      </CardBody>
    </Card>
  );
}

function EvidenceDetailPanel({
  evidenceId,
  caseFileId,
}: {
  evidenceId: string;
  caseFileId: string;
}) {
  const { data: ev, isLoading, error } = useEvidenceItem(evidenceId);
  const addCustody = useAddCustody(evidenceId, caseFileId);

  const [action, setAction] = useState<string>(CUSTODY_ACTIONS[0]);
  const [location, setLocation] = useState("");
  const [note, setNote] = useState("");

  function submit() {
    addCustody.mutate(
      { action, location, note },
      {
        onSuccess: () => {
          setAction(CUSTODY_ACTIONS[0]);
          setLocation("");
          setNote("");
        },
      },
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardBody className="space-y-3">
          <Skeleton className="h-[360px] w-full" />
          <Skeleton className="h-24 w-full" />
        </CardBody>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardBody>
          <ErrorState error={error} />
        </CardBody>
      </Card>
    );
  }

  const custody: CustodyEvent[] = ev?.custody ?? [];
  const sortedCustody = [...custody].sort(
    (a, b) => new Date(a.at).getTime() - new Date(b.at).getTime(),
  );

  return (
    <>
      {/* 3D-Viewer */}
      <Card>
        <CardHeader>
          <CardTitle>3D-Analyse</CardTitle>
        </CardHeader>
        <CardBody>
          <EvidenceViewer kind={ev?.kind ?? "box"} label={ev?.label} />
        </CardBody>
      </Card>

      {/* Chain of Custody */}
      <Card>
        <CardHeader>
          <CardTitle>Chain of Custody</CardTitle>
        </CardHeader>
        <CardBody className="space-y-6">
          {sortedCustody.length === 0 ? (
            <EmptyState
              title="Keine Custody-Einträge"
              hint="Noch keine Beweiskette dokumentiert."
            />
          ) : (
            <ol className="relative space-y-5 border-l border-border pl-6">
              {sortedCustody.map((c) => (
                <li key={c.id} className="relative">
                  <span className="absolute -left-[27px] top-1">
                    <StatusDot tone="blue" />
                  </span>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{c.action}</span>
                    <Badge tone="gray">{shortId(c.byUserId)}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(c.at)}
                    {c.location ? ` · ${c.location}` : ""}
                  </div>
                  {c.note ? (
                    <div className="mt-1 text-sm text-muted-foreground">
                      {c.note}
                    </div>
                  ) : null}
                </li>
              ))}
            </ol>
          )}

          {/* Custody-Formular */}
          <div className="space-y-3 border-t border-border pt-4">
            <div>
              <Label htmlFor="cu-action">Aktion</Label>
              <Select
                id="cu-action"
                value={action}
                onChange={(e) => setAction(e.target.value)}
              >
                {CUSTODY_ACTIONS.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="cu-location">Ort</Label>
              <Input
                id="cu-location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="z.B. Asservatenkammer A"
              />
            </div>
            <div>
              <Label htmlFor="cu-note">Notiz</Label>
              <Input
                id="cu-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Bemerkung (optional)"
              />
            </div>
            <Button onClick={submit} disabled={addCustody.isPending}>
              {addCustody.isPending ? <Spinner /> : null}
              Custody-Eintrag hinzufügen
            </Button>
          </div>
        </CardBody>
      </Card>
    </>
  );
}

"use client";

import { useState } from "react";
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
import { SecurityBadge } from "@aktensystem/ui";
import { useCaseFiles, useCreateCaseFile } from "@/lib/hooks";
import { formatDate, SECURITY_LABEL } from "@/lib/format";
import type { CaseFile } from "@/lib/types";

const CASE_FILE_TYPES = [
  "PERSONENAKTE",
  "ERMITTLUNGSAKTE",
  "STRAFAKTE",
  "FORENSIKAKTE",
  "OBDUKTIONSBERICHT",
  "PATIENTENAKTE",
  "GERICHTSAKTE",
  "STAATSANWALTSCHAFTSAKTE",
  "GEFAENGNISAKTE",
  "UNTERNEHMENSAKTE",
  "VERWALTUNGSAKTE",
] as const;

const SECURITY_LEVELS = [
  "INTERN",
  "VERTRAULICH",
  "BEHOERDENINTERN",
  "GEHEIM",
  "HOCHGEHEIM",
] as const;

const STATUS_TONE: Record<string, "default" | "blue" | "green" | "amber" | "red" | "purple" | "gray"> = {
  ENTWURF: "gray",
  OFFEN: "blue",
  IN_BEARBEITUNG: "amber",
  GESCHLOSSEN: "green",
  ARCHIVIERT: "purple",
};

const STATUS_LABEL: Record<string, string> = {
  ENTWURF: "Entwurf",
  OFFEN: "Offen",
  IN_BEARBEITUNG: "In Bearbeitung",
  GESCHLOSSEN: "Geschlossen",
  ARCHIVIERT: "Archiviert",
};

const TYPE_LABEL: Record<string, string> = {
  PERSONENAKTE: "Personenakte",
  ERMITTLUNGSAKTE: "Ermittlungsakte",
  STRAFAKTE: "Strafakte",
  FORENSIKAKTE: "Forensikakte",
  OBDUKTIONSBERICHT: "Obduktionsbericht",
  PATIENTENAKTE: "Patientenakte",
  GERICHTSAKTE: "Gerichtsakte",
  STAATSANWALTSCHAFTSAKTE: "Staatsanwaltschaftsakte",
  GEFAENGNISAKTE: "Gefängnisakte",
  UNTERNEHMENSAKTE: "Unternehmensakte",
  VERWALTUNGSAKTE: "Verwaltungsakte",
};

type FormState = {
  title: string;
  type: string;
  securityLevel: string;
  summary: string;
  ownerFactionId: string;
};

const EMPTY_FORM: FormState = {
  title: "",
  type: "PERSONENAKTE",
  securityLevel: "INTERN",
  summary: "",
  ownerFactionId: "",
};

function CreateCaseFileForm({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const { mutate, isPending } = useCreateCaseFile();

  const canSubmit = form.title.trim().length > 0 && form.ownerFactionId.trim().length > 0;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit || isPending) return;
    mutate({
      type: form.type,
      title: form.title.trim(),
      summary: form.summary.trim(),
      securityLevel: form.securityLevel,
      ownerFactionId: form.ownerFactionId.trim(),
      status: "ENTWURF",
      linkedCaseFileIds: [],
    });
    setForm(EMPTY_FORM);
    onClose();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Neue Akte anlegen</CardTitle>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1.5 md:col-span-2">
            <Label htmlFor="cf-title">Titel</Label>
            <Input
              id="cf-title"
              value={form.title}
              onChange={(e) => update("title", e.target.value)}
              placeholder="Aktentitel"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cf-type">Typ</Label>
            <Select
              id="cf-type"
              value={form.type}
              onChange={(e) => update("type", e.target.value)}
            >
              {CASE_FILE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {TYPE_LABEL[t]}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="cf-security">Sicherheitsstufe</Label>
            <Select
              id="cf-security"
              value={form.securityLevel}
              onChange={(e) => update("securityLevel", e.target.value)}
            >
              {SECURITY_LEVELS.map((s) => (
                <option key={s} value={s}>
                  {SECURITY_LABEL[s as keyof typeof SECURITY_LABEL] ?? s}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-1.5 md:col-span-2">
            <Label htmlFor="cf-summary">Zusammenfassung</Label>
            <Textarea
              id="cf-summary"
              value={form.summary}
              onChange={(e) => update("summary", e.target.value)}
              placeholder="Kurze Beschreibung der Akte"
              rows={3}
            />
          </div>

          <div className="flex flex-col gap-1.5 md:col-span-2">
            <Label htmlFor="cf-faction">Eigene Fraktion</Label>
            <Input
              id="cf-faction"
              value={form.ownerFactionId}
              onChange={(e) => update("ownerFactionId", e.target.value)}
              placeholder="00000000-0000-0000-0000-000000000000"
              required
            />
            <span className="text-xs text-muted-foreground">UUID der eigenen Fraktion</span>
          </div>

          <div className="flex items-center justify-end gap-2 md:col-span-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={isPending}>
              Abbrechen
            </Button>
            <Button type="submit" variant="primary" disabled={!canSubmit || isPending}>
              {isPending ? "Wird angelegt…" : "Akte anlegen"}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

function CaseFilesTableSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full" />
      ))}
    </div>
  );
}

export default function CaseFilesPage() {
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading, error } = useCaseFiles();

  const caseFiles = (data ?? []) as CaseFile[];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Akten"
        subtitle="Verwaltung aller Akten und Vorgänge"
        actions={
          <Button variant="primary" onClick={() => setShowForm((v) => !v)}>
            {showForm ? "Formular schließen" : "Neue Akte"}
          </Button>
        }
      />

      {showForm && <CreateCaseFileForm onClose={() => setShowForm(false)} />}

      <Card>
        <CardHeader>
          <CardTitle>Aktenübersicht</CardTitle>
        </CardHeader>
        <CardBody>
          {isLoading ? (
            <CaseFilesTableSkeleton />
          ) : error ? (
            <ErrorState error={error} />
          ) : caseFiles.length === 0 ? (
            <EmptyState title="Keine Akten" hint="Lege die erste Akte an." />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Titel</TH>
                  <TH>Typ</TH>
                  <TH>Sicherheitsstufe</TH>
                  <TH>Status</TH>
                  <TH>Aktualisiert</TH>
                </TR>
              </THead>
              <tbody>
                {caseFiles.map((cf) => (
                  <TR key={cf.id}>
                    <TD>
                      <a
                        href={`/case-files/${cf.id}`}
                        className="font-medium text-foreground hover:underline"
                      >
                        {cf.title}
                      </a>
                    </TD>
                    <TD>
                      <Badge tone="blue">{TYPE_LABEL[cf.type] ?? cf.type}</Badge>
                    </TD>
                    <TD>
                      <SecurityBadge sec={cf.securityLevel}>
                        {SECURITY_LABEL[cf.securityLevel as keyof typeof SECURITY_LABEL] ?? cf.securityLevel}
                      </SecurityBadge>
                    </TD>
                    <TD>
                      <Badge tone={STATUS_TONE[cf.status] ?? "default"}>
                        {STATUS_LABEL[cf.status] ?? cf.status}
                      </Badge>
                    </TD>
                    <TD className="text-muted-foreground">{formatDate(cf.updatedAt)}</TD>
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

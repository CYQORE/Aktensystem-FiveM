"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import {
  useCaseFile,
  useUpdateCaseFile,
  useShares,
  useRequestShare,
  useDecideShare,
} from "@/lib/hooks";
import type { FileShare } from "@/lib/types";
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
  Spinner,
  Skeleton,
  EmptyState,
  ErrorState,
  PageHeader,
} from "@/components/ui";
import { SecurityBadge } from "@aktensystem/ui";
import { formatDate, SECURITY_LABEL } from "@/lib/format";

const API_BASE = "http://localhost:4000/api/v1";

const CASE_FILE_STATUS = [
  "ENTWURF",
  "OFFEN",
  "IN_BEARBEITUNG",
  "GESCHLOSSEN",
  "ARCHIVIERT",
] as const;

const SECURITY_LEVELS = [
  "INTERN",
  "VERTRAULICH",
  "BEHOERDENINTERN",
  "GEHEIM",
  "HOCHGEHEIM",
] as const;

const SHARE_TARGET_TYPES = [
  "PERSON",
  "ROLLE",
  "ABTEILUNG",
  "FRAKTION",
  "BEHOERDE",
] as const;

const SHARE_STATUS_TONE: Record<string, "default" | "blue" | "green" | "amber" | "red" | "purple" | "gray"> = {
  PRIVAT: "gray",
  BEANTRAGT: "amber",
  IN_PRUEFUNG: "blue",
  TEILFREIGEGEBEN: "purple",
  VOLLSTAENDIG_FREIGEGEBEN: "green",
  ABGELEHNT: "red",
  WIDERRUFEN: "gray",
};

const SHARE_STATUS_LABEL: Record<string, string> = {
  PRIVAT: "Privat",
  BEANTRAGT: "Beantragt",
  IN_PRUEFUNG: "In Prüfung",
  TEILFREIGEGEBEN: "Teilfreigegeben",
  VOLLSTAENDIG_FREIGEGEBEN: "Vollständig freigegeben",
  ABGELEHNT: "Abgelehnt",
  WIDERRUFEN: "Widerrufen",
};

function shortId(id: string): string {
  if (!id) return "—";
  return id.length > 12 ? `${id.slice(0, 8)}…` : id;
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = React.use(params);
  const { data, isLoading, error } = useCaseFile(id);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-9 w-1/3" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <PageHeader title="Akte" subtitle="Fehler beim Laden" />
        <ErrorState error={error} />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="space-y-6">
        <PageHeader title="Akte" subtitle="Nicht gefunden" />
        <EmptyState
          title="Akte nicht gefunden"
          hint="Diese Akte existiert nicht oder du hast keinen Zugriff."
        />
      </div>
    );
  }

  return <CaseFileDetail id={id} data={data} />;
}

function CaseFileDetail({
  id,
  data,
}: {
  id: string;
  data: import("@/lib/types").CaseFile;
}) {
  const update = useUpdateCaseFile(id);

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [status, setStatus] = useState("");
  const [securityLevel, setSecurityLevel] = useState("");
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    setTitle(data.title ?? "");
    setSummary(data.summary ?? "");
    setStatus(data.status ?? "");
    setSecurityLevel(data.securityLevel ?? "");
  }, [data]);

  const subtitle = useMemo(
    () => `${data.type} · ${data.status}`,
    [data.type, data.status],
  );

  function handleSave() {
    setSaveFailed(false);
    update.mutate(
      { title, summary, status, securityLevel },
      { onError: () => setSaveFailed(true) },
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={data.title}
        subtitle={subtitle}
        actions={
          <>
            <SecurityBadge sec={data.securityLevel as never}>
              {SECURITY_LABEL[data.securityLevel] ?? data.securityLevel}
            </SecurityBadge>
            <a
              href={`${API_BASE}/case-files/${id}/report.pdf`}
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="outline" size="sm">
                PDF-Export
              </Button>
            </a>
          </>
        }
      />

      {/* Editor */}
      <Card>
        <CardHeader>
          <CardTitle>Akte bearbeiten</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <div>
            <Label htmlFor="cf-title">Titel</Label>
            <Input
              id="cf-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Titel der Akte"
            />
          </div>

          <div>
            <Label htmlFor="cf-summary">Zusammenfassung</Label>
            <Textarea
              id="cf-summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={4}
              placeholder="Kurzbeschreibung des Sachverhalts"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="cf-status">Status</Label>
              <Select
                id="cf-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {CASE_FILE_STATUS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="cf-sec">Sicherheitsstufe</Label>
              <Select
                id="cf-sec"
                value={securityLevel}
                onChange={(e) => setSecurityLevel(e.target.value)}
              >
                {SECURITY_LEVELS.map((s) => (
                  <option key={s} value={s}>
                    {SECURITY_LABEL[s] ?? s}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={update.isPending}>
              {update.isPending ? <Spinner /> : null}
              Speichern
            </Button>
            {saveFailed ? (
              <span className="text-xs text-destructive">
                Speichern fehlgeschlagen.
              </span>
            ) : null}
          </div>
        </CardBody>
      </Card>

      {/* Dokumente */}
      <Card>
        <CardHeader>
          <CardTitle>Dokumente</CardTitle>
        </CardHeader>
        <CardBody>
          {!data.documents || data.documents.length === 0 ? (
            <EmptyState
              title="Keine Dokumente"
              hint="Dieser Akte sind noch keine Dokumente angehängt."
            />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Dateiname</TH>
                  <TH>Erstellt</TH>
                  <TH className="text-right">Version</TH>
                </TR>
              </THead>
              <tbody>
                {data.documents.map((doc) => (
                  <TR key={doc.id}>
                    <TD className="font-medium">{doc.filename}</TD>
                    <TD className="text-muted-foreground">
                      {formatDate(doc.createdAt)}
                    </TD>
                    <TD className="text-right">
                      <Badge tone="gray">v{doc.version}</Badge>
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          )}
        </CardBody>
      </Card>

      {/* Freigaben */}
      <SharesSection id={id} />
    </div>
  );
}

function SharesSection({ id }: { id: string }) {
  const { data: shares, isLoading, error } = useShares(id);
  const requestShare = useRequestShare(id);
  const decideShare = useDecideShare(id);

  const [targetType, setTargetType] = useState<string>("PERSON");
  const [targetId, setTargetId] = useState("");
  const [reason, setReason] = useState("");

  function handleRequest(e: React.FormEvent) {
    e.preventDefault();
    if (!targetId.trim()) return;
    requestShare.mutate(
      { targetType, targetId, reason, caseFileId: id },
      {
        onSuccess: () => {
          setTargetId("");
          setReason("");
        },
      },
    );
  }

  function decide(share: FileShare, action: "approve" | "reject" | "revoke") {
    decideShare.mutate({ shareId: share.id, action });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Freigaben</CardTitle>
      </CardHeader>
      <CardBody className="space-y-6">
        {/* Beantragen */}
        <form
          onSubmit={handleRequest}
          className="grid grid-cols-1 items-end gap-3 sm:grid-cols-4"
        >
          <div>
            <Label htmlFor="sh-type">Zieltyp</Label>
            <Select
              id="sh-type"
              value={targetType}
              onChange={(e) => setTargetType(e.target.value)}
            >
              {SHARE_TARGET_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="sh-target">Ziel-ID</Label>
            <Input
              id="sh-target"
              value={targetId}
              onChange={(e) => setTargetId(e.target.value)}
              placeholder="z.B. Citizen-/Rollen-ID"
            />
          </div>
          <div>
            <Label htmlFor="sh-reason">Grund</Label>
            <Input
              id="sh-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Begründung"
            />
          </div>
          <div>
            <Button
              type="submit"
              disabled={requestShare.isPending || !targetId.trim()}
              className="w-full"
            >
              {requestShare.isPending ? <Spinner /> : null}
              Beantragen
            </Button>
          </div>
        </form>

        {/* Liste */}
        {isLoading ? (
          <div className="space-y-2">
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
            <Skeleton className="h-9 w-full" />
          </div>
        ) : error ? (
          <ErrorState error={error} />
        ) : !shares || shares.length === 0 ? (
          <EmptyState
            title="Keine Freigaben"
            hint="Für diese Akte wurden noch keine Freigaben beantragt."
          />
        ) : (
          <Table>
            <THead>
              <TR>
                <TH>Zieltyp</TH>
                <TH>Ziel-ID</TH>
                <TH>Status</TH>
                <TH>Erstellt</TH>
                <TH className="text-right">Aktionen</TH>
              </TR>
            </THead>
            <tbody>
              {shares.map((share) => {
                const pending =
                  share.status === "BEANTRAGT" ||
                  share.status === "IN_PRUEFUNG";
                const granted =
                  share.status === "TEILFREIGEGEBEN" ||
                  share.status === "VOLLSTAENDIG_FREIGEGEBEN";
                return (
                  <TR key={share.id}>
                    <TD>{share.targetType}</TD>
                    <TD className="font-mono text-xs">
                      {shortId(share.targetId)}
                    </TD>
                    <TD>
                      <Badge tone={SHARE_STATUS_TONE[share.status] ?? "default"}>
                        {SHARE_STATUS_LABEL[share.status] ?? share.status}
                      </Badge>
                    </TD>
                    <TD className="text-muted-foreground">
                      {formatDate(share.createdAt)}
                    </TD>
                    <TD>
                      <div className="flex items-center justify-end gap-2">
                        {pending ? (
                          <>
                            <Button
                              size="sm"
                              variant="primary"
                              disabled={decideShare.isPending}
                              onClick={() => decide(share, "approve")}
                            >
                              Genehmigen
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              disabled={decideShare.isPending}
                              onClick={() => decide(share, "reject")}
                            >
                              Ablehnen
                            </Button>
                          </>
                        ) : granted ? (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={decideShare.isPending}
                            onClick={() => decide(share, "revoke")}
                          >
                            Widerrufen
                          </Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </div>
                    </TD>
                  </TR>
                );
              })}
            </tbody>
          </Table>
        )}
      </CardBody>
    </Card>
  );
}

"use client";

import { useMemo } from "react";
import { useAuditLog, useVerifyAudit } from "@/lib/hooks";
import type { AuditEntry } from "@/lib/types";
import {
  Badge,
  Card,
  CardBody,
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
  Spinner,
  Table,
  TD,
  TH,
  THead,
  TR,
} from "@/components/ui";
import { formatDate } from "@/lib/format";

type BadgeTone =
  | "default"
  | "blue"
  | "green"
  | "amber"
  | "red"
  | "purple"
  | "gray";

function actionTone(action: string): BadgeTone {
  const a = action.toUpperCase();
  if (a === "CREATE") return "green";
  if (a === "READ") return "gray";
  if (a === "UPDATE") return "blue";
  if (a === "DELETE" || a === "REVOKE") return "red";
  if (a === "SHARE") return "purple";
  return "default";
}

function shortId(value?: string | null, len = 8): string {
  if (!value) return "—";
  return value.length > len ? value.slice(0, len) + "…" : value;
}

function ChainStatus() {
  const { data, isLoading, error } = useVerifyAudit();

  if (isLoading) {
    return (
      <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner className="h-4 w-4" />
        Kette wird geprüft …
      </span>
    );
  }
  if (error || !data) {
    return <Badge tone="gray">Kettenstatus unbekannt</Badge>;
  }
  if (data.ok) {
    return <Badge tone="green">Kette intakt</Badge>;
  }
  return (
    <Badge tone="red">
      Kette gebrochen{data.brokenAt ? ` bei ${shortId(data.brokenAt, 12)}` : ""}
    </Badge>
  );
}

export default function AuditTrailPage() {
  const { data, isLoading, error } = useAuditLog();

  const entries = useMemo<AuditEntry[]>(() => data ?? [], [data]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit-Trail"
        subtitle="Unveränderliches, hash-verkettetes Protokoll"
        actions={<ChainStatus />}
      />

      <Card className="border-border bg-muted/30">
        <CardBody className="text-sm text-muted-foreground">
          Audit-Einträge sind nicht editier- oder löschbar (append-only,
          hash-chained).
        </CardBody>
      </Card>

      {isLoading ? (
        <Card>
          <CardBody className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardBody>
        </Card>
      ) : error ? (
        <ErrorState error={error} />
      ) : entries.length === 0 ? (
        <EmptyState
          title="Keine Audit-Einträge"
          hint="Sobald Aktionen protokolliert werden, erscheinen sie hier."
        />
      ) : (
        <Card>
          <CardBody className="p-0">
            <Table>
              <THead>
                <TR>
                  <TH>Zeit</TH>
                  <TH>Aktion</TH>
                  <TH>Objekt</TH>
                  <TH>Nutzer</TH>
                  <TH>Hash</TH>
                </TR>
              </THead>
              <tbody>
                {entries.map((entry) => (
                  <TR key={entry.id}>
                    <TD className="whitespace-nowrap text-muted-foreground">
                      {formatDate(entry.at)}
                    </TD>
                    <TD>
                      <Badge tone={actionTone(entry.action)}>
                        {entry.action}
                      </Badge>
                    </TD>
                    <TD className="whitespace-nowrap">
                      <span className="font-medium">{entry.subjectType}</span>
                      {entry.subjectId ? (
                        <span className="ml-1 text-muted-foreground">
                          #{shortId(entry.subjectId, 8)}
                        </span>
                      ) : null}
                    </TD>
                    <TD className="whitespace-nowrap font-mono text-xs">
                      {entry.userId ? shortId(entry.userId, 8) : "System"}
                    </TD>
                    <TD>
                      <span
                        className="font-mono text-xs text-muted-foreground"
                        title={entry.hash}
                      >
                        {entry.hash.slice(0, 12)}
                      </span>
                    </TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          </CardBody>
        </Card>
      )}
    </div>
  );
}

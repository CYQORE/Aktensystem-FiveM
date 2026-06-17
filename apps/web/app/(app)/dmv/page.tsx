"use client";

import { useState } from "react";
import Link from "next/link";
import { useLicenses, useIssueLicense, useSetLicenseStatus, useCitizens } from "@/lib/hooks";
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
import { formatDate } from "@/lib/format";

const TYPES = ["DRIVER", "WEAPON", "BUSINESS", "PILOT", "HUNTING", "MEDICAL", "LAW"] as const;
const TYPE_LABEL: Record<string, string> = {
  DRIVER: "Führerschein", WEAPON: "Waffenschein", BUSINESS: "Gewerbe", PILOT: "Pilot",
  HUNTING: "Jagd", MEDICAL: "Medizin", LAW: "Anwalt",
};
const STATUS_TONE: Record<string, "green" | "amber" | "red" | "gray"> = {
  ACTIVE: "green", SUSPENDED: "amber", REVOKED: "red", EXPIRED: "gray",
};

export default function DmvPage() {
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading, error } = useLicenses();
  const setStatus = useSetLicenseStatus();

  return (
    <div className="space-y-6">
      <PageHeader
        title="DMV / Lizenzen"
        subtitle="Führerscheine, Waffenscheine & Lizenzen ausstellen"
        actions={<Button onClick={() => setShowForm((s) => !s)}>{showForm ? "Abbrechen" : "Lizenz ausstellen"}</Button>}
      />
      {showForm && <LicenseForm onClose={() => setShowForm(false)} />}

      <Card>
        <CardBody>
          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-10" />)}</div>
          ) : error ? (
            <ErrorState error={error} />
          ) : !data || data.length === 0 ? (
            <EmptyState title="Keine Lizenzen" hint="Stelle die erste Lizenz aus." />
          ) : (
            <Table>
              <THead>
                <TR><TH>Nummer</TH><TH>Art</TH><TH>Inhaber</TH><TH>Status</TH><TH>Ausgestellt</TH><TH className="text-right">Aktion</TH></TR>
              </THead>
              <tbody>
                {data.map((l) => (
                  <TR key={l.id}>
                    <TD className="font-mono text-xs">{l.number}</TD>
                    <TD>{TYPE_LABEL[l.type] ?? l.type}</TD>
                    <TD>
                      {l.citizen ? <Link href={`/citizens/${l.citizen.id}`} className="hover:underline">{l.citizen.lastName}, {l.citizen.firstName}</Link> : "—"}
                    </TD>
                    <TD><Badge tone={STATUS_TONE[l.status] ?? "gray"}>{l.status}</Badge></TD>
                    <TD>{formatDate(l.issuedAt)}</TD>
                    <TD className="text-right">
                      <Select
                        value={l.status}
                        disabled={setStatus.isPending}
                        onChange={(e) => setStatus.mutate({ id: l.id, status: e.target.value })}
                        className="ml-auto h-8 max-w-[140px] text-xs"
                      >
                        {["ACTIVE", "SUSPENDED", "REVOKED", "EXPIRED"].map((s) => <option key={s} value={s}>{s}</option>)}
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

function LicenseForm({ onClose }: { onClose: () => void }) {
  const [citizenId, setCitizenId] = useState("");
  const [csearch, setCsearch] = useState("");
  const [type, setType] = useState<string>("DRIVER");
  const { data: citizens } = useCitizens(csearch);
  const issue = useIssueLicense();

  function submit() {
    if (!citizenId) return;
    issue.mutate({ citizenId, type }, { onSuccess: onClose });
  }

  return (
    <Card>
      <CardHeader><CardTitle>Lizenz ausstellen</CardTitle></CardHeader>
      <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Label>Inhaber *</Label>
          <Input placeholder="Person suchen…" value={csearch} onChange={(e) => setCsearch(e.target.value)} className="mb-2" />
          <Select value={citizenId} onChange={(e) => setCitizenId(e.target.value)}>
            <option value="">— Person wählen —</option>
            {(citizens ?? []).map((c) => <option key={c.id} value={c.id}>{c.lastName}, {c.firstName}</option>)}
          </Select>
        </div>
        <div><Label>Art</Label>
          <Select value={type} onChange={(e) => setType(e.target.value)}>{TYPES.map((t) => <option key={t} value={t}>{TYPE_LABEL[t]}</option>)}</Select>
        </div>
        <div className="flex items-end gap-2">
          <Button onClick={submit} disabled={!citizenId || issue.isPending}>Ausstellen</Button>
          <Button variant="ghost" onClick={onClose}>Abbrechen</Button>
        </div>
      </CardBody>
    </Card>
  );
}

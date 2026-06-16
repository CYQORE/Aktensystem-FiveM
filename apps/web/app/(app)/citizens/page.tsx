"use client";

import { useState } from "react";
import {
  useCitizens,
  useCitizen,
  useCreateCitizen,
} from "@/lib/hooks";
import type { Citizen } from "@/lib/types";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Badge,
  Input,
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
import { formatDate } from "@/lib/format";

export default function CitizensPage() {
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { data, isLoading, error } = useCitizens(q);
  const create = useCreateCitizen();

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    phone: "",
    address: "",
    fivemCharId: "",
  });
  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function submit() {
    const body: Record<string, unknown> = { firstName: form.firstName, lastName: form.lastName };
    for (const k of ["dateOfBirth", "gender", "phone", "address", "fivemCharId"] as const) {
      if (form[k]) body[k] = form[k];
    }
    create.mutate(body, {
      onSuccess: () => {
        setShowForm(false);
        setForm({ firstName: "", lastName: "", dateOfBirth: "", gender: "", phone: "", address: "", fivemCharId: "" });
      },
    });
  }

  return (
    <div>
      <PageHeader
        title="Bürgerregister"
        subtitle="Bürger anlegen, suchen und mit Akten verknüpfen"
        actions={
          <Button onClick={() => setShowForm((s) => !s)}>
            {showForm ? "Abbrechen" : "Neuer Bürger"}
          </Button>
        }
      />

      {showForm && (
        <Card className="mb-4">
          <CardHeader>
            <CardTitle>Neuer Bürger</CardTitle>
          </CardHeader>
          <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label>Vorname *</Label>
              <Input value={form.firstName} onChange={(e) => set("firstName", e.target.value)} />
            </div>
            <div>
              <Label>Nachname *</Label>
              <Input value={form.lastName} onChange={(e) => set("lastName", e.target.value)} />
            </div>
            <div>
              <Label>Geburtsdatum</Label>
              <Input type="date" value={form.dateOfBirth} onChange={(e) => set("dateOfBirth", e.target.value)} />
            </div>
            <div>
              <Label>Geschlecht</Label>
              <Input value={form.gender} onChange={(e) => set("gender", e.target.value)} />
            </div>
            <div>
              <Label>Telefon</Label>
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
            <div>
              <Label>Adresse</Label>
              <Input value={form.address} onChange={(e) => set("address", e.target.value)} />
            </div>
            <div>
              <Label>FiveM CharID</Label>
              <Input value={form.fivemCharId} onChange={(e) => set("fivemCharId", e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button
                onClick={submit}
                disabled={create.isPending || !form.firstName || !form.lastName}
              >
                {create.isPending ? "Speichern…" : "Anlegen"}
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      <div className="mb-4 max-w-md">
        <Input
          placeholder="Suche nach Name oder Telefon…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-10" />
              ))}
            </div>
          ) : error ? (
            <ErrorState error={error} />
          ) : !data || data.length === 0 ? (
            <EmptyState title="Keine Bürger gefunden" hint="Lege den ersten Bürger an." />
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Name</TH>
                  <TH>Telefon</TH>
                  <TH>Geburtsdatum</TH>
                  <TH>Adresse</TH>
                </TR>
              </THead>
              <tbody>
                {data.map((c: Citizen) => (
                  <TR
                    key={c.id}
                    className="cursor-pointer"
                    onClick={() => setSelectedId(c.id)}
                  >
                    <TD className="font-medium">
                      {c.lastName}, {c.firstName}
                    </TD>
                    <TD>{c.phone ?? "—"}</TD>
                    <TD>{c.dateOfBirth ? formatDate(c.dateOfBirth) : "—"}</TD>
                    <TD>{c.address ?? "—"}</TD>
                  </TR>
                ))}
              </tbody>
            </Table>
          )}
        </div>

        <div>{selectedId && <CitizenDetail id={selectedId} />}</div>
      </div>
    </div>
  );
}

function CitizenDetail({ id }: { id: string }) {
  const { data, isLoading, error } = useCitizen(id);
  if (isLoading)
    return (
      <Card>
        <CardBody className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner /> Lädt…
        </CardBody>
      </Card>
    );
  if (error) return <ErrorState error={error} />;
  if (!data) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {data.lastName}, {data.firstName}
        </CardTitle>
      </CardHeader>
      <CardBody className="space-y-4 text-sm">
        <div className="text-muted-foreground">
          {data.phone && <div>Tel: {data.phone}</div>}
          {data.address && <div>Adresse: {data.address}</div>}
          {data.fivemCharId && <div>CharID: {data.fivemCharId}</div>}
        </div>

        {data.warrants && data.warrants.length > 0 && (
          <div>
            <p className="mb-1 font-medium">Aktive Haftbefehle</p>
            {data.warrants.map((w) => (
              <Badge key={w.id} tone="red" className="mr-1">
                {w.type}: {w.reason}
              </Badge>
            ))}
          </div>
        )}

        <Section title="Akten" empty="Keine Akten">
          {data.caseFiles?.map((f) => (
            <li key={f.id} className="flex items-center justify-between">
              <a href={`/case-files/${f.id}`} className="hover:underline">
                {f.title}
              </a>
              <Badge tone="blue">{f.type}</Badge>
            </li>
          ))}
        </Section>

        <Section title="Fahrzeuge" empty="Keine Fahrzeuge">
          {data.vehicles?.map((v) => (
            <li key={v.id}>
              {v.plate} {v.model ? `· ${v.model}` : ""}
            </li>
          ))}
        </Section>

        <Section title="Lizenzen" empty="Keine Lizenzen">
          {data.licenses?.map((l) => (
            <li key={l.id} className="flex items-center justify-between">
              <span>{l.type}</span>
              <Badge tone={l.status === "ACTIVE" ? "green" : "gray"}>{l.status}</Badge>
            </li>
          ))}
        </Section>
      </CardBody>
    </Card>
  );
}

function Section({
  title,
  empty,
  children,
}: {
  title: string;
  empty: string;
  children?: React.ReactNode;
}) {
  const arr = Array.isArray(children) ? children : children ? [children] : [];
  return (
    <div>
      <p className="mb-1 font-medium">{title}</p>
      {arr.length === 0 ? (
        <p className="text-xs text-muted-foreground">{empty}</p>
      ) : (
        <ul className="space-y-1 text-muted-foreground">{children}</ul>
      )}
    </div>
  );
}

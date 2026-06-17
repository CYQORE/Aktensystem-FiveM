"use client";

import { useState } from "react";
import { useGovLaws, useCreateGovLaw, useDeleteGovLaw } from "@/lib/hooks";
import { useAuth } from "@/lib/auth-store";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Badge,
  Input,
  Textarea,
  Label,
  Skeleton,
  EmptyState,
  ErrorState,
  PageHeader,
} from "@/components/ui";

export default function GesetzePage() {
  const isAdmin = useAuth((s) => s.user?.isPlatformAdmin ?? false);
  const [q, setQ] = useState("");
  const [showForm, setShowForm] = useState(false);
  const { data, isLoading, error } = useGovLaws(q);
  const del = useDeleteGovLaw();

  return (
    <div>
      <PageHeader
        title="Gesetze"
        subtitle="Gesetzbuch & Verordnungen"
        actions={isAdmin && <Button onClick={() => setShowForm((s) => !s)}>{showForm ? "Abbrechen" : "+ Gesetz"}</Button>}
      />
      {isAdmin && showForm && <LawForm onClose={() => setShowForm(false)} />}

      <div className="mb-4 max-w-sm"><Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Gesetz suchen…" /></div>

      {isLoading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
      ) : error ? (
        <ErrorState error={error} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="Keine Gesetze" hint={isAdmin ? "Lege das erste Gesetz an." : "Noch keine Gesetze erfasst."} />
      ) : (
        <div className="space-y-2">
          {data.map((l) => (
            <Card key={l.id}>
              <CardBody className="space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="font-medium">
                    <span className="font-mono text-xs text-muted-foreground">{l.code}</span> · {l.title}
                  </div>
                  <div className="flex items-center gap-2">
                    {l.category && <Badge tone="blue">{l.category}</Badge>}
                    {isAdmin && (
                      <button onClick={() => { if (confirm(`"${l.title}" löschen?`)) del.mutate(l.id); }} className="text-xs text-muted-foreground hover:text-red-500">✕</button>
                    )}
                  </div>
                </div>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{l.body}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function LawForm({ onClose }: { onClose: () => void }) {
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [body, setBody] = useState("");
  const create = useCreateGovLaw();

  function submit() {
    if (!code.trim() || !title.trim() || !body.trim()) return;
    create.mutate({ code, title, category: category || undefined, body }, { onSuccess: onClose });
  }

  return (
    <Card className="mb-4">
      <CardHeader><CardTitle>Neues Gesetz</CardTitle></CardHeader>
      <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div><Label>Kürzel *</Label><Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="§1" /></div>
        <div className="sm:col-span-2"><Label>Titel *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></div>
        <div><Label>Kategorie</Label><Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="StGB / StVO …" /></div>
        <div className="sm:col-span-3"><Label>Text *</Label><Textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} /></div>
        <div className="flex gap-2 sm:col-span-3">
          <Button onClick={submit} disabled={!code.trim() || !title.trim() || !body.trim() || create.isPending}>Anlegen</Button>
          <Button variant="ghost" onClick={onClose}>Abbrechen</Button>
        </div>
      </CardBody>
    </Card>
  );
}

"use client";

import { useState } from "react";
import { useTags, useCreateTag, useDeleteTag } from "@/lib/hooks";
import { useAuth } from "@/lib/auth-store";
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
  Skeleton,
  EmptyState,
  ErrorState,
  PageHeader,
} from "@/components/ui";

const COLORS = ["gray", "blue", "green", "amber", "red", "purple"] as const;
type Tone = (typeof COLORS)[number];

export default function TagsPage() {
  const isAdmin = useAuth((s) => s.user?.isPlatformAdmin ?? false);
  const { data, isLoading, error } = useTags();
  const create = useCreateTag();
  const del = useDeleteTag();
  const [name, setName] = useState("");
  const [color, setColor] = useState<Tone>("gray");
  const [category, setCategory] = useState("");

  function submit() {
    if (!name.trim()) return;
    create.mutate(
      { name: name.trim(), color, category: category.trim() || undefined },
      { onSuccess: () => { setName(""); setCategory(""); } },
    );
  }

  return (
    <div>
      <PageHeader title="Tags" subtitle="Markierungen für Bürger (z. B. Bewaffnet, Informant)" />

      <Card className="mb-4">
        <CardHeader><CardTitle>Tag anlegen</CardTitle></CardHeader>
        <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-4">
          <div><Label>Name *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. Bewaffnet" /></div>
          <div><Label>Farbe</Label>
            <Select value={color} onChange={(e) => setColor(e.target.value as Tone)}>
              {COLORS.map((c) => <option key={c} value={c}>{c}</option>)}
            </Select>
          </div>
          <div><Label>Kategorie</Label><Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="optional" /></div>
          <div className="flex items-end">
            <Button onClick={submit} disabled={!name.trim() || create.isPending}>Anlegen</Button>
          </div>
        </CardBody>
      </Card>

      {isLoading ? (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
      ) : error ? (
        <ErrorState error={error} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="Keine Tags" hint="Lege das erste Tag an." />
      ) : (
        <div className="flex flex-wrap gap-2">
          {data.map((t) => (
            <div key={t.id} className="flex items-center gap-1.5 rounded-lg border border-border px-2 py-1.5">
              <Badge tone={COLORS.includes(t.color as Tone) ? (t.color as Tone) : "gray"}>{t.name}</Badge>
              {t.category && <span className="text-xs text-muted-foreground">{t.category}</span>}
              {isAdmin && (
                <button
                  onClick={() => { if (confirm(`Tag "${t.name}" löschen?`)) del.mutate(t.id); }}
                  className="text-xs text-muted-foreground hover:text-red-500"
                  title="Löschen"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

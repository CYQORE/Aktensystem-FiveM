"use client";

import { useState } from "react";
import {
  usePenalCodes,
  usePenalCodeCategories,
  useCreatePenalCode,
  useUpdatePenalCode,
  useDeletePenalCode,
} from "@/lib/hooks";
import { useAuth } from "@/lib/auth-store";
import type { PenalCode } from "@/lib/types";
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
  Skeleton,
  EmptyState,
  ErrorState,
  PageHeader,
} from "@/components/ui";
import { cn } from "@aktensystem/ui";

const CATEGORIES = ["Verkehr", "Vergehen", "Verbrechen", "Waffen", "Drogen", "Behörde"] as const;
const CAT_ICON: Record<string, string> = {
  Verkehr: "🚗", Vergehen: "⚖", Verbrechen: "🚔", Waffen: "🔫", Drogen: "💊", Behörde: "🏛",
};
const CLASS_LABEL: Record<string, string> = {
  INFRACTION: "Ordnungswidrigkeit", MISDEMEANOR: "Vergehen", FELONY: "Verbrechen",
};
const CLASS_TONE: Record<string, "green" | "amber" | "red"> = {
  INFRACTION: "green", MISDEMEANOR: "amber", FELONY: "red",
};

const money = (n: number) => `${n.toLocaleString("de-DE")} $`;

type Form = {
  title: string; category: string; class: string; description: string;
  fineMin: string; fineMax: string; jailDaysMin: string; jailDaysMax: string; points: string;
};
const EMPTY: Form = {
  title: "", category: "Vergehen", class: "MISDEMEANOR", description: "",
  fineMin: "0", fineMax: "0", jailDaysMin: "0", jailDaysMax: "0", points: "0",
};

export default function StrafkatalogPage() {
  const isAdmin = useAuth((s) => s.user?.isPlatformAdmin ?? false);
  const [cat, setCat] = useState("Alle");
  const [q, setQ] = useState("");
  const [adminMode, setAdminMode] = useState(false);
  const [editing, setEditing] = useState<PenalCode | null>(null);
  const [form, setForm] = useState<Form>(EMPTY);
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading, error } = usePenalCodes(q, cat);
  const { data: cats } = usePenalCodeCategories();
  const create = useCreatePenalCode();
  const update = useUpdatePenalCode();
  const del = useDeletePenalCode();

  const total = cats?.reduce((s, c) => s + c.count, 0) ?? 0;
  const set = (k: keyof Form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  function openCreate() { setEditing(null); setForm(EMPTY); setShowForm(true); }
  function openEdit(p: PenalCode) {
    setEditing(p);
    setForm({
      title: p.title, category: p.category, class: p.class, description: p.description ?? "",
      fineMin: String(p.fineMin), fineMax: String(p.fineMax),
      jailDaysMin: String(p.jailDaysMin), jailDaysMax: String(p.jailDaysMax), points: String(p.points),
    });
    setShowForm(true);
  }
  function submit() {
    const body = {
      title: form.title, category: form.category, class: form.class,
      description: form.description || undefined,
      fineMin: Number(form.fineMin) || 0, fineMax: Number(form.fineMax) || 0,
      jailDaysMin: Number(form.jailDaysMin) || 0, jailDaysMax: Number(form.jailDaysMax) || 0,
      points: Number(form.points) || 0,
    };
    const done = () => { setShowForm(false); setEditing(null); };
    if (editing) update.mutate({ id: editing.id, body }, { onSuccess: done });
    else create.mutate(body, { onSuccess: done });
  }

  return (
    <div>
      <PageHeader
        title="Strafkatalog"
        subtitle="Delikte, Bußgelder, Haftzeiten und Punkte"
        actions={
          isAdmin && (
            <Button variant={adminMode ? "destructive" : "outline"} onClick={() => setAdminMode((a) => !a)}>
              {adminMode ? "Admin-Modus beenden" : "Admin-Modus"}
            </Button>
          )
        }
      />

      {adminMode && showForm && (
        <Card className="mb-4">
          <CardHeader><CardTitle>{editing ? "Delikt bearbeiten" : "Neues Delikt"}</CardTitle></CardHeader>
          <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="lg:col-span-3"><Label>Titel *</Label><Input value={form.title} onChange={(e) => set("title", e.target.value)} /></div>
            <div><Label>Kategorie</Label>
              <Select value={form.category} onChange={(e) => set("category", e.target.value)}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </Select>
            </div>
            <div><Label>Schweregrad</Label>
              <Select value={form.class} onChange={(e) => set("class", e.target.value)}>
                {Object.entries(CLASS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            </div>
            <div><Label>Punkte</Label><Input type="number" value={form.points} onChange={(e) => set("points", e.target.value)} /></div>
            <div><Label>Bußgeld min ($)</Label><Input type="number" value={form.fineMin} onChange={(e) => set("fineMin", e.target.value)} /></div>
            <div><Label>Bußgeld max ($)</Label><Input type="number" value={form.fineMax} onChange={(e) => set("fineMax", e.target.value)} /></div>
            <div><Label>Haft min (Tage)</Label><Input type="number" value={form.jailDaysMin} onChange={(e) => set("jailDaysMin", e.target.value)} /></div>
            <div><Label>Haft max (Tage)</Label><Input type="number" value={form.jailDaysMax} onChange={(e) => set("jailDaysMax", e.target.value)} /></div>
            <div className="lg:col-span-3"><Label>Beschreibung</Label><Textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={2} /></div>
            <div className="flex items-end gap-2 lg:col-span-3">
              <Button onClick={submit} disabled={!form.title || create.isPending || update.isPending}>
                {editing ? "Speichern" : "Anlegen"}
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>Abbrechen</Button>
            </div>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[200px_1fr]">
        {/* Kategorie-Sidebar */}
        <Card className="h-fit">
          <CardBody className="space-y-1">
            <CatRow label="Alle" count={total} active={cat === "Alle"} onClick={() => setCat("Alle")} icon="📚" />
            {CATEGORIES.map((c) => (
              <CatRow key={c} label={c} icon={CAT_ICON[c]} active={cat === c}
                count={cats?.find((x) => x.category === c)?.count ?? 0} onClick={() => setCat(c)} />
            ))}
          </CardBody>
        </Card>

        {/* Delikt-Liste */}
        <div>
          <div className="mb-3 flex items-center gap-2">
            <Input placeholder="Delikt suchen…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-md" />
            {adminMode && <Button onClick={openCreate}>+ Delikt</Button>}
          </div>

          {isLoading ? (
            <div className="space-y-2">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : error ? (
            <ErrorState error={error} />
          ) : !data || data.length === 0 ? (
            <EmptyState title="Keine Delikte" hint="Im Admin-Modus kannst du Delikte anlegen." />
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {data.map((p) => (
                <Card key={p.id}>
                  <CardBody className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-medium">{CAT_ICON[p.category] ?? ""} {p.title}</div>
                      <Badge tone={CLASS_TONE[p.class] ?? "default"}>{CLASS_LABEL[p.class] ?? p.class}</Badge>
                    </div>
                    {p.description && <p className="text-xs text-muted-foreground">{p.description}</p>}
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      <span>💵 {money(p.fineMin)}{p.fineMax !== p.fineMin ? `–${money(p.fineMax)}` : ""}</span>
                      <span>⛓ {p.jailDaysMin}{p.jailDaysMax !== p.jailDaysMin ? `–${p.jailDaysMax}` : ""} Tage</span>
                      {p.points > 0 && <span>🅿 {p.points} Punkte</span>}
                    </div>
                    {adminMode && (
                      <div className="flex gap-2 pt-1">
                        <Button size="sm" variant="outline" onClick={() => openEdit(p)}>Bearbeiten</Button>
                        <Button size="sm" variant="destructive"
                          onClick={() => { if (confirm(`"${p.title}" wirklich löschen?`)) del.mutate(p.id); }}>
                          Löschen
                        </Button>
                      </div>
                    )}
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CatRow({ label, count, active, onClick, icon }: { label: string; count: number; active: boolean; onClick: () => void; icon?: string }) {
  return (
    <button onClick={onClick}
      className={cn("flex w-full items-center justify-between rounded-md px-2 py-1.5 text-sm hover:bg-accent",
        active && "bg-accent font-medium")}>
      <span>{icon} {label}</span>
      <span className="text-xs text-muted-foreground">{count}</span>
    </button>
  );
}

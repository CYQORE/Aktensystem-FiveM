"use client";

import { useState } from "react";
import {
  useRadioChannels,
  useCreateRadioChannel,
  useDeleteRadioChannel,
  useRadioAction,
} from "@/lib/hooks";
import { useAuth } from "@/lib/auth-store";
import {
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Badge,
  Input,
  Label,
  Skeleton,
  EmptyState,
  ErrorState,
  PageHeader,
} from "@/components/ui";
import { useSocket } from "@/lib/ws";

export default function FunkPage() {
  const isAdmin = useAuth((s) => s.user?.isPlatformAdmin ?? false);
  const userId = useAuth((s) => s.user?.id ?? "");
  const { data, isLoading, error, refetch } = useRadioChannels();
  const join = useRadioAction("join");
  const leave = useRadioAction("leave");
  const del = useDeleteRadioChannel();
  const [showForm, setShowForm] = useState(false);

  useSocket({ "radio:roster": () => void refetch() });

  return (
    <div>
      <PageHeader
        title="Funk"
        subtitle="Funkkanäle — beitreten, verlassen, Roster"
        actions={
          isAdmin && (
            <Button onClick={() => setShowForm((s) => !s)}>{showForm ? "Abbrechen" : "+ Kanal"}</Button>
          )
        }
      />

      {isAdmin && showForm && <ChannelForm onClose={() => setShowForm(false)} />}

      {isLoading ? (
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32" />)}</div>
      ) : error ? (
        <ErrorState error={error} />
      ) : !data || data.length === 0 ? (
        <EmptyState title="Keine Funkkanäle" hint={isAdmin ? "Lege den ersten Kanal an." : "Ein Admin muss Kanäle anlegen."} />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.map((ch) => {
            const members = ch.members ?? [];
            const onChannel = members.some((m) => m.userId === userId);
            return (
              <Card key={ch.id}>
                <CardHeader className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <span className="font-mono">📻 {ch.name}</span>
                    {ch.isPrivate && <Badge tone="purple">privat</Badge>}
                  </CardTitle>
                  <Badge tone="gray">{members.length}</Badge>
                </CardHeader>
                <CardBody className="space-y-3">
                  <div className="text-sm text-muted-foreground">{ch.label}</div>
                  <div className="min-h-[3rem] space-y-1">
                    {members.length === 0 ? (
                      <p className="text-xs text-muted-foreground">Niemand auf dem Kanal.</p>
                    ) : (
                      members.map((m) => (
                        <div key={m.id} className="flex items-center gap-2 text-sm">
                          <span className="h-2 w-2 rounded-full bg-green-500" />
                          {m.callsign ?? "Einheit"}
                        </div>
                      ))
                    )}
                  </div>
                  <div className="flex gap-2">
                    {onChannel ? (
                      <Button size="sm" variant="outline" disabled={leave.isPending} onClick={() => leave.mutate(ch.id)}>
                        Verlassen
                      </Button>
                    ) : (
                      <Button size="sm" disabled={join.isPending} onClick={() => join.mutate(ch.id)}>
                        Beitreten
                      </Button>
                    )}
                    {isAdmin && (
                      <Button size="sm" variant="destructive" onClick={() => { if (confirm(`Kanal "${ch.name}" löschen?`)) del.mutate(ch.id); }}>
                        Löschen
                      </Button>
                    )}
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      <p className="mt-4 text-xs text-muted-foreground">
        In-Game: <code>/funk &lt;kanal&gt;</code> setzt den pma-voice-Kanal (falls vorhanden). Der Beitritt hier dient der Koordination/Übersicht.
      </p>
    </div>
  );
}

function ChannelForm({ onClose }: { onClose: () => void }) {
  const [name, setName] = useState("");
  const [label, setLabel] = useState("");
  const [isPrivate, setIsPrivate] = useState(false);
  const create = useCreateRadioChannel();

  function submit() {
    if (!name || !label) return;
    create.mutate({ name, label, isPrivate }, { onSuccess: onClose });
  }

  return (
    <Card className="mb-4">
      <CardHeader><CardTitle>Funkkanal anlegen</CardTitle></CardHeader>
      <CardBody className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div><Label>Kürzel *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="z. B. TAC" className="font-mono" /></div>
        <div><Label>Anzeigename *</Label><Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="z. B. Taktik" /></div>
        <label className="flex items-center gap-2 text-sm sm:col-span-2">
          <input type="checkbox" checked={isPrivate} onChange={(e) => setIsPrivate(e.target.checked)} /> Privater Kanal
        </label>
        <div className="flex gap-2 sm:col-span-2">
          <Button onClick={submit} disabled={!name || !label || create.isPending}>Anlegen</Button>
          <Button variant="ghost" onClick={onClose}>Abbrechen</Button>
        </div>
      </CardBody>
    </Card>
  );
}

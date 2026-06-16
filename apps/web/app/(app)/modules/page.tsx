"use client";

import { useState } from "react";
import { useModules, useToggleModule, useRegisterModule } from "@/lib/hooks";
import type { PlatformModule } from "@/lib/types";
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
  Skeleton,
  EmptyState,
  ErrorState,
  PageHeader,
} from "@/components/ui";

export default function ModulesPage() {
  const { data, isLoading, error } = useModules();
  const toggle = useToggleModule();
  const register = useRegisterModule();

  const [form, setForm] = useState({
    key: "",
    name: "",
    icon: "",
    route: "",
    category: "",
    sortOrder: "",
  });
  const set = (k: keyof typeof form, v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  function submit() {
    register.mutate(
      {
        key: form.key,
        name: form.name,
        icon: form.icon,
        route: form.route,
        category: form.category,
        sortOrder: Number(form.sortOrder) || 100,
      },
      {
        onSuccess: () =>
          setForm({ key: "", name: "", icon: "", route: "", category: "", sortOrder: "" }),
      }
    );
  }

  return (
    <div>
      <PageHeader
        title="Module"
        subtitle="Plattform-Module aktivieren, deaktivieren und neue registrieren"
      />

      <div className="mb-4 rounded-md border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        Module lassen sich im laufenden Betrieb an-/abschalten und neu
        registrieren. Kernmodule sind nicht deaktivierbar.
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12" />
          ))}
        </div>
      ) : error ? (
        <ErrorState error={error} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="Keine Module"
          hint="Registriere unten ein erstes Modul."
        />
      ) : (
        <Card className="mb-6">
          <Table>
            <THead>
              <TR>
                <TH>Icon</TH>
                <TH>Name</TH>
                <TH>Schlüssel</TH>
                <TH>Kategorie</TH>
                <TH>Route</TH>
                <TH>Version</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <tbody>
              {data.map((m: PlatformModule) => (
                <TR key={m.id ?? m.key}>
                  <TD className="text-lg">{m.icon ?? "📦"}</TD>
                  <TD className="font-medium">{m.name}</TD>
                  <TD className="font-mono text-xs text-muted-foreground">{m.key}</TD>
                  <TD>{m.category ?? "—"}</TD>
                  <TD className="font-mono text-xs text-muted-foreground">
                    {m.route ?? "—"}
                  </TD>
                  <TD className="text-muted-foreground">{m.version}</TD>
                  <TD>
                    {m.core ? (
                      <Badge tone="green">Kern</Badge>
                    ) : m.enabled ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={toggle.isPending}
                        onClick={() =>
                          toggle.mutate({ key: m.key, enabled: false })
                        }
                      >
                        Aktiv
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={toggle.isPending}
                        onClick={() =>
                          toggle.mutate({ key: m.key, enabled: true })
                        }
                      >
                        Inaktiv
                      </Button>
                    )}
                  </TD>
                </TR>
              ))}
            </tbody>
          </Table>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Neues Modul registrieren</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label>Schlüssel</Label>
              <Input
                placeholder="mein-modul"
                value={form.key}
                onChange={(e) => set("key", e.target.value)}
              />
            </div>
            <div>
              <Label>Name</Label>
              <Input
                placeholder="Mein Modul"
                value={form.name}
                onChange={(e) => set("name", e.target.value)}
              />
            </div>
            <div>
              <Label>Icon (Emoji)</Label>
              <Input
                placeholder="🧩"
                value={form.icon}
                onChange={(e) => set("icon", e.target.value)}
              />
            </div>
            <div>
              <Label>Route</Label>
              <Input
                placeholder="/mein-modul"
                value={form.route}
                onChange={(e) => set("route", e.target.value)}
              />
            </div>
            <div>
              <Label>Kategorie</Label>
              <Input
                placeholder="Verwaltung"
                value={form.category}
                onChange={(e) => set("category", e.target.value)}
              />
            </div>
            <div>
              <Label>Sortierung</Label>
              <Input
                type="number"
                placeholder="100"
                value={form.sortOrder}
                onChange={(e) => set("sortOrder", e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">
              Erscheint nach Registrierung in der Navigation.
            </p>
            <Button
              onClick={submit}
              disabled={register.isPending || !form.key || !form.name}
            >
              {register.isPending ? "Registrieren…" : "Modul registrieren"}
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

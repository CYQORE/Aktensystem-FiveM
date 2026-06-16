# Module hinzufügen (Erweiterbarkeit)

S6mdt ist modular. Module lassen sich **im laufenden Betrieb aktivieren/deaktivieren** und
**neu registrieren** (Feature-Flags + dynamische Navigation). Echtes Hot-Loading von
kompiliertem Code ist nicht möglich; das Muster ist:

## Modul-Registry

DB-Modell `PlatformModule` (key, name, icon, route, category, enabled, core, sortOrder, version).
Beim Boot registriert das Backend die Kernmodule idempotent (`ModulesService.onModuleInit`).

- `GET /api/v1/modules` — Liste (jede:r authentifizierte Nutzer:in). Das Frontend baut daraus
  **dynamisch die Navigation** (Gruppierung nach `category`, Sortierung `sortOrder`).
- `PATCH /api/v1/modules/:key` `{ enabled }` — an/aus (**Admin**). Kernmodule (`core:true`)
  bleiben aktiv.
- `POST /api/v1/modules` — neues Modul registrieren (**Admin**). Erscheint sofort in der Nav.

UI: Seite **`/modules`** (Administration) zum Schalten + Registrieren.

## Neues Feature-Modul anlegen — Schritte

1. **Datenmodell** (falls nötig): Modell in
   [`packages/database/prisma/schema.prisma`](../packages/database/prisma/schema.prisma),
   dann `pnpm db:generate` + Migration.
2. **RBAC**: Subject + Grants in [`packages/rbac/src/index.ts`](../packages/rbac/src/index.ts)
   ergänzen (z.B. `can("read", "MeinSubject")`).
3. **Shared-Vertrag**: Zod-Schema(s) in
   [`packages/shared/src/schemas.ts`](../packages/shared/src/schemas.ts).
4. **Backend-Modul**: `apps/api/src/<modul>/` mit `*.service.ts`, `*.controller.ts`
   (Guards `JwtAuthGuard` + `PoliciesGuard`, `@CheckPolicies`, Audit über `AuditService`),
   `*.module.ts`; in `apps/api/src/app.module.ts` importieren.
5. **Registry-Eintrag**: in `CORE_MODULES` (modules.service) ergänzen **oder** zur Laufzeit
   per `POST /modules` registrieren.
6. **Frontend**: Hooks in `apps/web/lib/hooks.ts`, Typen in `lib/types.ts`, Seite unter
   `apps/web/app/(app)/<route>/page.tsx`. Die Nav erscheint automatisch über die Registry.

Beispiel-Muster: die Module **forensics / vehicles / justice** folgen exakt diesem Aufbau.

## Beispiel: Forensik-Computer mit 3D-Beweismitteln

Das Forensik-Modul zeigt das Erweiterungsmuster inkl. Spezial-UI:
- Backend `forensics` (Evidence + `CustodyEvent` Chain-of-Custody + `ForensicDetail`).
- Frontend `/forensics` mit dem **3D-Viewer** (`components/evidence-viewer.tsx`, three.js via
  `@react-three/fiber`, client-only via `next/dynamic ssr:false`). Beweismittel werden als
  rotierendes 3D-Objekt mit Scan-Effekt dargestellt; Geometrie/Farbe richten sich nach der
  Beweismittel-Art (Waffe/Probe/Dokument). Erweiterbar um echte 3D-Modelle (glTF) später.

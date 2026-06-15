import { SecurityBadge } from "@aktensystem/ui";

const MODULES = [
  { group: "Identity", items: ["Bürgerregister", "Fahrzeugregister", "Immobilien"] },
  { group: "Law Enforcement", items: ["Polizeisystem", "Ermittlungen", "Fahndung"] },
  { group: "Justice", items: ["DOJ", "Gericht", "Staatsanwaltschaft", "Gefängnis"] },
  { group: "Medical", items: ["EMS", "Fire Department", "Forensik"] },
  { group: "CAD / Dispatch", items: ["Leitstelle", "Live-Karte", "Einsätze", "Status"] },
  { group: "Workforce", items: ["Dienstzeit", "Schichtplanung", "Statistiken"] },
  { group: "Platform", items: ["Akten", "Dokumente", "Workflows", "Audit", "RBAC"] },
];

const SEC_LEVELS = [
  { sec: "INTERN", label: "1 · Intern" },
  { sec: "VERTRAULICH", label: "2 · Vertraulich" },
  { sec: "BEHOERDENINTERN", label: "3 · Behördenintern" },
  { sec: "GEHEIM", label: "4 · Geheim" },
  { sec: "HOCHGEHEIM", label: "5 · Hochgeheim" },
] as const;

export default function Home() {
  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 border-r border-border bg-card p-4 md:block">
        <div className="mb-6 flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary font-bold text-primary-foreground">
            A
          </div>
          <span className="font-semibold">Aktensystem</span>
        </div>
        <nav className="space-y-4 text-sm">
          {MODULES.map((m) => (
            <div key={m.group}>
              <p className="mb-1 text-xs uppercase tracking-wider text-muted-foreground">
                {m.group}
              </p>
              <ul className="space-y-1">
                {m.items.map((i) => (
                  <li
                    key={i}
                    className="cursor-default rounded px-2 py-1 text-foreground/80 hover:bg-accent hover:text-accent-foreground"
                  >
                    {i}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8">
        <header className="mb-8">
          <p className="text-sm text-muted-foreground">Phase 1 · Scaffold</p>
          <h1 className="text-2xl font-semibold">
            Enterprise CAD / RMS / DMS Plattform
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Fraktionsübergreifendes Aktensystem für FiveM Roleplay. Backend-Health,
            Realtime-Gateway und FiveM-Bridge sind verdrahtet. Module folgen je Phase.
          </p>
        </header>

        <section className="mb-8">
          <h2 className="mb-3 text-sm font-medium text-muted-foreground">
            Sicherheitsstufen
          </h2>
          <div className="flex flex-wrap gap-2">
            {SEC_LEVELS.map((s) => (
              <SecurityBadge key={s.sec} sec={s.sec}>
                {s.label}
              </SecurityBadge>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m) => (
            <div
              key={m.group}
              className="rounded-lg border border-border bg-card p-4"
            >
              <h3 className="mb-2 font-medium">{m.group}</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                {m.items.map((i) => (
                  <li key={i}>· {i}</li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

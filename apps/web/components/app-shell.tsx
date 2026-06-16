"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo } from "react";
import { cn } from "@aktensystem/ui";
import { useAuth } from "../lib/auth-store";
import { useModules } from "../lib/hooks";
import { Button } from "./ui";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}
interface NavGroup {
  group: string;
  items: NavItem[];
}

const NAV: NavGroup[] = [
  {
    group: "Übersicht",
    items: [{ href: "/dashboard", label: "Dashboard", icon: "▦" }],
  },
  {
    group: "Akten & Justiz",
    items: [
      { href: "/citizens", label: "Bürger", icon: "👤" },
      { href: "/case-files", label: "Akten", icon: "🗂" },
      { href: "/forensics", label: "Forensik", icon: "🔬" },
      { href: "/strafkatalog", label: "Strafkatalog", icon: "📕" },
      { href: "/haftbefehle", label: "Haftbefehle", icon: "🚔" },
      { href: "/bussgelder", label: "Bußgelder", icon: "💵" },
      { href: "/strafvollzug", label: "Strafvollzug", icon: "⛓" },
      { href: "/justice", label: "Gericht", icon: "⚖" },
      { href: "/audit", label: "Audit-Trail", icon: "🛡" },
    ],
  },
  {
    group: "Register",
    items: [
      { href: "/vehicles", label: "Fahrzeuge", icon: "🚗" },
      { href: "/fahndung", label: "Fahndung / BOLO", icon: "🔎" },
    ],
  },
  {
    group: "Leitstelle / CAD",
    items: [
      { href: "/dispatch", label: "Dispatch", icon: "🚨" },
      { href: "/units", label: "Leitstellenblatt", icon: "📋" },
      { href: "/map", label: "Live-Karte", icon: "🗺" },
      { href: "/funk", label: "Funk", icon: "📻" },
    ],
  },
  {
    group: "Personal",
    items: [{ href: "/workforce", label: "Dienstzeit", icon: "⏱" }],
  },
  {
    group: "Administration",
    items: [{ href: "/modules", label: "Module", icon: "🧩" }],
  },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, status, init, login, logout } = useAuth();
  const { data: modules } = useModules();

  useEffect(() => {
    if (status === "idle") void init();
  }, [status, init]);

  const membership = user?.memberships?.[0];

  // Navigation dynamisch aus der Modul-Registry (aktive Module), sonst statisch.
  const nav = useMemo<NavGroup[]>(() => {
    if (!modules || modules.length === 0) return NAV;
    const enabled = modules
      .filter((m) => m.enabled && m.route)
      .sort((a, b) => a.sortOrder - b.sortOrder);
    const groups: Record<string, NavGroup> = {};
    const order: string[] = [];
    for (const m of enabled) {
      const g = m.category ?? "Module";
      if (!groups[g]) {
        groups[g] = { group: g, items: [] };
        order.push(g);
      }
      groups[g].items.push({ href: m.route!, label: m.name, icon: m.icon ?? "•" });
    }
    return order.map((g) => groups[g]);
  }, [modules]);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card md:flex">
        <div className="flex h-14 items-center gap-2 border-b border-border px-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-xs font-bold text-primary-foreground">
            S6
          </div>
          <span className="font-semibold">S6mdt</span>
        </div>
        <nav className="flex-1 space-y-4 overflow-y-auto p-3 text-sm">
          {nav.map((g) => (
            <div key={g.group}>
              <p className="mb-1 px-2 text-[10px] uppercase tracking-wider text-muted-foreground">
                {g.group}
              </p>
              <ul className="space-y-0.5">
                {g.items.map((it) => {
                  const active =
                    pathname === it.href || pathname.startsWith(it.href + "/");
                  return (
                    <li key={it.href}>
                      <Link
                        href={it.href}
                        className={cn(
                          "flex items-center gap-2 rounded-md px-2 py-1.5 text-foreground/80 hover:bg-accent hover:text-accent-foreground",
                          active && "bg-accent font-medium text-accent-foreground",
                        )}
                      >
                        <span className="w-4 text-center">{it.icon}</span>
                        {it.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </aside>

      {/* Main */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-14 items-center justify-between border-b border-border px-6">
          <div className="text-sm text-muted-foreground">
            {membership?.faction?.shortName ? (
              <span>
                {membership.faction.shortName}
                {membership.rank?.name ? ` · ${membership.rank.name}` : ""}
              </span>
            ) : (
              "S6mdt · Enterprise CAD / RMS"
            )}
          </div>
          <div className="flex items-center gap-3">
            {status === "authenticated" && user ? (
              <>
                <span className="text-sm">{user.globalName ?? user.username}</span>
                <Button size="sm" variant="outline" onClick={() => void logout()}>
                  Abmelden
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={login}>
                Mit Discord anmelden
              </Button>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

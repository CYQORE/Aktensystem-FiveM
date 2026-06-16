"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSearch } from "@/lib/hooks";
import type { SearchHit } from "@/lib/types";
import { Spinner } from "./ui";

const TYPE_META: Record<SearchHit["type"], { icon: string; label: string }> = {
  citizen: { icon: "👤", label: "Bürger" },
  vehicle: { icon: "🚗", label: "Fahrzeug" },
  warrant: { icon: "🚔", label: "Haftbefehl" },
  casefile: { icon: "🗂", label: "Akte" },
  bolo: { icon: "🔎", label: "Fahndung" },
};

/** Globale Command-Palette: mit Strg/⌘+K öffnen, tippen, ↑↓ + Enter. */
export function SearchPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const { data, isFetching } = useSearch(q);
  const hits = data ?? [];

  // Strg/⌘+K togglet die Palette (global).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    }
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("s6mdt:open-search", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("s6mdt:open-search", onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQ("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => setActive(0), [q]);

  function go(hit: SearchHit) {
    setOpen(false);
    router.push(hit.href);
  }

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, hits.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter" && hits[active]) {
      e.preventDefault();
      go(hits[active]);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 p-4 pt-[12vh]" onClick={() => setOpen(false)}>
      <div
        className="w-full max-w-xl overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-border px-3">
          <span className="text-muted-foreground">🔎</span>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Bürger, Kennzeichen, Akte, Haftbefehl…"
            className="h-12 flex-1 bg-transparent text-sm outline-none"
          />
          {isFetching && <Spinner />}
          <kbd className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground">ESC</kbd>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-2">
          {q.trim().length < 2 ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">Mindestens 2 Zeichen eingeben…</p>
          ) : hits.length === 0 && !isFetching ? (
            <p className="px-2 py-6 text-center text-sm text-muted-foreground">Keine Treffer für „{q}“.</p>
          ) : (
            hits.map((h, i) => {
              const meta = TYPE_META[h.type] ?? { icon: "•", label: "Treffer" };
              return (
                <button
                  key={`${h.type}-${h.id}`}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(h)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left ${i === active ? "bg-accent" : "hover:bg-accent/60"}`}
                >
                  <span className="text-lg">{meta.icon}</span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium">{h.label}</div>
                    <div className="truncate text-xs text-muted-foreground">{h.sublabel}</div>
                  </div>
                  <span className="shrink-0 text-[10px] uppercase tracking-wide text-muted-foreground">{meta.label}</span>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

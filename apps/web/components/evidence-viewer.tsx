"use client";

import dynamic from "next/dynamic";

/**
 * Forensik-3D-Viewer (Client-only). Lädt die three.js-Szene per dynamic import
 * ohne SSR (WebGL läuft nur im Browser). Zeigt das Beweismittel als rotierendes
 * 3D-Objekt mit Scan-Effekt — der "Forensik-Computer".
 */
const EvidenceViewer3D = dynamic(() => import("./evidence-viewer-3d"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-xs text-muted-foreground">
      3D-Scan wird geladen…
    </div>
  ),
});

export function EvidenceViewer({ kind, label }: { kind: string; label?: string }) {
  return (
    <div className="relative h-[360px] w-full overflow-hidden rounded-lg border border-border bg-[#0b1120]">
      <EvidenceViewer3D kind={kind} />
      {label && (
        <div className="absolute left-3 top-3 rounded bg-black/40 px-2 py-1 text-xs text-emerald-300">
          🔬 {label}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/auth-store";
import { Spinner } from "../../../components/ui";

/**
 * FiveM-Identitäts-Login. Empfängt den One-Time-Code aus dem URL-Fragment
 * (#code=…) — gesetzt von der NUI bzw. dem /cad-Link — und tauscht ihn gegen
 * eine Session. Kein manueller Login nötig: der Spieler wird automatisch erkannt.
 */
export default function FivemAuthPage() {
  const router = useRouter();
  const exchangeFivem = useAuth((s) => s.exchangeFivem);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    const code = new URLSearchParams(hash).get("code");
    // Code sofort aus URL/History entfernen (kein Leak via History/Logs)
    window.history.replaceState(null, "", window.location.pathname);
    if (!code) {
      setError("Kein Login-Code empfangen");
      return;
    }
    exchangeFivem(code)
      .then(() => router.replace("/dashboard"))
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Login fehlgeschlagen"),
      );
  }, [router, exchangeFivem]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner /> Spieler wird erkannt…
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../../../lib/auth-store";
import { Spinner } from "../../../components/ui";

/** Empfängt das Access-Token aus dem URL-Fragment (#token=…) und meldet an. */
export default function AuthCallbackPage() {
  const router = useRouter();
  const setToken = useAuth((s) => s.setToken);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.replace(/^#/, "");
    const params = new URLSearchParams(hash);
    const token = params.get("token");
    if (!token) {
      setError("Kein Token empfangen");
      return;
    }
    void setToken(token).then(() => router.replace("/dashboard"));
  }, [router, setToken]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner /> Anmeldung wird abgeschlossen…
        </div>
      )}
    </div>
  );
}

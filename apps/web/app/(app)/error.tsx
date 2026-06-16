"use client";

import { Button, Card, CardBody, CardHeader, CardTitle } from "@/components/ui";

/**
 * Fehler-Grenze für den authentifizierten Bereich: ein Render-Fehler auf einer
 * Seite zeigt einen eingegrenzten Fallback (statt die ganze Shell weiß zu machen).
 */
export default function AppError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg pt-10">
      <Card>
        <CardHeader>
          <CardTitle>Etwas ist schiefgelaufen</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Diese Ansicht konnte nicht geladen werden. Versuch es erneut.
          </p>
          {error?.message && (
            <pre className="overflow-x-auto rounded-md bg-muted p-2 text-xs text-muted-foreground">
              {error.message}
            </pre>
          )}
          <Button onClick={reset}>Erneut versuchen</Button>
        </CardBody>
      </Card>
    </div>
  );
}

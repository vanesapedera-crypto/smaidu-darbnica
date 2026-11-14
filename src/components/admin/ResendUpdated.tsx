"use client";

import { useState, useTransition } from "react";
import { LoaderCircle, RefreshCw } from "lucide-react";
import { resendUpdatedConfirmation } from "@/app/admin/actions";
import { adminSecondary } from "./styles";

/** Pēc izmaiņām (datums, laiks u.c.) — klientam atjaunots apstiprinājums e-pastā + atjaunots Google kalendārs */
export default function ResendUpdated({ id, hasEmail }: { id: string; hasEmail: boolean }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok?: string; error?: string }>();
  return (
    <div className="space-y-1.5 text-sm">
      <button
        type="button"
        disabled={pending}
        className={adminSecondary}
        onClick={() => {
          if (!window.confirm(hasEmail ? "Nosūtīt klientam atjaunotu apstiprinājumu ar aktuālo informāciju? Google kalendārs arī tiks atjaunots." : "Klientam nav e-pasta — atjaunots tiks tikai Google kalendārs. Turpināt?")) return;
          start(async () => {
            const r = await resendUpdatedConfirmation(id);
            setMsg(r.error ? { error: r.error } : { ok: r.emailed ? "Nosūtīts. Klients saņēma atjaunotu e-pastu, kalendārs atjaunots." : "Kalendārs atjaunots. Klientam e-pasta nav." });
          });
        }}
      >
        {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <RefreshCw className="size-4" aria-hidden />}
        Atjaunots e-pasts klientam
      </button>
      <p className="text-xs text-ink-soft">Pēc izmaiņām (datums, laiks, bērnu skaits…) — vispirms saglabājiet sadaļā “Labot informāciju”, tad spiediet šo.</p>
      {msg?.ok && <p className="font-semibold text-emerald-700">{msg.ok}</p>}
      {msg?.error && <p className="font-semibold text-destructive">{msg.error}</p>}
    </div>
  );
}

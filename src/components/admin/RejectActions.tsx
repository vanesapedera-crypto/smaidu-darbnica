"use client";

import { useState, useTransition } from "react";
import { DoorOpen, LoaderCircle, XCircle } from "lucide-react";
import { approveWithoutProgram, rejectBooking } from "@/app/admin/actions";
import { adminSecondary } from "./styles";

/**
 * Ja nevaram uzņemt: "Apstiprināt tikai telpas" (telpu nomai ar programmu, ko nevaram nodrošināt)
 * vai "Atteikt" (pieteikums pāriet uz atceltajiem, klientam — pieklājīgs e-pasts).
 */
export default function RejectActions({ id, venueWithProgram, programTitle, hasEmail }: { id: string; venueWithProgram: boolean; programTitle: string; hasEmail: boolean }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok?: string; error?: string }>();

  return (
    <div className="space-y-3 text-sm">
      {venueWithProgram && (
        <div className="space-y-1.5">
          <button
            type="button"
            disabled={pending}
            className={adminSecondary}
            onClick={() => {
              if (!window.confirm(`Apstiprināt tikai telpas bez programmas “${programTitle}”? Klientam aizies apstiprinājums ar piebildi, ka programmu nevaram nodrošināt.`)) return;
              start(async () => {
                const r = await approveWithoutProgram(id);
                setMsg(r.error ? { error: r.error } : { ok: "Apstiprināta tikai telpu noma. Klientam nosūtīts apstiprinājums." });
              });
            }}
          >
            {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <DoorOpen className="size-4" aria-hidden />}
            Apstiprināt tikai telpas (bez programmas)
          </button>
          <p className="text-xs text-ink-soft">Programma tiek noņemta, cena pārrēķinās — klients saņem apstiprinājumu ar piebildi, ka programmu nevaram nodrošināt.</p>
        </div>
      )}
      <div className="space-y-1.5">
        <button
          type="button"
          disabled={pending}
          className={`${adminSecondary} text-destructive`}
          onClick={() => {
            if (!window.confirm(hasEmail ? "Atteikt pieteikumu? Klientam aizies pieklājīgs e-pasts, pieteikums pāries uz atceltajiem." : "Atteikt pieteikumu? Klientam nav e-pasta — pazvaniet viņam pati.")) return;
            start(async () => {
              const r = await rejectBooking(id);
              setMsg(r.error ? { error: r.error } : { ok: r.emailed ? "Atteikts. Klientam nosūtīts e-pasts." : "Atteikts. Klientam e-pasts netika nosūtīts — sazinieties pa telefonu." });
            });
          }}
        >
          {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <XCircle className="size-4" aria-hidden />}
          Atteikt pieteikumu
        </button>
        <p className="text-xs text-ink-soft">
          Pieteikums nepazūd — pāriet uz atceltajiem. Klients saņem e-pastu: {venueWithProgram || programTitle ? "“nevaram nodrošināt izklaides programmu”" : "“šajā laikā nevaram uzņemt”"} un aicinājumu izvēlēties citu laiku.
        </p>
      </div>
      {msg?.ok && <p className="font-semibold text-emerald-700">{msg.ok}</p>}
      {msg?.error && <p role="alert" className="font-semibold text-destructive">{msg.error}</p>}
    </div>
  );
}

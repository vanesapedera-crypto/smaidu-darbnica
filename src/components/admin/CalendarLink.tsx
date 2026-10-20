"use client";

import { useState, useTransition } from "react";
import { CalendarCheck, CalendarPlus, LoaderCircle } from "lucide-react";
import { addToGoogleCalendar } from "@/app/admin/actions";
import { CALENDAR_HOSTS, calendarUrl, type CalendarEvent } from "@/lib/calendar";
import { adminInput, adminSecondary } from "./styles";

/**
 * Rezerves variants: poga atver Google kalendāru ar aizpildītu notikumu.
 * Parasti to nevajag — apstiprinot pieteikumu, ielūgums aiziet automātiski (sk. StatusSelect un lib/notify.ts).
 * Noder, ja notikums kalendārā nav parādījies vai jāpievieno vēl kāds viesis.
 */
export default function CalendarLink({
  event,
  withHost,
  googleBookingId,
}: {
  event: CalendarEvent;
  withHost: boolean;
  /** Ja Google kalendārs ir savienots un rezervācija apstiprināta — poga "Ielikt Google kalendārā" (labojams notikums) */
  googleBookingId?: string;
}) {
  const [host, setHost] = useState("");
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ error?: string; ok?: boolean }>();

  return (
    <div className="space-y-2">
      <p className="text-sm text-ink-soft">Google kalendārs — ar roku</p>
      <div className="flex flex-wrap items-center gap-2">
        {withHost && (
          <select value={host} onChange={(e) => setHost(e.target.value)} aria-label="Programmu vada" className={adminInput} style={{ width: "auto" }}>
            <option value="">Programmu vada…</option>
            {CALENDAR_HOSTS.map((h) => (
              <option key={h.email} value={h.email}>
                {h.name}
              </option>
            ))}
          </select>
        )}
        {googleBookingId ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => start(async () => setResult(await addToGoogleCalendar(googleBookingId, host)))}
            className={adminSecondary}
          >
            {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <CalendarCheck className="size-4" aria-hidden />}
            Ielikt Google kalendārā
          </button>
        ) : (
          <a href={calendarUrl(event, host ? [host] : [])} target="_blank" rel="noopener noreferrer" className={adminSecondary}>
            <CalendarPlus className="size-4" aria-hidden />
            Pievienot kalendāram
          </a>
        )}
      </div>
      {result?.ok && (
        <p className="text-sm font-semibold text-emerald-700">
          Ielikts jūsu Google kalendārā — to var labot (Edit). Veco ielūgumu, ja tāds ir, izdzēsiet.
        </p>
      )}
      {result?.error && (
        <p role="alert" className="text-sm font-semibold text-destructive">
          {result.error}
        </p>
      )}
      <p className="text-xs text-ink-soft">
        {googleBookingId
          ? "Apstiprinot pieteikumu, notikums kalendārā tiek ielikts automātiski. Šo pogu lietojiet rezervācijām, kas apstiprinātas pirms Google kalendāra savienošanas. Klientam nekas netiek sūtīts."
          : "Apstiprinot pieteikumu, notikums kalendārā tiek ielikts automātiski. Šo pogu lietojiet tikai tad, ja tas tur nav parādījies."}
      </p>
    </div>
  );
}

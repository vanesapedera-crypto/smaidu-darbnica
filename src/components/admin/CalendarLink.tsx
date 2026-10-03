"use client";

import { useState } from "react";
import { CalendarPlus } from "lucide-react";
import { CALENDAR_HOSTS, calendarUrl, type CalendarEvent } from "@/lib/calendar";
import { adminInput, adminSecondary } from "./styles";

/**
 * Rezerves variants: poga atver Google kalendāru ar aizpildītu notikumu.
 * Parasti to nevajag — apstiprinot pieteikumu, ielūgums aiziet automātiski (sk. StatusSelect un lib/notify.ts).
 * Noder, ja notikums kalendārā nav parādījies vai jāpievieno vēl kāds viesis.
 */
export default function CalendarLink({ event, withHost }: { event: CalendarEvent; withHost: boolean }) {
  const [host, setHost] = useState("");

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
        <a href={calendarUrl(event, host ? [host] : [])} target="_blank" rel="noopener noreferrer" className={adminSecondary}>
          <CalendarPlus className="size-4" aria-hidden />
          Pievienot kalendāram
        </a>
      </div>
      <p className="text-xs text-ink-soft">
        Apstiprinot pieteikumu, notikums kalendārā tiek ielikts automātiski. Šo pogu lietojiet tikai tad, ja tas tur nav parādījies.
      </p>
    </div>
  );
}

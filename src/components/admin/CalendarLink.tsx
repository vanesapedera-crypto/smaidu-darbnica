"use client";

import { useState } from "react";
import { CalendarPlus } from "lucide-react";
import { CALENDAR_HOSTS, calendarUrl, type CalendarEvent } from "@/lib/calendar";
import { adminInput, adminSecondary } from "./styles";

/**
 * Poga "Pievienot Google kalendāram": atver Google kalendāru ar aizpildītu notikumu.
 * Ballītēm vispirms var izvēlēties, kura vadītāja vadīs programmu — viņa tiek pievienota kā viesis
 * un pēc notikuma saglabāšanas saņem ielūgumu (tāpat kā pārējie viesi, sk. lib/calendar.ts).
 */
export default function CalendarLink({ event, withHost }: { event: CalendarEvent; withHost: boolean }) {
  const [host, setHost] = useState("");

  return (
    <div className="space-y-2">
      <p className="text-sm text-ink-soft">Google kalendārs</p>
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
        Ielūgumu saņems: {[...event.guests, ...(host ? [host] : [])].join(", ")}
      </p>
    </div>
  );
}

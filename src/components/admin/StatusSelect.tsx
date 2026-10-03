"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { BOOKING_STATUSES } from "@/lib/bookings";
import { CALENDAR_HOSTS } from "@/lib/calendar";
import { adminInput, adminSecondary } from "./styles";

type Props = {
  id: string;
  status: string | null;
  /** Ballītēm apstiprinot var izvēlēties, kura vadītāja vadīs programmu (viņa saņem kalendāra ielūgumu) */
  withHost?: boolean;
  /** Kam aizies kalendāra ielūgums; null — pieteikumam nav datuma, ielūgumu nesūta */
  guests?: string[] | null;
  /** Klienta e-pasts (ja norādīts) — uz to aizies apstiprinājums */
  clientEmail?: string | null;
};

const styles: Record<string, string> = {
  Jauns: "bg-brand/30 ring-brand",
  Apstiprināta: "bg-emerald-50 text-emerald-800 ring-emerald-300",
  Atcelta: "bg-red-50 text-red-700 ring-red-200",
};

/**
 * Pieteikuma statusa maiņa. Izvēloties "Apstiprināta", vispirms atveras neliels logs:
 * tajā redzams, kas notiks (e-pasts klientam, ielūgums kalendārā), un ballītēm izvēlas programmas vadītāju.
 */
export default function StatusSelect({ id, status, withHost = false, guests = null, clientEmail = null }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(status ?? "Jauns");
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  // Paziņojums pēc apstiprināšanas: kas tika nosūtīts
  const [note, setNote] = useState("");
  // Apstiprināšanas logs (lai nejaušs klikšķis neko nenosūta)
  const [confirming, setConfirming] = useState(false);
  const [host, setHost] = useState("");

  async function save(next: string, withHostEmail = "") {
    const previous = value;
    setValue(next);
    setFailed(false);
    setNote("");
    setConfirming(false);
    const res = await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next, host: withHostEmail }),
    });
    if (!res.ok) {
      setValue(previous);
      setFailed(true);
      return;
    }
    const data = await res.json().catch(() => ({}));
    setNote(
      [
        data.clientEmail === "sent"
          ? "Klientam nosūtīts apstiprinājums."
          : data.clientEmail === "no-email"
            ? "Klients nav norādījis e-pastu — apstiprinājums nav nosūtīts."
            : data.clientEmail === "not-configured"
              ? "E-pasta sūtīšana nav ieslēgta — nekas nav nosūtīts."
              : "",
        data.calendar === "sent" ? "Ielūgums nosūtīts kalendāram." : data.calendar === "no-date" ? "Nav datuma — kalendārā nav ielikts." : "",
      ]
        .filter(Boolean)
        .join(" "),
    );
    startTransition(() => router.refresh());
  }

  function change(next: string) {
    if (next === "Apstiprināta" && value !== "Apstiprināta") setConfirming(true);
    else save(next);
  }

  const recipients = guests ? [...guests, ...(host ? [host] : [])] : [];

  return (
    <div className="relative flex items-center gap-2">
      <select
        value={value}
        aria-label="Statuss"
        disabled={pending}
        className={cn("rounded-full px-3 py-2 text-sm font-bold ring-1 outline-none", styles[value] ?? "ring-line")}
        onChange={(e) => change(e.target.value)}
      >
        {BOOKING_STATUSES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      {failed && <span className="text-xs font-semibold text-destructive">Neizdevās</span>}
      {note && <span className="max-w-56 text-xs font-semibold text-ink-soft">{note}</span>}

      {confirming && (
        <div
          role="dialog"
          aria-label="Apstiprināt rezervāciju"
          className="absolute bottom-full left-0 z-20 mb-2 w-80 max-w-[calc(100vw-3rem)] space-y-3 rounded-2xl bg-white p-4 text-sm shadow-xl ring-1 ring-line sm:top-full sm:right-0 sm:bottom-auto sm:left-auto sm:mt-2 sm:mb-0"
        >
          <p className="font-extrabold">Apstiprināt rezervāciju?</p>
          <ul className="space-y-1.5 text-ink-soft">
            <li>
              {clientEmail ? (
                <>
                  Klientam uz <b className="font-semibold break-all text-ink">{clientEmail}</b> aizies apstiprinājums ar datumu, laiku un izmaksām.
                </>
              ) : (
                "Klients nav norādījis e-pastu — apstiprinājums viņam netiks nosūtīts."
              )}
            </li>
            <li>{guests ? "Notikums tiks ielikts Google kalendārā." : "Pieteikumam nav datuma — kalendārā netiks ielikts."}</li>
          </ul>
          {guests && withHost && (
            <label className="block space-y-1">
              <span className="font-semibold">Programmu vada</span>
              <select value={host} onChange={(e) => setHost(e.target.value)} className={adminInput}>
                <option value="">Vēl nav zināms</option>
                {CALENDAR_HOSTS.map((h) => (
                  <option key={h.email} value={h.email}>
                    {h.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          {guests && <p className="text-xs break-words text-ink-soft">Ielūgumu saņems: {recipients.join(", ")}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => save("Apstiprināta", host)}
              className="rounded-full bg-brand px-4 py-2 text-sm font-extrabold hover:bg-brand/80"
            >
              Apstiprināt
            </button>
            <button type="button" onClick={() => setConfirming(false)} className={adminSecondary}>
              Atcelt
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

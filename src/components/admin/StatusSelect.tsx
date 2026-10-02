"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { BOOKING_STATUSES } from "@/lib/bookings";

type Props = {
  id: string;
  status: string | null;
};

const styles: Record<string, string> = {
  Jauns: "bg-brand/30 ring-brand",
  Apstiprināta: "bg-emerald-50 text-emerald-800 ring-emerald-300",
  Atcelta: "bg-red-50 text-red-700 ring-red-200",
};

/** Pieteikuma statusa maiņa (sākotnējā paneļa komponente, papildināta ar kļūdu apstrādi). */
export default function StatusSelect({ id, status }: Props) {
  const router = useRouter();
  const [value, setValue] = useState(status ?? "Jauns");
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  // Paziņojums pēc apstiprināšanas: vai klientam aizgāja e-pasts
  const [note, setNote] = useState("");

  async function change(next: string) {
    const previous = value;
    // Apstiprinot klientam aiziet e-pasts — tāpēc vispirms pārjautā (lai nejaušs klikšķis neko nenosūta)
    if (
      next === "Apstiprināta" &&
      previous !== "Apstiprināta" &&
      !window.confirm("Apstiprināt rezervāciju?\n\nJa klients norādījis e-pastu, viņam tiks nosūtīts apstiprinājums.")
    ) {
      return;
    }
    setValue(next);
    setFailed(false);
    setNote("");
    const res = await fetch(`/api/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (!res.ok) {
      setValue(previous);
      setFailed(true);
      return;
    }
    const data = await res.json().catch(() => ({}));
    setNote(
      data.clientEmail === "sent"
        ? "Klientam nosūtīts apstiprinājuma e-pasts"
        : data.clientEmail === "no-email"
          ? "Klients nav norādījis e-pastu — apstiprinājums nav nosūtīts"
          : data.clientEmail === "not-configured"
            ? "E-pasta sūtīšana vēl nav ieslēgta — klientam nekas nav nosūtīts"
            : "",
    );
    startTransition(() => router.refresh());
  }

  return (
    <div className="flex items-center gap-2">
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
      {note && <span className="max-w-48 text-xs font-semibold text-ink-soft">{note}</span>}
    </div>
  );
}

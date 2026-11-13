"use client";

import { useState, useTransition } from "react";
import { LoaderCircle, Trash2 } from "lucide-react";
import { deleteBooking } from "@/app/admin/actions";
import { adminSecondary } from "./styles";

/** Pieteikuma dzēšana ar apstiprinājumu (divi klikšķi) — neatgriezeniski */
export default function DeleteBooking({ id }: { id: string }) {
  const [asking, setAsking] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState("");

  if (!asking) {
    return (
      <button type="button" onClick={() => setAsking(true)} className={`${adminSecondary} text-destructive`}>
        <Trash2 className="size-4" aria-hidden /> Dzēst pieteikumu
      </button>
    );
  }
  return (
    <div className="space-y-2 rounded-2xl bg-red-50 p-4 ring-1 ring-red-200">
      <p className="text-sm font-extrabold text-red-800">Vai tiešām izdzēst šo pieteikumu?</p>
      <p className="text-sm text-red-800">To nevarēs atjaunot. Apstiprināta rezervācija tiks izņemta arī no komandas kalendāriem. Klientam nekas netiek sūtīts.</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await deleteBooking(id);
              if (r.error) setError(r.error);
            })
          }
          className="inline-flex items-center gap-2 rounded-full bg-red-700 px-4 py-2 text-sm font-extrabold text-white hover:bg-red-800 disabled:opacity-60"
        >
          {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Trash2 className="size-4" aria-hidden />}
          Jā, dzēst
        </button>
        <button type="button" disabled={pending} onClick={() => setAsking(false)} className={adminSecondary}>
          Nē
        </button>
      </div>
      {error && <p className="text-sm font-semibold text-destructive">{error}</p>}
    </div>
  );
}

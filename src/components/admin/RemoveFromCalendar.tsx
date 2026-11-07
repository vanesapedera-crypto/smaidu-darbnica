"use client";

import { useState, useTransition } from "react";
import { CalendarX, LoaderCircle } from "lucide-react";
import { removeFromCalendars } from "@/app/admin/actions";
import { adminSecondary } from "./styles";

/** Atceltai rezervācijai — izņem notikumu no visu iesaistīto Google kalendāriem (ja tas tur vēl ir palicis) */
export default function RemoveFromCalendar({ id }: { id: string }) {
  const [pending, start] = useTransition();
  const [result, setResult] = useState<{ error?: string; ok?: boolean }>();
  return (
    <div className="space-y-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => start(async () => setResult(await removeFromCalendars(id)))}
        className={adminSecondary}
      >
        {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <CalendarX className="size-4" aria-hidden />}
        Izņemt no visu kalendāriem
      </button>
      {result?.ok && <p className="text-sm font-semibold text-emerald-700">Gatavs — notikums tiek izņemts no visu kalendāriem.</p>}
      {result?.error && <p className="text-sm font-semibold text-destructive">{result.error}</p>}
    </div>
  );
}

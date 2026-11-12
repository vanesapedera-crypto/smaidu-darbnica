"use client";

import { useTransition } from "react";
import { LoaderCircle, X } from "lucide-react";
import { cancelTeamEvent } from "@/app/admin/actions";
import { adminDanger } from "./styles";

/** Poga "Atcelt" komandas grafika pasākumam (piem. ja tas dublējas) — ar apstiprinājumu */
export default function CancelTeamEvent({ id, title }: { id: string; title: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm(`Atcelt pasākumu “${title}”? Tas tiks izdzēsts no grafika.`)) return;
        start(() => cancelTeamEvent(id));
      }}
      className={adminDanger}
    >
      {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <X className="size-4" aria-hidden />}
      Atcelt
    </button>
  );
}

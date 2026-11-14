"use client";

import { useState, useTransition } from "react";
import { Check, LoaderCircle, X } from "lucide-react";
import { answerParticipation } from "@/app/admin/team-actions";
import { cn } from "@/lib/utils";

/** Komandas loceklim: "Varu" / "Nevaru" pasākumam, kuram viņš pievienots */
export default function StaffAnswer({ bookingId, status }: { bookingId: string; status: "gaida" | "var" | "nevar" }) {
  const [current, setCurrent] = useState(status);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const answer = (s: "var" | "nevar") =>
    start(async () => {
      const r = await answerParticipation(bookingId, s);
      if (r.error) setError(r.error);
      else {
        setError(null);
        setCurrent(s);
      }
    });
  return (
    <div className="flex flex-wrap items-center gap-2 text-sm">
      <span className="font-bold">{current === "gaida" ? "Vai vari piedalīties?" : current === "var" ? "Tu atbildēji: varu" : "Tu atbildēji: nevaru"}</span>
      <button
        type="button"
        disabled={pending}
        onClick={() => answer("var")}
        className={cn("inline-flex items-center gap-1.5 rounded-full px-4 py-2 font-bold ring-1", current === "var" ? "bg-emerald-600 text-white ring-emerald-600" : "bg-white text-emerald-800 ring-emerald-300 hover:bg-emerald-50")}
      >
        {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Check className="size-4" />} Varu
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => answer("nevar")}
        className={cn("inline-flex items-center gap-1.5 rounded-full px-4 py-2 font-bold ring-1", current === "nevar" ? "bg-red-600 text-white ring-red-600" : "bg-white text-red-700 ring-red-300 hover:bg-red-50")}
      >
        <X className="size-4" /> Nevaru
      </button>
      {error && <span className="font-semibold text-destructive">{error}</span>}
    </div>
  );
}

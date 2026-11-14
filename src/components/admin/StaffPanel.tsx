"use client";

import { useState, useTransition } from "react";
import { Check, HelpCircle, LoaderCircle, Send, X } from "lucide-react";
import { approveAndNotify, askStaff } from "@/app/admin/actions";
import { CALENDAR_HOSTS } from "@/lib/calendar";
import { adminPrimary, adminSecondary } from "./styles";
import { cn } from "@/lib/utils";

type Row = { email: string; name: string; status: "gaida" | "var" | "nevar" };

export const STAFF_TONE = {
  var: "bg-emerald-50 text-emerald-800 ring-emerald-300",
  gaida: "bg-surface text-ink-soft ring-line",
  nevar: "bg-red-50 text-red-700 ring-red-300",
} as const;
export const STAFF_LABEL = { var: "var", gaida: "gaida atbildi", nevar: "NEVAR" } as const;

/**
 * Kas piedalās (administratorei): atzīmē meitenes → "Jautāt komandai" (klientam vēl nekas neaiziet);
 * redzamas atbildes; kad visas "Varu" — "Apstiprināt un nosūtīt klientam".
 */
export default function StaffPanel({ id, rows, status, initial }: { id: string; rows: Row[]; status: string | null; initial: string[] }) {
  const [picked, setPicked] = useState<string[]>(rows.length ? rows.map((r) => r.email) : initial);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok?: string; error?: string }>();
  const byEmail = new Map(rows.map((r) => [r.email, r]));
  const allYes = rows.length > 0 && rows.every((r) => r.status === "var");
  const declined = rows.filter((r) => r.status === "nevar");
  const changed = picked.slice().sort().join() !== rows.map((r) => r.email).sort().join();

  return (
    <div className="space-y-3 text-sm">
      <div className="flex flex-wrap gap-2">
        {CALENDAR_HOSTS.map((h) => {
          const on = picked.includes(h.email);
          const r = byEmail.get(h.email);
          return (
            <label
              key={h.email}
              className={cn(
                "inline-flex cursor-pointer items-center gap-2 rounded-full px-3 py-1.5 font-semibold ring-1",
                r ? STAFF_TONE[r.status] : on ? "bg-brand-soft ring-ink" : "bg-white ring-line",
              )}
            >
              <input
                type="checkbox"
                checked={on}
                onChange={(e) => setPicked((p) => (e.target.checked ? [...p, h.email] : p.filter((x) => x !== h.email)))}
                className="size-4 accent-ink"
              />
              {h.name}
              {r && (
                <span className="inline-flex items-center gap-0.5 text-xs">
                  {r.status === "var" ? <Check className="size-3.5" /> : r.status === "nevar" ? <X className="size-3.5" /> : <HelpCircle className="size-3.5" />}
                  {STAFF_LABEL[r.status]}
                </span>
              )}
            </label>
          );
        })}
      </div>

      {declined.length > 0 && (
        <p className="font-bold text-red-700">
          {declined.map((r) => r.name).join(", ")} nevar piedalīties — atzīmējiet citu un nospiediet “Jautāt komandai”.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        {(changed || !rows.length) && (
          <button
            type="button"
            disabled={pending || !picked.length}
            className={adminSecondary}
            onClick={() =>
              start(async () => {
                const r = await askStaff(id, picked);
                setMsg(r.error ? { error: r.error } : { ok: "Jautājums nosūtīts — atbildes parādīsies šeit." });
              })
            }
          >
            {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
            Jautāt komandai
          </button>
        )}
        {status !== "Apstiprināta" && allYes && !changed && (
          <button
            type="button"
            disabled={pending}
            className={adminPrimary}
            onClick={() => {
              if (!window.confirm("Apstiprināt rezervāciju? Klientam aizies apstiprinājuma e-pasts, komandai — kalendāra ielūgums.")) return;
              start(async () => {
                const r = await approveAndNotify(id);
                setMsg(r.error ? { error: r.error } : { ok: "Apstiprināts. Klientam nosūtīts e-pasts, komandai — ielūgums." });
              });
            }}
          >
            <Check className="size-4" aria-hidden /> Apstiprināt un nosūtīt klientam
          </button>
        )}
      </div>
      {status !== "Apstiprināta" && rows.length > 0 && !allYes && !declined.length && (
        <p className="text-xs text-ink-soft">Klientam apstiprinājums vēl nav nosūtīts — gaidām komandas atbildes.</p>
      )}
      {msg?.ok && <p className="font-semibold text-emerald-700">{msg.ok}</p>}
      {msg?.error && <p role="alert" className="font-semibold text-destructive">{msg.error}</p>}
    </div>
  );
}

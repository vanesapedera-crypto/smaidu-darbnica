"use client";

import { useState, useTransition } from "react";
import { LoaderCircle, Send } from "lucide-react";
import { resendAllToGoogle } from "@/app/admin/actions";
import { adminSecondary } from "./styles";

/** Poga "Nosūtīt ielūgumus vēlreiz" — visas nākamās apstiprinātās rezervācijas vēlreiz Google kalendārā (sk. resendAllToGoogle) */
export default function ResendInvites() {
  const [pending, start] = useTransition();
  const [result, setResult] = useState("");

  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          if (!confirm("Visas nākamās apstiprinātās rezervācijas tiks ieliktas Google kalendārā vēlreiz, un visi viesi (Kristīne u. c.) saņems ielūgumu. Klientiem nekas netiek sūtīts. Turpināt?")) return;
          setResult("");
          start(async () => {
            const r = await resendAllToGoogle();
            setResult(r.error ? `Kļūda: ${r.error}` : `Nosūtīti: ${r.done}${r.failed ? `, neizdevās: ${r.failed}` : ""}.`);
          });
        }}
        className={adminSecondary}
      >
        {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
        {pending ? "Sūta…" : "Nosūtīt ielūgumus vēlreiz"}
      </button>
      {result && <p className="text-sm font-semibold">{result}</p>}
    </div>
  );
}

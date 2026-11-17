"use client";

import { useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Check, LoaderCircle } from "lucide-react";

/**
 * Saglabāšanas poga: kamēr saglabā — izslēgta ar "Saglabā…" (lai nespiež vēlreiz un redz, ka kaut kas notiek),
 * pēc tam uz brīdi "Saglabāts ✓".
 */
export default function SubmitOnce({ className, children, pendingText = "Saglabā…" }: { className: string; children: React.ReactNode; pendingText?: string }) {
  const { pending } = useFormStatus();
  const [done, setDone] = useState(false);
  const seen = useRef(false);
  useEffect(() => {
    if (pending) {
      seen.current = true;
      return;
    }
    if (!seen.current) return;
    seen.current = false;
    const on = setTimeout(() => setDone(true), 0);
    const off = setTimeout(() => setDone(false), 2500);
    return () => {
      clearTimeout(on);
      clearTimeout(off);
    };
  }, [pending]);
  return (
    <button type="submit" disabled={pending} className={`${className} disabled:cursor-wait disabled:opacity-60`}>
      {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : done ? <Check className="size-4 text-emerald-600" aria-hidden /> : null}
      {pending ? pendingText : done ? "Saglabāts" : children}
    </button>
  );
}

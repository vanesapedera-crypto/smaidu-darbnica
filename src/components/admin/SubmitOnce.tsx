"use client";

import { useFormStatus } from "react-dom";
import { LoaderCircle } from "lucide-react";

/** Poga, ko var nospiest tikai vienreiz — kamēr saglabā, tā ir izslēgta (lai nerodas dubulti ieraksti) */
export default function SubmitOnce({ className, children, pendingText = "Saglabā…" }: { className: string; children: React.ReactNode; pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={`${className} disabled:cursor-wait disabled:opacity-60`}>
      {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
      {pending ? pendingText : children}
    </button>
  );
}

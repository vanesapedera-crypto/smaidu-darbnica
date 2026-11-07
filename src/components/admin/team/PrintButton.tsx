"use client";

import { FileDown } from "lucide-react";

/** Atver pārlūka drukas logu — tur izvēlas "Saglabāt kā PDF" */
export default function PrintButton({ label = "Lejupielādēt PDF" }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-ink hover:bg-brand-strong">
      <FileDown className="size-4" aria-hidden /> {label}
    </button>
  );
}

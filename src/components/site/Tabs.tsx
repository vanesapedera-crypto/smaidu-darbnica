"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type Tab = { id: string; label: string; content: React.ReactNode };

/**
 * Cilnes (piem. "Ziemassvētki / Vasara / Visu gadu"), lai garu saturu nerādītu vienu zem otra.
 * Saturu renderē serveris un nodod kā `content` — klientā ir tikai pārslēgšana.
 * Saite ar #cilnes-id (piem. /uznemumiem#ziemassvetki) atver attiecīgo cilni.
 */
export default function Tabs({ tabs, defaultTab }: { tabs: Tab[]; defaultTab?: string }) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id);

  useEffect(() => {
    const fromHash = () => {
      const id = window.location.hash.slice(1);
      if (!tabs.some((t) => t.id === id)) return;
      setActive(id);
      // Paslēptu paneli pārlūks pats nevar atrast — ritinām līdz cilnēm, kad panelis ir redzams
      requestAnimationFrame(() => document.getElementById(`cilne-${id}`)?.scrollIntoView({ block: "center" }));
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [tabs]);

  // Tastatūra: bultiņas pārslēdz cilnes (WAI-ARIA tabs)
  const onKey = (e: React.KeyboardEvent, i: number) => {
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    const next = tabs[(i + dir + tabs.length) % tabs.length];
    setActive(next.id);
    document.getElementById(`cilne-${next.id}`)?.focus();
  };

  return (
    <div>
      <div role="tablist" className="flex flex-wrap gap-2">
        {tabs.map((t, i) => (
          <button
            key={t.id}
            id={`cilne-${t.id}`}
            type="button"
            role="tab"
            aria-selected={active === t.id}
            aria-controls={`panelis-${t.id}`}
            tabIndex={active === t.id ? 0 : -1}
            onClick={() => setActive(t.id)}
            onKeyDown={(e) => onKey(e, i)}
            className={cn(
              "h-12 rounded-full px-6 text-sm font-extrabold tracking-wide uppercase transition-colors",
              active === t.id ? "bg-ink text-white" : "bg-white text-ink ring-1 ring-line hover:ring-ink",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tabs.map((t) => (
        <div
          key={t.id}
          id={`panelis-${t.id}`}
          role="tabpanel"
          aria-labelledby={`cilne-${t.id}`}
          hidden={active !== t.id}
          className="mt-10"
        >
          {t.content}
        </div>
      ))}
    </div>
  );
}

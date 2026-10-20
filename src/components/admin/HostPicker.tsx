"use client";

import { CALENDAR_HOSTS } from "@/lib/calendar";
import { cn } from "@/lib/utils";

/** Animatoru izvēle (var atzīmēt vairākas) — atzīmētās saņem kalendāra ielūgumu */
export default function HostPicker({ value, onChange }: { value: string[]; onChange: (hosts: string[]) => void }) {
  const toggle = (email: string) => onChange(value.includes(email) ? value.filter((e) => e !== email) : [...value, email]);
  return (
    <div className="flex flex-wrap gap-1.5">
      {CALENDAR_HOSTS.map((h) => {
        const on = value.includes(h.email);
        return (
          <button
            key={h.email}
            type="button"
            aria-pressed={on}
            onClick={() => toggle(h.email)}
            className={cn(
              "rounded-full px-3 py-1.5 text-sm font-bold ring-1 transition-colors",
              on ? "bg-ink text-white ring-ink" : "bg-white text-ink ring-line hover:ring-ink",
            )}
          >
            {on ? "✓ " : ""}
            {h.name}
          </button>
        );
      })}
    </div>
  );
}

"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

const HOURS = Array.from({ length: 17 }, (_, i) => String(i + 6).padStart(2, "0")); // 06–22
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, "0")); // 00, 05 … 55

/**
 * Laika izvēle 24 stundu formātā (stunda un minūtes) — pārlūka laika lauks dažos datoros rāda AM/PM.
 * Vērtība "HH:MM" vai "". Ar `name` — arī slēpts lauks parastām formām (piem. admin panelī).
 */
export default function TimeSelect({
  id,
  name,
  value: controlled,
  defaultValue = "",
  onChange,
  className,
  invalid,
}: {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  className?: string;
  invalid?: boolean;
}) {
  const [own, setOwn] = useState(defaultValue);
  const value = controlled ?? own;
  const [h = "", m = ""] = value ? value.split(":") : [];

  const update = (hour: string, minute: string) => {
    const next = hour ? `${hour}:${minute || "00"}` : "";
    setOwn(next);
    onChange?.(next);
  };

  return (
    <div className="flex items-center gap-2">
      {name && <input type="hidden" name={name} value={value} />}
      <select
        id={id}
        aria-label="Stunda"
        value={h}
        onChange={(e) => update(e.target.value, m)}
        aria-invalid={invalid || undefined}
        className={cn(className, "min-w-0 flex-1")}
      >
        <option value="">--</option>
        {/* Ja vērtība ir ārpus saraksta (piem. vecs pieteikums 05:00), to tāpat rāda */}
        {h && !HOURS.includes(h) && <option value={h}>{h}</option>}
        {HOURS.map((x) => (
          <option key={x} value={x}>
            {x}
          </option>
        ))}
      </select>
      <span className="font-bold" aria-hidden>
        :
      </span>
      <select
        aria-label="Minūtes"
        value={m}
        onChange={(e) => update(h, e.target.value)}
        disabled={!h}
        aria-invalid={invalid || undefined}
        className={cn(className, "min-w-0 flex-1")}
      >
        <option value="">--</option>
        {m && !MINUTES.includes(m) && <option value={m}>{m}</option>}
        {MINUTES.map((x) => (
          <option key={x} value={x}>
            {x}
          </option>
        ))}
      </select>
    </div>
  );
}

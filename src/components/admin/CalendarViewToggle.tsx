"use client";

import Link from "next/link";
import { CalendarDays, List } from "lucide-react";
import { cn } from "@/lib/utils";

/** "Saraksts" / "Mēnesis" — izvēle saglabājas šajā ierīcē (sīkdatne), nākamreiz atveras tas pats skats */
export default function CalendarViewToggle({ view }: { view: "saraksts" | "menesis" }) {
  const remember = (v: string) => {
    // eslint-disable-next-line react-hooks/immutability -- sīkdatnes iestatīšana klikšķī (ne renderēšanas laikā)
    document.cookie = `sd_skats=${v}; path=/admin; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
  };
  const item = (v: "saraksts" | "menesis", label: string, Icon: typeof List) => (
    <Link
      href={`/admin/kalendars?skats=${v}`}
      onClick={() => remember(v)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-bold ring-1",
        view === v ? "bg-ink text-white ring-ink" : "bg-white text-ink ring-line hover:ring-ink",
      )}
    >
      <Icon className="size-4" aria-hidden /> {label}
    </Link>
  );
  return (
    <div className="flex gap-2">
      {item("saraksts", "Saraksts", List)}
      {item("menesis", "Kalendārs", CalendarDays)}
    </div>
  );
}

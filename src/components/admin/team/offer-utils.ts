/** "2026-11-07" → "07.11.2026" */
export function lvDate(iso: string | null | undefined): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? "");
  return m ? `${m[3]}.${m[2]}.${m[1]}` : "";
}

export function statusTone(status: string | null | undefined): string {
  switch (status) {
    case "Pieņemts":
      return "bg-emerald-50 text-emerald-800";
    case "Noraidīts":
      return "bg-red-50 text-red-700";
    case "Nosūtīts":
      return "bg-brand/30 text-ink";
    default:
      return "bg-white text-ink-soft ring-1 ring-line";
  }
}

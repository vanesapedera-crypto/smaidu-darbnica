import { cn } from "@/lib/utils";

/**
 * Sezona lapā "Salikt piedāvājumu": divas atzīmes. Abas (vai neviena) — rāda gan vasarā, gan Ziemassvētkos.
 * Formā — lauki "season_summer" un "season_xmas" (sk. seasonFromForm).
 */
export default function SeasonChecks({ value, className }: { value: string | null | undefined; className?: string }) {
  const v = value === "summer" || value === "xmas" ? value : "all";
  return (
    <fieldset className={cn("space-y-1.5", className)}>
      <legend className="mb-1.5 block text-sm font-bold">Piedāvājums klientiem</legend>
      <span className="flex flex-wrap gap-x-5 gap-y-2">
        <label className="inline-flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" name="season_summer" defaultChecked={v !== "xmas"} className="size-5 accent-ink" /> ☀️ Vasaras
        </label>
        <label className="inline-flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" name="season_xmas" defaultChecked={v !== "summer"} className="size-5 accent-ink" /> 🎄 Ziemassvētku
        </label>
      </span>
    </fieldset>
  );
}

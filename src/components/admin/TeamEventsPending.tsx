import Link from "next/link";
import { Check, Pencil, Plus } from "lucide-react";
import type { AdminContext } from "@/lib/auth";
import { publishTeamEvent } from "@/app/admin/actions";
import { adminSecondary } from "./styles";
import CancelTeamEvent from "./CancelTeamEvent";

type TeamEvent = { id: string; event_date: string; time: string | null; title: string; place: string | null; team: string | null; details: string | null };

const MONTHS = ["janvāris", "februāris", "marts", "aprīlis", "maijs", "jūnijs", "jūlijs", "augusts", "septembris", "oktobris", "novembris", "decembris"];
const WEEKDAYS = ["svētdiena", "pirmdiena", "otrdiena", "trešdiena", "ceturtdiena", "piektdiena", "sestdiena"];
const dayTitle = (day: string) => {
  const d = new Date(`${day.slice(0, 10)}T12:00:00Z`);
  return `${d.getUTCDate()}. ${MONTHS[d.getUTCMonth()]}, ${WEEKDAYS[d.getUTCDay()]}`;
};

/**
 * Pieteikumu lapā — komandas grafika pasākumi, kas vēl nav apstiprināti (komanda tos kalendārā neredz).
 * "Apstiprināt" — pasākums parādās komandas kalendārā; "Labot" — atver pasākuma labošanu.
 */
export default async function TeamEventsPending({ db }: { db: AdminContext["db"] }) {
  const { data, error } = await db.from("team_events").select("*").eq("published", false).order("event_date").order("created_at");
  if (error) return null; // tabula vēl nav izveidota
  const events = (data ?? []) as TeamEvent[];

  return (
    <section className="mt-6 rounded-2xl bg-sky-50 p-4 ring-1 ring-sky-200 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold">Komandas grafiks — jāapstiprina ({events.length})</h2>
          <p className="mt-0.5 text-sm text-ink-soft">Pēc apstiprināšanas pasākums parādās komandas kalendārā.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/grafiks/jauns" className={adminSecondary}>
            <Plus className="size-4" aria-hidden /> Pievienot pasākumu
          </Link>
          {events.length > 1 && (
            <form action={publishTeamEvent.bind(null, null)}>
              <button type="submit" className={adminSecondary}>
                <Check className="size-4" aria-hidden /> Apstiprināt visus
              </button>
            </form>
          )}
        </div>
      </div>

      {events.length > 0 && (
        <ul className="mt-4 space-y-2">
          {events.map((e) => (
            <li key={e.id} className="flex flex-wrap items-start justify-between gap-3 rounded-2xl bg-white p-4 ring-1 ring-line">
              <div className="min-w-0 flex-1 text-sm">
                <p className="text-xs font-extrabold tracking-wide text-ink-soft uppercase">
                  {dayTitle(e.event_date)}
                  {e.time && ` · ${e.time}`}
                </p>
                <p className="mt-1 font-extrabold">
                  {e.title}
                  {e.place && <span className="font-semibold text-ink-soft"> · {e.place}</span>}
                </p>
                {e.team && <p className="mt-1">Komanda: {e.team}</p>}
                {e.details && <p className="mt-2 rounded-xl bg-surface p-2.5 whitespace-pre-line text-ink-soft">{e.details}</p>}
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                <CancelTeamEvent id={e.id} title={e.title} />
                <Link href={`/admin/grafiks/${e.id}`} className={adminSecondary}>
                  <Pencil className="size-4" aria-hidden /> Labot
                </Link>
                <form action={publishTeamEvent.bind(null, e.id)}>
                  <button type="submit" className="inline-flex items-center gap-2 rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-ink hover:bg-brand-strong">
                    <Check className="size-4" aria-hidden /> Apstiprināt
                  </button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

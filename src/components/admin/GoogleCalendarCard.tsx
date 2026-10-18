import { CalendarCheck, CalendarX } from "lucide-react";
import { disconnectGoogle } from "@/app/admin/actions";
import type { AdminContext } from "@/lib/auth";
import { googleConnection, isGoogleConfigured } from "@/lib/google-calendar";
import { adminSecondary } from "./styles";

const MESSAGES: Record<string, string> = {
  savienots: "Google kalendārs savienots. Turpmāk apstiprinātās rezervācijas parādīsies jūsu kalendārā, un tās varēsiet labot.",
  kluda: "Neizdevās savienot ar Google kalendāru. Mēģiniet vēlreiz.",
  "nav-tabulas": "Google atļauja saņemta, bet datubāzē nav tabulas google_calendar — palaidiet SQL (sk. supabase/README.md) un savienojiet vēlreiz.",
  "nav-iestatits": "Vercel iestatījumos nav GOOGLE_CLIENT_ID un GOOGLE_CLIENT_SECRET (sk. docs/google-kalendars.md).",
};

/**
 * Google kalendāra savienojuma stāvoklis paneļa sākumā: savienots (ar kuru kontu) vai poga "Savienot".
 * Savienotajā kalendārā apstiprinātās rezervācijas tiek ieliktas tieši — tās var labot Google kalendārā.
 */
export default async function GoogleCalendarCard({ db, message }: { db: AdminContext["db"]; message?: string }) {
  const configured = isGoogleConfigured();
  const conn = configured ? await googleConnection(db) : null;
  const notice = message ? MESSAGES[message] : undefined;

  return (
    <div className="mt-6 rounded-2xl bg-white p-4 ring-1 ring-line sm:flex sm:items-center sm:justify-between sm:gap-6">
      <div className="flex items-start gap-3">
        <span className={`grid size-9 shrink-0 place-items-center rounded-lg ${conn ? "bg-emerald-50 text-emerald-700" : "bg-surface"}`}>
          {conn ? <CalendarCheck className="size-4" /> : <CalendarX className="size-4" />}
        </span>
        <div className="text-sm">
          <p className="font-bold">{conn ? `Google kalendārs: savienots${conn.email ? ` (${conn.email})` : ""}` : "Google kalendārs nav savienots"}</p>
          <p className="text-ink-soft">
            {conn
              ? "Apstiprinātās rezervācijas tiek ieliktas jūsu kalendārā — tās varat labot Google kalendārā (Edit)."
              : configured
                ? "Notikumi aiziet kā ielūgumi, kurus labot nevar. Savienojiet, lai notikumi būtu jūsu kalendārā un tos varētu labot."
                : "Lai savienotu, Vercel iestatījumos vispirms jāievada GOOGLE_CLIENT_ID un GOOGLE_CLIENT_SECRET."}
          </p>
          {notice && <p className="mt-1 font-semibold">{notice}</p>}
        </div>
      </div>
      <div className="mt-3 shrink-0 sm:mt-0">
        {conn ? (
          <form action={disconnectGoogle}>
            <button type="submit" className={adminSecondary}>
              Atvienot
            </button>
          </form>
        ) : (
          configured && (
            // Parasta saite (nevis Link) — pāradresē uz Google
            <a href="/api/google/connect" className={adminSecondary}>
              Savienot ar Google kalendāru
            </a>
          )
        )}
      </div>
    </div>
  );
}

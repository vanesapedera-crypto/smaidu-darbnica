import { Check, Clock, MessageCircle, MessageSquare } from "lucide-react";
import { markClientConfirmed } from "@/app/admin/actions";
import { CONFIRM_DAYS, confirmPath, phoneDigits, reminderText, type Booking } from "@/lib/bookings";
import { VENUE_SLOTS } from "@/lib/pricing";
import { absoluteUrl } from "@/lib/seo";
import { cn } from "@/lib/utils";
import { adminSecondary } from "./styles";

/** Cik pilnas dienas pagājušas kopš brīža (apstiprinājuma e-pasta nosūtīšanas) */
const daysSince = (iso: string) => Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
const lvDate = (iso: string) => new Date(iso).toLocaleDateString("lv-LV");

/**
 * Klienta apstiprinājuma stāvoklis apstiprinātai rezervācijai:
 *  "confirmed" — klients nospieda "Apstiprinu rezervāciju" (vai atzīmēts ar roku);
 *  "waiting"   — e-pasts nosūtīts, klients vēl nav apstiprinājis;
 *  "overdue"   — nav apstiprinājis CONFIRM_DAYS dienas → jāraksta WhatsApp / SMS;
 *  null        — nav ko rādīt (nav apstiprināta, vai apstiprinājuma e-pasts nav sūtīts).
 */
export function confirmationState(b: Booking): { state: "confirmed" | "waiting" | "overdue"; days: number } | null {
  if (b.status !== "Apstiprināta") return null;
  if (b.client_confirmed_at) return { state: "confirmed", days: 0 };
  if (!b.confirmation_sent_at) return null;
  const days = daysSince(b.confirmation_sent_at);
  return { state: days >= CONFIRM_DAYS ? "overdue" : "waiting", days };
}

const LABEL = {
  confirmed: "Klients apstiprināja",
  waiting: "Gaida klienta apstiprinājumu",
  overdue: "Klients nav apstiprinājis",
};
const TONE = {
  confirmed: "bg-emerald-50 text-emerald-800 ring-emerald-300",
  waiting: "bg-brand/30 text-ink ring-brand",
  overdue: "bg-red-50 text-red-700 ring-red-200",
};

/** Īsa atzīme pieteikuma galvenē (redzama, neatverot pieteikumu) */
export function ConfirmationBadge({ booking }: { booking: Booking }) {
  const c = confirmationState(booking);
  if (!c) return null;
  const Icon = c.state === "confirmed" ? Check : Clock;
  return (
    <span className={cn("mt-1.5 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ring-1", TONE[c.state])}>
      <Icon className="size-3.5" aria-hidden />
      {LABEL[c.state]}
      {c.state !== "confirmed" && ` · ${c.days} d.`}
    </span>
  );
}

/**
 * Bloks atvērtā pieteikumā: stāvoklis un — kamēr klients nav apstiprinājis — pogas "WhatsApp" un "SMS"
 * (atver ziņu ar jau uzrakstītu tekstu un apstiprināšanas saiti) un "Apstiprināja pa telefonu".
 */
export default function ClientConfirmation({ booking: b }: { booking: Booking }) {
  const c = confirmationState(b);
  if (!c) return null;

  const [y, m, d] = (b.event_date ?? "").split("-");
  const start = b.event_time?.slice(0, 5) ?? "";
  const slot = VENUE_SLOTS.find((t) => t.value === start)?.label ?? start;
  const when = [b.event_date ? `${Number(d)}.${m}.${y}.` : "", slot && `plkst. ${slot}`].filter(Boolean).join(" ");
  const path = confirmPath(b);
  const text = path ? encodeURIComponent(reminderText(when, absoluteUrl(path))) : "";
  const digits = phoneDigits(b.phone);

  return (
    <div className={cn("rounded-2xl p-4 ring-1", TONE[c.state])}>
      <p className="text-sm font-extrabold">
        {LABEL[c.state]}
        {c.state === "confirmed" && b.client_confirmed_at && ` ${lvDate(b.client_confirmed_at)}`}
      </p>
      {c.state !== "confirmed" && (
        <>
          <p className="mt-1 text-sm">
            Apstiprinājuma e-pasts nosūtīts {b.confirmation_sent_at && lvDate(b.confirmation_sent_at)} (pirms {c.days} d.).
            {c.state === "overdue" && " Nosūtiet atgādinājumu:"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {digits && text && (
              <>
                <a href={`https://wa.me/${digits}?text=${text}`} target="_blank" rel="noopener noreferrer" className={adminSecondary}>
                  <MessageCircle className="size-4" aria-hidden />
                  WhatsApp
                </a>
                <a href={`sms:+${digits}?&body=${text}`} className={adminSecondary}>
                  <MessageSquare className="size-4" aria-hidden />
                  SMS
                </a>
              </>
            )}
            <form action={markClientConfirmed.bind(null, b.id)}>
              <button type="submit" className={adminSecondary}>
                <Check className="size-4" aria-hidden />
                Apstiprināja pa telefonu
              </button>
            </form>
          </div>
        </>
      )}
    </div>
  );
}

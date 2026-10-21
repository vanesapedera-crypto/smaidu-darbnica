"use client";

import { useActionState } from "react";
import { LoaderCircle, Mail, MessageCircle, MessageSquare, Star } from "lucide-react";
import { sendReviewRequest } from "@/app/admin/actions";
import { adminSecondary } from "./styles";

/**
 * Bloks atvērtā pieteikumā: "Pieprasīt atsauksmi" — e-pasts klientam (nosūta uzreiz) vai WhatsApp / SMS
 * (atver ziņu ar jau uzrakstītu tekstu un saiti uz Google atsauksmēm). Teksti — lib/review.ts.
 */
export default function ReviewRequest({
  id,
  hasEmail,
  phoneDigits,
  message,
  about,
  requestedAt,
  fallbackUrl,
}: {
  id: string;
  hasEmail: boolean;
  /** Telefons starptautiskā formātā bez "+" (WhatsApp saitei); tukšs — WhatsApp un SMS pogu nav */
  phoneDigits: string;
  /** WhatsApp / SMS ziņas teksts */
  message: string;
  /** "par telpām" vai "par animatoriem un programmu" */
  about: string;
  /** Kad e-pasts jau nosūtīts (ja datubāzē ir kolonna review_requested_at) */
  requestedAt: string | null;
  /** true, ja panelī nav ievadīta Google atsauksmju saite (tad saite ved uz Google kartēm) */
  fallbackUrl: boolean;
}) {
  const [state, action, pending] = useActionState(sendReviewRequest.bind(null, id), undefined);
  const text = encodeURIComponent(message);

  return (
    <div className="rounded-2xl bg-surface p-4">
      <p className="flex items-center gap-2 text-sm font-extrabold">
        <Star className="size-4" aria-hidden />
        Pieprasīt atsauksmi <span className="font-semibold text-ink-soft">({about})</span>
      </p>
      {requestedAt && (
        <p className="mt-1 text-sm text-ink-soft">
          E-pasts nosūtīts {new Date(requestedAt).toLocaleDateString("lv-LV")}.
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        {hasEmail && (
          <form action={action}>
            <button type="submit" disabled={pending} className={adminSecondary}>
              {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Mail className="size-4" aria-hidden />}
              {requestedAt ? "Nosūtīt vēlreiz" : "Nosūtīt e-pastu"}
            </button>
          </form>
        )}
        {phoneDigits && (
          <>
            <a href={`https://wa.me/${phoneDigits}?text=${text}`} target="_blank" rel="noopener noreferrer" className={adminSecondary}>
              <MessageCircle className="size-4" aria-hidden />
              WhatsApp
            </a>
            <a href={`sms:+${phoneDigits}?&body=${text}`} className={adminSecondary}>
              <MessageSquare className="size-4" aria-hidden />
              SMS
            </a>
          </>
        )}
      </div>
      {state?.error && (
        <p role="alert" className="mt-2 text-sm font-semibold text-destructive">
          {state.error}
        </p>
      )}
      {fallbackUrl && (
        <p className="mt-2 text-xs text-ink-soft">
          Ziņa ved uz atsauksmes formu mājaslapā (/atsauksmes), kur ir arī poga “Iekopēt arī Google”. Ieteicams ievadīt Google atsauksmju saiti: Iestatījumi → Kontakti — līdz tam Google poga ved uz Smaidu Darbnīcu Google kartēs.
        </p>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CircleCheck, LoaderCircle, MapPin, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PriceGroup } from "@/lib/content/types";
import { VENUE_SLOTS, estimateProgramPrice, eur, extraPrice, fromPrice, venuePrice, type BookingPrices, type Extra } from "@/lib/pricing";
import { buttonClass } from "./ui";
import { Field, Honeypot, inputClass } from "./form";

type Program = { slug: string; title: string; pricing: PriceGroup[]; note?: string; extras?: Extra[]; smallMax?: number };

type TravelQuote = { address: string; oneWayKm: number; roundTripKm: number; cost: number; rate: number };
type TravelState =
  | { status: "idle" }
  | { status: "loading"; address: string }
  | { status: "ok"; address: string; quote: TravelQuote }
  | { status: "error"; address: string; error: string };

const LOCATIONS = { studio: "Smaidu Darbnīcā", travel: "Izbraukums" } as const;

const initial = {
  parentName: "",
  phone: "",
  email: "",
  program: "",
  childrenCount: "",
  childAge: "",
  eventDate: "",
  eventTime: "",
  location: LOCATIONS.studio as string,
  address: "",
  acceptTravelFee: false,
  message: "",
  consent: false,
};

/**
 * Bērnu ballītes rezervācijas forma (privātpersonām).
 * Pārveidota no iepriekšējās versijas: tie paši lauki un `bookings` tabula,
 * bet cena tiek aprēķināta no programmas cenrāža (lib/pricing.ts).
 */
export default function BookingForm({
  programs,
  prices,
  defaultProgram = "",
}: {
  programs: Program[];
  /** Telpu nomas un izbraukuma cenas no paneļa */
  prices: BookingPrices;
  defaultProgram?: string;
}) {
  const [form, setForm] = useState({ ...initial, program: defaultProgram });
  const [website, setWebsite] = useState("");
  const [startedAt] = useState(() => Date.now());
  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const [travel, setTravel] = useState<TravelState>({ status: "idle" });
  // Telpu nomas aizņemtie laiki izvēlētajā datumā (no /api/availability)
  const [booked, setBooked] = useState<{ date: string; times: string[] }>({ date: "", times: [] });
  // Atzīmētās papildu iespējas (pēc nosaukuma); mainot programmu, izvēle tiek notīrīta
  const [extras, setExtras] = useState<string[]>([]);

  const inStudio = form.location === LOCATIONS.studio;
  const program = programs.find((p) => p.slug === form.program);
  const programPrice = program
    ? estimateProgramPrice(program.pricing, Number(form.childrenCount), !inStudio)
    : null;
  const roomPrice = inStudio ? venuePrice(form.eventDate, prices) : null;

  // Telpu noma: kad izvēlēts datums, noskaidro, kuri laiki tajā jau ir aizņemti
  useEffect(() => {
    if (!inStudio || !form.eventDate) return;
    const date = form.eventDate;
    let stale = false;
    fetch(`/api/availability?date=${date}`)
      .then((r) => r.json())
      .then((d) => {
        if (!stale) setBooked({ date, times: Array.isArray(d.taken) ? d.taken : [] });
      })
      .catch(() => {});
    return () => {
      stale = true;
    };
  }, [inStudio, form.eventDate]);
  const takenTimes = inStudio && booked.date === form.eventDate ? booked.times : [];
  const allTaken = VENUE_SLOTS.every((t) => takenTimes.includes(t.value));
  const timeTaken = inStudio && takenTimes.includes(form.eventTime);
  // Cenrādī rāda tikai izvēlētās norises vietas cenas: ja programmai ir atsevišķa grupa "Izbraukuma ballīte",
  // tad izbraukumam — tikai to, Smaidu Darbnīcai — tikai pārējās. Piezīmi par izbraukumu šeit nerāda:
  // izbraukuma piemaksa un ceļa izdevumi ir redzami kopsavilkumā formas apakšā.
  const isTravelGroup = (g: PriceGroup) => /izbrauk/i.test(g.title);
  const shownPricing = program?.pricing.some(isTravelGroup)
    ? program.pricing.filter((g) => isTravelGroup(g) === !inStudio)
    : (program?.pricing ?? []);
  const shownNote = program?.note && !/izbrauk/i.test(program.note) ? program.note : "";
  // Ceļa izdevumi skaitās tikai tad, ja aprēķins atbilst pašreizējai adresei
  const travelQuote = !inStudio && travel.status === "ok" && travel.address === form.address.trim() ? travel.quote : null;
  // Papildu iespējas: atzīmētās + to cena (dažām cena atkarīga no bērnu skaita)
  const chosenExtras = (program?.extras ?? [])
    .filter((x) => extras.includes(x.label))
    .map((x) => ({ label: x.label, price: extraPrice(x, Number(form.childrenCount), program?.smallMax ?? 6) }));
  const extrasTotal = chosenExtras.reduce((sum, x) => sum + (x.price ?? 0), 0);
  // Izbraukuma piemaksa — ballītēm tālāk par 10 km no Smaidu Darbnīcas (tāpat kā ceļa izdevumi).
  // Par to informējam tikai tad, kad adrese ir aprēķināta un ir tālāk (sk. ceļa izdevumu rezultātu pie adreses).
  const far = Boolean(travelQuote && travelQuote.oneWayKm > prices.freeTravelKm);
  const surcharge = far ? prices.travelSurcharge : 0;
  const total = Math.round(((programPrice ?? 0) + extrasTotal + (roomPrice ?? 0) + surcharge + (travelQuote?.cost ?? 0)) * 100) / 100;
  // Cenas paskaidrojums pie papildu iespējas
  const extraHint = (x: Extra) =>
    x.flat !== undefined
      ? eur(x.flat)
      : x.perChild !== undefined
        ? `${eur(x.perChild)} / bērnam`
        : `${x.smallLabel ?? "Mazā grupa"} — ${eur(x.small ?? 0)} · ${x.largeLabel ?? "Lielā grupa"} — ${eur(x.large ?? 0)}`;

  /**
   * Ceļa izdevumu aprēķins (pa ceļiem no Pasta ielas 25, Tukumā, turp un atpakaļ).
   * Tiek izsaukts, kad lietotājs pabeidz rakstīt adresi (iziet no lauka) vai nospiež pogu —
   * nevis pie katra burta, jo kartes pakalpojumi to neatļauj.
   */
  async function calculateTravel() {
    const address = form.address.trim();
    if (address.length < 4 || (travel.status !== "idle" && travel.status !== "error" && travel.address === address)) return;
    setTravel({ status: "loading", address });
    try {
      const res = await fetch(`/api/travel?${new URLSearchParams({ address })}`);
      const data = await res.json();
      setTravel(data.ok ? { status: "ok", address, quote: data } : { status: "error", address, error: data.error });
    } catch {
      setTravel({ status: "error", address, error: "Neizdevās aprēķināt. Ceļa izdevumus aprēķināsim, apstiprinot rezervāciju." });
    }
  }

  const set = (field: keyof typeof initial) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  const fieldProps = (field: keyof typeof initial) => ({
    id: field,
    name: field,
    value: form[field] as string,
    onChange: set(field),
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": errors[field] ? `${field}-error` : undefined,
    className: inputClass,
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setErrors({});
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          // Papildu iespējas pievieno ziņojumam — tā tās redzamas panelī un e-pasta paziņojumā
          message: [
            form.message.trim(),
            chosenExtras.length > 0 &&
              `Papildu iespējas: ${chosenExtras.map((x) => `${x.label}${x.price !== null ? ` (${eur(x.price)})` : ""}`).join(", ")}`,
          ]
            .filter(Boolean)
            .join("\n\n"),
          eventTime: inStudio ? form.eventTime : "",
          inquiryType: "private",
          website,
          startedAt,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setState("sent");
        setForm({ ...initial, program: defaultProgram });
        setTravel({ status: "idle" });
        setExtras([]);
        return;
      }
      setErrors(data.errors ?? {});
      setMessage(data.error ?? "Lūdzu, pārbaudiet iezīmētos laukus.");
      setState("error");
    } catch {
      setMessage("Neizdevās nosūtīt. Pārbaudiet interneta savienojumu vai zvaniet mums.");
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div role="status" className="flex flex-col items-center rounded-3xl bg-white p-10 text-center ring-1 ring-line md:p-14">
        <span className="grid size-16 place-items-center rounded-full bg-brand">
          <CircleCheck className="size-8" aria-hidden />
        </span>
        <h2 className="mt-6 text-2xl font-extrabold">Paldies! Pieteikums saņemts.</h2>
        <p className="mt-3 max-w-md leading-7 text-ink-soft">Sazināsimies ar jums, lai apstiprinātu rezervāciju.</p>
        <button type="button" className={cn(buttonClass("outline"), "mt-8")} onClick={() => setState("idle")}>
          Jauns pieteikums
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="relative space-y-10 rounded-3xl bg-white p-6 ring-1 ring-line sm:p-8 md:p-10">
      <Honeypot value={website} onChange={setWebsite} />

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="mb-5 text-lg font-extrabold">Ballīte</legend>
        <Field id="program" label="Programma" error={errors.program} className="sm:col-span-2">
          <select
            {...fieldProps("program")}
            onChange={(e) => {
              setForm((f) => ({ ...f, program: e.target.value }));
              setExtras([]);
            }}
          >
            <option value="">Izvēlieties programmu</option>
            {programs.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.title}
                {fromPrice(p.pricing) !== null ? ` — no ${fromPrice(p.pricing)} €` : ""}
              </option>
            ))}
          </select>
        </Field>

        {/* Izvēlētās programmas cenrādis (ja ir atsevišķas izbraukuma cenas — tikai izvēlētajai norises vietai) */}
        {program && program.pricing.length > 0 && (
          <div className="grid gap-4 rounded-2xl bg-surface p-5 text-sm sm:col-span-2 sm:grid-cols-2">
            {shownPricing.map((g) => (
              <div key={g.title}>
                <p className="font-extrabold">{g.title}</p>
                <dl className="mt-2 space-y-1">
                  {g.options.map((o) => (
                    <div key={o.label} className="flex justify-between gap-3">
                      <dt className="text-ink-soft">{o.label}</dt>
                      <dd className="font-bold whitespace-nowrap">{o.price === null ? "pēc vienošanās" : eur(o.price)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
            {shownNote && <p className="text-ink-soft sm:col-span-2">{shownNote}</p>}
          </div>
        )}

        {/* Papildu iespējas par atsevišķu samaksu (ja programmai tādas ir) */}
        {program?.extras && program.extras.length > 0 && (
          <div className="space-y-2 sm:col-span-2">
            <p className="text-sm font-bold" id="extras-label">Papildu iespējas</p>
            <div role="group" aria-labelledby="extras-label" className="grid gap-2 sm:grid-cols-2">
              {program.extras.map((x) => {
                const checked = extras.includes(x.label);
                return (
                  <label
                    key={x.label}
                    className={cn(
                      "flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 text-sm leading-6 transition-colors",
                      checked ? "border-ink bg-brand-soft" : "border-input hover:border-ink",
                    )}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => setExtras((list) => (e.target.checked ? [...list, x.label] : list.filter((l) => l !== x.label)))}
                      className="mt-0.5 size-5 shrink-0 accent-ink"
                    />
                    <span>
                      <span className="block font-bold">{x.label}</span>
                      {/* Cenas pēc grupas lieluma — katra savā rindā */}
                      {extraHint(x).split(" · ").map((line) => (
                        <span key={line} className="block text-ink-soft">{line}</span>
                      ))}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        )}

        <div className="space-y-2 sm:col-span-2">
          <p className="text-sm font-bold" id="location-label">Norises vieta</p>
          <div role="radiogroup" aria-labelledby="location-label" className="grid grid-cols-2 gap-3">
            {Object.values(LOCATIONS).map((loc) => (
              <label
                key={loc}
                className={cn(
                  "flex cursor-pointer items-center justify-center rounded-2xl border px-4 py-3.5 text-center font-bold transition-colors",
                  form.location === loc ? "border-ink bg-ink text-white" : "border-input hover:border-ink",
                )}
              >
                <input
                  type="radio"
                  name="location"
                  value={loc}
                  checked={form.location === loc}
                  onChange={() => setForm((f) => ({ ...f, location: loc }))}
                  className="sr-only"
                />
                {loc}
              </label>
            ))}
          </div>
        </div>

        {inStudio ? (
          <p className="rounded-2xl bg-brand-soft p-4 text-sm leading-6 sm:col-span-2">
            <strong>Telpu noma (3 h):</strong> pirmdiena–ceturtdiena {prices.venueWeekday} €, piektdiena–svētdiena{" "}
            {prices.venueWeekend} €. Pieejamie laiki: {VENUE_SLOTS.map((t) => t.label).join(", ")}.
          </p>
        ) : (
          <>
            <Field id="address" label="Ballītes adrese" error={errors.address} className="sm:col-span-2">
              <div className="flex gap-2">
                <input
                  {...fieldProps("address")}
                  onBlur={calculateTravel}
                  autoComplete="street-address"
                  placeholder="Iela, mājas nr., pilsēta"
                />
                <button
                  type="button"
                  onClick={calculateTravel}
                  className="shrink-0 rounded-xl border border-ink/20 px-4 text-sm font-bold transition-colors hover:border-ink"
                >
                  Aprēķināt
                </button>
              </div>
            </Field>

            {/* Ceļa izdevumu rezultāts */}
            {travel.status !== "idle" && travel.address === form.address.trim() && (
              <div aria-live="polite" className="flex items-start gap-3 rounded-2xl bg-surface p-4 text-sm leading-6 sm:col-span-2">
                {travel.status === "loading" ? (
                  <>
                    <LoaderCircle className="mt-0.5 size-4 shrink-0 animate-spin" aria-hidden /> Aprēķina attālumu…
                  </>
                ) : travel.status === "error" ? (
                  <p>{travel.error}</p>
                ) : (
                  <>
                    <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
                    <div>
                      {travel.quote.oneWayKm <= prices.freeTravelKm ? (
                        <p>
                          <strong>Ceļa izdevumi: 0 €</strong> — {travel.quote.oneWayKm.toLocaleString("lv-LV")} km vienā virzienā.
                          Adresēm līdz {prices.freeTravelKm} km izbraukuma piemaksu un ceļa izdevumus nerēķinām.
                        </p>
                      ) : (
                        <>
                          <p>
                            <strong>Ceļa izdevumi: {eur(travel.quote.cost)}</strong> — {travel.quote.oneWayKm.toLocaleString("lv-LV")} km
                            vienā virzienā, {travel.quote.roundTripKm.toLocaleString("lv-LV")} km turp un atpakaļ.
                          </p>
                          <p className="mt-1">
                            Izbraukuma ballītēm tālāk par {prices.freeTravelKm} km no Smaidu Darbnīcas (Pasta iela 25, Tukums) tiek pieskaitīta
                            izbraukuma piemaksa {eur(prices.travelSurcharge)} un ceļa izdevumi — {eur(prices.travelRate)} par km turp un atpakaļ.
                          </p>
                        </>
                      )}
                      <p className="mt-1 text-ink-soft">Atrastā adrese: {travel.quote.address}</p>
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}

        <Field id="eventDate" label="Vēlamais datums" error={errors.eventDate}>
          <input {...fieldProps("eventDate")} type="date" min={today} />
        </Field>
        {inStudio && (
          <Field id="eventTime" label="Vēlamais laiks" error={errors.eventTime}>
            <select {...fieldProps("eventTime")}>
              <option value="">Izvēlieties laiku</option>
              {VENUE_SLOTS.map((t) => (
                <option key={t.value} value={t.value} disabled={takenTimes.includes(t.value)}>
                  {t.label}
                  {takenTimes.includes(t.value) ? " — aizņemts" : ""}
                </option>
              ))}
            </select>
            {/* Aizņemtos laikus izvēlēties nevar; ja laiks bija izvēlēts pirms datuma — lūdz izvēlēties citu */}
            {(allTaken || timeTaken) && (
              <p role="alert" className="mt-2 text-sm font-semibold text-destructive">
                {allTaken ? "Šajā datumā visi laiki ir aizņemti — lūdzu, izvēlieties citu datumu." : "Šis laiks šajā datumā jau ir aizņemts — izvēlieties citu."}
              </p>
            )}
          </Field>
        )}
        <Field id="childrenCount" label="Bērnu skaits" error={errors.childrenCount}>
          <input {...fieldProps("childrenCount")} type="number" inputMode="numeric" min={1} />
        </Field>
        <Field id="childAge" label="Gaviļnieka vecums" error={errors.childAge}>
          <input {...fieldProps("childAge")} />
        </Field>
      </fieldset>

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="mb-5 text-lg font-extrabold">Kontaktinformācija</legend>
        <Field id="parentName" label="Vārds" required error={errors.parentName}>
          <input {...fieldProps("parentName")} autoComplete="name" required />
        </Field>
        <Field id="phone" label="Telefons" required error={errors.phone}>
          <input {...fieldProps("phone")} type="tel" autoComplete="tel" placeholder="+371" required />
        </Field>
        {/* Apstiprinājums un visa turpmākā saziņa notiek pa e-pastu — tāpēc tas ir obligāts */}
        <Field
          id="email"
          label="E-pasts"
          required
          error={errors.email}
          hint="Uz šo e-pastu nosūtīsim rezervācijas apstiprinājumu."
          className="sm:col-span-2"
        >
          <input {...fieldProps("email")} type="email" autoComplete="email" required />
        </Field>
        <Field id="message" label="Papildu informācija" error={errors.message} className="sm:col-span-2">
          <textarea {...fieldProps("message")} rows={4} placeholder="Pastāstiet par ballīti…" />
        </Field>
      </fieldset>

      {/* Aptuvenās cenas kopsavilkums */}
      {(programPrice !== null || roomPrice !== null) && (
        <div className="rounded-2xl bg-surface p-5" aria-live="polite">
          <h2 className="font-extrabold">Aptuvenā cena</h2>
          <dl className="mt-3 space-y-2 text-sm">
            {program && (
              <div className="flex justify-between">
                <dt>{program.title}</dt>
                <dd className="font-bold">{programPrice === null ? "pēc vienošanās" : `${programPrice} €`}</dd>
              </div>
            )}
            {chosenExtras.map((x) => (
              <div key={x.label} className="flex justify-between gap-3">
                <dt>{x.label}</dt>
                <dd className="font-bold whitespace-nowrap">{x.price === null ? "norādiet bērnu skaitu" : eur(x.price)}</dd>
              </div>
            ))}
            {roomPrice !== null && (
              <div className="flex justify-between">
                <dt>Telpu noma</dt>
                <dd className="font-bold">{roomPrice} €</dd>
              </div>
            )}
            {surcharge > 0 && (
              <div className="flex justify-between gap-3">
                <dt>Izbraukuma piemaksa</dt>
                <dd className="font-bold whitespace-nowrap">{eur(surcharge)}</dd>
              </div>
            )}
            {travelQuote && (
              <div className="flex justify-between">
                <dt>Ceļa izdevumi ({travelQuote.roundTripKm.toLocaleString("lv-LV")} km)</dt>
                <dd className="font-bold">{eur(travelQuote.cost)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-line pt-2 text-lg">
              <dt className="font-extrabold">Kopā</dt>
              <dd className="font-extrabold">{eur(total)}</dd>
            </div>
          </dl>
          {!inStudio && !travelQuote && (
            <p className="mt-3 text-sm text-ink-soft">Ievadiet ballītes adresi, lai aprēķinātu ceļa izdevumus.</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <label className="flex items-start gap-3 text-sm leading-6">
          <input
            type="checkbox"
            checked={form.consent}
            onChange={(e) => setForm((f) => ({ ...f, consent: e.target.checked }))}
            className="mt-1 size-5 shrink-0 accent-ink"
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={errors.consent ? "consent-error" : undefined}
          />
          <span>
            Piekrītu datu apstrādei rezervācijas veikšanai.{" "}
            <Link href="/privatuma-politika" className="link-underline">
              Privātuma politika
            </Link>
            {inStudio && (
              <>
                {" · "}
                <Link href="/telpu-noma#noteikumi" target="_blank" className="link-underline">
                  Telpu lietošanas noteikumi
                </Link>
              </>
            )}
          </span>
        </label>
        {errors.consent && (
          <p id="consent-error" role="alert" className="text-sm font-semibold text-destructive">
            {errors.consent}
          </p>
        )}
      </div>

      {state === "error" && (
        <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={state === "sending" || timeTaken}
        className={cn(buttonClass("primary", "lg"), "w-full disabled:opacity-60")}
      >
        {state === "sending" ? <LoaderCircle className="size-5 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
        {state === "sending" ? "Sūta…" : "Pieteikt ballīti"}
      </button>
    </form>
  );
}

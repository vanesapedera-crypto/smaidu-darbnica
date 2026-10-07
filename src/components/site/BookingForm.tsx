"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Car, CircleCheck, Clock, DoorOpen, LoaderCircle, MapPin, Send } from "lucide-react";
import { needsHeadcount } from "@/lib/bookings";
import { isOptimizable } from "@/lib/images";
import { cn } from "@/lib/utils";
import type { PriceGroup } from "@/lib/content/types";
import {
  VAT_NOTE,
  VENUE_SLOTS,
  estimateProgramPrice,
  eur,
  extraPrice,
  fromPrice,
  priceVariants,
  venuePrice,
  type BookingPrices,
  type Extra,
} from "@/lib/pricing";
import { buttonClass } from "./ui";
import { Field, Honeypot, inputClass } from "./form";

type Program = { slug: string; title: string; image?: string; pricing: PriceGroup[]; note?: string; extras?: Extra[]; smallMax?: number };

type TravelQuote = { address: string; oneWayKm: number; roundTripKm: number; cost: number; rate: number };
type TravelState =
  | { status: "idle" }
  | { status: "loading"; address: string }
  | { status: "ok"; address: string; quote: TravelQuote }
  | { status: "error"; address: string; error: string };

const LOCATIONS = { studio: "Smaidu Darbnīcā", travel: "Izbraukums" } as const;
/** Izvēle "Nebūs nepieciešama" programmu sarakstā — tikai telpu noma, bez izklaides programmas */
const NO_PROGRAM = "none";

const initial = {
  companyName: "",
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
 *
 * `institution` — forma vienai noteiktai izbraukuma programmai iestādei (piem. "Ziemassvētki bērnudārzā"):
 * programma (`defaultProgram`) un norises vieta nav jāizvēlas, papildus jānorāda iestādes nosaukums,
 * cena ir bez PVN un izbraukuma piemaksu nepiemēro (tāpat rēķina serveris — sk. bookingCosts).
 */
export default function BookingForm({
  programs,
  prices,
  defaultProgram = "",
  institution,
  notice,
}: {
  programs: Program[];
  /** Telpu nomas un izbraukuma cenas no paneļa */
  prices: BookingPrices;
  defaultProgram?: string;
  /** Iestādes forma: lauku nosaukumi (piem. "Bērnudārza nosaukums", "Bērnudārza adrese") */
  institution?: { nameLabel: string; addressLabel: string };
  /** Svarīgs brīdinājums zem datuma un laika (piem. par kavēšanos); rindkopas atdala tukša rinda */
  notice?: string;
}) {
  // Sākuma stāvoklis: iestādes formā programma un izbraukums ir noteikti jau iepriekš
  const start = { ...initial, program: defaultProgram, ...(institution ? { location: LOCATIONS.travel as string } : {}) };
  const [form, setForm] = useState(start);
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
  // Izvēlētais programmas variants (cenu grupas nosaukums), ja programmai tādi ir — piem. sejas apgleznošana ar vai bez tetovējumiem
  const [variantChoice, setVariantChoice] = useState("");

  const inStudio = form.location === LOCATIONS.studio;
  const program = programs.find((p) => p.slug === form.program);
  // Bērnu skaits un vecums ir obligāti tikai programmām, kur tas ietekmē cenu (ne telpu nomai vien, ne pārsteiguma tēlam)
  const headcount = needsHeadcount(program?.slug);
  // Cena bez PVN — rāda kā "150 € + PVN" (iestādes formā)
  const vat = institution ? " + PVN" : "";
  // Varianti: pēc noklusējuma izvēlēts pirmais
  const variants = program ? priceVariants(program.pricing) : [];
  const variant = variants.find((g) => g.title === variantChoice)?.title ?? variants[0]?.title;
  const programPrice = program
    ? estimateProgramPrice(program.pricing, Number(form.childrenCount), !inStudio, variant)
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
  // Iestādēm izbraukuma piemaksu nepiemēro — tikai ceļa izdevumus par km
  const surcharge = far && !institution ? prices.travelSurcharge : 0;
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
    // Visi lauki ir obligāti (izņemot "Papildu informācija"); bērnu skaits un vecums — tikai programmām, kur tas ir svarīgi.
    // Programma jāizvēlas apzināti: vai nu programma, vai "Nebūs nepieciešama" (izbraukumam programma ir obligāta).
    const missing: Record<string, string> = {};
    if (!form.program || (form.program === NO_PROGRAM && !inStudio))
      missing.program = inStudio
        ? "Izvēlieties izklaides programmu vai “Nebūs nepieciešama”."
        : "Izbraukuma ballītei izvēlieties izklaides programmu.";
    if (institution && !form.companyName.trim()) missing.companyName = "Norādiet nosaukumu.";
    if (!inStudio && !form.address.trim()) missing.address = institution ? "Norādiet adresi." : "Norādiet ballītes adresi.";
    if (!form.eventDate) missing.eventDate = "Izvēlieties datumu.";
    if (!form.eventTime) missing.eventTime = inStudio ? "Izvēlieties laiku." : institution ? "Norādiet sākuma laiku." : "Norādiet ballītes sākuma laiku.";
    if ((headcount || institution) && !form.childrenCount) missing.childrenCount = "Norādiet bērnu skaitu.";
    if (headcount && !form.childAge.trim()) missing.childAge = "Norādiet gaviļnieka vecumu.";
    if (!form.parentName.trim()) missing.parentName = "Norādiet vārdu.";
    if (!form.phone.trim()) missing.phone = "Norādiet telefonu.";
    if (!form.email.trim()) missing.email = "Norādiet e-pastu.";
    if (!form.consent) missing.consent = "Nepieciešama piekrišana datu apstrādei.";
    const first = Object.keys(missing)[0];
    if (first) {
      setErrors(missing);
      setMessage("Lūdzu, aizpildiet iezīmētos laukus.");
      setState("error");
      // Aizritina līdz pirmajam neaizpildītajam laukam
      const el = document.getElementById(first === "eventTime" && inStudio ? "time-label" : first);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement) el.focus({ preventScroll: true });
      return;
    }
    setState("sending");
    setErrors({});
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          program: form.program === NO_PROGRAM ? "" : form.program,
          // Papildu iespējas pievieno ziņojumam — tā tās redzamas panelī un e-pasta paziņojumā
          message: [
            form.message.trim(),
            // Programmas variants — pēc tā serveris rēķina izmaksas e-pastam un panelim (sk. bookingCosts)
            variant && `Izvēle: ${variant}`,
            chosenExtras.length > 0 &&
              `Papildu iespējas: ${chosenExtras.map((x) => `${x.label}${x.price !== null ? ` (${eur(x.price)})` : ""}`).join(", ")}`,
          ]
            .filter(Boolean)
            .join("\n\n"),
          eventTime: form.eventTime,
          inquiryType: "private",
          website,
          startedAt,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setState("sent");
        setForm(start);
        setTravel({ status: "idle" });
        setExtras([]);
        setVariantChoice("");
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

  // Kopsavilkuma rindas biļetē: datums, laiks, vieta (rādām tikai to, kas jau izvēlēts)
  const dateLabel = form.eventDate
    ? new Date(`${form.eventDate}T12:00:00`).toLocaleDateString("lv-LV", { weekday: "long", day: "numeric", month: "long" })
    : "";
  const timeLabel = inStudio ? (VENUE_SLOTS.find((t) => t.value === form.eventTime)?.label ?? "") : form.eventTime;
  const placeLabel = inStudio ? "Smaidu Darbnīca, Pasta iela 25, Tukums" : form.address.trim();
  const hasCosts = programPrice !== null || roomPrice !== null || chosenExtras.length > 0;

  if (state === "sent") {
    return (
      // Pēc nosūtīšanas lapa ir aizritināta līdz formas apakšai — pārceļ skatu uz paziņojumu, lai tas ir redzams ekrāna vidū
      <div
        role="status"
        ref={(el) => el?.scrollIntoView({ behavior: "smooth", block: "center" })}
        className="relative z-10 mx-auto flex max-w-2xl flex-col items-center rounded-3xl bg-white p-10 text-center shadow-xl ring-1 ring-line md:p-14"
      >
        <span className="grid size-16 place-items-center rounded-full bg-brand text-ink">
          <CircleCheck className="size-8" aria-hidden />
        </span>
        <h2 className="display mt-7 text-3xl md:text-4xl">
          Pieteikums <span className="sticker">saņemts</span>
        </h2>
        <p className="mt-5 max-w-md leading-7 text-ink-soft">Paldies! Sazināsimies ar jums, lai apstiprinātu rezervāciju.</p>
        <button type="button" className={cn(buttonClass("outline"), "mt-8")} onClick={() => setState("idle")}>
          Jauns pieteikums
        </button>
      </div>
    );
  }

  // Soļa kartīte: liels numurs + virsraksts (kā "Ballītes gaita" programmu lapās)
  const step = "relative rounded-3xl bg-white p-6 ring-1 ring-line sm:p-8";
  const stepHead = (n: string, title: string) => (
    <legend className="float-left mb-6 flex w-full items-center gap-4">
      <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-2xl bg-brand font-display text-lg font-extrabold">
        {n}
      </span>
      <span className="font-display text-xl font-extrabold tracking-tight uppercase sm:text-2xl">{title}</span>
    </legend>
  );
  // Biļetes rinda: etiķete + vērtība
  const ticketRow = (label: string, value: React.ReactNode) => (
    <div className="flex justify-between gap-4">
      <dt className="text-white/60">{label}</dt>
      <dd className="text-right font-semibold">{value}</dd>
    </div>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="relative grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-8">
      <Honeypot value={website} onChange={setWebsite} />

      <div className="space-y-6">
        {/* 1. solis — izklaides programma (vai "Nebūs nepieciešama", ja vajag tikai telpas); iestādes formā — tikai varianta izvēle */}
        <fieldset className={step}>
          {stepHead("01", institution ? "Programma" : "Izklaides programma")}
          <div className="clear-both grid gap-5">
            {!institution && (
            <Field id="program" label="Izklaides programma" required error={errors.program}>
              <select
                {...fieldProps("program")}
                onChange={(e) => {
                  setForm((f) => ({ ...f, program: e.target.value }));
                  setExtras([]);
                  setVariantChoice("");
                  setErrors((er) => ({ ...er, program: "" }));
                }}
              >
                <option value="">Izvēlieties izklaides programmu</option>
                <option value={NO_PROGRAM}>Nebūs nepieciešama</option>
                {programs.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.title}
                    {fromPrice(p.pricing) !== null ? ` — no ${fromPrice(p.pricing)} €` : ""}
                  </option>
                ))}
              </select>
            </Field>
            )}

            {/* Izvēlētās programmas cenrādis (ja ir atsevišķas izbraukuma cenas — tikai izvēlētajai norises vietai) */}
            {/* Programmai ar variantiem (piem. sejas apgleznošana ar vai bez tetovējumiem) cenrādis ir izvēle: */}
            {/* katrs variants ir kartīte ar savām cenām, un izmaksas rēķina pēc izvēlētā */}
            {program && variants.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-bold" id="variant-label">
                  Izvēlieties<span className="ml-0.5 text-destructive" aria-hidden> *</span>
                </p>
                <div role="radiogroup" aria-labelledby="variant-label" className="grid gap-3 sm:grid-cols-2">
                  {variants.map((g) => {
                    const active = g.title === variant;
                    return (
                      <label
                        key={g.title}
                        className={cn(
                          "block cursor-pointer rounded-2xl border-2 p-4 text-sm transition-colors",
                          active ? "border-ink bg-brand" : "border-line hover:border-ink",
                        )}
                      >
                        <input
                          type="radio"
                          name="variant"
                          value={g.title}
                          checked={active}
                          onChange={() => setVariantChoice(g.title)}
                          className="sr-only"
                        />
                        <span className="block leading-snug font-extrabold">{g.title}</span>
                        <span className="mt-2 block space-y-1">
                          {g.options.map((o) => (
                            <span key={o.label} className="flex justify-between gap-3">
                              <span className={active ? "text-ink/75" : "text-ink-soft"}>{o.label}</span>
                              <span className="font-bold whitespace-nowrap">{o.price === null ? "pēc vienošanās" : `${eur(o.price)}${vat}`}</span>
                            </span>
                          ))}
                        </span>
                      </label>
                    );
                  })}
                </div>
                {shownNote && <p className="text-sm text-ink-soft">{shownNote}</p>}
              </div>
            )}
            {program && variants.length === 0 && program.pricing.length > 0 && (
              <div className={cn("grid gap-4 rounded-2xl bg-surface p-5 text-sm", shownPricing.length > 1 && "sm:grid-cols-2")}>
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
                {shownNote && <p className={cn("text-ink-soft", shownPricing.length > 1 && "sm:col-span-2")}>{shownNote}</p>}
              </div>
            )}

            {/* Papildu iespējas (ja programmai tādas ir) */}
            {program?.extras && program.extras.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-bold" id="extras-label">Papildu iespējas</p>
                <div role="group" aria-labelledby="extras-label" className="grid gap-2 sm:grid-cols-2">
                  {program.extras.map((x) => {
                    const checked = extras.includes(x.label);
                    return (
                      <label
                        key={x.label}
                        className={cn(
                          "flex cursor-pointer items-start gap-3 rounded-2xl border-2 px-4 py-3 text-sm leading-6 transition-colors",
                          checked ? "border-ink bg-brand" : "border-line hover:border-ink",
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
                            <span key={line} className={cn("block", checked ? "text-ink/75" : "text-ink-soft")}>{line}</span>
                          ))}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </fieldset>

        {/* 2. solis — vieta un laiks */}
        <fieldset className={step}>
          {stepHead("02", "Vieta un laiks")}
          <div className="clear-both grid gap-5 sm:grid-cols-2">
            {institution && (
              <Field id="companyName" label={institution.nameLabel} required error={errors.companyName} className="sm:col-span-2">
                <input {...fieldProps("companyName")} autoComplete="organization" />
              </Field>
            )}
            {!institution && (
            <div className="space-y-2 sm:col-span-2">
              <p className="text-sm font-bold" id="location-label">
                Norises vieta<span className="ml-0.5 text-destructive" aria-hidden> *</span>
              </p>
              <div role="radiogroup" aria-labelledby="location-label" className="grid grid-cols-2 gap-3">
                {(
                  [
                    [LOCATIONS.studio, DoorOpen, "Pasta iela 25, Tukums"],
                    [LOCATIONS.travel, Car, "Pie jums"],
                  ] as const
                ).map(([loc, Icon, sub]) => {
                  const active = form.location === loc;
                  return (
                    <label
                      key={loc}
                      className={cn(
                        "flex cursor-pointer flex-col gap-3 rounded-2xl border-2 p-4 transition-colors sm:flex-row sm:items-center",
                        active ? "border-ink bg-ink text-white" : "border-line hover:border-ink",
                      )}
                    >
                      <input
                        type="radio"
                        name="location"
                        value={loc}
                        checked={active}
                        onChange={() => setForm((f) => ({ ...f, location: loc, eventTime: "" }))}
                        className="sr-only"
                      />
                      <span className={cn("grid size-11 shrink-0 place-items-center rounded-xl", active ? "bg-brand text-ink" : "bg-surface")}>
                        <Icon className="size-5" aria-hidden />
                      </span>
                      <span>
                        <span className="block leading-tight font-extrabold">{loc}</span>
                        <span className={cn("mt-0.5 block text-sm", active ? "text-white/70" : "text-ink-soft")}>{sub}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
            )}

            {inStudio ? (
              <p className="rounded-2xl bg-surface p-4 text-sm leading-6 sm:col-span-2">
                <strong>Telpu noma (3 h):</strong> pirmdiena–ceturtdiena {prices.venueWeekday} €, piektdiena–svētdiena {prices.venueWeekend} €.
              </p>
            ) : (
              <>
                <Field id="address" label={institution?.addressLabel ?? "Ballītes adrese"} required error={errors.address} className="sm:col-span-2">
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
                      className="shrink-0 rounded-2xl border-2 border-ink px-4 text-sm font-bold transition-colors hover:bg-ink hover:text-white"
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
                              {institution
                                ? `Adresēm līdz ${prices.freeTravelKm} km ceļa izdevumus nerēķinām.`
                                : `Adresēm līdz ${prices.freeTravelKm} km izbraukuma piemaksu un ceļa izdevumus nerēķinām.`}
                            </p>
                          ) : (
                            <>
                              <p>
                                <strong>Ceļa izdevumi: {eur(travel.quote.cost)}</strong> — {travel.quote.oneWayKm.toLocaleString("lv-LV")} km
                                vienā virzienā, {travel.quote.roundTripKm.toLocaleString("lv-LV")} km turp un atpakaļ.
                              </p>
                              <p className="mt-1">
                                {institution
                                  ? `Adresēm tālāk par ${prices.freeTravelKm} km no Smaidu Darbnīcas (Pasta iela 25, Tukums) tiek pieskaitīti ceļa izdevumi — ${eur(prices.travelRate)} par km turp un atpakaļ.`
                                  : `Izbraukuma ballītēm tālāk par ${prices.freeTravelKm} km no Smaidu Darbnīcas (Pasta iela 25, Tukums) tiek pieskaitīta izbraukuma piemaksa ${eur(prices.travelSurcharge)} un ceļa izdevumi — ${eur(prices.travelRate)} par km turp un atpakaļ.`}
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

            <Field id="eventDate" label="Vēlamais datums" required error={errors.eventDate} className={inStudio ? "sm:col-span-2" : undefined}>
              <input {...fieldProps("eventDate")} type="date" min={today} />
            </Field>
            {/* Izbraukuma ballītei — brīvi izvēlams sākuma laiks (telpām zemāk ir trīs laika posmi) */}
            {!inStudio && (
              <Field id="eventTime" label="Vēlamais laiks" required error={errors.eventTime}>
                <input {...fieldProps("eventTime")} type="time" step={300} />
              </Field>
            )}

            {/* Brīdinājums par sākuma laiku — uzreiz zem datuma un laika */}
            {notice && (
              <div className="flex items-start gap-3.5 rounded-2xl bg-brand p-4 text-sm leading-6 font-semibold sm:col-span-2 sm:p-5">
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-ink text-brand">
                  <Clock className="size-4" aria-hidden />
                </span>
                <div className="space-y-2">
                  <p className="font-display font-extrabold uppercase">Svarīgi!</p>
                  {notice.split(/\n{2,}/).map((para) => (
                    <p key={para}>{para}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Telpu nomas laiki — trīs pogas; aizņemtos laikus izvēlēties nevar */}
            {inStudio && (
              <div className="space-y-2 sm:col-span-2">
                <p className="text-sm font-bold" id="time-label">
                  Vēlamais laiks<span className="ml-0.5 text-destructive" aria-hidden> *</span>
                </p>
                <div role="radiogroup" aria-labelledby="time-label" className="grid grid-cols-3 gap-2 sm:gap-3">
                  {VENUE_SLOTS.map((t) => {
                    const taken = takenTimes.includes(t.value);
                    const active = form.eventTime === t.value && !taken;
                    return (
                      <label
                        key={t.value}
                        className={cn(
                          "flex flex-col items-center rounded-2xl border-2 px-2 py-3 text-center transition-colors",
                          taken
                            ? "cursor-not-allowed border-line bg-surface text-ink/35"
                            : active
                              ? "cursor-pointer border-ink bg-brand"
                              : "cursor-pointer border-line hover:border-ink",
                        )}
                      >
                        <input
                          type="radio"
                          name="eventTime"
                          value={t.value}
                          checked={active}
                          disabled={taken}
                          onChange={() => setForm((f) => ({ ...f, eventTime: t.value }))}
                          className="sr-only"
                        />
                        <span className={cn("text-sm font-extrabold whitespace-nowrap sm:text-base", taken && "line-through")}>{t.label}</span>
                        {taken && <span className="mt-0.5 text-xs font-semibold">aizņemts</span>}
                      </label>
                    );
                  })}
                </div>
                {(allTaken || timeTaken) && (
                  <p role="alert" className="text-sm font-semibold text-destructive">
                    {allTaken ? "Šajā datumā visi laiki ir aizņemti — lūdzu, izvēlieties citu datumu." : "Šis laiks šajā datumā jau ir aizņemts — izvēlieties citu."}
                  </p>
                )}
                {errors.eventTime && (
                  <p id="eventTime-error" role="alert" className="text-sm font-semibold text-destructive">
                    {errors.eventTime}
                  </p>
                )}
              </div>
            )}

            <Field
              id="childrenCount"
              label="Bērnu skaits"
              required={headcount || Boolean(institution)}
              error={errors.childrenCount}
              className={institution ? "sm:col-span-2" : undefined}
            >
              <input {...fieldProps("childrenCount")} type="number" inputMode="numeric" min={1} />
            </Field>
            {!institution && (
              <Field id="childAge" label="Gaviļnieka vecums" required={headcount} error={errors.childAge}>
                <input {...fieldProps("childAge")} />
              </Field>
            )}
          </div>
        </fieldset>

        {/* 3. solis — kontakti */}
        <fieldset className={step}>
          {stepHead("03", "Kontakti")}
          <div className="clear-both grid gap-5 sm:grid-cols-2">
            <Field id="parentName" label={institution ? "Kontaktpersona" : "Vārds"} required error={errors.parentName}>
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
              <textarea {...fieldProps("message")} rows={4} placeholder={institution ? undefined : "Pastāstiet par ballīti…"} />
            </Field>
          </div>
        </fieldset>
      </div>

      {/* Biļete: izvēlētā programma, datums, izmaksas un pieteikšanas poga (lielā ekrānā paliek redzama ritinot) */}
      <aside className="overflow-hidden rounded-3xl bg-ink text-white ring-1 ring-white/15 lg:sticky lg:top-28" aria-label="Rezervācijas kopsavilkums">
        {program?.image && (
          <div className="relative aspect-[16/10]">
            <Image
              src={program.image}
              alt=""
              fill
              sizes="(min-width: 1024px) 380px, 100vw"
              unoptimized={!isOptimizable(program.image)}
              className="object-cover"
            />
            <span aria-hidden className="absolute inset-0 bg-linear-to-t from-ink via-ink/20 to-transparent" />
          </div>
        )}
        <div className={cn("p-6 sm:p-7", program?.image && "relative -mt-10")}>
          <p className="text-xs font-extrabold tracking-[0.14em] text-brand uppercase">Jūsu rezervācija</p>
          {(program || form.program === NO_PROGRAM) && (
            <p className="mt-2 font-display text-2xl leading-tight font-extrabold uppercase">{program?.title ?? "Telpu noma"}</p>
          )}

          <dl className="mt-5 space-y-2 text-sm">
            {dateLabel && ticketRow("Datums", dateLabel)}
            {timeLabel && ticketRow("Laiks", timeLabel)}
            {institution && form.companyName.trim() && ticketRow(institution.nameLabel.split(" ")[0], form.companyName.trim())}
            {placeLabel && ticketRow("Vieta", placeLabel)}
            {form.childrenCount && ticketRow("Bērnu skaits", form.childrenCount)}
          </dl>

          {/* Biļetes "perforācija" */}
          <div aria-hidden className="relative my-6 border-t-2 border-dashed border-white/20">
            <span className="absolute top-1/2 -left-10 size-6 -translate-y-1/2 rounded-full bg-paper sm:-left-11" />
            <span className="absolute top-1/2 -right-10 size-6 -translate-y-1/2 rounded-full bg-paper sm:-right-11" />
          </div>

          <div aria-live="polite">
            <p className="text-xs font-extrabold tracking-[0.14em] text-white/60 uppercase">Izmaksas</p>
            {hasCosts ? (
              <dl className="mt-3 space-y-2 text-sm">
                {program && ticketRow(variant ?? program.title, programPrice === null ? "pēc vienošanās" : `${eur(programPrice)}${vat}`)}
                {chosenExtras.map((x) => (
                  <div key={x.label} className="flex justify-between gap-4">
                    <dt className="text-white/60">{x.label}</dt>
                    <dd className="text-right font-semibold whitespace-nowrap">{x.price === null ? "norādiet bērnu skaitu" : eur(x.price)}</dd>
                  </div>
                ))}
                {roomPrice !== null && ticketRow("Telpu noma", eur(roomPrice))}
                {surcharge > 0 && ticketRow("Izbraukuma piemaksa", eur(surcharge))}
                {travelQuote && ticketRow(`Ceļa izdevumi (${travelQuote.roundTripKm.toLocaleString("lv-LV")} km)`, eur(travelQuote.cost))}
                <div className="flex items-end justify-between gap-4 border-t border-white/15 pt-4">
                  <dt className="font-extrabold">Kopā</dt>
                  <dd className="font-display text-3xl leading-none font-extrabold text-brand">{eur(total)}</dd>
                </div>
              </dl>
            ) : (
              <p className="mt-3 text-sm leading-6 text-white/60">Izvēlieties programmu un datumu — šeit parādīsies izmaksas.</p>
            )}
            {vat && hasCosts && <p className="mt-3 text-sm text-white/60">{VAT_NOTE}</p>}
            {!inStudio && !travelQuote && hasCosts && (
              <p className="mt-3 text-sm text-white/60">Ievadiet {institution ? "adresi" : "ballītes adresi"}, lai aprēķinātu ceļa izdevumus.</p>
            )}
          </div>

          <div className="mt-6 space-y-2">
            <label className="flex items-start gap-3 text-sm leading-6 text-white/85">
              <input
                type="checkbox"
                checked={form.consent}
                onChange={(e) => setForm((f) => ({ ...f, consent: e.target.checked }))}
                id="consent"
                className="mt-1 size-5 shrink-0 accent-brand"
                aria-invalid={errors.consent ? true : undefined}
                aria-describedby={errors.consent ? "consent-error" : undefined}
              />
              <span>
                Piekrītu datu apstrādei rezervācijas veikšanai.{" "}
                <Link href="/privatuma-politika" className="font-semibold text-white underline decoration-brand decoration-2 underline-offset-4">
                  Privātuma politika
                </Link>
                {inStudio && (
                  <>
                    {" · "}
                    <Link
                      href="/telpu-noma#noteikumi"
                      target="_blank"
                      className="font-semibold text-white underline decoration-brand decoration-2 underline-offset-4"
                    >
                      Telpu lietošanas noteikumi
                    </Link>
                  </>
                )}
              </span>
            </label>
            {errors.consent && (
              <p id="consent-error" role="alert" className="text-sm font-semibold text-red-300">
                {errors.consent}
              </p>
            )}
          </div>

          {state === "error" && (
            <p role="alert" className="mt-4 rounded-2xl bg-red-500/15 px-4 py-3 text-sm font-semibold text-red-200">
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={state === "sending" || timeTaken}
            className={cn(buttonClass("primary", "lg"), "mt-6 w-full disabled:opacity-60")}
          >
            {state === "sending" ? <LoaderCircle className="size-5 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
            {state === "sending" ? "Sūta…" : institution ? "Rezervēt" : form.program === NO_PROGRAM ? "Rezervēt telpas" : "Pieteikt ballīti"}
          </button>
        </div>
      </aside>
    </form>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Car, Check, CircleCheck, LoaderCircle, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonClass } from "./ui";
import { Field, Honeypot, inputClass } from "./form";

type Unit = "hour" | "person" | "piece" | "fixed";
type Workshop = { id: string; title: string; description: string | null; image: string | null; season?: string | null; perPerson: number };
type Activity = { id: string; title: string; description: string | null; image: string | null; season?: string | null; unit: Unit; price: number };
/** Cenas klientam ar uzcenojumu un PVN (funkcija configurator_prices) */
export type ConfiguratorPrices = {
  factor: number;
  animatorHour: number;
  perAnimator: number;
  /** Sagatavošanās un novākšana: likme klientam (€/h) un stundas katram darbnīcu animatoram */
  prepHour?: number;
  prepHours?: number;
  /** Laiks ceļā: likme klientam (€/h) katram braucošajam */
  travelHour?: number;
  /** Telpas noma izrādei (ja telpu nodrošinām mēs) — vismaz šī summa ar PVN */
  venueMin?: number;
  /** Minimālā pasūtījuma summa ar PVN */
  minTotal?: number;
  /** Piemaksa ceturtdienās un piektdienās, % */
  peakPercent?: number;
  /** Standarta galda noformējums — ar PVN par katru darbnīcu */
  decorPerWorkshop?: number;
  workshops: Workshop[];
  activities: Activity[];
};

type TravelState = { status: "idle" | "loading" | "ok" | "error"; km?: number; cost?: number; far?: boolean; error?: string };

/** Tālākiem braucieniem (no Tukuma 100 km un vairāk vienā virzienā) ceļš var maksāt līdz 0,50 €/km — aptuvenajā cenā rēķina ar to */
const FAR_KM = 100;
const FAR_RATE = 0.5;
/** Vidējais ātrums laikam ceļā (turp un atpakaļ) */
const AVG_KMH = 70;

/** Izrāde — aktivitāte, kuras nosaukumā ir "izrāde" (tai jānorāda, vai telpa ir klienta vai mūsu) */
const isShow = (a: Activity) => /izrād/i.test(a.title);

/** Izrāde no lapas "Izrādes" (panelī: Iestatījumi → Izrādes) */
export type ShowInfo = { title: string; src: string; poster: string; duration?: string; audience?: string; season?: string; description?: string };

/**
 * Bildes no public/media/salikt — ja darbnīcai, aktivitātei vai izrādei panelī nav savas bildes,
 * to izvēlas pēc nosaukuma (piem. "Sejas apgleznošana" → sejas-apgleznosana.webp).
 */
const KEYWORD_IMAGES: [RegExp, string][] = [
  [/piparkūk/i, "piparkukas"],
  [/sejas|sejiņ/i, "sejas-apgleznosana"],
  [/glit/i, "glitera-tetovejumi"],
  [/mirdz/i, "mirdzumins"],
  [/burbu/i, "burbuli"],
  [/putu/i, "putu-ballite"],
  [/slaim/i, "slaims"],
  [/eksperiment|pētniek/i, "eksperimenti"],
  [/virtu|donut/i, "virtuli"],
  [/cepum/i, "cepumu-apgleznosana"],
  [/keks|kēks|kūciņ/i, "keksini"],
  [/zobeni/i, "kroni-zils"],
  [/kroņ|kroni/i, "kroni"],
  [/piesprau/i, "piespraudes"],
  [/olaf/i, "olafs"],
  [/balon/i, "tels-baloni"],
  [/tēl/i, "tels-suns"],
  [/vadīt|vadītāj|organiz/i, "pasakuma-vaditaja"],
  [/lent|deju|kustīb/i, "lentes"],
  [/apglezno|krāso|tekstil|maisiņ/i, "apgleznosana"],
  [/egl|ziemassvētk/i, "egles-iedegsana"],
];
const fallbackImage = (title: string) => {
  const hit = KEYWORD_IMAGES.find(([re]) => re.test(title));
  return hit ? `/media/salikt/${hit[1]}.webp` : null;
};
const SEASON_IMAGE = { summer: "/media/salikt/burbuli.webp", xmas: "/media/salikt/egles-iedegsana.webp" } as const;

type Season = "summer" | "xmas";
const SEASON_LABEL: Record<Season, string> = { summer: "Vasaras pasākums", xmas: "Ziemassvētku pasākums" };
/** Vai darbnīca / aktivitāte / izrāde der izvēlētajai sezonai (bez sezonas — visu gadu) */
const fits = (itemSeason: string | null | undefined, season: Season | "") =>
  Boolean(season) && (!itemSeason || itemSeason === "all" || itemSeason === season);
const norm = (t: string) => t.toLowerCase().replace(/[„”“"'«»]/g, "").replace(/\s+/g, " ").trim();
const ytId = (src: string) => src.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/)?.[1];
const showPoster = (v: ShowInfo) => v.poster || (ytId(v.src) ? `https://i.ytimg.com/vi/${ytId(v.src)}/hqdefault.jpg` : "");

const eur = (n: number) => `${n.toLocaleString("lv-LV", { maximumFractionDigits: 0 })} €`;
/** Aptuvenā summa — noapaļota līdz 10 € */
const approx = (n: number) => Math.round(n / 10) * 10;

/**
 * Klients atzīmē darbnīcas un aktivitātes — kopsumma (aptuveni, ar PVN) mainās uzreiz.
 * Darbnīcām: materiāli × dalībnieki + animatori (vismaz 1 katrai darbnīcai un 1 uz `perAnimator` dalībniekiem) × stundas.
 * Aktivitātēm: par stundu × ilgums, par gabalu × skaits, par personu × dalībnieki, fiksēta summa.
 */
export default function OfferConfigurator({ prices: allPrices, shows: allShows = [] }: { prices: ConfiguratorPrices; shows?: ShowInfo[] }) {
  // Vispirms klients izvēlas sezonu — sarakstos paliek tikai tās sezonas (un visu gadu) iespējas
  const [season, setSeason] = useState<Season | "">("");
  const prices = {
    ...allPrices,
    workshops: allPrices.workshops.filter((w) => fits(w.season, season)),
    activities: allPrices.activities.filter((a) => fits(a.season, season)),
  };
  // Izrādes cena un sezona — no "💰 Cenas → Izrādes" (aktivitāte "Izrāde „Nosaukums”"); ja cenas nav — sezona no lapas "Izrādes"
  const allShowItems = allShows
    .filter((v) => v.title.trim())
    .map((v) => ({ show: v, price: allPrices.activities.find((a) => isShow(a) && norm(a.title).includes(norm(v.title))) }));
  const showItems = allShowItems.filter((x) => fits(x.price ? x.price.season : x.show.season, season));
  const matched = new Set(allShowItems.map((x) => x.price?.id).filter(Boolean));
  const otherActivities = prices.activities.filter((a) => !matched.has(a.id));
  const [pickedShows, setPickedShows] = useState<string[]>([]);
  const [participants, setParticipants] = useState(30);
  const [hours, setHours] = useState(2);
  const [workshops, setWorkshops] = useState<string[]>([]);
  // aktivitātes id → daudzums (gabaliem); pārējām — 1
  const [activities, setActivities] = useState<Record<string, number>>({});
  const [ownVenue, setOwnVenue] = useState<"" | "yes" | "no">("");
  const [address, setAddress] = useState("");
  const [travel, setTravel] = useState<TravelState>({ status: "idle" });
  const [form, setForm] = useState({ companyName: "", parentName: "", phone: "", email: "", eventDate: "", message: "", consent: false });
  const [website, setWebsite] = useState("");
  const [startedAt] = useState(() => Date.now());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");

  const people = Math.max(0, participants || 0);
  const chosenWorkshops = prices.workshops.filter((w) => workshops.includes(w.id));
  const chosenActivities = otherActivities.filter((a) => activities[a.id] !== undefined);
  const chosenShows = showItems.filter((x) => pickedShows.includes(x.show.title));
  const showChosen = chosenShows.length > 0 || chosenActivities.some(isShow);
  // Izrāde bez cenas panelī — cenu precizēsim
  const showPriceUnknown = chosenShows.some((x) => !x.price);

  const workshopAnimators = chosenWorkshops.length ? Math.max(chosenWorkshops.length, Math.ceil(people / Math.max(1, prices.perAnimator))) : 0;
  const workshopsSum =
    chosenWorkshops.reduce((s, w) => s + w.perPerson * people, 0) +
    workshopAnimators * hours * prices.animatorHour +
    // Sagatavošanās pirms un novākšana pēc darbnīcām (piem. +1 h katram animatoram)
    workshopAnimators * (prices.prepHours ?? 0) * (prices.prepHour ?? 0) +
    // Standarta galda noformējums katrai darbnīcai
    chosenWorkshops.length * (prices.decorPerWorkshop ?? 0);
  const activityPrice = (a: Activity) =>
    a.unit === "hour" ? a.price * hours : a.unit === "piece" ? a.price * (activities[a.id] || 1) : a.unit === "person" ? a.price * people : a.price;
  const activitiesSum = chosenActivities.reduce((s, a) => s + activityPrice(a), 0);
  // Ceļš: km izdevumi + laiks ceļā katram braucošajam (darbnīcu animatori + pa vienam katrai aktivitātei ar cilvēku)
  const travellers = workshopAnimators + chosenActivities.filter((a) => a.unit === "hour" || a.unit === "person").length;
  const travelHours = travel.status === "ok" && travel.cost ? (travel.km ?? 0) / AVG_KMH : 0;
  const travelSum =
    travel.status === "ok" ? (travel.cost ?? 0) * (prices.factor || 1) + Math.max(1, travellers) * travelHours * (prices.travelHour ?? 0) : 0;
  const showsSum = chosenShows.reduce((s, x) => s + (x.price ? activityPrice(x.price) : 0), 0);
  const venueSum = showChosen && ownVenue === "no" ? (prices.venueMin ?? 0) : 0;
  // Ceturtdienās un piektdienās — piemaksa programmai (darbnīcām, aktivitātēm, izrādēm); ceļam un telpas nomai — nav
  const weekday = form.eventDate ? new Date(`${form.eventDate}T12:00:00`).getDay() : -1;
  const peak = weekday === 4 || weekday === 5 ? (prices.peakPercent ?? 0) / 100 : 0;
  const sum = (workshopsSum + activitiesSum + showsSum) * (1 + peak) + travelSum + venueSum;
  // Mazāk par minimālo pasūtījumu nerēķinām
  const atMinimum = sum > 0 && sum < (prices.minTotal ?? 0);
  const total = atMinimum ? (prices.minTotal ?? 0) : sum;
  const anything = chosenWorkshops.length + chosenActivities.length + chosenShows.length > 0;
  const extras = [showPriceUnknown && "izrādes cena"].filter(Boolean).join(" + ");

  const toggleWorkshop = (id: string) => setWorkshops((ws) => (ws.includes(id) ? ws.filter((x) => x !== id) : [...ws, id]));
  const toggleActivity = (id: string) =>
    setActivities((as) => {
      const next = { ...as };
      if (next[id] !== undefined) delete next[id];
      else next[id] = 1;
      return next;
    });

  async function quoteTravel() {
    if (address.trim().length < 4) return;
    setTravel({ status: "loading" });
    try {
      const res = await fetch(`/api/travel?address=${encodeURIComponent(address.trim())}`);
      const d = await res.json();
      const far = d.ok && Number(d.oneWayKm) >= FAR_KM;
      setTravel(
        d.ok
          ? { status: "ok", km: d.roundTripKm, cost: far ? Math.round(Number(d.roundTripKm) * FAR_RATE) : d.cost, far }
          : { status: "error", error: d.error },
      );
    } catch {
      setTravel({ status: "error", error: "Ceļa izdevumus šobrīd neizdevās aprēķināt — tos precizēsim." });
    }
  }

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const missing: Record<string, string> = {};
    if (!season) missing.choice = "Izvēlieties, vai tas ir vasaras vai Ziemassvētku pasākums.";
    else if (!anything) missing.choice = "Atzīmējiet vismaz vienu izrādi, darbnīcu vai aktivitāti.";
    if (showChosen && !ownVenue) missing.venue = "Norādiet, vai izrādei ir sava telpa.";
    if (!form.companyName.trim()) missing.companyName = "Norādiet uzņēmumu.";
    if (!form.parentName.trim()) missing.parentName = "Norādiet kontaktpersonu.";
    if (!form.phone.trim()) missing.phone = "Norādiet telefonu.";
    if (!form.email.trim()) missing.email = "Norādiet e-pastu.";
    if (!form.consent) missing.consent = "Nepieciešama piekrišana datu apstrādei.";
    if (Object.keys(missing).length) {
      setErrors(missing);
      return;
    }

    const lines = [
      season && SEASON_LABEL[season],
      `Saliktais piedāvājums — aptuveni ${eur(approx(total))} ar PVN${extras ? ` + ${extras}` : ""}`,
      `Dalībnieki: ${people}, ilgums: ${String(hours).replace(".", ",")} h`,
      peak > 0 && `Iekļauta piemaksa ceturtdienai/piektdienai: +${prices.peakPercent} %`,
      chosenShows.length > 0 && `Izrādes: ${chosenShows.map((x) => x.show.title).join(", ")}`,
      chosenWorkshops.length > 0 && `Radošās darbnīcas: ${chosenWorkshops.map((w) => w.title).join(", ")}`,
      chosenActivities.length > 0 &&
        `Aktivitātes: ${chosenActivities.map((a) => (a.unit === "piece" ? `${a.title} × ${activities[a.id] || 1}` : a.title)).join(", ")}`,
      showChosen && `Telpa izrādei: ${ownVenue === "yes" ? "klientam ir sava telpa" : `jānodrošina Smaidu Darbnīcai (aprēķinā telpas noma no ${eur(prices.venueMin ?? 0)} — jāprecizē)`}`,
      address.trim() && `Adrese: ${address.trim()}${travel.status === "ok" ? ` (${travel.km} km turp un atpakaļ)` : ""}`,
      form.message.trim() && `\n${form.message.trim()}`,
    ].filter(Boolean);

    setState("sending");
    setErrors({});
    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inquiryType: "business",
          companyName: form.companyName,
          parentName: form.parentName,
          phone: form.phone,
          email: form.email,
          eventDate: form.eventDate || undefined,
          participants: people || undefined,
          address: address.trim() || undefined,
          eventType: "Saliktais piedāvājums",
          message: lines.join("\n"),
          // No izvēles panelī automātiski izveidojas prezentācija (bez cenām) — to pārbauda un nosūta klientam PDF
          presentation: {
            title: season ? SEASON_LABEL[season] : "",
            hours,
            workshopIds: chosenWorkshops.map((w) => w.id),
            activityIds: [...chosenActivities.map((a) => a.id), ...chosenShows.map((x) => x.price?.id).filter(Boolean)],
            intro: [
              chosenShows.length > 0 && `Izrādes: ${chosenShows.map((x) => x.show.title).join(", ")}`,
              showChosen && `Telpa izrādei: ${ownVenue === "yes" ? "klientam ir sava telpa" : "jānodrošina Smaidu Darbnīcai"}`,
              form.message.trim(),
            ]
              .filter(Boolean)
              .join("\n"),
          },
          consent: form.consent,
          website,
          startedAt,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setState("sent");
        return;
      }
      setErrors(data.errors ?? {});
      setState("error");
    } catch {
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div className="rounded-3xl bg-brand p-10 text-center">
        <CircleCheck className="mx-auto size-12" aria-hidden />
        <p className="mt-4 display text-2xl">Paldies! Pieteikums nosūtīts.</p>
        <p className="mt-2">Sazināsimies ar jums tuvākajā laikā, lai precizētu detaļas un galīgo cenu.</p>
      </div>
    );
  }

  const card = (active: boolean) =>
    cn(
      "flex h-full cursor-pointer flex-col overflow-hidden rounded-2xl border-2 bg-white transition-colors",
      active ? "border-ink ring-3 ring-brand" : "border-line hover:border-ink",
    );
  const picture = (src: string | null, alt: string) =>
    src ? (
      // eslint-disable-next-line @next/next/no-img-element -- bildes no paneļa (jebkura adrese)
      <img src={src} alt={alt} className="aspect-[4/3] w-full object-cover" />
    ) : null;
  const unitText = (a: Activity) => (a.unit === "hour" ? "visu pasākuma laiku" : a.unit === "piece" ? "izvēlieties skaitu" : a.unit === "person" ? "katram dalībniekam" : "");

  return (
    <form onSubmit={submit} noValidate className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
      <Honeypot value={website} onChange={setWebsite} />
      <div className="space-y-10">
        {/* Sezona — no tās atkarīgs, kas parādās sarakstos */}
        <section>
          <h2 className="display text-2xl">Kāds pasākums?</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {(Object.keys(SEASON_LABEL) as Season[]).map((v) => (
              <label
                key={v}
                className={cn(
                  "relative flex aspect-[16/9] cursor-pointer items-end overflow-hidden rounded-2xl border-2 bg-ink p-5 text-lg font-extrabold text-white transition-colors",
                  season === v ? "border-ink ring-4 ring-brand" : "border-line hover:border-ink",
                )}
              >
                <input
                  type="radio"
                  name="season"
                  checked={season === v}
                  onChange={() => {
                    setSeason(v);
                    // Mainot sezonu, citas sezonas izvēles notīra
                    setWorkshops([]);
                    setActivities({});
                    setPickedShows([]);
                    setOwnVenue("");
                  }}
                  className="sr-only"
                />
                {/* eslint-disable-next-line @next/next/no-img-element -- sezonas bilde */}
                <img src={SEASON_IMAGE[v]} alt="" className={cn("absolute inset-0 size-full object-cover transition-opacity", season && season !== v ? "opacity-40" : "opacity-80")} />
                <span className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                <span className="relative">
                {v === "summer" ? "☀️ " : "🎄 "}
                {SEASON_LABEL[v]}
                </span>
              </label>
            ))}
          </div>
        </section>

        {season && (
        <>
        {/* 1. Pamatinformācija */}
        <section className="grid gap-4 sm:grid-cols-3">
          <Field id="participants" label="Dalībnieku skaits">
            <input id="participants" type="number" min={1} value={participants || ""} onChange={(e) => setParticipants(Number(e.target.value))} className={inputClass} />
          </Field>
          <Field id="eventDate" label="Pasākuma datums"
            hint={peak ? `Ceturtdienās un piektdienās — piemaksa ${prices.peakPercent} %.` : undefined} error={errors.eventDate}>
            <input id="eventDate" type="date" value={form.eventDate} onChange={set("eventDate")} className={inputClass} />
          </Field>
          <Field id="hours" label="Pasākuma ilgums, stundas">
            <select id="hours" value={hours} onChange={(e) => setHours(Number(e.target.value))} className={inputClass}>
              {[1, 1.5, 2, 2.5, 3, 4, 5, 6].map((h) => (
                <option key={h} value={h}>
                  {String(h).replace(".", ",")} h
                </option>
              ))}
            </select>
          </Field>
        </section>

        {/* Izrādes — ar video, ilgumu un aprakstu no lapas "Izrādes" */}
        {showItems.length > 0 && (
          <section>
            <h2 className="display text-2xl">Izrādes</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {showItems.map(({ show: v }) => {
                const active = pickedShows.includes(v.title);
                const poster = showPoster(v);
                return (
                  <li key={v.title}>
                    <div className={card(active)}>
                      <label className="flex flex-1 cursor-pointer flex-col">
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={() => setPickedShows((ps) => (ps.includes(v.title) ? ps.filter((x) => x !== v.title) : [...ps, v.title]))}
                          className="sr-only"
                        />
                        {picture(poster || fallbackImage(v.title), v.title)}
                        <span className="flex flex-1 items-start gap-3 p-4">
                          <span className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-md border-2", active ? "border-ink bg-ink text-white" : "border-line")}>
                            {active && <Check className="size-4" strokeWidth={3} aria-hidden />}
                          </span>
                          <span>
                            <span className="block font-extrabold">{v.title}</span>
                            {(v.duration || v.audience) && (
                              <span className="block text-xs font-semibold text-ink-soft">{[v.duration, v.audience].filter(Boolean).join(" · ")}</span>
                            )}
                            {v.description && <span className="mt-1 block text-sm whitespace-pre-line text-ink-soft">{v.description.replace(/\*\*/g, "")}</span>}
                          </span>
                        </span>
                      </label>
                      {v.src && (
                        <a href={v.src} target="_blank" rel="noreferrer" className="border-t border-line px-4 py-3 text-sm font-bold underline decoration-brand decoration-2 underline-offset-4">
                          Skatīties video
                        </a>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* 2. Radošās darbnīcas */}
        {prices.workshops.length > 0 && (
          <section>
            <h2 className="display text-2xl">Radošās darbnīcas</h2>
            <p className="mt-1 text-ink-soft">Var izvēlēties vairākas — dalībnieki tās apmeklē pēc kārtas.</p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {prices.workshops.map((w) => {
                const active = workshops.includes(w.id);
                return (
                  <li key={w.id}>
                    <label className={card(active)}>
                      <input type="checkbox" checked={active} onChange={() => toggleWorkshop(w.id)} className="sr-only" />
                      {picture(w.image || fallbackImage(w.title), w.title)}
                      <span className="flex flex-1 items-start gap-3 p-4">
                        <span className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-md border-2", active ? "border-ink bg-ink text-white" : "border-line")}>
                          {active && <Check className="size-4" strokeWidth={3} aria-hidden />}
                        </span>
                        <span>
                          <span className="block font-extrabold">{w.title}</span>
                          {w.description && <span className="mt-1 line-clamp-3 block text-sm text-ink-soft">{w.description}</span>}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* 3. Aktivitātes un izrādes */}
        {otherActivities.length > 0 && (
          <section>
            <h2 className="display text-2xl">Aktivitātes</h2>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {otherActivities.map((a) => {
                const active = activities[a.id] !== undefined;
                return (
                  <li key={a.id}>
                    <div className={card(active)}>
                      <label className="flex flex-1 cursor-pointer flex-col">
                        <input type="checkbox" checked={active} onChange={() => toggleActivity(a.id)} className="sr-only" />
                        {picture(a.image || fallbackImage(a.title), a.title)}
                        <span className="flex flex-1 items-start gap-3 p-4">
                          <span className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-md border-2", active ? "border-ink bg-ink text-white" : "border-line")}>
                            {active && <Check className="size-4" strokeWidth={3} aria-hidden />}
                          </span>
                          <span>
                            <span className="block font-extrabold">{a.title}</span>
                            {unitText(a) && <span className="block text-xs font-semibold text-ink-soft">{unitText(a)}</span>}
                            {a.description && <span className="mt-1 line-clamp-3 block text-sm text-ink-soft">{a.description}</span>}
                          </span>
                        </span>
                      </label>
                      {active && a.unit === "piece" && (
                        <label className="flex items-center gap-2 border-t border-line px-4 py-3 text-sm font-bold">
                          Skaits
                          <input
                            type="number"
                            min={1}
                            value={activities[a.id] || ""}
                            onChange={(e) => setActivities((as) => ({ ...as, [a.id]: Math.max(1, Number(e.target.value) || 1) }))}
                            className="w-20 rounded-lg border border-input px-2 py-1.5"
                          />
                        </label>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>

          </section>
        )}

        {/* Izrādei — vai klientam ir sava telpa */}
        {showChosen && (
          <fieldset className="mt-5 rounded-2xl bg-surface p-5">
            <legend className="sr-only">Telpa izrādei</legend>
            <p className="font-bold">
              Telpa izrādei<span className="ml-0.5 text-destructive" aria-hidden> *</span>
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {(
                [
                  ["yes", "Mums ir sava telpa"],
                  ["no", "Telpu jānodrošina jums"],
                ] as const
              ).map(([v, l]) => (
                <label key={v} className={cn("flex cursor-pointer items-center gap-3 rounded-xl border-2 bg-white p-3 text-sm font-bold", ownVenue === v ? "border-ink" : "border-line")}>
                  <input type="radio" name="venue" checked={ownVenue === v} onChange={() => setOwnVenue(v)} className="size-5 accent-ink" />
                  {l}
                </label>
              ))}
            </div>
            {ownVenue === "no" && (
          <p className="mt-3 text-sm text-ink-soft">
            Telpas noma — no {eur(prices.venueMin ?? 0)} (ar PVN), atkarībā no konkrētās telpas. Aptuvenajā cenā ir iekļauta minimālā summa, precīzu cenu saskaņosim ar jums.
          </p>
        )}
            {errors.venue && <p role="alert" className="mt-2 text-sm font-semibold text-destructive">{errors.venue}</p>}
          </fieldset>
        )}

        </>
        )}

        {/* 4. Norises vieta — ceļa izdevumi */}
        <section>
          <h2 className="display text-2xl">Norises vieta</h2>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <input
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                setTravel({ status: "idle" });
              }}
              onBlur={quoteTravel}
              placeholder="Adrese, piem. Rīgas iela 1, Jelgava, LV-3001"
              className={inputClass}
            />
            <button type="button" onClick={quoteTravel} className={cn(buttonClass("outline"), "shrink-0")}>
              {travel.status === "loading" ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Car className="size-4" aria-hidden />}
              Aprēķināt ceļu
            </button>
          </div>
          {travel.status === "ok" && (
            <p className="mt-2 text-sm text-ink-soft">
              {travel.km} km turp un atpakaļ{travel.cost ? "" : " — ceļa izdevumu nav"}.
              {travel.far && " Braucieniem 100 km un tālāk no Tukuma ceļa izdevumi var būt līdz 0,50 €/km — aptuvenajā cenā tie jau iekļauti."}
            </p>
          )}
          {travel.status === "error" && <p className="mt-2 text-sm text-ink-soft">{travel.error ?? "Ceļa izdevumus precizēsim."}</p>}
        </section>

        {/* 5. Kontakti */}
        <section className="grid gap-4 sm:grid-cols-2">
          <h2 className="display text-2xl sm:col-span-2">Jūsu kontakti</h2>
          <Field id="companyName" label="Uzņēmums" required error={errors.companyName}>
            <input id="companyName" value={form.companyName} onChange={set("companyName")} className={inputClass} />
          </Field>
          <Field id="parentName" label="Kontaktpersona" required error={errors.parentName}>
            <input id="parentName" value={form.parentName} onChange={set("parentName")} className={inputClass} />
          </Field>
          <Field id="phone" label="Telefons" required error={errors.phone}>
            <input id="phone" type="tel" value={form.phone} onChange={set("phone")} className={inputClass} />
          </Field>
          <Field id="email" label="E-pasts" required error={errors.email}>
            <input id="email" type="email" value={form.email} onChange={set("email")} className={inputClass} />
          </Field>
          <Field id="message" label="Papildu informācija" className="sm:col-span-2">
            <textarea id="message" rows={3} value={form.message} onChange={set("message")} className={inputClass} />
          </Field>
          <label className="flex items-start gap-3 text-sm sm:col-span-2">
            <input
              type="checkbox"
              checked={form.consent}
              onChange={(e) => setForm((f) => ({ ...f, consent: e.target.checked }))}
              className="mt-1 size-5 shrink-0 accent-ink"
            />
            <span>
              Piekrītu, ka mani dati tiek apstrādāti, lai sagatavotu piedāvājumu.{" "}
              <Link href="/privatuma-politika" className="link-underline">
                Privātuma politika
              </Link>
            </span>
          </label>
          {errors.consent && <p role="alert" className="text-sm font-semibold text-destructive sm:col-span-2">{errors.consent}</p>}
        </section>
      </div>

      {/* Kopsavilkums ar aptuveno cenu (lielā ekrānā — blakus, paliek redzams) */}
      <aside className="lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-3xl bg-ink p-6 text-white">
          <p className="text-xs font-extrabold tracking-[0.14em] text-brand uppercase">Aptuvenā cena</p>
          <p className="mt-2 font-display text-5xl font-extrabold">{anything ? eur(approx(total)) : "—"}</p>
          <p className="mt-1 text-sm text-white/70">ar PVN{extras ? ` + ${extras}` : ""}</p>
          {anything && peak > 0 && <p className="mt-2 text-xs text-white/70">Iekļauta piemaksa ceturtdienai/piektdienai (+{prices.peakPercent} %).</p>}
          {anything && atMinimum && <p className="mt-2 text-xs text-white/70">Minimālā pasūtījuma summa — {eur(prices.minTotal ?? 0)} ar PVN.</p>}
          {anything && (
            <ul className="mt-5 space-y-1.5 border-t border-white/15 pt-4 text-sm">
              {chosenShows.map((x) => (
                <li key={x.show.title}>✓ {x.show.title}</li>
              ))}
              {chosenWorkshops.map((w) => (
                <li key={w.id}>✓ {w.title}</li>
              ))}
              {chosenActivities.map((a) => (
                <li key={a.id}>
                  ✓ {a.title}
                  {a.unit === "piece" && ` × ${activities[a.id] || 1}`}
                </li>
              ))}
              {travel.status === "ok" && travel.cost ? <li>✓ Ceļa izdevumi</li> : null}
            </ul>
          )}
          <p className="mt-5 text-xs leading-5 text-white/60">
            Cena ir aptuvena — galīgo cenu apstiprināsim pēc sarunas, kad būs zināmas visas detaļas.
          </p>
          {errors.choice && <p role="alert" className="mt-3 rounded-lg bg-white/10 p-2 text-sm font-semibold">{errors.choice}</p>}
          <button type="submit" disabled={state === "sending"} className={cn(buttonClass("primary", "lg"), "mt-5 w-full justify-center")}>
            {state === "sending" ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
            Nosūtīt pieteikumu
          </button>
          {state === "error" && (
            <p role="alert" className="mt-3 text-sm font-semibold text-brand">
              Neizdevās nosūtīt — pārbaudiet laukus vai zvaniet mums.
            </p>
          )}
        </div>
      </aside>
    </form>
  );
}

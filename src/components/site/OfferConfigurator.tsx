"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Car, Check, CircleCheck, LoaderCircle, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { Honeypot } from "./form";
import { fallbackImage } from "@/lib/salikt-images";

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

const SEASON_IMAGE = { summer: "/media/salikt/burbuli.webp", xmas: "/media/salikt/egles-iedegsana.webp" } as const;

type Season = "summer" | "xmas";
const SEASON_LABEL: Record<Season, string> = { summer: "Vasaras pasākums", xmas: "Ziemas pasākums" };
const SEASON_SHORT: Record<Season, string> = { summer: "Vasara", xmas: "Ziema" };
/** "Kā tas notiek" — īsa info katrā solī (teksts — šeit) */
const HOW: Record<string, string> = {
  pasakums: "Pēc šīs informācijas aprēķinām aptuveno cenu. Ceturtdienās un piektdienās cenai pieskaita piemaksu. Ja datums vēl nav zināms, to var atstāt tukšu.",
  izrades: "Izrāde ilgst ~45 minūtes, aktieri ierodas ar savu skaņu un gaismu. Ja jums nav piemērotas telpas, to varam sarunāt mēs.",
  darbnicas: "Galdus darbnīcām nodrošina pasūtītājs. Mēs atvedam visus materiālus un standarta galda dekorācijas — tās ir iekļautas cenā. Bērni pienāk pie galdiem, izveido savu darbiņu un paņem to līdzi; katru darbnīcu vada animatore.",
  aktivitates: "Aktivitātes notiek visu pasākuma laiku paralēli darbnīcām. Lielformāta spēles atvedam, uzstādām un pieskatām. Pārsteiguma tēls ierodas uz pasākumu, satiekas ar bērniem un fotografējas.",
  kontakti: "Pēc nosūtīšanas sagatavosim prezentāciju ar aprakstiem un bildēm un sazināsimies, lai precizētu detaļas un galīgo cenu.",
};

/** Soļi (secība lapā) */
const STEPS = ["Pasākums", "Izrādes", "Darbnīcas", "Aktivitātes", "Kontakti"] as const;
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
export default function OfferConfigurator({
  prices: allPrices,
  shows: allShows = [],
  games = [],
  characters = [],
  clientName = "",
}: {
  prices: ConfiguratorPrices;
  shows?: ShowInfo[];
  /** Lielformāta spēles ar bildēm (panelī: Uzņēmumiem → spēles) — klients izvēlas konkrētas */
  games?: { name: string; image: string }[];
  /** Pārsteiguma tēli ar bildēm (panelī: Izklaides programmas → Pārsteiguma tēli) — klients izvēlas konkrētus */
  characters?: { name: string; image: string }[];
  /** No saites ?klients=… — uzņēmuma lauks jau aizpildīts */
  clientName?: string;
}) {
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
  // Lielformāta spēles — atsevišķa sadaļa ar bildēm; cena — aktivitāte "Lielformāta spēles" (par gabalu) × izvēlēto spēļu skaits
  const isGames = (a: Activity) => /lielformāt/i.test(a.title);
  const gamesItem = games.length ? prices.activities.find(isGames) : undefined;
  // Pārsteiguma tēls — atsevišķa izvēle ar tēlu bildēm; cena — aktivitāte "Pārsteiguma tēls" × izvēlēto tēlu skaits
  const isCharacter = (a: Activity) => /pārsteiguma tēl/i.test(a.title);
  const characterItem = characters.length ? prices.activities.find(isCharacter) : undefined;
  const [pickedCharacters, setPickedCharacters] = useState<string[]>([]);
  const otherActivities = prices.activities.filter(
    (a) => !matched.has(a.id) && !(games.length && isGames(a)) && !(characterItem && isCharacter(a)),
  );
  const [pickedGames, setPickedGames] = useState<string[]>([]);
  const [pickedShows, setPickedShows] = useState<string[]>([]);
  const [participants, setParticipants] = useState(30);
  const [hoursInput, setHours] = useState(2);
  const [workshops, setWorkshops] = useState<string[]>([]);
  // aktivitātes id → daudzums (gabaliem); pārējām — 1
  const [activities, setActivities] = useState<Record<string, number>>({});
  const [ownVenue, setOwnVenue] = useState<"" | "yes" | "no">("");
  const [address, setAddress] = useState("");
  const [travel, setTravel] = useState<TravelState>({ status: "idle" });
  const [form, setForm] = useState({ companyName: clientName, parentName: "", phone: "", email: "", eventDate: "", message: "", consent: false });
  const [website, setWebsite] = useState("");
  const [startedAt] = useState(() => Date.now());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [step, setStep] = useState(0);
  // Uzspiestā kartīte — tās apraksts labajā pusē ("w:<id>", "a:<id>", "g:<spēle>")
  const [focus, setFocus] = useState("");

  const people = Math.max(0, participants || 0);
  const chosenWorkshops = prices.workshops.filter((w) => workshops.includes(w.id));
  const chosenActivities = otherActivities.filter((a) => activities[a.id] !== undefined);
  const chosenShows = showItems.filter((x) => pickedShows.includes(x.show.title));
  const showChosen = chosenShows.length > 0 || chosenActivities.some(isShow);
  // Izrāde bez cenas panelī — cenu precizēsim
  const showPriceUnknown = chosenShows.some((x) => !x.price || !x.price.price);
  // Minimālais ilgums: katrai izrādei ~1 h, radošajām darbnīcām vēl vismaz 1 h (izrāde + darbnīca — vismaz 2 h)
  const minHours = Math.max(1, chosenShows.length + (chosenWorkshops.length ? 1 : 0));
  const hours = Math.max(hoursInput, minHours);
  const hoursRaised = hoursInput < minHours;

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
  const travellers = workshopAnimators + chosenActivities.filter((a) => a.unit === "hour" || a.unit === "person").length + pickedCharacters.length;
  const travelHours = travel.status === "ok" && travel.cost ? (travel.km ?? 0) / AVG_KMH : 0;
  const travelSum =
    travel.status === "ok" ? (travel.cost ?? 0) * (prices.factor || 1) + Math.max(1, travellers) * travelHours * (prices.travelHour ?? 0) : 0;
  const showsSum = chosenShows.reduce((s, x) => s + (x.price ? activityPrice(x.price) : 0), 0);
  const gamesSum = gamesItem ? gamesItem.price * pickedGames.length : 0;
  const charactersSum = characterItem ? activityPrice(characterItem) * pickedCharacters.length : 0;
  const venueSum = showChosen && ownVenue === "no" ? (prices.venueMin ?? 0) : 0;
  // Ceturtdienās un piektdienās — piemaksa programmai (darbnīcām, aktivitātēm, izrādēm); ceļam un telpas nomai — nav
  const weekday = form.eventDate ? new Date(`${form.eventDate}T12:00:00`).getDay() : -1;
  const peak = weekday === 4 || weekday === 5 ? (prices.peakPercent ?? 0) / 100 : 0;
  const sum = (workshopsSum + activitiesSum + showsSum + gamesSum + charactersSum) * (1 + peak) + travelSum + venueSum;
  // Mazāk par minimālo pasūtījumu nerēķinām
  const atMinimum = sum > 0 && sum < (prices.minTotal ?? 0);
  const total = atMinimum ? (prices.minTotal ?? 0) : sum;
  const anything = chosenWorkshops.length + chosenActivities.length + chosenShows.length + pickedGames.length + pickedCharacters.length > 0;
  // Darbnīcas un aktivitātes bez cenas panelī — rāda, bet cenu precizēsim
  const otherUnknown =
    chosenWorkshops.some((w) => !w.perPerson) || chosenActivities.some((a) => !a.price) || (pickedGames.length > 0 && !gamesItem?.price) || (pickedCharacters.length > 0 && !characterItem?.price);
  const extras = [showPriceUnknown && "izrādes cena", otherUnknown && "dažu pozīciju cena"].filter(Boolean).join(" + ");

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
    if (!season) missing.choice = "Izvēlieties, vai tas ir vasaras vai ziemas pasākums.";
    else if (!anything) missing.choice = "Atzīmējiet vismaz vienu izrādi, darbnīcu vai aktivitāti.";
    if (showChosen && !ownVenue) missing.venue = "Norādiet, vai izrādei ir sava telpa.";
    if (!form.companyName.trim()) missing.companyName = "Norādiet uzņēmumu.";
    if (!form.parentName.trim()) missing.parentName = "Norādiet kontaktpersonu.";
    if (!form.phone.trim()) missing.phone = "Norādiet telefonu.";
    if (!form.email.trim()) missing.email = "Norādiet e-pastu.";
    if (!form.consent) missing.consent = "Nepieciešama piekrišana datu apstrādei.";
    if (Object.keys(missing).length) {
      setErrors(missing);
      // Uz soli, kurā ir kļūda
      if (missing.choice) setStep(0);
      else if (missing.venue) setStep(1);
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
      pickedGames.length > 0 && `Lielformāta spēles (${pickedGames.length}): ${pickedGames.join(", ")}`,
      pickedCharacters.length > 0 && `Pārsteiguma tēli (${pickedCharacters.length}): ${pickedCharacters.join(", ")}`,
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
            activityIds: [
              ...chosenActivities.map((a) => a.id),
              ...chosenShows.map((x) => x.price?.id).filter(Boolean),
              ...(pickedGames.length && gamesItem ? [gamesItem.id] : []),
              ...(pickedCharacters.length && characterItem ? [characterItem.id] : []),
            ],
            intro: [
              chosenShows.length > 0 && `Izrādes: ${chosenShows.map((x) => x.show.title).join(", ")}`,
              pickedGames.length > 0 && `Lielformāta spēles: ${pickedGames.join(", ")}`,
              pickedCharacters.length > 0 && `Pārsteiguma tēli: ${pickedCharacters.join(", ")}`,
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


  const next = () => {
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
    setFocus("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const back = () => {
    setStep((s) => Math.max(0, s - 1));
    setFocus("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (state === "sent") {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <CircleCheck className="mx-auto size-14 text-brand" aria-hidden />
        <p className="display mt-5 text-3xl">Paldies! Izvēle nosūtīta.</p>
        <p className="mt-3 text-white/70">Sagatavosim prezentāciju ar visām detaļām un sazināsimies ar jums tuvākajā laikā.</p>
      </div>
    );
  }

  const unitText = (a: Activity) => (a.unit === "hour" ? "visu pasākuma laiku" : a.unit === "piece" ? "izvēlieties skaitu" : a.unit === "person" ? "katram dalībniekam" : "");
  const eye = "text-[11px] font-extrabold tracking-[0.22em] text-brand uppercase";
  const field = "mt-1.5 block w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-brand";
  const pill = (on: boolean) =>
    cn("rounded-full border-2 px-4 py-1.5 text-sm font-extrabold whitespace-nowrap transition-colors", on ? "border-brand bg-brand text-ink" : "border-white/70 hover:border-brand");

  // Kartīte ar bildi un nosaukumu uz tās. Uzspiežot — apraksts labajā pusē; uzspiežot vēlreiz — atzīmē / noņem
  const tile = (key: string, title: string, image: string | null, on: boolean, toggle: () => void, contain = false) => (
    <li key={key}>
      <button
        type="button"
        onClick={() => (focus === key ? toggle() : setFocus(key))}
        className={cn(
          "relative block aspect-square w-full overflow-hidden rounded-xl border-2 text-left transition",
          on ? "border-brand" : "border-transparent",
          focus === key && "ring-2 ring-white",
        )}
      >
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element -- bildes no paneļa vai public/media
          <img src={image} alt="" className={cn("size-full", contain ? "bg-white object-contain p-2" : "object-cover")} />
        ) : (
          <span className="block size-full bg-white/5" />
        )}
        <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent px-2.5 pt-6 pb-2 text-[13px] leading-tight font-extrabold text-white">
          {title}
        </span>
        {on && (
          <span className="absolute top-2 right-2 grid size-7 place-items-center rounded-full bg-brand text-ink">
            <Check className="size-4" strokeWidth={3} aria-hidden />
          </span>
        )}
      </button>
    </li>
  );

  // Uzspiestās kartītes apraksts
  const focused = (() => {
    const [kind, id] = [focus.slice(0, 1), focus.slice(2)];
    if (kind === "w") {
      const w = prices.workshops.find((x) => x.id === id);
      return w && { title: w.title, image: w.image || fallbackImage(w.title), text: w.description, on: workshops.includes(w.id), toggle: () => toggleWorkshop(w.id) };
    }
    if (kind === "a") {
      const a = otherActivities.find((x) => x.id === id);
      return (
        a && { title: a.title, image: a.image || fallbackImage(a.title), text: a.description, note: unitText(a), on: activities[a.id] !== undefined, toggle: () => toggleActivity(a.id), piece: a.unit === "piece" ? a : undefined }
      );
    }
    if (kind === "g") {
      const g = games.find((x) => x.name === id);
      return g && { title: g.name, image: g.image, text: gamesItem?.description ?? null, on: pickedGames.includes(g.name), toggle: () => setPickedGames((gs) => (gs.includes(g.name) ? gs.filter((x) => x !== g.name) : [...gs, g.name])) };
    }
    if (kind === "c") {
      const c = characters.find((x) => x.name === id);
      return (
        c && {
          title: c.name,
          image: c.image,
          text: characterItem?.description ?? null,
          on: pickedCharacters.includes(c.name),
          toggle: () => setPickedCharacters((cs) => (cs.includes(c.name) ? cs.filter((x) => x !== c.name) : [...cs, c.name])),
        }
      );
    }
    return null;
  })();

  const infoPanel = focused ? (
    <div key={focus} className="animate-in fade-in rounded-2xl border border-brand bg-white/[0.04] p-4">
      {focused.image && (
        // eslint-disable-next-line @next/next/no-img-element -- bilde no paneļa vai public/media
        <img src={focused.image} alt="" className="aspect-[2/1] w-full rounded-lg object-cover" />
      )}
      <p className="display mt-3 text-lg">{focused.title}</p>
      {"note" in focused && focused.note && <p className="text-xs font-semibold text-white/50">{focused.note}</p>}
      <p className="mt-2 text-sm leading-6 whitespace-pre-line text-white/70">{focused.text || "Sīkāku aprakstu nosūtīsim prezentācijā."}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <button type="button" onClick={focused.toggle} className={pill(focused.on)}>
          {focused.on ? "✓ Izvēlēts" : "+ Pievienot"}
        </button>
        {"piece" in focused && focused.piece && focused.on && (
          <label className="flex items-center gap-2 text-sm font-bold">
            Skaits
            <input
              type="number"
              min={1}
              value={activities[focused.piece.id] || ""}
              onChange={(e) => setActivities((as) => ({ ...as, [focused.piece!.id]: Math.max(1, Number(e.target.value) || 1) }))}
              className="w-16 rounded-lg border border-white/20 bg-transparent px-2 py-1"
            />
          </label>
        )}
      </div>
    </div>
  ) : null;

  const summaryItems = [
    ...chosenShows.map((x) => [x.show.title, "izrāde"]),
    ...chosenWorkshops.map((w) => [w.title, "darbnīca"]),
    ...chosenActivities.map((a) => [a.unit === "piece" ? `${a.title} × ${activities[a.id] || 1}` : a.title, "aktivitāte"]),
    ...(pickedGames.length ? [[`Lielformāta spēles × ${pickedGames.length}`, "spēles"]] : []),
    ...pickedCharacters.map((c) => [c, "tēls"]),
    ...(travel.status === "ok" && travel.cost ? [["Ceļa izdevumi", `${travel.km} km`]] : []),
  ];
  const summary = (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
      <p className={eye}>Aptuvenā cena</p>
      <p className="display mt-1.5 text-3xl text-brand">{anything ? eur(approx(total)) : "—"}</p>
      <p className="text-sm text-white/50">ar PVN{extras ? ` + ${extras}` : ""}</p>
      {summaryItems.length > 0 && (
        <ul className="mt-3 border-t border-dashed border-white/15 text-sm">
          {summaryItems.map(([t, k]) => (
            <li key={t + k} className="flex justify-between gap-3 border-b border-dashed border-white/15 py-2">
              <span>✓ {t}</span>
              <span className="shrink-0 text-white/40">{k}</span>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-3 text-xs leading-5 text-white/40">
        {people} dalībnieki · {String(hours).replace(".", ",")} h{hoursRaised ? " (minimālais ilgums)" : ""}{form.eventDate ? ` · ${form.eventDate.split("-").reverse().join(".")}` : ""}
        {hoursRaised && <><br />Izrādei un radošajām darbnīcām vajag vismaz {minHours} h — ilgums palielināts.</>}
        {peak > 0 && <><br />Iekļauta piemaksa ceturtdienai/piektdienai (+{prices.peakPercent} %).</>}
        {anything && atMinimum && <><br />Minimālā pasūtījuma summa — {eur(prices.minTotal ?? 0)}.</>}
        <br />Cena ir aptuvena — galīgo apstiprināsim pēc sarunas.
      </p>
    </div>
  );

  const howKey = ["pasakums", "izrades", "darbnicas", "aktivitates", "kontakti"][step];
  const heading = (title: string, lead?: string) => (
    <div className="mb-5">
      <p className={eye}>
        {step + 1}. solis no {STEPS.length}
      </p>
      <h2 className="display mt-1.5 text-2xl sm:text-3xl">{title}</h2>
      {lead && <p className="mt-1.5 text-white/60">{lead}</p>}
      {HOW[howKey] && (
        <p className="mt-3 border-l-2 border-brand pl-3 text-sm leading-6 text-white/70">
          <span className="font-extrabold text-white">Kā tas notiek. </span>
          {HOW[howKey]}
        </p>
      )}
    </div>
  );
  const grid = "grid grid-cols-3 gap-2.5 sm:grid-cols-4";
  const empty = <p className="rounded-xl bg-white/5 p-5 text-sm text-white/60">Šai sezonai šeit nekā nav — spiediet “Tālāk”.</p>;

  return (
    <form onSubmit={submit} noValidate className="text-white">
      <Honeypot value={website} onChange={setWebsite} />

      {/* Galvene ar sezonas bildi */}
      <div className="relative h-36 overflow-hidden sm:h-40">
        {/* eslint-disable-next-line @next/next/no-img-element -- sezonas bilde */}
        <img src={SEASON_IMAGE[season || "xmas"]} alt="" className="absolute inset-0 size-full object-cover opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#121110] to-transparent" />
        <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-end px-4 pb-5 sm:px-6">
          <p className={eye}>Piedāvājums{clientName ? ` · ${clientName}` : ""}</p>
          <h1 className="display mt-1.5 text-2xl sm:text-3xl">
            {season === "summer" ? "Jūsu vasaras pasākums" : season === "xmas" ? "Jūsu ziemas pasākums" : clientName ? `Sveiki, ${clientName}!` : "Salieciet savu pasākumu"}
          </h1>
        </div>
      </div>

      {/* Soļi */}
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <ol className="flex gap-1.5 pt-4">
          {STEPS.map((s, i) => (
            <li key={s} className="flex-1">
              <button type="button" disabled={!season && i > 0} onClick={() => setStep(i)} className="block w-full text-left disabled:cursor-not-allowed">
                <span className={cn("block h-1.5 rounded-full", i <= step ? "bg-brand" : "bg-white/15")} />
                <span className={cn("mt-1.5 hidden text-[11px] font-bold sm:block", i === step ? "text-brand" : "text-white/50")}>{s}</span>
              </button>
            </li>
          ))}
        </ol>

        <div className="grid gap-7 pt-6 pb-28 lg:grid-cols-[minmax(0,1fr)_320px] lg:pb-14">
          <div>
            {step === 0 && (
              <>
                {heading("Jūsu pasākums", "Sezona, datums, dalībnieku skaits un ilgums — no tā atkarīgs piedāvājums un cena.")}
                <div className="grid grid-cols-2 gap-3">
                  {(Object.keys(SEASON_SHORT) as Season[]).map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => {
                        if (season !== v) {
                          setSeason(v);
                          setWorkshops([]);
                          setActivities({});
                          setPickedShows([]);
                          setPickedGames([]);
                          setPickedCharacters([]);
                          setOwnVenue("");
                        }
                        setErrors((er) => ({ ...er, choice: "" }));
                      }}
                      className={cn("relative h-28 overflow-hidden rounded-xl border-2 text-left sm:h-32", season === v ? "border-brand ring-2 ring-brand" : "border-white/15")}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- sezonas bilde */}
                      <img src={SEASON_IMAGE[v]} alt="" className={cn("absolute inset-0 size-full object-cover", season && season !== v ? "opacity-30" : "opacity-70")} />
                      <span className="display absolute bottom-3 left-4 text-xl">{SEASON_SHORT[v]}</span>
                    </button>
                  ))}
                </div>
                {errors.choice && <p className="mt-3 text-sm font-semibold text-brand">{errors.choice}</p>}
                <h3 className="display mt-8 mb-3 text-xl">Pamatinformācija</h3>
                <p className="-mt-2 mb-4 text-sm text-white/60">Pēc tā aprēķinām aptuveno cenu.</p>
                <div className="grid gap-4 sm:grid-cols-3">
                  <label className="text-sm font-bold text-white/70">
                    Pasākuma datums
                    <input type="date" value={form.eventDate} onChange={set("eventDate")} className={field} />
                  </label>
                  <label className="text-sm font-bold text-white/70">
                    Dalībnieku skaits
                    <input type="number" min={1} value={participants || ""} onChange={(e) => setParticipants(Number(e.target.value))} className={field} />
                  </label>
                  <label className="text-sm font-bold text-white/70">
                    Ilgums
                    <select value={hours} onChange={(e) => setHours(Number(e.target.value))} className={field}>
                      {[1, 1.5, 2, 2.5, 3, 4, 5, 6].map((h) => (
                        <option key={h} value={h} disabled={h < minHours} className="text-ink">
                          {String(h).replace(".", ",")} h
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                {peak > 0 && <p className="mt-3 text-sm text-white/60">Ceturtdienās un piektdienās — piemaksa {prices.peakPercent} %.</p>}
                {minHours > 1 && <p className="mt-3 text-sm text-white/60">Ar izvēlēto programmu pasākumam vajag vismaz {minHours} h.</p>}
              </>
            )}

            {step === 1 && (
              <>
                {heading("Izrādes", "Interaktīvas izrādes visai ģimenei.")}
                {showItems.length === 0
                  ? empty
                  : showItems.map(({ show: v }) => {
                      const on = pickedShows.includes(v.title);
                      return (
                        <div key={v.title} className="flex items-center justify-between gap-3 border-b border-dashed border-white/15 py-3.5">
                          <div className="flex min-w-0 items-center gap-3">
                            {showPoster(v) && (
                              // eslint-disable-next-line @next/next/no-img-element -- video vāciņš
                              <img src={showPoster(v)} alt="" className="size-14 shrink-0 rounded-lg object-cover" />
                            )}
                            <div className="min-w-0">
                              <p className="font-extrabold">{v.title}</p>
                              <p className="text-sm text-white/50">
                                {[v.duration, v.audience].filter(Boolean).join(" · ")}
                                {v.src && (
                                  <>
                                    {" · "}
                                    <a href={v.src} target="_blank" rel="noreferrer" className="text-brand underline underline-offset-2">
                                      Skatīties video
                                    </a>
                                  </>
                                )}
                              </p>
                            </div>
                          </div>
                          <button type="button" onClick={() => setPickedShows((ps) => (on ? ps.filter((x) => x !== v.title) : [...ps, v.title]))} className={pill(on)}>
                            {on ? "✓ Izvēlēts" : "+ Pievienot"}
                          </button>
                        </div>
                      );
                    })}
                {showChosen && (
                  <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                    <p className="font-extrabold">Telpa izrādei</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button type="button" onClick={() => setOwnVenue("yes")} className={pill(ownVenue === "yes")}>
                        Mums ir sava telpa
                      </button>
                      <button type="button" onClick={() => setOwnVenue("no")} className={pill(ownVenue === "no")}>
                        Telpu jānodrošina jums
                      </button>
                    </div>
                    {ownVenue === "no" && (
                      <p className="mt-3 text-sm text-white/60">Telpas noma — no {eur(prices.venueMin ?? 0)} (ar PVN), atkarībā no telpas. Precīzu cenu saskaņosim ar jums.</p>
                    )}
                    {errors.venue && <p className="mt-2 text-sm font-semibold text-brand">{errors.venue}</p>}
                  </div>
                )}
              </>
            )}

            {step === 2 && (
              <>
                {heading("Radošās darbnīcas", "Uzspiediet uz kartītes — parādīsies apraksts. Var izvēlēties vairākas.")}
                {prices.workshops.length === 0 ? (
                  empty
                ) : (
                  <ul className={grid}>
                    {prices.workshops.map((w) => tile(`w:${w.id}`, w.title, w.image || fallbackImage(w.title), workshops.includes(w.id), () => toggleWorkshop(w.id)))}
                  </ul>
                )}
                {infoPanel && <div className="mt-4 lg:hidden">{infoPanel}</div>}
              </>
            )}

            {step === 3 && (
              <>
                {heading("Papildu aktivitātes", "Uzspiediet uz kartītes — parādīsies apraksts.")}
                {otherActivities.length === 0 && games.length === 0 && !characterItem ? (
                  empty
                ) : (
                  <ul className={grid}>
                    {otherActivities.map((a) => tile(`a:${a.id}`, a.title, a.image || fallbackImage(a.title), activities[a.id] !== undefined, () => toggleActivity(a.id)))}
                  </ul>
                )}
                {characterItem && (
                  <>
                    <h3 className="display mt-8 mb-3 text-xl">Pārsteiguma tēls</h3>
                    <p className="-mt-2 mb-3 text-sm text-white/60">Izvēlieties, kurš tēls ieradīsies — var vairākus.</p>
                    <ul className={grid}>
                      {characters.map((c) =>
                        tile(`c:${c.name}`, c.name, c.image || null, pickedCharacters.includes(c.name), () =>
                          setPickedCharacters((cs) => (cs.includes(c.name) ? cs.filter((x) => x !== c.name) : [...cs, c.name])),
                          true,
                        ),
                      )}
                    </ul>
                  </>
                )}
                {games.length > 0 && (
                  <>
                    <h3 className="display mt-8 mb-3 text-xl">Lielformāta spēles</h3>
                    <ul className={grid}>
                      {games.map((g) =>
                        tile(`g:${g.name}`, g.name, g.image || null, pickedGames.includes(g.name), () =>
                          setPickedGames((gs) => (gs.includes(g.name) ? gs.filter((x) => x !== g.name) : [...gs, g.name])),
                          true,
                        ),
                      )}
                    </ul>
                  </>
                )}
                {infoPanel && <div className="mt-4 lg:hidden">{infoPanel}</div>}
              </>
            )}

            {step === 4 && (
              <>
                {heading("Vieta un kontakti", "Pēc nosūtīšanas sagatavosim prezentāciju ar visām detaļām.")}
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-bold text-white/70 sm:col-span-2">
                    Pasākuma adrese
                    <span className="mt-1.5 flex gap-2">
                      <input
                        value={address}
                        onChange={(e) => {
                          setAddress(e.target.value);
                          setTravel({ status: "idle" });
                        }}
                        onBlur={quoteTravel}
                        placeholder="Piem. Rīgas iela 1, Jelgava, LV-3001"
                        className={cn(field, "mt-0")}
                      />
                      <button type="button" onClick={quoteTravel} className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/20 px-4 font-bold hover:border-brand">
                        {travel.status === "loading" ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Car className="size-4" aria-hidden />}
                        Ceļš
                      </button>
                    </span>
                    {travel.status === "ok" && (
                      <span className="mt-1.5 block font-semibold text-brand">
                        {travel.km} km turp un atpakaļ{travel.cost ? " — ceļš iekļauts cenā" : " — ceļa izdevumu nav"}
                      </span>
                    )}
                    {travel.status === "error" && <span className="mt-1.5 block font-normal text-white/50">{travel.error ?? "Ceļa izdevumus precizēsim."}</span>}
                  </label>
                  {(
                    [
                      ["companyName", "Uzņēmums", "text"],
                      ["parentName", "Kontaktpersona", "text"],
                      ["phone", "Telefons", "tel"],
                      ["email", "E-pasts", "email"],
                    ] as const
                  ).map(([k, l, t]) => (
                    <label key={k} className="text-sm font-bold text-white/70">
                      {l} *
                      <input type={t} value={form[k]} onChange={set(k)} className={field} />
                      {errors[k] && <span className="mt-1 block text-brand">{errors[k]}</span>}
                    </label>
                  ))}
                  <label className="text-sm font-bold text-white/70 sm:col-span-2">
                    Papildu informācija
                    <textarea rows={3} value={form.message} onChange={set("message")} className={field} />
                  </label>
                  <label className="flex items-start gap-3 text-sm text-white/70 sm:col-span-2">
                    <input type="checkbox" checked={form.consent} onChange={(e) => setForm((f) => ({ ...f, consent: e.target.checked }))} className="mt-1 size-5 shrink-0 accent-[#ffd54a]" />
                    <span>
                      Piekrītu, ka mani dati tiek apstrādāti, lai sagatavotu piedāvājumu.{" "}
                      <Link href="/privatuma-politika" className="underline">
                        Privātuma politika
                      </Link>
                    </span>
                  </label>
                  {errors.consent && <p className="text-sm font-semibold text-brand sm:col-span-2">{errors.consent}</p>}
                </div>

                {/* Biļete — kopsavilkums un nosūtīšana */}
                <div className="relative mt-7 rounded-2xl bg-brand p-6 text-ink before:absolute before:top-1/2 before:-left-3 before:size-6 before:-translate-y-1/2 before:rounded-full before:bg-[#121110] after:absolute after:top-1/2 after:-right-3 after:size-6 after:-translate-y-1/2 after:rounded-full after:bg-[#121110]">
                  <p className="text-[11px] font-extrabold tracking-[0.22em] uppercase">Jūsu izvēle · aptuvenā cena ar PVN</p>
                  <p className="display mt-1 text-4xl">{anything ? eur(approx(total)) : "—"}</p>
                  {summaryItems.length > 0 && <p className="mt-2 font-bold">{summaryItems.map(([t]) => t).join(" · ")}</p>}
                  {errors.choice && <p className="mt-2 font-bold">{errors.choice}</p>}
                  <button type="submit" disabled={state === "sending"} className="mt-4 inline-flex items-center gap-2 rounded-full bg-ink px-6 py-3 font-extrabold text-white disabled:opacity-60">
                    {state === "sending" ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
                    Nosūtīt izvēli
                  </button>
                  {state === "error" && <p className="mt-2 text-sm font-bold">Neizdevās nosūtīt — pārbaudiet laukus vai zvaniet mums.</p>}
                </div>
              </>
            )}

            {/* Atpakaļ / Tālāk */}
            <div className="mt-7 hidden items-center justify-between lg:flex">
              {step > 0 ? (
                <button type="button" onClick={back} className="inline-flex items-center gap-2 rounded-full border-2 border-white/20 px-5 py-2.5 font-extrabold hover:border-white">
                  <ArrowLeft className="size-4" aria-hidden /> Atpakaļ
                </button>
              ) : (
                <span />
              )}
              {step < STEPS.length - 1 && (
                <button type="button" disabled={!season} onClick={next} className="inline-flex items-center gap-2 rounded-full bg-brand px-6 py-2.5 font-extrabold text-ink disabled:opacity-40">
                  Tālāk <ArrowRight className="size-4" aria-hidden />
                </button>
              )}
            </div>
          </div>

          {/* Labajā pusē: uzspiestās kartītes apraksts un aptuvenā cena */}
          <aside className="hidden space-y-4 lg:sticky lg:top-6 lg:block lg:self-start">
            {(step === 2 || step === 3) && infoPanel}
            {summary}
          </aside>
        </div>
      </div>

      {/* Telefonā: apakšā cena un pogas */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center justify-between gap-3 bg-brand px-4 py-3 text-ink lg:hidden">
        <div>
          <p className="text-[11px] font-extrabold tracking-wider uppercase">Aptuveni</p>
          <p className="display text-xl">{anything ? eur(approx(total)) : "—"}</p>
        </div>
        <div className="flex gap-2">
          {step > 0 && (
            <button type="button" onClick={back} aria-label="Atpakaļ" className="grid size-11 place-items-center rounded-full border-2 border-ink">
              <ArrowLeft className="size-4" aria-hidden />
            </button>
          )}
          {step < STEPS.length - 1 && (
            <button type="button" disabled={!season} onClick={next} className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 font-extrabold text-white disabled:opacity-40">
              Tālāk <ArrowRight className="size-4" aria-hidden />
            </button>
          )}
        </div>
      </div>
    </form>
  );
}

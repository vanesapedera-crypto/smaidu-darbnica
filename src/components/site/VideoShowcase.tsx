"use client";

import { useState } from "react";
import { Clock, Play } from "lucide-react";
import RichText from "./RichText";
import type { Video } from "@/lib/content/types";

/** YouTube / Vimeo saites atpazīšana. */
function parse(src: string): { kind: "youtube" | "vimeo" | "file"; id?: string } {
  const yt = src.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  if (yt) return { kind: "youtube", id: yt[1] };
  const vimeo = src.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vimeo) return { kind: "vimeo", id: vimeo[1] };
  return { kind: "file" };
}

export type ShowcaseVariant = "kino" | "kartites" | "atskanotajs";

type Props = {
  videos: Video[];
  /** Rezervācijas saite katrai izrādei */
  bookHref?: string[];
  /** Izkārtojums (sk. zemāk) */
  variant?: ShowcaseVariant;
};

/**
 * Izrāžu bloks. Trīs izkārtojumi:
 *  - "kino"         — tumšs fons, katrai izrādei liels video un zem tā nosaukums + apraksts divās kolonnās;
 *  - "kartites"     — trīs vienāda augstuma kartītes blakus (video, nosaukums, apraksts, poga);
 *  - "atskanotajs"  — viens liels atskaņotājs + izrāžu saraksts blakus; izvēlētās izrādes apraksts zem video.
 * YouTube/Vimeo atskaņotājs tiek ielādēts tikai pēc klikšķa (līdz tam — vāciņa attēls).
 */
export default function VideoShowcase({ videos, bookHref = [], variant = "kino" }: Props) {
  if (variant === "kartites") return <Cards videos={videos} bookHref={bookHref} />;
  if (variant === "atskanotajs") return <Player videos={videos} bookHref={bookHref} />;
  return <Cinema videos={videos} bookHref={bookHref} />;
}

const href = (bookHref: string[], i: number) => bookHref[i] ?? "/kontakti#pieprasijums";

/** Ilgums kā maza birka */
function Duration({ value, light = false }: { value?: string; light?: boolean }) {
  if (!value) return null;
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-extrabold tracking-[0.08em] uppercase ${
        light ? "bg-white/10 text-white" : "bg-surface text-ink"
      }`}
    >
      <Clock className="size-3.5" aria-hidden />
      {value}
    </span>
  );
}

function BookButton({ to, light = false }: { to: string; light?: boolean }) {
  return (
    <a
      href={to}
      className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-extrabold transition-transform hover:-translate-y-0.5 ${
        light ? "bg-brand text-ink" : "bg-ink text-white"
      }`}
    >
      Rezervēt izrādi <span aria-hidden>→</span>
    </a>
  );
}

/* ── A: "Kino" ─────────────────────────────────────────────────────────── */
function Cinema({ videos, bookHref }: { videos: Video[]; bookHref: string[] }) {
  return (
    <ol className="space-y-24 md:space-y-32">
      {videos.map((v, i) => (
        <li key={`${v.src}-${i}`} data-reveal>
          <VideoCard video={v} />
          <div className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-14">
            <div>
              <p className="text-sm font-extrabold tracking-[0.14em] text-brand uppercase">Izrāde {String(i + 1).padStart(2, "0")}</p>
              <h3 className="display mt-3 text-3xl md:text-4xl">{v.title}</h3>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <Duration value={v.duration} light />
                <BookButton to={href(bookHref, i)} light />
              </div>
            </div>
            {v.description && <RichText text={v.description} className="prose-sd prose-light" />}
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ── B: "Kartītes" ─────────────────────────────────────────────────────── */
function Cards({ videos, bookHref }: { videos: Video[]; bookHref: string[] }) {
  return (
    <ol className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {videos.map((v, i) => (
        <li
          key={`${v.src}-${i}`}
          data-reveal
          style={{ "--reveal-delay": `${i * 90}ms` } as React.CSSProperties}
          className="flex flex-col overflow-hidden rounded-[1.75rem] bg-white shadow-[0_30px_60px_-40px_rgba(26,24,22,0.55)] ring-1 ring-line"
        >
          <VideoCard video={v} flat />
          <div className="flex flex-1 flex-col p-7">
            <h3 className="display text-xl md:text-2xl">{v.title}</h3>
            {v.description && <RichText text={v.description} className="prose-sd prose-compact mt-4 flex-1" />}
            <div className="mt-7 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
              <Duration value={v.duration} />
              <BookButton to={href(bookHref, i)} />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ── C: "Atskaņotājs ar sarakstu" ──────────────────────────────────────── */
function Player({ videos, bookHref }: { videos: Video[]; bookHref: string[] }) {
  const [active, setActive] = useState(0);
  const v = videos[active];
  if (!v) return null;

  return (
    <div className="grid grid-cols-1 gap-8 md:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] md:gap-8 lg:gap-10">
      <div data-reveal>
        {/* key — pārslēdzot izrādi, atskaņotājs sākas no jauna */}
        <VideoCard key={v.src} video={v} />
        <div className="mt-8">
          <h3 className="display text-2xl md:text-3xl">{v.title}</h3>
          {v.description && <RichText text={v.description} className="prose-sd mt-5" />}
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <Duration value={v.duration} />
            <BookButton to={href(bookHref, active)} />
          </div>
        </div>
      </div>

      <ol data-reveal className="space-y-3 md:sticky md:top-28 md:self-start" aria-label="Izrādes">
        {videos.map((x, i) => (
          <li key={`${x.src}-${i}`}>
            <button
              type="button"
              onClick={() => setActive(i)}
              aria-current={i === active ? "true" : undefined}
              className={`flex w-full items-center gap-4 rounded-2xl p-3 text-left transition-colors ${
                i === active ? "bg-ink text-white" : "bg-white ring-1 ring-line hover:bg-surface"
              }`}
            >
              <span className="relative aspect-video w-24 shrink-0 overflow-hidden rounded-xl bg-ink lg:w-32">
                <Thumb video={x} />
                <span className="absolute inset-0 grid place-items-center">
                  <span className="grid size-8 place-items-center rounded-full bg-brand text-ink">
                    <Play className="ml-0.5 size-3.5 fill-ink" aria-hidden />
                  </span>
                </span>
              </span>
              <span>
                <span className="block text-xs font-extrabold tracking-[0.12em] uppercase opacity-60">
                  Izrāde {String(i + 1).padStart(2, "0")}
                </span>
                <span className="mt-1 block font-bold leading-snug">{x.title}</span>
                {x.duration && <span className="mt-1 block text-sm opacity-70">{x.duration}</span>}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Mazs vāciņš sarakstam (YouTube vidējā izmēra bilde) */
function Thumb({ video }: { video: Video }) {
  const { kind, id } = parse(video.src);
  const src = video.poster || (kind === "youtube" ? `https://i.ytimg.com/vi/${id}/mqdefault.jpg` : "");
  if (!src) return null;
  // eslint-disable-next-line @next/next/no-img-element -- ārēja vāciņa bilde (YouTube)
  return <img src={src} alt="" loading="lazy" className="absolute inset-0 size-full object-cover" />;
}

function VideoCard({ video, flat = false }: { video: Video; /** Kartītē: bez ēnas un apakšējiem stūriem */ flat?: boolean }) {
  const [playing, setPlaying] = useState(false);
  const { kind, id } = parse(video.src);
  // YouTube vāciņš: vispirms 1280×720 (maxres); ja tāda nav, krītam uz 640×480 (sd) un 480×360 (hq)
  const ytSizes = ["maxresdefault", "sddefault", "hqdefault"];
  const [ytSize, setYtSize] = useState(0);
  const poster = video.poster || (kind === "youtube" ? `https://i.ytimg.com/vi/${id}/${ytSizes[ytSize]}.jpg` : "");

  const frame = flat
    ? "relative aspect-video overflow-hidden bg-ink"
    : "relative aspect-video overflow-hidden rounded-[22px] bg-ink shadow-[0_30px_50px_-28px_rgba(31,41,55,0.6)]";

  if (kind === "file") {
    return (
      <div className={frame}>
        <video src={video.src} poster={poster || undefined} controls preload="none" playsInline className="size-full object-cover">
          <track kind="captions" />
        </video>
      </div>
    );
  }

  if (playing) {
    const url =
      kind === "youtube"
        ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`
        : `https://player.vimeo.com/video/${id}?autoplay=1`;
    return (
      <div className={frame}>
        <iframe
          src={url}
          title={video.title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          className="absolute inset-0 size-full border-0"
        />
      </div>
    );
  }

  return (
    <button type="button" onClick={() => setPlaying(true)} aria-label={`Atskaņot: ${video.title}`} className={`${frame} group block w-full`}>
      {poster && (
        // eslint-disable-next-line @next/next/no-img-element -- ārēja vāciņa bilde (YouTube)
        <img
          src={poster}
          alt=""
          loading="lazy"
          onLoad={(e) => {
            // YouTube "nav attēla" gadījumā atgriež 120×90 pelēku bildi — tad ņemam nākamo izmēru
            if (!video.poster && kind === "youtube" && e.currentTarget.naturalWidth <= 120 && ytSize < ytSizes.length - 1) setYtSize(ytSize + 1);
          }}
          onError={() => !video.poster && ytSize < ytSizes.length - 1 && setYtSize(ytSize + 1)}
          className="absolute inset-0 size-full object-cover transition-transform duration-700 group-hover:scale-[1.03]" />
      )}
      <span className="absolute inset-0 grid place-items-center">
        <span className="grid size-20 place-items-center rounded-full bg-brand text-ink shadow-xl transition-transform group-hover:scale-110">
          <Play className="ml-1 size-8 fill-ink" aria-hidden />
        </span>
      </span>
    </button>
  );
}

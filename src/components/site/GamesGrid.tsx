import Photo from "./Photo";
import { StageHeading } from "./stage";
import { Container } from "./ui";
import { GAMES } from "@/lib/content/defaults/games";

/**
 * Visu lielformāta spēļu režģis (pakalpojuma "Lielformāta spēles" lapā).
 * Ja spēlei ir norādīta bilde (sk. defaults/games.ts), rāda bildi ar nosaukumu;
 * ja bildes vēl nav — tumšu kartīti ar numuru un nosaukumu.
 */
export default function GamesGrid() {
  return (
    <section id="speles" className="scroll-mt-20 bg-surface py-16 md:py-24">
      <Container>
        <StageHeading
          eyebrow="Lielformāta spēles"
          title="Visas"
          highlight="spēles"
          text="No šīm spēlēm kopā ar jums izvēlamies pasākumam piemērotāko kombināciju."
        />
        <ul className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {GAMES.map((g, i) => {
            const hasImage = g.image !== "";
            return (
              <li
                key={g.name}
                data-reveal
                style={{ "--reveal-delay": `${(i % 5) * 50}ms` } as React.CSSProperties}
                className={`group relative isolate flex flex-col justify-end overflow-hidden rounded-2xl bg-ink p-4 text-white ${hasImage ? "aspect-square" : "min-h-28"}`}
              >
                {hasImage ? (
                  <>
                    <Photo
                      src={g.image}
                      alt={g.name}
                      fill
                      sizes="(min-width: 1024px) 20vw, (min-width: 640px) 33vw, 50vw"
                      className="-z-20 object-cover transition-transform duration-700 group-hover:scale-105"
                    />
                    <span aria-hidden className="absolute inset-0 -z-10 bg-linear-to-t from-ink/85 via-ink/10 to-transparent" />
                  </>
                ) : (
                  <span aria-hidden className="absolute top-4 left-4 font-display text-4xl font-extrabold text-white/15">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                )}
                <span className="font-display text-sm leading-tight font-bold uppercase md:text-base">{g.name}</span>
              </li>
            );
          })}
        </ul>
      </Container>
    </section>
  );
}

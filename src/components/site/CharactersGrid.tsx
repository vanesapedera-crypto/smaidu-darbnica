import Photo from "./Photo";
import { StageHeading } from "./stage";
import { Container } from "./ui";
import { CHARACTERS } from "@/lib/content/defaults/service-media";

/**
 * Pieejamo pārsteiguma tēlu režģis (programmas "Pārsteiguma tēls" lapā):
 * katram tēlam bilde un nosaukums. Saraksts un bildes — defaults/service-media.ts (CHARACTERS).
 */
export default function CharactersGrid() {
  return (
    <section id="teli" className="scroll-mt-20 bg-surface py-16 md:py-24">
      <Container>
        <StageHeading eyebrow="Pārsteiguma tēls" title="Pieejamie" highlight="tēli" />
        <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4 md:gap-4">
          {CHARACTERS.map((c, i) => (
            <li
              key={c.name}
              data-reveal
              style={{ "--reveal-delay": `${(i % 4) * 50}ms` } as React.CSSProperties}
              className="overflow-hidden rounded-2xl bg-white"
            >
              {/* Bildēm ir balts fons, tāpēc tās rāda veselas (bez apgriešanas) uz baltas kartītes */}
              <div className="relative aspect-[4/5]">
                <Photo src={c.image} alt={`Pārsteiguma tēls ${c.name}`} fill sizes="(min-width: 640px) 25vw, 50vw" className="object-contain p-3" />
              </div>
              <p className="px-3 pb-4 text-center font-display text-sm font-bold uppercase md:text-base">{c.name}</p>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}

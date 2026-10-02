"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Viens kustību "dzinējs" visai lapai (bez papildu bibliotēkām). Sadaļas paliek servera
 * komponentes — efektus ieslēdz ar datu atribūtiem, bet pašas animācijas ir CSS (globals.css):
 *
 *  data-reveal  — elements parādās, kad nonāk ekrānā (klase `is-visible`)
 *  data-scroll  — elementam tiek iestatīts `--p` (0…1): cik tālu tas ir izritināts cauri ekrānam
 *                 (0 = tikko parādās apakšā, 1 = pazudis augšā). Parallakse, 3D pagriezieni.
 *  data-scene   — "piesprausta" sadaļa (iekšā ir `position: sticky` bloks): `--p` 0…1 nozīmē,
 *                 cik tālu sadaļa izritināta, kamēr tās saturs stāv uz vietas.
 *  data-tilt    — kartīte sekot peles kursoram 3D (`--rx`, `--ry`, `--gx`, `--gy` atspīdumam)
 *
 * Ātrdarbība: klausās tikai vienu ritināšanas notikumu, rēķina vienreiz kadrā (requestAnimationFrame)
 * un tikai elementiem, kas ir ekrānā. Maina tikai CSS mainīgos → pārlūks animē transform/opacity.
 * Ja lietotājs vēlas mazāk kustību, `--p` tiek iestatīts uz gala stāvokli un 3D efekti netiek ieslēgti.
 */
export default function RevealObserver() {
  const pathname = usePathname();

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const cleanups: (() => void)[] = [];

    /* ---- Parādīšanās ---- */
    const revealEls = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]:not(.is-visible)"));
    if (!("IntersectionObserver" in window) || reduced) {
      revealEls.forEach((el) => el.classList.add("is-visible"));
    } else {
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) {
              e.target.classList.add("is-visible");
              io.unobserve(e.target);
            }
          }
        },
        { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
      );
      revealEls.forEach((el) => io.observe(el));
      cleanups.push(() => io.disconnect());
    }

    /* ---- Ritināšanas progress ---- */
    const tracked = Array.from(document.querySelectorAll<HTMLElement>("[data-scroll], [data-scene]"));
    if (reduced) {
      tracked.forEach((el) => el.style.setProperty("--p", el.hasAttribute("data-scene") ? "0" : "0.5"));
    } else if (tracked.length) {
      const active = new Set<HTMLElement>();
      const vis = new IntersectionObserver((entries) => {
        for (const e of entries) {
          if (e.isIntersecting) active.add(e.target as HTMLElement);
          else active.delete(e.target as HTMLElement);
        }
        schedule();
      }, { rootMargin: "20% 0px 20% 0px" });
      tracked.forEach((el) => vis.observe(el));

      let frame = 0;
      const update = () => {
        frame = 0;
        const vh = window.innerHeight;
        for (const el of active) {
          const r = el.getBoundingClientRect();
          let p: number;
          if (el.hasAttribute("data-scene")) {
            const len = r.height - vh; // cik tālu var ritināt, kamēr saturs piesprausts
            p = len > 0 ? -r.top / len : 0;
          } else {
            p = (vh - r.top) / (vh + r.height);
          }
          p = Math.min(1, Math.max(0, p));
          el.style.setProperty("--p", p.toFixed(4));
        }
      };
      const schedule = () => {
        if (!frame) frame = requestAnimationFrame(update);
      };
      window.addEventListener("scroll", schedule, { passive: true });
      window.addEventListener("resize", schedule);
      schedule();
      cleanups.push(() => {
        vis.disconnect();
        window.removeEventListener("scroll", schedule);
        window.removeEventListener("resize", schedule);
        cancelAnimationFrame(frame);
      });
    }

    /* ---- 3D pagrieziens pēc kursora (tikai ierīcēm ar peli) ---- */
    if (!reduced && window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
      document.querySelectorAll<HTMLElement>("[data-tilt]").forEach((el) => {
        let raf = 0;
        const move = (e: PointerEvent) => {
          const r = el.getBoundingClientRect();
          const x = (e.clientX - r.left) / r.width; // 0…1
          const y = (e.clientY - r.top) / r.height;
          cancelAnimationFrame(raf);
          raf = requestAnimationFrame(() => {
            el.style.setProperty("--ry", `${(x - 0.5) * 14}deg`);
            el.style.setProperty("--rx", `${(0.5 - y) * 12}deg`);
            el.style.setProperty("--gx", `${x * 100}%`);
            el.style.setProperty("--gy", `${y * 100}%`);
            el.dataset.tiltActive = "";
          });
        };
        const leave = () => {
          cancelAnimationFrame(raf);
          el.style.setProperty("--ry", "0deg");
          el.style.setProperty("--rx", "0deg");
          delete el.dataset.tiltActive;
        };
        el.addEventListener("pointermove", move);
        el.addEventListener("pointerleave", leave);
        cleanups.push(() => {
          el.removeEventListener("pointermove", move);
          el.removeEventListener("pointerleave", leave);
        });
      });
    }

    return () => cleanups.forEach((fn) => fn());
  }, [pathname]);

  return null;
}

"use client";

import { useEffect } from "react";

/**
 * Atver aizvērtu <details> sadaļu, ja lapa atvērta ar saiti uz to (piem. /telpu-noma#noteikumi
 * no apstiprinājuma e-pasta) — citādi pārlūks aizritina līdz sadaļai, bet tā paliek aizvērta.
 */
export default function OpenOnHash({ id }: { id: string }) {
  useEffect(() => {
    const open = () => {
      if (window.location.hash !== `#${id}`) return;
      const el = document.getElementById(id);
      if (el instanceof HTMLDetailsElement) {
        el.open = true;
        el.scrollIntoView({ block: "start" });
      }
    };
    open();
    window.addEventListener("hashchange", open);
    return () => window.removeEventListener("hashchange", open);
  }, [id]);
  return null;
}

"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { adminSecondary } from "../styles";

/** Nokopē tekstu starpliktuvē (piem. piedāvājuma tekstu e-pastam). */
export default function CopyButton({ text, label = "Kopēt tekstu" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={adminSecondary}
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 2000);
      }}
    >
      {done ? <Check className="size-4" aria-hidden /> : <Copy className="size-4" aria-hidden />}
      {done ? "Nokopēts" : label}
    </button>
  );
}

"use client";

import { Trash2 } from "lucide-react";
import { adminDanger } from "./styles";

/** Dzēšanas poga ar apstiprinājumu. `action` — piesaistīta servera darbība. */
export default function DeleteButton({ action, label = "Dzēst" }: { action: () => Promise<void>; label?: string }) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm("Vai tiešām dzēst šo ierakstu? Darbību nevar atsaukt.")) e.preventDefault();
      }}
    >
      <button type="submit" className={adminDanger}>
        <Trash2 className="size-4" aria-hidden /> {label}
      </button>
    </form>
  );
}

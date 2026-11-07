"use client";

import { createContext, useActionState, useContext, useState } from "react";
import { CircleCheck, LoaderCircle, Save, TriangleAlert } from "lucide-react";
import type { TeamActionState } from "@/app/admin/team-actions";
import { adminPrimary } from "../styles";
import { cn } from "@/lib/utils";

/** Kamēr FileField augšupielādē failu, formu nevar iesniegt */
const UploadContext = createContext<(busy: boolean) => void>(() => {});
export const useUploadBusy = () => useContext(UploadContext);

/**
 * Forma komandas sadaļām: iesniedz servera darbību, rāda kļūdu vai "Saglabāts".
 * `resetOnSave` — pēc veiksmīgas saglabāšanas notīra laukus (jauna ieraksta formai).
 */
export default function TeamForm({
  action,
  children,
  submitLabel = "Saglabāt",
  resetOnSave = false,
  className,
}: {
  action: (state: TeamActionState, form: FormData) => Promise<TeamActionState>;
  children: React.ReactNode;
  submitLabel?: string;
  resetOnSave?: boolean;
  className?: string;
}) {
  // `n` palielinās pēc katras veiksmīgas saglabāšanas — pēc tā pārzīmē laukus (arī faila lauku) tukšus
  const [state, formAction, pending] = useActionState(
    async (prev: (TeamActionState & { n?: number }) | undefined, form: FormData) => {
      const result = await action(prev, form);
      const n = (prev?.n ?? 0) + (result?.ok && resetOnSave ? 1 : 0);
      return { ...result, n };
    },
    undefined,
  );
  const [uploads, setUploads] = useState(0);

  const busy = uploads > 0;
  return (
    <UploadContext.Provider value={(b) => setUploads((n) => Math.max(0, n + (b ? 1 : -1)))}>
      <form action={formAction} className={cn("space-y-5", className)}>
        <div key={state?.n ?? 0}>
          {children}
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <button type="submit" disabled={pending || busy} className={adminPrimary}>
            {pending || busy ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />}
            {busy ? "Augšupielādē…" : submitLabel}
          </button>
          {state?.error && (
            <p role="alert" className="flex items-center gap-2 text-sm font-semibold text-destructive">
              <TriangleAlert className="size-4" aria-hidden /> {state.error}
            </p>
          )}
          {state?.ok && !pending && (
            <p role="status" className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
              <CircleCheck className="size-4" aria-hidden /> {state.ok}
            </p>
          )}
        </div>
      </form>
    </UploadContext.Provider>
  );
}

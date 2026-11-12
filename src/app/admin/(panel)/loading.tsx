import { LoaderCircle } from "lucide-react";

/** Rāda uzreiz pēc klikšķa izvēlnē, kamēr lapa ielādējas (izvēlne paliek redzama) */
export default function Loading() {
  return (
    <div className="flex items-center gap-3 py-10 text-sm font-semibold text-ink-soft" role="status">
      <LoaderCircle className="size-5 animate-spin" aria-hidden /> Ielādē…
    </div>
  );
}

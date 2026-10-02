import { CircleCheck } from "lucide-react";

/** Paneļa lapas virsraksts ar darbību pogām un paziņojumu pēc saglabāšanas. */
export default function PageHeader({
  title,
  description,
  actions,
  notice,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  notice?: string;
}) {
  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold md:text-3xl">{title}</h1>
          {description && <p className="mt-1 max-w-2xl text-sm text-ink-soft">{description}</p>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </header>
      {notice && (
        <p role="status" className="mt-5 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800">
          <CircleCheck className="size-4" aria-hidden /> {notice}
        </p>
      )}
    </>
  );
}

import { cn } from "@/lib/utils";

/** Kopīgi formu elementi publiskajām formām (pieprasījums, rezervācija). */

export const inputClass =
  "block w-full rounded-2xl border border-input bg-white px-4 py-3.5 text-base text-ink placeholder:text-ink/40 transition-colors outline-none hover:border-ink/40 focus:border-ink focus:ring-4 focus:ring-brand/40 aria-[invalid=true]:border-destructive";

export function Field({
  id,
  label,
  required,
  error,
  hint,
  className,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={id} className="block text-sm font-bold">
        {label}
        {required && <span className="ml-0.5 text-destructive" aria-hidden> *</span>}
      </label>
      {children}
      {hint && !error && <p className="text-sm text-ink-soft">{hint}</p>}
      {error && (
        <p id={`${id}-error`} role="alert" className="text-sm font-semibold text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}

/** Slēpts lauks robotiem. Cilvēks to neredz un neaizpilda. */
export function Honeypot({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
      <label>
        Mājaslapa
        <input tabIndex={-1} autoComplete="off" name="website" value={value} onChange={(e) => onChange(e.target.value)} />
      </label>
    </div>
  );
}

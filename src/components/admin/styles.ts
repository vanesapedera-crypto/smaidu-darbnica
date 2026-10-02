/** Administrēšanas paneļa kopīgie stili. */

export const adminInput =
  "block w-full rounded-lg border border-input bg-white px-3 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink/35 focus:border-ink focus:ring-3 focus:ring-brand/40";

export const adminButton =
  "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-colors disabled:opacity-60";

export const adminPrimary = `${adminButton} bg-brand text-ink hover:bg-brand-strong`;
export const adminSecondary = `${adminButton} border border-line bg-white text-ink hover:border-ink`;
export const adminDanger = `${adminButton} text-destructive hover:bg-destructive/10`;

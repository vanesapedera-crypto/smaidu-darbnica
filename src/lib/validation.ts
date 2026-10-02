/**
 * Vienkārša ievades validācija bez papildu bibliotēkām.
 * Katra funkcija atgriež attīrītu vērtību vai pievieno kļūdu `errors` objektam.
 */

export type Errors = Record<string, string>;

export class Validator {
  errors: Errors = {};
  constructor(private data: Record<string, unknown>) {}

  text(field: string, opts: { required?: boolean; max?: number; label?: string } = {}): string {
    const raw = this.data[field];
    const value = typeof raw === "string" ? raw.trim() : typeof raw === "number" ? String(raw) : "";
    const max = opts.max ?? 500;
    if (opts.required && !value) this.errors[field] = `${opts.label ?? "Lauks"} ir obligāts`;
    else if (value.length > max) this.errors[field] = `Ne vairāk kā ${max} rakstzīmes`;
    return value.slice(0, max);
  }

  email(field: string, required = false): string {
    const value = this.text(field, { required, max: 200, label: "E-pasts" });
    if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) this.errors[field] = "Nepareizs e-pasta formāts";
    return value;
  }

  phone(field: string, required = true): string {
    const value = this.text(field, { required, max: 30, label: "Telefons" });
    if (value && (value.replace(/\D/g, "").length < 8 || !/^[+\d\s()-]+$/.test(value)))
      this.errors[field] = "Nepareizs telefona numurs";
    return value;
  }

  int(field: string, opts: { min?: number; max?: number } = {}): number | null {
    const raw = this.data[field];
    if (raw === "" || raw === null || raw === undefined) return null;
    const n = Number(raw);
    if (!Number.isInteger(n) || n < (opts.min ?? 0) || n > (opts.max ?? 100000)) {
      this.errors[field] = "Nepareizs skaitlis";
      return null;
    }
    return n;
  }

  date(field: string): string | null {
    const value = this.text(field, { max: 10 });
    if (!value) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value))) {
      this.errors[field] = "Nepareizs datums";
      return null;
    }
    return value;
  }

  bool(field: string): boolean {
    return this.data[field] === true || this.data[field] === "true" || this.data[field] === "on";
  }

  oneOf<T extends string>(field: string, allowed: readonly T[], fallback: T): T {
    const value = this.data[field];
    return allowed.includes(value as T) ? (value as T) : fallback;
  }

  get ok() {
    return Object.keys(this.errors).length === 0;
  }
}

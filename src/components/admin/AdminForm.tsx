"use client";

import { useActionState } from "react";
import { LoaderCircle, Save, TriangleAlert } from "lucide-react";
import type { FieldDef } from "@/lib/admin/fields";
import type { ActionState } from "@/app/admin/actions";
import { cn } from "@/lib/utils";
import ImageField from "./ImageField";
import { adminInput, adminPrimary } from "./styles";

/**
 * Universāla rediģēšanas forma. Lauku vērtības jau ir pārveidotas tekstā (serialize),
 * servera darbība tās pārveido atpakaļ (parse) un saglabā.
 */
export default function AdminForm({
  fields,
  values,
  action,
  folder,
  submitLabel = "Saglabāt",
}: {
  fields: FieldDef[];
  /** Lauka nosaukums → teksts (vai string[] albumiem, boolean izvēles rūtiņām) */
  values: Record<string, string | string[] | boolean>;
  action: (state: ActionState, form: FormData) => Promise<ActionState>;
  folder: string;
  submitLabel?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-x-6 gap-y-5 rounded-2xl bg-white p-5 ring-1 ring-line sm:p-7 md:grid-cols-2">
        {fields.map((f) =>
          f.type === "heading" ? (
            // Formas daļas virsraksts (un īss paskaidrojums zem tā)
            <div key={f.name} className="border-t border-line pt-5 first:border-t-0 first:pt-0 md:col-span-2">
              <h2 className="text-base font-extrabold">{f.label}</h2>
              {f.help && <p className="mt-1 text-sm leading-6 text-ink-soft">{f.help}</p>}
            </div>
          ) : (
          <div key={f.name} className={cn("space-y-1.5", (f.wide || ["textarea", "pairs", "pricing", "faq", "albums", "image", "table"].includes(f.type)) && "md:col-span-2")}>
            {f.type === "checkbox" ? (
              <label className="flex items-center gap-3 text-sm font-semibold">
                <input type="checkbox" name={f.name} defaultChecked={values[f.name] === true} className="size-5 accent-ink" />
                {f.label}
              </label>
            ) : (
              <>
                <label htmlFor={f.name} className="block text-sm font-bold">
                  {f.label}
                  {f.required && <span className="text-destructive"> *</span>}
                </label>
                <FieldInput field={f} value={values[f.name]} folder={folder} />
              </>
            )}
            {f.help && <p className="text-xs leading-5 text-ink-soft">{f.help}</p>}
          </div>
          ),
        )}
      </div>

      {state?.error && (
        <p role="alert" className="flex items-center gap-2 rounded-xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          <TriangleAlert className="size-4 shrink-0" aria-hidden /> {state.error}
        </p>
      )}

      <div className="sticky bottom-0 -mx-4 flex justify-end border-t border-line bg-surface/90 px-4 py-4 backdrop-blur sm:mx-0 sm:rounded-2xl sm:border sm:px-5">
        <button type="submit" disabled={pending} className={adminPrimary}>
          {pending ? <LoaderCircle className="size-4 animate-spin" aria-hidden /> : <Save className="size-4" aria-hidden />}
          {pending ? "Saglabā…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

function FieldInput({ field, value, folder }: { field: FieldDef; value: string | string[] | boolean | undefined; folder: string }) {
  const text = typeof value === "string" ? value : "";

  switch (field.type) {
    case "image":
      return <ImageField name={field.name} defaultValue={text} folder={folder} required={field.required} />;
    case "select":
      return (
        <select id={field.name} name={field.name} defaultValue={text} className={adminInput}>
          {field.options?.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      );
    case "albums": {
      const selected = new Set(Array.isArray(value) ? value : []);
      return (
        <fieldset className="grid max-h-64 gap-1 overflow-y-auto rounded-lg border border-line p-3 sm:grid-cols-2 lg:grid-cols-3">
          {field.options?.map((o) => (
            <label key={o.value} className="flex items-center gap-2 text-sm">
              <input type="checkbox" name={field.name} value={o.value} defaultChecked={selected.has(o.value)} className="accent-ink" />
              {o.label}
            </label>
          ))}
        </fieldset>
      );
    }
    case "number":
      // step="any" — lai var ievadīt arī decimāldaļas (piem. 0.3 € par km)
      return <input id={field.name} name={field.name} type="number" step="any" defaultValue={text} className={adminInput} />;
    case "text":
      return <input id={field.name} name={field.name} defaultValue={text} required={field.required} className={adminInput} />;
    default:
      // textarea, lines, pairs, stats, faq, pricing, table
      return (
        <textarea
          id={field.name}
          name={field.name}
          defaultValue={text}
          rows={field.rows ?? 4}
          required={field.required}
          className={cn(adminInput, field.type !== "textarea" && "font-mono text-[13px] leading-6")}
        />
      );
  }
}

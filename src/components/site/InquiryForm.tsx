"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CircleCheck, LoaderCircle, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { buttonClass } from "./ui";
import { Field, Honeypot, inputClass } from "./form";

type ServiceOption = { slug: string; title: string };

const BUDGETS = ["Līdz 500 €", "500–1500 €", "1500–5000 €", "Virs 5000 €", "Vēl nav zināms"];

const initial = {
  companyName: "",
  parentName: "",
  contactRole: "",
  phone: "",
  email: "",
  serviceSlug: "",
  eventDate: "",
  eventCity: "",
  participants: "",
  budgetRange: "",
  message: "",
  consent: false,
};

/**
 * Pieprasījuma forma uzņēmumiem un iestādēm.
 * Dati tiek saglabāti `bookings` tabulā ar inquiry_type = "business".
 */
export default function InquiryForm({
  services,
  defaultService = "",
}: {
  services: ServiceOption[];
  defaultService?: string;
}) {
  const [form, setForm] = useState({ ...initial, serviceSlug: defaultService });
  const [website, setWebsite] = useState("");
  const [startedAt] = useState(() => Date.now());
  const [today] = useState(() => new Date().toISOString().slice(0, 10));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");

  // Priekšaizpilde no saites, piem. /kontakti?pakalpojums=izrades&izrade=Dāvanu+prieks#pieprasijums
  // (pogas "Rezervēt izrādi" sadaļā "Izrādes")
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const slug = q.get("pakalpojums");
    const show = q.get("izrade");
    if (!slug && !show) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- vienreizēja sinhronizācija ar URL pēc ielādes (serverī URL parametri nav pieejami)
    setForm((f) => ({
      ...f,
      serviceSlug: slug && services.some((x) => x.slug === slug) ? slug : f.serviceSlug,
      message: show && !f.message ? `Vēlamies rezervēt izrādi: ${show}` : f.message,
    }));
  }, [services]);

  const set = (field: keyof typeof initial) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [field]: e.target.value }));

  // Kopīgi atribūti laukam: id, vērtība, kļūdas stāvoklis
  const fieldProps = (field: keyof typeof initial) => ({
    id: field,
    name: field,
    value: form[field] as string,
    onChange: set(field),
    "aria-invalid": errors[field] ? true : undefined,
    "aria-describedby": errors[field] ? `${field}-error` : undefined,
    className: inputClass,
  });

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    setErrors({});

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, inquiryType: "business", website, startedAt }),
      });
      const data = await res.json();
      if (data.success) {
        setState("sent");
        setForm({ ...initial, serviceSlug: defaultService });
        return;
      }
      setErrors(data.errors ?? {});
      setMessage(data.error ?? "Lūdzu, pārbaudiet iezīmētos laukus.");
      setState("error");
    } catch {
      setMessage("Neizdevās nosūtīt. Pārbaudiet interneta savienojumu vai zvaniet mums.");
      setState("error");
    }
  }

  if (state === "sent") {
    return (
      <div role="status" className="flex flex-col items-center rounded-3xl bg-white p-10 text-center ring-1 ring-line md:p-14">
        <span className="grid size-16 place-items-center rounded-full bg-brand">
          <CircleCheck className="size-8" aria-hidden />
        </span>
        <h3 className="mt-6 text-2xl font-extrabold">Paldies! Pieprasījums saņemts.</h3>
        <p className="mt-3 max-w-md leading-7 text-ink-soft">
          Sazināsimies ar jums tuvākās darba dienas laikā, lai precizētu detaļas un nosūtītu piedāvājumu.
        </p>
        <button type="button" className={cn(buttonClass("outline"), "mt-8")} onClick={() => setState("idle")}>
          Nosūtīt vēl vienu pieprasījumu
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="relative rounded-3xl bg-white p-6 ring-1 ring-line sm:p-8 md:p-10">
      <Honeypot value={website} onChange={setWebsite} />

      <fieldset className="grid gap-5 sm:grid-cols-2">
        <legend className="mb-5 text-lg font-extrabold">Kontaktinformācija</legend>
        <Field id="companyName" label="Uzņēmums vai iestāde" required error={errors.companyName}>
          <input {...fieldProps("companyName")} autoComplete="organization" required />
        </Field>
        <Field id="parentName" label="Kontaktpersona" required error={errors.parentName}>
          <input {...fieldProps("parentName")} autoComplete="name" required />
        </Field>
        <Field id="phone" label="Telefons" required error={errors.phone}>
          <input {...fieldProps("phone")} type="tel" autoComplete="tel" placeholder="+371" required />
        </Field>
        <Field id="email" label="E-pasts" required error={errors.email}>
          <input {...fieldProps("email")} type="email" autoComplete="email" required />
        </Field>
      </fieldset>

      <fieldset className="mt-10 grid gap-5 sm:grid-cols-2">
        <legend className="mb-5 text-lg font-extrabold">Par pasākumu</legend>
        <Field id="serviceSlug" label="Pakalpojums" error={errors.serviceSlug} className="sm:col-span-2">
          <select {...fieldProps("serviceSlug")}>
            <option value="">Vēl nezinu / vairāki pakalpojumi</option>
            {services.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.title}
              </option>
            ))}
          </select>
        </Field>
        <Field id="eventDate" label="Plānotais datums" error={errors.eventDate}>
          <input {...fieldProps("eventDate")} type="date" min={today} />
        </Field>
        <Field id="eventCity" label="Norises vieta" error={errors.eventCity}>
          <input {...fieldProps("eventCity")} placeholder="Pilsēta vai adrese" />
        </Field>
        <Field id="participants" label="Dalībnieku skaits" error={errors.participants}>
          <input {...fieldProps("participants")} type="number" inputMode="numeric" min={1} placeholder="piem., 80" />
        </Field>
        <Field id="budgetRange" label="Aptuvenais budžets" error={errors.budgetRange}>
          <select {...fieldProps("budgetRange")}>
            <option value="">Izvēlieties</option>
            {BUDGETS.map((b) => (
              <option key={b}>{b}</option>
            ))}
          </select>
        </Field>
        <Field id="message" label="Pastāstiet vairāk" error={errors.message} className="sm:col-span-2">
          <textarea {...fieldProps("message")} rows={5} placeholder="Pasākuma mērķis, auditorija, vēlmes…" />
        </Field>
      </fieldset>

      <div className="mt-8 space-y-2">
        <label className="flex items-start gap-3 text-sm leading-6">
          <input
            type="checkbox"
            checked={form.consent}
            onChange={(e) => setForm((f) => ({ ...f, consent: e.target.checked }))}
            className="mt-1 size-5 shrink-0 accent-ink"
            aria-invalid={errors.consent ? true : undefined}
            aria-describedby={errors.consent ? "consent-error" : undefined}
            required
          />
          <span>
            Piekrītu, ka mani dati tiek apstrādāti, lai sagatavotu piedāvājumu.{" "}
            <Link href="/privatuma-politika" className="link-underline">
              Privātuma politika
            </Link>
          </span>
        </label>
        {errors.consent && (
          <p id="consent-error" role="alert" className="text-sm font-semibold text-destructive">
            {errors.consent}
          </p>
        )}
      </div>

      {state === "error" && (
        <p role="alert" className="mt-6 rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          {message}
        </p>
      )}

      <button type="submit" disabled={state === "sending"} className={cn(buttonClass("primary", "lg"), "mt-8 w-full sm:w-auto disabled:opacity-60")}>
        {state === "sending" ? <LoaderCircle className="size-5 animate-spin" aria-hidden /> : <Send className="size-4" aria-hidden />}
        {state === "sending" ? "Sūta…" : "Nosūtīt pieprasījumu"}
      </button>
    </form>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, LoaderCircle, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Field, Honeypot, inputClass } from "./form";

/**
 * Atsauksmes forma lapā "Atsauksmes". Pēc nosūtīšanas — pateicība un poga "Iekopēt arī Google":
 * nokopē atsauksmes tekstu un atver Google atsauksmes logu (tur atliek tikai ielīmēt).
 * Pogu rāda visiem — neatkarīgi no vērtējuma (tā prasa Google noteikumi).
 */
export default function TestimonialForm({ googleUrl }: { googleUrl: string }) {
  const [form, setForm] = useState({ author: "", event: "", text: "", rating: 0, consent: false, website: "" });
  const [hover, setHover] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [message, setMessage] = useState("");
  const [copied, setCopied] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const missing: Record<string, string> = {};
    if (!form.author.trim()) missing.author = "Norādiet vārdu.";
    if (form.text.trim().length < 5) missing.text = "Uzrakstiet atsauksmi.";
    if (!form.consent) missing.consent = "Nepieciešama piekrišana.";
    setErrors(missing);
    if (Object.keys(missing).length) return;
    setState("sending");
    try {
      const res = await fetch("/api/testimonials", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setErrors(data.errors ?? {});
        setMessage(data.error ?? "Lūdzu, pārbaudiet iezīmētos laukus.");
        setState("error");
        return;
      }
      setState("sent");
    } catch {
      setMessage("Neizdevās nosūtīt. Lūdzu, mēģiniet vēlreiz.");
      setState("error");
    }
  }

  async function copyToGoogle() {
    try {
      await navigator.clipboard.writeText(form.text.trim());
      setCopied(true);
    } catch {
      // Ja pārlūks neļauj kopēt — Google logs tik un tā atveras
    }
    window.open(googleUrl, "_blank", "noopener,noreferrer");
  }

  if (state === "sent") {
    return (
      <div className="rounded-3xl bg-white p-7 text-center ring-1 ring-line sm:p-10">
        <span className="mx-auto grid size-14 place-items-center rounded-full bg-brand">
          <Check className="size-7" strokeWidth={3} aria-hidden />
        </span>
        <p className="mt-5 font-display text-2xl font-extrabold uppercase">Paldies par atsauksmi!</p>
        <p className="mx-auto mt-3 max-w-lg text-ink-soft">
          Mēs to izlasīsim un drīzumā publicēsim. Būsim ļoti pateicīgi, ja to pašu atsauksmi atstāsiet arī Google — tā mūs atradīs vēl vairāk ģimeņu.
        </p>
        <button
          type="button"
          onClick={copyToGoogle}
          className="mt-7 inline-flex items-center gap-2 rounded-full bg-brand px-6 py-3.5 font-extrabold transition-colors hover:bg-brand-strong"
        >
          <Copy className="size-5" aria-hidden />
          Iekopēt arī Google
        </button>
        <p className="mx-auto mt-4 max-w-md text-sm text-ink-soft">
          {copied
            ? "Teksts nokopēts! Google logā ielīmējiet to (turiet pirkstu laukā → “Ielīmēt” vai Ctrl+V / Cmd+V) un izvēlieties zvaigznes."
            : "Atsauksmes teksts tiks nokopēts, un atvērsies Google logs — atliek tikai ielīmēt."}
        </p>
      </div>
    );
  }

  const shown = hover || form.rating;
  return (
    <form onSubmit={onSubmit} noValidate className="relative space-y-5 rounded-3xl bg-white p-6 ring-1 ring-line sm:p-9">
      <Honeypot value={form.website} onChange={(v) => setForm((f) => ({ ...f, website: v }))} />

      <div className="space-y-2">
        <p className="text-sm font-bold" id="rating-label">
          Jūsu vērtējums
        </p>
        <div role="radiogroup" aria-labelledby="rating-label" className="flex gap-1" onMouseLeave={() => setHover(0)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={form.rating === n}
              aria-label={`${n} no 5`}
              onMouseEnter={() => setHover(n)}
              onClick={() => setForm((f) => ({ ...f, rating: n }))}
              className="p-1"
            >
              <Star className={cn("size-9 transition-colors", n <= shown ? "fill-brand text-brand-strong" : "text-ink/25")} aria-hidden />
            </button>
          ))}
        </div>
      </div>

      <Field id="text" label="Atsauksme" required error={errors.text}>
        <textarea
          id="text"
          rows={5}
          value={form.text}
          onChange={(e) => setForm((f) => ({ ...f, text: e.target.value }))}
          placeholder="Kā Jums patika svētki, animatori, programma vai telpas?"
          aria-invalid={errors.text ? true : undefined}
          className={inputClass}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="author" label="Vārds" required error={errors.author}>
          <input
            id="author"
            value={form.author}
            onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))}
            placeholder="piem. Ilze"
            aria-invalid={errors.author ? true : undefined}
            className={inputClass}
          />
        </Field>
        <Field id="event" label="Pasākums" hint="Nav obligāti">
          <input
            id="event"
            value={form.event}
            onChange={(e) => setForm((f) => ({ ...f, event: e.target.value }))}
            placeholder="piem. Frozen ballīte"
            className={inputClass}
          />
        </Field>
      </div>

      <label className="flex items-start gap-3 text-sm leading-6">
        <input
          type="checkbox"
          checked={form.consent}
          onChange={(e) => setForm((f) => ({ ...f, consent: e.target.checked }))}
          className="mt-1 size-5 shrink-0 accent-ink"
          aria-invalid={errors.consent ? true : undefined}
        />
        <span>
          Piekrītu, ka atsauksme ar manu vārdu tiek publicēta Smaidu Darbnīcas mājaslapā.{" "}
          <Link href="/privatuma-politika" className="font-semibold underline decoration-brand decoration-2 underline-offset-4">
            Privātuma politika
          </Link>
        </span>
      </label>
      {errors.consent && (
        <p role="alert" className="-mt-3 text-sm font-semibold text-destructive">
          {errors.consent}
        </p>
      )}

      {state === "error" && message && (
        <p role="alert" className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
          {message}
        </p>
      )}

      <button
        type="submit"
        disabled={state === "sending"}
        className="inline-flex items-center gap-2 rounded-full bg-ink px-7 py-3.5 font-extrabold text-white transition-colors hover:bg-black disabled:opacity-60"
      >
        {state === "sending" && <LoaderCircle className="size-5 animate-spin" aria-hidden />}
        {state === "sending" ? "Sūta…" : "Nosūtīt atsauksmi"}
      </button>
    </form>
  );
}

"use client";

import { useActionState } from "react";
import { LoaderCircle } from "lucide-react";
import { login } from "../actions";
import { adminInput, adminPrimary } from "@/components/admin/styles";

export default function LoginForm() {
  const [state, action, pending] = useActionState(login, undefined);

  return (
    <form action={action} className="mt-6 space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="email" className="block text-sm font-bold">
          E-pasts
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required className={adminInput} />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="password" className="block text-sm font-bold">
          Parole
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className={adminInput} />
      </div>
      {state?.error && (
        <p role="alert" className="text-sm font-semibold text-destructive">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className={`${adminPrimary} w-full`}>
        {pending && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
        Pieteikties
      </button>
    </form>
  );
}

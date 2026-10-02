import Image from "next/image";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/auth";
import LoginForm from "./LoginForm";

export const metadata = { title: "Pieteikšanās" };

export default async function LoginPage() {
  if (await getAdmin()) redirect("/admin");

  return (
    <main className="grid min-h-screen place-items-center px-4 py-12">
      <div className="w-full max-w-sm">
        <Image src="/brand/logo-dark.svg" alt="Smaidu Darbnīca" width={489} height={291} className="mx-auto h-16 w-auto" loading="eager" />
        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-line sm:p-8">
          <h1 className="text-xl font-extrabold">Administrēšanas panelis</h1>
          <p className="mt-1 text-sm text-ink-soft">Piesakieties ar savu e-pastu un paroli.</p>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}

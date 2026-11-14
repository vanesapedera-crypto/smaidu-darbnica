"use client";

import { useEffect, useState } from "react";
import { Bell, BellOff, LoaderCircle } from "lucide-react";
import { savePushSubscription } from "@/app/admin/team-actions";

const urlB64ToUint8 = (b64: string) => {
  const pad = "=".repeat((4 - (b64.length % 4)) % 4);
  const raw = atob((b64 + pad).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
};

/**
 * "Ieslēgt paziņojumus" — telefonā (SD Admin lietotnē sākuma ekrānā) un datorā.
 * iPhone paziņojumi strādā tikai lietotnē, kas pievienota sākuma ekrānam (Safari → Kopīgot → Pievienot sākuma ekrānam).
 */
export default function PushToggle({ publicKey }: { publicKey: string }) {
  const [state, setState] = useState<"loading" | "unsupported" | "ios-install" | "off" | "on" | "denied" | "busy">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
      const standalone = window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone;
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        setState(ios && !standalone ? "ios-install" : "unsupported");
        return;
      }
      if (Notification.permission === "denied") return setState("denied");
      const reg = await navigator.serviceWorker.getRegistration("/admin/");
      const sub = await reg?.pushManager.getSubscription();
      setState(sub ? "on" : "off");
    })().catch(() => setState("unsupported"));
  }, []);

  async function enable() {
    setError(null);
    setState("busy");
    try {
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return setState(perm === "denied" ? "denied" : "off");
      const reg = await navigator.serviceWorker.register("/sw.js", { scope: "/admin/" });
      await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlB64ToUint8(publicKey) }));
      const json = sub.toJSON() as { endpoint: string; keys: { p256dh: string; auth: string } };
      const res = await savePushSubscription(json);
      if (res.error) throw new Error(res.error);
      setState("on");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Neizdevās ieslēgt.");
      setState("off");
    }
  }

  if (state === "loading" || state === "unsupported") return null;
  return (
    <div className="text-xs text-ink-soft">
      {state === "on" && (
        <p className="inline-flex items-center gap-1.5 font-semibold text-emerald-700">
          <Bell className="size-3.5" aria-hidden /> Paziņojumi ieslēgti
        </p>
      )}
      {(state === "off" || state === "busy") && (
        <button type="button" onClick={enable} disabled={state === "busy"} className="inline-flex items-center gap-1.5 font-semibold text-ink hover:underline">
          {state === "busy" ? <LoaderCircle className="size-3.5 animate-spin" aria-hidden /> : <Bell className="size-3.5" aria-hidden />}
          Ieslēgt paziņojumus
        </button>
      )}
      {state === "denied" && (
        <p className="inline-flex items-center gap-1.5">
          <BellOff className="size-3.5" aria-hidden /> Paziņojumi bloķēti — ieslēdziet tos telefona iestatījumos
        </p>
      )}
      {state === "ios-install" && <p>Paziņojumiem: Safari → Kopīgot → “Pievienot sākuma ekrānam”, tad atveriet SD Admin.</p>}
      {error && <p className="mt-1 font-semibold text-destructive">{error}</p>}
    </div>
  );
}

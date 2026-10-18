import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";
import { exchangeCode } from "@/lib/google-calendar";
import { absoluteUrl } from "@/lib/seo";

/**
 * Google atgriež administratoru šeit pēc piekrišanas: kodu apmaina pret atjaunošanas žetonu
 * un saglabā to tabulā `google_calendar` (to var lasīt tikai administrators).
 */
export async function GET(request: Request) {
  const admin = await getAdmin();
  if (!admin) return NextResponse.redirect(absoluteUrl("/admin/login"));

  const url = new URL(request.url);
  const store = await cookies();
  const state = store.get("google_state")?.value;
  store.delete("google_state");
  const code = url.searchParams.get("code");
  if (!code || !state || url.searchParams.get("state") !== state) {
    return NextResponse.redirect(absoluteUrl("/admin?google=kluda"));
  }

  const result = await exchangeCode(code);
  if ("error" in result) {
    console.error("[google] callback", result.error);
    return NextResponse.redirect(absoluteUrl("/admin?google=kluda"));
  }
  const { error } = await admin.db
    .from("google_calendar")
    .upsert({ id: 1, email: result.email, refresh_token: result.refreshToken, updated_at: new Date().toISOString() });
  if (error) {
    console.error("[google] save", error.message);
    return NextResponse.redirect(absoluteUrl("/admin?google=nav-tabulas"));
  }
  return NextResponse.redirect(absoluteUrl("/admin?google=savienots"));
}

import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/auth";
import { googleAuthUrl, isGoogleConfigured } from "@/lib/google-calendar";
import { absoluteUrl } from "@/lib/seo";

/** Panelī poga "Savienot ar Google kalendāru" — pāradresē uz Google piekrišanas lapu (tikai administratoram). */
export async function GET() {
  if (!(await getAdmin())) return NextResponse.redirect(absoluteUrl("/admin/login"));
  if (!isGoogleConfigured()) return NextResponse.redirect(absoluteUrl("/admin?google=nav-iestatits"));
  const state = randomBytes(16).toString("hex");
  (await cookies()).set("google_state", state, { httpOnly: true, secure: true, sameSite: "lax", path: "/", maxAge: 600 });
  return NextResponse.redirect(googleAuthUrl(state));
}

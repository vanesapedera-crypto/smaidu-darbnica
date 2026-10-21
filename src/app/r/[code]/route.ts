import { NextResponse } from "next/server";
import { decodeShortConfirm } from "@/lib/bookings";

/** Īsā apstiprināšanas saite no WhatsApp / SMS ziņas: /r/<kods> → /rezervacija/<id>?k=<žetons> */
export async function GET(request: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const path = decodeShortConfirm(code);
  return NextResponse.redirect(new URL(path ?? "/", request.url), 302);
}

import { redirect } from "next/navigation";

/** Izejmateriāli tagad ir lapā "Radošās darbnīcas" (sadaļa apakšā) */
export default function MaterialsRedirect() {
  redirect("/admin/darbnicas?materiali=1#izejmateriali");
}

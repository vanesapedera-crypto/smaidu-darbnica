import { redirect } from "next/navigation";

/** Izmaksu katalogs tagad ir lapā "Piedāvājuma izveide" (sadaļa "Cenas un likmes") */
export default function CostCatalogRedirect() {
  redirect("/admin/piedavajuma-izveide#cenas");
}

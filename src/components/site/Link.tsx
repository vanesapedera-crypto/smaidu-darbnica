"use client";

import NextLink from "next/link";
import { useLocale } from "./LocaleProvider";
import { localePath } from "@/lib/i18n/config";

/**
 * next/link ar valodas prefiksu: <Link href="/uznemumiem"> angļu lapā ved uz /en/uznemumiem.
 * Ārējām saitēm, panelim un failiem prefiksu nepievieno.
 */
export default function Link({ href, ...props }: React.ComponentProps<typeof NextLink>) {
  const locale = useLocale();
  const target = typeof href === "string" ? localePath(locale, href) : href;
  return <NextLink href={target} {...props} />;
}

import {
  Baby,
  Brush,
  Building2,
  Dices,
  Drama,
  Palette,
  PartyPopper,
  Sparkles,
  Sun,
  TreePine,
  Trophy,
  Users,
  type LucideProps,
} from "lucide-react";

/**
 * Pakalpojumu ikonas pēc nosaukuma (lauks `icon` datubāzē).
 * Tiek importētas tikai šeit uzskaitītās ikonas, lai JS apjoms paliktu mazs.
 */
export const serviceIcons = {
  Users,
  Trophy,
  Building2,
  Sun,
  TreePine,
  Palette,
  Dices,
  Sparkles,
  Brush,
  Baby,
  Drama,
  PartyPopper,
} as const;

export type ServiceIconName = keyof typeof serviceIcons;

export function ServiceIcon({ name, ...props }: { name: string } & LucideProps) {
  const Icon = serviceIcons[name as ServiceIconName] ?? Sparkles;
  return <Icon aria-hidden {...props} />;
}

/* Sociālo tīklu logotipi (lucide tos vairs neiekļauj) */

export function FacebookIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M13.5 21v-7.5h2.5l.4-3h-2.9V8.6c0-.9.3-1.5 1.5-1.5h1.5V4.4c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8v2.4H8v3h2.6V21h2.9Z" />
    </svg>
  );
}

export function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden {...props}>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function TikTokIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
      <path d="M16.6 3c.4 2.2 1.8 3.7 4 3.9v3.1c-1.5.1-2.8-.4-4-1.2v6.1c0 3.3-2.5 5.6-5.6 5.6-3.2 0-5.6-2.6-5.4-5.9.2-2.8 2.6-5 5.5-4.9v3.2c-.4-.1-.8-.2-1.2-.1-1.2.2-2 1.2-1.9 2.4.1 1.2 1.1 2.1 2.3 2 1.2 0 2.1-1 2.1-2.3V3h3.2Z" />
    </svg>
  );
}

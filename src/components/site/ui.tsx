import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Pamata izkārtojuma primitīvi publiskajai mājaslapai. */

export function Container({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)} {...props} />;
}

export function Section({
  className,
  tone = "white",
  ...props
}: React.ComponentProps<"section"> & { tone?: "white" | "surface" | "ink" }) {
  return (
    <section
      className={cn(
        "py-20 md:py-28",
        tone === "surface" && "bg-surface",
        tone === "ink" && "bg-ink text-white",
        className,
      )}
      {...props}
    />
  );
}

const buttonStyles = {
  primary:
    "bg-brand text-ink shadow-[0_8px_24px_-8px_rgba(245,197,24,0.7)] hover:bg-brand-strong hover:-translate-y-0.5",
  dark: "bg-ink text-white hover:bg-black hover:-translate-y-0.5",
  outline: "border border-ink/15 bg-white text-ink hover:border-ink hover:-translate-y-0.5",
  ghostLight: "border border-white/30 text-white hover:bg-white hover:text-ink",
  outlineDark: "border-2 border-ink text-ink hover:bg-ink hover:text-brand",
} as const;

export type ButtonVariant = keyof typeof buttonStyles;

export function buttonClass(variant: ButtonVariant = "primary", size: "md" | "lg" = "md") {
  return cn(
    "group inline-flex items-center justify-center gap-2 rounded-full font-extrabold transition-all duration-300 ease-out-soft",
    size === "lg" ? "h-14 px-8 text-base" : "h-12 px-6 text-sm",
    buttonStyles[variant],
  );
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  arrow = false,
  className,
  children,
  ...props
}: React.ComponentProps<typeof Link> & { variant?: ButtonVariant; size?: "md" | "lg"; arrow?: boolean }) {
  return (
    <Link href={href} className={cn(buttonClass(variant, size), className)} {...props}>
      {children}
      {arrow && <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />}
    </Link>
  );
}

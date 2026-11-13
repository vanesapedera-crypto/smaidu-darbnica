import { ButtonLink, Container, Section } from "@/components/site/ui";

export default function NotFound() {
  return (
    <Section className="min-h-[60vh]">
      <Container className="max-w-2xl text-center">
        <p className="font-display text-8xl font-extrabold"><span className="sticker">404</span></p>
        <h1 className="display mt-8 text-3xl md:text-4xl">Lapa netika atrasta</h1>
        <p className="mt-4 text-lg text-ink-soft">Iespējams, adrese ir mainījusies. Sāciet no sākumlapas vai izvēlieties sadaļu.</p>
        <div className="mt-10 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/" arrow>
            Uz sākumlapu
          </ButtonLink>
          <ButtonLink href="/uznemumiem" variant="outline">
            Uzņēmumiem
          </ButtonLink>
        </div>
      </Container>
    </Section>
  );
}

import SiteLayout from "./(site)/[lang]/layout";
import NotFound from "./(site)/[lang]/not-found";

// Neatrastām adresēm (ārpus maršrutiem) rādām to pašu 404 lapu ar navigāciju un kājeni
export default function RootNotFound() {
  return (
    <SiteLayout>
      <NotFound />
    </SiteLayout>
  );
}

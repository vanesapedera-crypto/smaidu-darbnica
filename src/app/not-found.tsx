import SiteLayout from "./(site)/layout";
import NotFound from "./(site)/not-found";

// Neatrastām adresēm (ārpus maršrutiem) rādām to pašu 404 lapu ar navigāciju un kājeni
export default function RootNotFound() {
  return (
    <SiteLayout>
      <NotFound />
    </SiteLayout>
  );
}

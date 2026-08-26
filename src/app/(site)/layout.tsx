import DepartureCityProvider from "@/components/site/DepartureCity";
import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import SitePopups from "@/components/site/SitePopups";
import { getNavigation, getSiteSettings } from "@/server/catalogue";
import { getCustomerSession } from "@/server/customer-session";
import { detectDepartureCity } from "@/server/geo";

// L'en-tête et le pied de page affichent des valeurs éditées au back-office :
// ils sont donc rendus à la demande, pas figés à la construction.
export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const [settings, navigation, session, detectedCity] = await Promise.all([
    getSiteSettings(),
    getNavigation(),
    getCustomerSession(),
    detectDepartureCity(),
  ]);

  // Le nom porté par le cookie signé suffit à l'en-tête : inutile d'interroger
  // la base à chaque page pour afficher une initiale.
  const customer = session
    ? { name: session.name, firstName: session.name.split(" ")[0] || session.name }
    : null;

  return (
    // La ville de départ enveloppe toute la page : l'en-tête la règle, le
    // moteur de recherche la lit, sur chaque page et sans la redemander.
    <DepartureCityProvider detectedCity={detectedCity}>
      <div className="flex min-h-screen flex-col">
        <Header
          settings={settings}
          categories={navigation.main}
          overflow={navigation.overflow}
          customer={customer}
        />
        <main className="flex-1">{children}</main>
        <Footer
          settings={settings}
          categories={navigation.main}
          overflow={navigation.overflow}
        />
        <SitePopups />
      </div>
    </DepartureCityProvider>
  );
}

import Header from "@/components/site/Header";
import Footer from "@/components/site/Footer";
import SitePopups from "@/components/site/SitePopups";
import { getSearchCategories, getSiteSettings } from "@/server/catalogue";
import { getCustomerSession } from "@/server/customer-session";

// L'en-tête et le pied de page affichent des valeurs éditées au back-office :
// ils sont donc rendus à la demande, pas figés à la construction.
export const dynamic = "force-dynamic";

export default async function SiteLayout({ children }: LayoutProps<"/">) {
  const [settings, categories, session] = await Promise.all([
    getSiteSettings(),
    getSearchCategories(),
    getCustomerSession(),
  ]);

  // Le nom porté par le cookie signé suffit à l'en-tête : inutile d'interroger
  // la base à chaque page pour afficher une initiale.
  const customer = session
    ? { name: session.name, firstName: session.name.split(" ")[0] || session.name }
    : null;

  return (
    <div className="flex min-h-screen flex-col">
      <Header settings={settings} categories={categories} customer={customer} />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} categories={categories} />
      <SitePopups />
    </div>
  );
}

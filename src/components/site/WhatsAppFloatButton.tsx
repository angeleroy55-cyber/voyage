"use client";

import { useI18n } from "@/i18n/I18nProvider";
import { SocialLogo } from "@/components/ui/BrandLogos";
import { whatsappLink } from "@/lib/data";

/**
 * Bouton WhatsApp flottant, fixé en bas à droite de l'écran.
 *
 * Avant, le seul lien WhatsApp du site vivait dans le pied de page : invisible
 * tant qu'on n'avait pas fini de défiler jusqu'en bas. `position: fixed`
 * (plutôt qu'`absolute`) le garde à l'écran sur toute la page, comme un bouton
 * d'assistance en ligne classique. Rendu une seule fois ici, au niveau du
 * layout : la version du pied de page reste un lien de contact normal parmi
 * d'autres, redondant mais pas gênant.
 */
export default function WhatsAppFloatButton({ number }: { number: string }) {
  const { dict } = useI18n();
  const href = whatsappLink(number, dict.footer.whatsappMessage);
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      aria-label={`${dict.footer.writeOnWhatsapp}${dict.footer.newWindow}`}
      className="fixed bottom-5 right-5 z-40 flex size-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-pop transition hover:scale-105 hover:bg-[#1da851] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-400 sm:bottom-6 sm:right-6"
    >
      <SocialLogo id="whatsapp" className="size-7" />
    </a>
  );
}

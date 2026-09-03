/**
 * Dictionnaire d'interface : anglais et espagnol, en plus du français.
 *
 * Volontairement limité à l'habillage du site : en-tête, pied de page,
 * moteur de recherche, boutons courants. Les catégories (venues du
 * back-office), les fiches du catalogue et les articles du carnet de voyage
 * restent en français quelle que soit la langue choisie — les traduire
 * demanderait de reprendre plusieurs centaines de fiches une à une, ce
 * qu'un dictionnaire statique ne peut pas garantir juste sans relecture
 * humaine. C'est une première étape, pas la version finale : le catalogue en
 * anglais et espagnol est un chantier à part, qui suppose un vrai flux de
 * traduction plutôt qu'une liste figée dans le code.
 *
 * Le anglais/espagnol change ici l'affichage, pas l'URL : `/sejours` reste
 * `/sejours` dans les trois langues. Un découpage `/en/sejours`, meilleur
 * pour le référencement par langue, est le sujet d'un chantier séparé — voir
 * la note laissée à ce propos dans le dépôt.
 */

export type Locale = "fr" | "en" | "es";

export const LOCALES: { id: Locale; label: string }[] = [
  { id: "fr", label: "Français" },
  { id: "en", label: "English" },
  { id: "es", label: "Español" },
];

export const DEFAULT_LOCALE: Locale = "fr";

export function isLocale(value: string | null | undefined): value is Locale {
  return !!value && LOCALES.some((l) => l.id === value);
}

const fr = {
  "utility.help": "Aide & FAQ",
  "utility.contact": "Contact",
  "utility.departureFrom": "Vous partez de",
  "utility.departureCity": "Ville de départ",
  "utility.locate": "Utiliser ma position",
  "utility.language": "Langue",
  "utility.currency": "EUR €",

  "header.openMenu": "Ouvrir le menu",
  "header.closeMenu": "Fermer le menu",
  "header.seeMore": "Voir plus",
  "header.seeMoreTrips": "Voir plus de voyages",
  "header.seeAll": "Tout voir",
  "header.myBooking": "Ma réservation",
  "header.myAccount": "Mon espace",
  "header.login": "Connexion",
  "header.home": "accueil",
  "header.newWindow": " (nouvelle fenêtre)",

  "footer.book": "Réserver",
  "footer.popularDestinations": "Destinations populaires",
  "footer.information": "Informations",
  "footer.legalGroup": "Mentions légales",
  "footer.aboutGroup": "À propos",
  "footer.followUs": "Suivez-nous",
  "footer.payment": "Paiement",
  "footer.accreditations": "Accréditations",
  "footer.whatsapp": "Écrire sur WhatsApp",

  "footer.legal.terms": "Conditions générales",
  "footer.legal.privacy": "Politique de confidentialité",
  "footer.legal.cookies": "Gestion des cookies",
  "footer.legal.accessibility": "Accessibilité",
  "footer.legal.mediation": "Médiation",
  "footer.about.who": "Qui sommes-nous",
  "footer.about.guides": "Guides de voyage",
  "footer.about.help": "Aide et FAQ",
  "footer.about.contact": "Nous contacter",
  "footer.about.jobs": "Recrutement",
  "footer.about.affiliation": "Affiliation",
} as const;

type Key = keyof typeof fr;

const en: Record<Key, string> = {
  "utility.help": "Help & FAQ",
  "utility.contact": "Contact",
  "utility.departureFrom": "Departing from",
  "utility.departureCity": "Departure city",
  "utility.locate": "Use my location",
  "utility.language": "Language",
  "utility.currency": "EUR €",

  "header.openMenu": "Open menu",
  "header.closeMenu": "Close menu",
  "header.seeMore": "More",
  "header.seeMoreTrips": "More trips",
  "header.seeAll": "See all",
  "header.myBooking": "My booking",
  "header.myAccount": "My account",
  "header.login": "Log in",
  "header.home": "home",
  "header.newWindow": " (new window)",

  "footer.book": "Book",
  "footer.popularDestinations": "Popular destinations",
  "footer.information": "Information",
  "footer.legalGroup": "Legal",
  "footer.aboutGroup": "About",
  "footer.followUs": "Follow us",
  "footer.payment": "Payment",
  "footer.accreditations": "Accreditations",
  "footer.whatsapp": "Message us on WhatsApp",

  "footer.legal.terms": "Terms & conditions",
  "footer.legal.privacy": "Privacy policy",
  "footer.legal.cookies": "Cookie settings",
  "footer.legal.accessibility": "Accessibility",
  "footer.legal.mediation": "Mediation",
  "footer.about.who": "About us",
  "footer.about.guides": "Travel guides",
  "footer.about.help": "Help & FAQ",
  "footer.about.contact": "Contact us",
  "footer.about.jobs": "Careers",
  "footer.about.affiliation": "Affiliate program",
};

const es: Record<Key, string> = {
  "utility.help": "Ayuda y FAQ",
  "utility.contact": "Contacto",
  "utility.departureFrom": "Sales desde",
  "utility.departureCity": "Ciudad de salida",
  "utility.locate": "Usar mi ubicación",
  "utility.language": "Idioma",
  "utility.currency": "EUR €",

  "header.openMenu": "Abrir menú",
  "header.closeMenu": "Cerrar menú",
  "header.seeMore": "Más",
  "header.seeMoreTrips": "Más viajes",
  "header.seeAll": "Ver todo",
  "header.myBooking": "Mi reserva",
  "header.myAccount": "Mi cuenta",
  "header.login": "Iniciar sesión",
  "header.home": "inicio",
  "header.newWindow": " (nueva ventana)",

  "footer.book": "Reservar",
  "footer.popularDestinations": "Destinos populares",
  "footer.information": "Información",
  "footer.legalGroup": "Aviso legal",
  "footer.aboutGroup": "Sobre nosotros",
  "footer.followUs": "Síguenos",
  "footer.payment": "Pago",
  "footer.accreditations": "Acreditaciones",
  "footer.whatsapp": "Escríbenos por WhatsApp",

  "footer.legal.terms": "Condiciones generales",
  "footer.legal.privacy": "Política de privacidad",
  "footer.legal.cookies": "Gestión de cookies",
  "footer.legal.accessibility": "Accesibilidad",
  "footer.legal.mediation": "Mediación",
  "footer.about.who": "Quiénes somos",
  "footer.about.guides": "Guías de viaje",
  "footer.about.help": "Ayuda y FAQ",
  "footer.about.contact": "Contáctanos",
  "footer.about.jobs": "Empleo",
  "footer.about.affiliation": "Afiliación",
};

export const DICTIONARIES: Record<Locale, Record<Key, string>> = { fr, en, es };

export type { Key as I18nKey };

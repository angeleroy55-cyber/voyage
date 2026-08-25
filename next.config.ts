import type { NextConfig } from "next";

/**
 * Redirections héritées de l'ancienne arborescence.
 *
 * Le cahier de catégorisation remonte les catégories à la racine (/sejours au
 * lieu de /recherche/vol-hotel) et en renomme quatre. Ces adresses ont été
 * indexées et partagées : elles répondent donc en 308, qui conserve la méthode
 * de la requête et transmet la valeur du lien aux nouvelles pages.
 *
 * L'ordre compte : les slugs renommés passent avant la règle générique, sinon
 * /recherche/vol-hotel atterrirait sur /vol-hotel, qui n'existe plus.
 */
const legacyCategories: Record<string, string> = {
  "vol-hotel": "sejours",
  escapades: "camping-escapades",
  campings: "camping-escapades",
  voitures: "location-voiture",
};

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Photographies du catalogue, sous licence libre (cf. npm run photos).
      { protocol: "https", hostname: "upload.wikimedia.org" },
      // Visuels téléversés depuis le back-office.
      { protocol: "https", hostname: "res.cloudinary.com" },
      // Repli sur un visuel neutre quand une offre n'a aucune image.
      { protocol: "https", hostname: "picsum.photos" },
      // Vignettes des vidéos YouTube du pied de page.
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
  },
  async redirects() {
    return [
      ...Object.entries(legacyCategories).flatMap(([ancien, nouveau]) => [
        { source: `/recherche/${ancien}`, destination: `/${nouveau}`, permanent: true },
        { source: `/${ancien}`, destination: `/${nouveau}`, permanent: true },
      ]),
      { source: "/recherche/:category", destination: "/:category", permanent: true },
      { source: "/recherche", destination: "/destinations", permanent: true },
    ];
  },
};

export default nextConfig;

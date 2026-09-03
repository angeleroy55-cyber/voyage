/**
 * Saisons commerciales du catalogue.
 *
 * Le cahier prévoit une rotation automatique sur la page d'accueil : Toussaint,
 * été indien, hiver et ski, Noël, Pâques, été. Elle est décrite ici une fois
 * pour toutes, et pilotée par la date du jour plutôt que par une saisie
 * manuelle : une mise en avant saisonnière oubliée en place trois mois après la
 * saison fait plus de mal qu'elle n'a fait de bien.
 *
 * Chaque saison est une fenêtre de départ, exprimée en jour et mois. Une
 * fenêtre qui traverse le 31 décembre est gérée : `du 20/12 au 05/01` reste une
 * seule période continue.
 */

export type Season = {
  id: string;
  label: string;
  blurb: string;
  /** Début de la fenêtre de départ, [mois, jour], mois de 1 à 12. */
  from: [number, number];
  /** Fin de la fenêtre de départ, incluse. */
  to: [number, number];
};

export const SEASONS: Season[] = [
  {
    id: "ete-indien",
    label: "Été indien",
    blurb: "Septembre et octobre : la mer est encore chaude, les prix ont baissé.",
    from: [9, 1],
    to: [10, 15],
  },
  {
    id: "toussaint",
    label: "Vacances de la Toussaint",
    blurb: "Une semaine de soleil entre deux trimestres, sans poser de congés.",
    from: [10, 16],
    to: [11, 5],
  },
  {
    id: "soleil-hiver",
    label: "Soleil d'hiver",
    blurb: "Canaries, Cap-Vert, Égypte : partir au chaud quand il fait gris ici.",
    from: [11, 6],
    to: [12, 15],
  },
  {
    id: "noel",
    label: "Noël et Nouvel An",
    blurb: "Les fêtes ailleurs, en famille ou au soleil. À réserver tôt.",
    from: [12, 16],
    to: [1, 5],
  },
  {
    id: "ski",
    label: "Vacances d'hiver et ski",
    blurb: "Février et mars en montagne, ou au soleil pour couper l'hiver.",
    from: [1, 6],
    to: [3, 20],
  },
  {
    id: "paques",
    label: "Vacances de Pâques",
    blurb: "Le premier vrai soleil de l'année, en Méditerranée et au Maroc.",
    from: [3, 21],
    to: [5, 10],
  },
  {
    id: "pont-de-mai",
    label: "Ponts de mai",
    blurb: "Trois ou quatre jours à saisir entre deux jours fériés.",
    from: [5, 11],
    to: [6, 15],
  },
  {
    id: "ete",
    label: "Grandes vacances",
    blurb: "Juillet et août, en famille. Les meilleures places partent en premier.",
    from: [6, 16],
    to: [8, 31],
  },
];

/** Numéro de jour dans l'année, sans tenir compte des années bissextiles. */
function rang([mois, jour]: [number, number]): number {
  return mois * 100 + jour;
}

/**
 * La date tombe-t-elle dans la fenêtre de la saison ?
 *
 * Le test se fait sur le jour et le mois seulement : une saison se répète chaque
 * année, elle n'appartient à aucune en particulier.
 */
export function inSeason(date: Date, season: Season): boolean {
  const jour = rang([date.getMonth() + 1, date.getDate()]);
  const debut = rang(season.from);
  const fin = rang(season.to);
  // Fenêtre à cheval sur le nouvel an : elle est vraie de part et d'autre.
  return debut <= fin ? jour >= debut && jour <= fin : jour >= debut || jour <= fin;
}

export function seasonById(id: string | undefined): Season | null {
  return SEASONS.find((s) => s.id === id) ?? null;
}

/**
 * Saison en cours à une date donnée.
 *
 * Sert à la rotation automatique de la page d'accueil. Les fenêtres couvrant
 * l'année entière, il y en a toujours une.
 */
export function currentSeason(date = new Date()): Season {
  return SEASONS.find((s) => inSeason(date, s)) ?? SEASONS[0];
}

/**
 * Saison mise en avant, c'est-à-dire la suivante.
 *
 * On ne vend pas la saison en cours : quand les vacances de la Toussaint
 * commencent, ceux qui partent ont déjà réservé. La page d'accueil pousse donc
 * la période d'après, celle qu'il est encore temps de préparer.
 */
export function upcomingSeason(date = new Date()): Season {
  const index = SEASONS.findIndex((s) => inSeason(date, s));
  return SEASONS[(index + 1) % SEASONS.length];
}

/**
 * Les `count` prochaines saisons, dans l'ordre.
 *
 * Sert aux bandeaux d'accueil : plutôt qu'un unique bandeau saisonnier, la
 * page en pousse plusieurs, chacun sur une période différente à venir.
 */
export function upcomingSeasons(count: number, date = new Date()): Season[] {
  const index = SEASONS.findIndex((s) => inSeason(date, s));
  return Array.from({ length: count }, (_, i) => SEASONS[(index + 1 + i) % SEASONS.length]);
}

/**
 * Bornes réelles de la saison, en dates, à partir d'aujourd'hui.
 *
 * La fenêtre est reportée sur l'année en cours, ou la suivante si elle est déjà
 * passée : chercher « vacances de Pâques » en juin doit rendre les départs du
 * printemps prochain, pas une liste vide.
 */
export function seasonRange(season: Season, today = new Date()): { gte: Date; lte: Date } {
  const annee = today.getFullYear();
  const debut = new Date(annee, season.from[0] - 1, season.from[1], 0, 0, 0, 0);
  const fin = new Date(annee, season.to[0] - 1, season.to[1], 23, 59, 59, 999);

  // Fenêtre à cheval sur le nouvel an : la fin appartient à l'année suivante.
  if (fin < debut) fin.setFullYear(annee + 1);

  // Saison déjà terminée cette année : on vise la même, l'an prochain.
  if (fin < today) {
    debut.setFullYear(debut.getFullYear() + 1);
    fin.setFullYear(fin.getFullYear() + 1);
  }

  return { gte: debut, lte: fin };
}

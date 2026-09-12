"use client";

import { useEffect, useRef, useState } from "react";

type Variant = "up" | "down" | "left" | "right" | "zoom" | "fade";

type Props = {
  children: React.ReactNode;
  /** Sens d'arrivée. `up` par défaut : le bloc monte de quelques pixels. */
  variant?: Variant;
  /** Décalage en millisecondes, pour échelonner plusieurs blocs voisins. */
  delay?: number;
  /** Part de l'élément visible avant déclenchement (0 → 1). */
  threshold?: number;
  /** Rejoue l'animation à chaque passage plutôt qu'une seule fois. */
  repeat?: boolean;
  as?: "div" | "section" | "li" | "article" | "span";
  className?: string;
};

/**
 * Révèle son contenu quand il entre dans le champ de vision.
 *
 * L'état de repos et la transition vivent dans `globals.css` (`[data-reveal]`) :
 * le composant ne fait que basculer `data-shown`, ce qui évite de recalculer un
 * style en JavaScript à chaque défilement.
 *
 * L'observateur est abandonné dès le premier passage (sauf `repeat`), et rien
 * ne s'anime si le système demande à réduire les animations.
 */
export default function Reveal({
  children,
  variant = "up",
  delay = 0,
  threshold = 0.15,
  repeat = false,
  as: Tag = "div",
  className = "",
}: Props) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Sans IntersectionObserver, ou avec les animations coupées, le contenu
    // doit rester lisible : on l'affiche immédiatement. L'attribut est posé sur
    // le nœud plutôt que via un setState, qui déclencherait un rendu en cascade
    // pour un résultat identique : il n'y a ici rien à réconcilier, seulement un
    // état final à écrire dans le DOM.
    if (reduced || typeof IntersectionObserver === "undefined") {
      node.dataset.shown = "true";
      return;
    }

    // Un bloc plus haut que la fenêtre ne peut pas atteindre n'importe quel
    // ratio d'intersection : la grille des destinations fait près de sept écrans
    // et plafonne vers 0,13. Le seuil de 0,15 n'était alors jamais franchi,
    // l'observateur ne se déclenchait pas et le bloc restait à `opacity: 0`,
    // invisible mais occupant toute sa hauteur. D'où le seuil ramené à ce que
    // la hauteur réelle rend atteignable, moitié moins pour déclencher quand le
    // bloc est franchement entré plutôt qu'à son premier pixel.
    const atteignable = window.innerHeight / Math.max(node.offsetHeight, 1);
    const seuil = Math.min(threshold, atteignable / 2);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          if (!repeat) observer.disconnect();
        } else if (repeat) {
          setShown(false);
        }
      },
      // La marge basse négative retarde légèrement le déclenchement : un bloc
      // qui pointe d'un pixel sous le pli n'apparaît pas déjà animé.
      { threshold: seuil, rootMargin: "0px 0px -8% 0px" },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [repeat, threshold]);

  return (
    <Tag
      ref={ref as React.Ref<never>}
      data-reveal={variant}
      data-shown={shown ? "true" : undefined}
      style={delay ? ({ ["--reveal-delay" as string]: `${delay}ms` } as React.CSSProperties) : undefined}
      className={className}
    >
      {children}
    </Tag>
  );
}

/**
 * Échelonne l'apparition d'une liste d'enfants : chaque élément reçoit le même
 * `variant` avec un retard croissant, plafonné pour qu'une longue grille ne
 * finisse pas par attendre plusieurs secondes.
 */
export function RevealStagger({
  children,
  variant = "up",
  step = 70,
  maxDelay = 420,
  className = "",
}: {
  children: React.ReactNode;
  variant?: Variant;
  step?: number;
  maxDelay?: number;
  className?: string;
}) {
  const items = Array.isArray(children) ? children : [children];
  return (
    <>
      {items.map((child, index) => (
        <Reveal
          key={index}
          variant={variant}
          delay={Math.min(index * step, maxDelay)}
          className={className}
        >
          {child}
        </Reveal>
      ))}
    </>
  );
}

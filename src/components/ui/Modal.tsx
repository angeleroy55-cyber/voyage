"use client";

import { useCallback, useEffect, useRef } from "react";
import Icon from "@/components/ui/Icon";

type Props = {
  open: boolean;
  onClose: () => void;
  title: string;
  /** Masque le titre visuellement tout en le laissant aux lecteurs d'écran. */
  hideTitle?: boolean;
  description?: string;
  size?: "sm" | "md" | "lg" | "xl";
  /** Colle la fenêtre en bas de l'écran sur mobile, à la manière d'un tiroir. */
  sheetOnMobile?: boolean;
  footer?: React.ReactNode;
  children: React.ReactNode;
};

const WIDTHS = {
  sm: "sm:max-w-md",
  md: "sm:max-w-lg",
  lg: "sm:max-w-2xl",
  xl: "sm:max-w-4xl",
};

const FOCUSABLE =
  'a[href],button:not([disabled]),textarea:not([disabled]),input:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

/**
 * Fenêtre modale du site.
 *
 * Elle assure ce qu'un `<div>` posé en `position: fixed` ne fait pas seul :
 * fermeture au clavier, piégeage du focus, retour du focus à l'élément
 * d'origine, verrouillage du défilement de la page et compensation de la
 * largeur de la barre de défilement pour éviter le sursaut de mise en page.
 */
export default function Modal({
  open,
  onClose,
  title,
  hideTitle = false,
  description,
  size = "md",
  sheetOnMobile = false,
  footer,
  children,
}: Props) {
  const panel = useRef<HTMLDivElement>(null);
  const restoreTo = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
        return;
      }
      if (event.key !== "Tab" || !panel.current) return;

      const targets = Array.from(
        panel.current.querySelectorAll<HTMLElement>(FOCUSABLE),
      ).filter((el) => el.offsetParent !== null);
      if (targets.length === 0) return;

      const first = targets[0];
      const last = targets[targets.length - 1];
      const active = document.activeElement;

      // Le focus boucle à l'intérieur du panneau : sans cela, la tabulation
      // repart dans la page masquée, qui reste dans l'ordre du document.
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!open) return;

    restoreTo.current = document.activeElement as HTMLElement | null;

    const { body } = document;
    const previousOverflow = body.style.overflow;
    const previousPadding = body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;

    document.addEventListener("keydown", handleKeyDown, true);

    // Le premier champ prend le focus, à défaut le panneau lui-même : ouvrir
    // une modale sans déplacer le focus laisserait le lecteur d'écran en place.
    const timer = window.setTimeout(() => {
      const target =
        panel.current?.querySelector<HTMLElement>(FOCUSABLE) ?? panel.current;
      target?.focus();
    }, 40);

    return () => {
      window.clearTimeout(timer);
      document.removeEventListener("keydown", handleKeyDown, true);
      body.style.overflow = previousOverflow;
      body.style.paddingRight = previousPadding;
      restoreTo.current?.focus?.();
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  const titleId = `modal-title-${title.replace(/\W+/g, "-").toLowerCase()}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="animate-overlay-in absolute inset-0 bg-navy-900/60 backdrop-blur-[2px]"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={`relative flex max-h-[92vh] w-full flex-col overflow-hidden bg-white shadow-pop outline-none ${
          sheetOnMobile
            ? "animate-sheet-in rounded-t-3xl sm:animate-dialog-in sm:rounded-2xl"
            : "animate-dialog-in rounded-t-3xl sm:rounded-2xl"
        } ${WIDTHS[size]}`}
      >
        {/* Poignée du tiroir mobile : purement visuelle, elle indique que la
            fenêtre se referme vers le bas. */}
        {sheetOnMobile && (
          <span
            aria-hidden="true"
            className="mx-auto mt-2.5 h-1 w-10 shrink-0 rounded-full bg-navy-200 sm:hidden"
          />
        )}

        {/* Titre masqué : aucune barre d'en-tête n'est rendue, seulement le
            titre pour les lecteurs d'écran et le bouton de fermeture, posé en
            absolu au-dessus du contenu. Une barre vide de 20 px laissait
            auparavant un décalage que chaque appelant devait rattraper au
            moyen d'une marge négative, source de débordements. */}
        {hideTitle ? (
          <h2 id={titleId} className="sr-only">
            {title}
          </h2>
        ) : (
          <div className="flex items-start gap-4 px-5 pb-4 pt-5">
            <div className="min-w-0 flex-1">
              <h2 id={titleId} className="text-lg font-extrabold tracking-tight text-navy-900">
                {title}
              </h2>
              {description && <p className="mt-1 text-sm text-navy-600">{description}</p>}
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className={
            hideTitle
              ? "absolute right-3 top-3 z-20 rounded-lg bg-white/90 p-2 text-navy-600 shadow-card backdrop-blur transition hover:bg-white hover:text-navy-900"
              : "absolute right-4 top-4 rounded-lg p-2 text-navy-500 transition hover:bg-navy-50 hover:text-navy-900"
          }
        >
          <Icon name="close" className="size-5" />
        </button>

        {/* `overflow-y-auto` rend aussi l'axe horizontal scrollable : le
            contenu doit donc tenir dans la largeur, sans marge négative. */}
        <div className={`min-h-0 flex-1 overflow-y-auto ${hideTitle ? "" : "px-5 pb-5"}`}>
          {children}
        </div>

        {footer && (
          <div className="shrink-0 border-t border-navy-100 bg-navy-50/60 px-5 py-4">{footer}</div>
        )}
      </div>
    </div>
  );
}

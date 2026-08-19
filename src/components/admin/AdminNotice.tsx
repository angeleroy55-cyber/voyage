import Icon from "@/components/ui/Icon";

/**
 * Retour d'une action du back-office. Les pages passent par ce composant plutôt
 * que par un bandeau maison à chaque fois, pour qu'un succès et un échec se
 * distinguent partout de la même façon — la couleur seule ne suffisant pas, le
 * pictogramme porte la même information.
 */
export default function AdminNotice({
  tone = "success",
  children,
}: {
  tone?: "success" | "error";
  children: React.ReactNode;
}) {
  const error = tone === "error";

  return (
    <p
      role={error ? "alert" : "status"}
      className={`mt-4 flex items-start gap-2 rounded-xl px-4 py-3 text-sm ${
        error ? "bg-red-50 text-red-700" : "bg-teal-50 text-teal-700"
      }`}
    >
      <Icon name={error ? "close" : "check"} className="mt-0.5 size-4 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

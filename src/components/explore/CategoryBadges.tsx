import { categoriesOf, type BadgeCategory } from "@/lib/explore-data";
import { cn } from "@/lib/utils";

/** Letter and colours for the four verified categories. */
const META: Record<BadgeCategory, { letter: string; bg: string; fg: string }> = {
  Sports: { letter: "S", bg: "#22c55e", fg: "#052e16" },
  Arts: { letter: "A", bg: "#7c3aed", fg: "#ffffff" },
  Culture: { letter: "C", bg: "#f59e0b", fg: "#451a03" },
  Gaming: { letter: "G", bg: "#06b6d4", fg: "#083344" },
};
const ORDER: BadgeCategory[] = ["Sports", "Arts", "Culture", "Gaming"];

/**
 * One fixed-size marker for verified categories. Renders nothing for all other accounts.
 * Chips never shrink or wrap; put the username in a `min-w-0 truncate` sibling.
 */
export function CategoryBadges({ categories, className }: { categories?: BadgeCategory[]; className?: string }) {
  if (!categories || categories.length === 0) return null;
  return (
    <span className={cn("inline-flex shrink-0 flex-nowrap items-center gap-0.5 whitespace-nowrap", className)}>
      {ORDER.filter((category) => categories.includes(category)).map((c) => {
        const m = META[c];
        return (
          <span
            key={c}
            role="img"
            aria-label={`Verified in ${c}`}
            title={`Verified in ${c}`}
            className="inline-grid shrink-0 select-none place-items-center font-bold leading-none"
            style={{ width: 16, height: 16, borderRadius: 5, fontSize: 10, background: m.bg, color: m.fg }}
          >
            {m.letter}
          </span>
        );
      })}
    </span>
  );
}

/** Resolve verification from the profile, never from a post's topic. */
export function BadgesFor({ handle }: { handle: string }) {
  return <CategoryBadges categories={categoriesOf(handle)} />;
}

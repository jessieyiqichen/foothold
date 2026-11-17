import { Button } from "@/components/ui/Button";
import { ROLES_COPY, removeLabel } from "@/lib/roles/copy";
import { activeChips, clearAll, type ProfilePicks, type RoleFilters } from "@/lib/roles/filters";

/** What is filtering now, as chips with an × each, and Clear all. Thin edges: they are labels with one small key. */
export function FilterChips({ filters, profile, onChange }: { filters: RoleFilters; profile: ProfilePicks; onChange: (next: RoleFilters) => void }) {
  const chips = activeChips(filters, profile);
  if (chips.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <ul aria-label={ROLES_COPY.activeLabel} className="flex flex-wrap gap-2">
        {chips.map((chip) => (
          <li key={chip.key} className="inline-flex items-center border border-ink bg-surface pl-2 text-sm text-ink">
            {chip.label}
            <button type="button" aria-label={removeLabel(chip.label)} onClick={() => onChange(chip.without)}
              className="ml-1 inline-flex size-8 items-center justify-center hover:bg-wash focus-visible:outline-3 focus-visible:outline-focus">
              <span aria-hidden>×</span>
            </button>
          </li>
        ))}
      </ul>
      <Button variant="ghost" onClick={() => onChange(clearAll(filters))}>{ROLES_COPY.clearAll}</Button>
    </div>
  );
}

import { CATEGORY_LABELS } from "../core/classify";
import type { ThreatCategory } from "../core/types";

interface TagChipProps {
  category: ThreatCategory;
  selected?: boolean;
  onClick?: () => void;
}

export function TagChip({ category, selected, onClick }: TagChipProps) {
  const className = `tag tag-${category}${selected ? " is-selected" : ""}${onClick ? " is-button" : ""}`;
  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick} aria-pressed={selected}>
        {CATEGORY_LABELS[category]}
      </button>
    );
  }
  return <span className={className}>{CATEGORY_LABELS[category]}</span>;
}

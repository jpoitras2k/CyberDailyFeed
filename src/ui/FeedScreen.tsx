import type { FeedSnapshot, ThreatCategory, UserPreferences } from "../core/types";
import { THREAT_CATEGORIES } from "../core/types";
import { HeadlineCard } from "./HeadlineCard";
import { TagChip } from "./TagChip";

interface FeedScreenProps {
  snapshot: FeedSnapshot | null;
  loading: boolean;
  now: Date;
  preferences: UserPreferences;
  onRefresh: () => void;
  onOpenPreferences: () => void;
  onToggleCategory: (category: ThreatCategory) => void;
}

export function FeedScreen({
  snapshot,
  loading,
  now,
  preferences,
  onRefresh,
  onOpenPreferences,
  onToggleCategory,
}: FeedScreenProps) {
  const headlines = snapshot?.headlines ?? [];
  const failing = snapshot?.errors ?? [];

  return (
    <section className="screen">
      <header className="topbar">
        <div>
          <p className="kicker">Rolling 24-hour window</p>
          <h1>Cyber Daily Feed</h1>
        </div>
        <div className="topbar-actions">
          <button type="button" className="ghost" onClick={onRefresh} disabled={loading}>
            {loading ? "Refreshing" : "Refresh"}
          </button>
          <button type="button" className="ghost" onClick={onOpenPreferences}>
            Interests
          </button>
        </div>
      </header>

      <div className="chip-row wrap">
        {THREAT_CATEGORIES.map((category) => (
          <TagChip
            key={category}
            category={category}
            selected={preferences.selectedCategories.includes(category)}
            onClick={() => onToggleCategory(category)}
          />
        ))}
      </div>

      <p className="status-line">
        {snapshot
          ? `${headlines.length} headline${headlines.length === 1 ? "" : "s"} in the last 24 hours`
          : "Ingesting official RSS feeds…"}
        {failing.length > 0
          ? ` · ${failing.length} source${failing.length === 1 ? "" : "s"} unavailable`
          : ""}
      </p>

      {failing.length > 0 ? (
        <p className="banner">
          {failing.map((error) => error.sourceName).join(", ")} could not be
          reached. Headlines, source names, and original links are shown for
          sources that responded.
        </p>
      ) : null}

      {headlines.length === 0 && !loading ? (
        <div className="empty">
          <h2>No headlines in the last 24 hours</h2>
          <p>
            Low-frequency sources such as Krebs on Security often sit outside this
            window. Pull refresh after the next publish, or widen filters in
            Interests.
          </p>
        </div>
      ) : (
        <div className="feed">
          {headlines.map((headline) => (
            <HeadlineCard key={headline.id} headline={headline} now={now} />
          ))}
        </div>
      )}

      {snapshot ? (
        <footer className="source-health">
          {snapshot.sources.map((source) => (
            <span key={source.sourceId} className={source.error ? "is-down" : undefined}>
              {source.sourceName} {source.error ? "offline" : `${source.fresh.length} today`}
            </span>
          ))}
        </footer>
      ) : null}
    </section>
  );
}

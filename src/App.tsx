import { useCallback, useEffect, useMemo, useState } from "react";
import { ingestAllSources } from "./core/ingestion";
import type { FeedSnapshot, ThreatCategory, UserPreferences } from "./core/types";
import { THREAT_CATEGORIES } from "./core/types";
import { isDevWebPreview } from "./platform/http";
import { loadPreferences, savePreferences } from "./platform/storage";
import { FeedScreen } from "./ui/FeedScreen";
import { PreferencesScreen } from "./ui/PreferencesScreen";

const REFETCH_MS = 15 * 60 * 1000;
const TICK_MS = 60 * 1000;

export function App() {
  const [screen, setScreen] = useState<"feed" | "preferences">("feed");
  const [preferences, setPreferences] = useState<UserPreferences>(loadPreferences);
  const [snapshot, setSnapshot] = useState<FeedSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => new Date());

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const next = await ingestAllSources(undefined, {
        now: new Date(),
        preferences,
        useDevProxy: isDevWebPreview(),
      });
      setSnapshot(next);
      setNow(new Date());
    } finally {
      setLoading(false);
    }
  }, [preferences]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const refetch = window.setInterval(() => {
      void refresh();
    }, REFETCH_MS);
    const tick = window.setInterval(() => setNow(new Date()), TICK_MS);
    return () => {
      window.clearInterval(refetch);
      window.clearInterval(tick);
    };
  }, [refresh]);

  useEffect(() => {
    savePreferences(preferences);
  }, [preferences]);

  const visibleSnapshot = useMemo(() => {
    if (!snapshot) {
      return null;
    }
    const cutoff = now.getTime() - 24 * 60 * 60 * 1000;
    return {
      ...snapshot,
      headlines: snapshot.headlines.filter(
        (headline) => Date.parse(headline.publishedAt) >= cutoff,
      ),
    };
  }, [snapshot, now]);

  function toggleCategory(category: ThreatCategory): void {
    const selected = new Set(preferences.selectedCategories);
    if (selected.has(category)) {
      selected.delete(category);
    } else {
      selected.add(category);
    }
    setPreferences({
      ...preferences,
      selectedCategories: THREAT_CATEGORIES.filter((item) => selected.has(item)),
    });
  }

  return (
    <div className="shell">
      {screen === "feed" ? (
        <FeedScreen
          snapshot={visibleSnapshot}
          loading={loading}
          now={now}
          preferences={preferences}
          onRefresh={() => void refresh()}
          onOpenPreferences={() => setScreen("preferences")}
          onToggleCategory={toggleCategory}
        />
      ) : (
        <PreferencesScreen
          preferences={preferences}
          onChange={setPreferences}
          onBack={() => setScreen("feed")}
        />
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { parseKeywordsFromDraft } from "../core/filters";
import { THREAT_CATEGORIES } from "../core/types";
import type { UserPreferences } from "../core/types";
import { TagChip } from "./TagChip";

interface PreferencesScreenProps {
  preferences: UserPreferences;
  onChange: (next: UserPreferences) => void;
  onBack: () => void;
}

export function PreferencesScreen({
  preferences,
  onChange,
  onBack,
}: PreferencesScreenProps) {
  const [keywordDraft, setKeywordDraft] = useState(preferences.keywords.join(", "));

  useEffect(() => {
    setKeywordDraft(preferences.keywords.join(", "));
  }, [preferences.keywords]);

  function toggleCategory(category: (typeof THREAT_CATEGORIES)[number]): void {
    const selected = new Set(preferences.selectedCategories);
    if (selected.has(category)) {
      selected.delete(category);
    } else {
      selected.add(category);
    }
    onChange({
      ...preferences,
      keywords: parseKeywordsFromDraft(keywordDraft),
      selectedCategories: THREAT_CATEGORIES.filter((item) => selected.has(item)),
    });
  }

  function goBack(): void {
    onChange({
      ...preferences,
      keywords: parseKeywordsFromDraft(keywordDraft),
    });
    onBack();
  }

  return (
    <section className="screen">
      <header className="topbar">
        <button type="button" className="text-button" onClick={goBack}>
          ← Today
        </button>
        <div>
          <p className="kicker">On-device only</p>
          <h1>Interests</h1>
        </div>
      </header>

      <div className="panel">
        <h2>Threat categories</h2>
        <p className="lede">
          Leave all unselected to see every fresh headline. Selections stay on this
          device — nothing is uploaded.
        </p>
        <div className="chip-row wrap">
          {THREAT_CATEGORIES.map((category) => (
            <TagChip
              key={category}
              category={category}
              selected={preferences.selectedCategories.includes(category)}
              onClick={() => toggleCategory(category)}
            />
          ))}
        </div>
      </div>

      <div className="panel">
        <h2>Keyword interests</h2>
        <p className="lede">
          Comma-separated terms matched against headlines only (for example{" "}
          <code>cisco, lockbit</code>).
        </p>
        <textarea
          aria-label="Keyword interests"
          value={keywordDraft}
          rows={4}
          onChange={(event) => setKeywordDraft(event.target.value)}
          onBlur={(event) =>
            onChange({
              ...preferences,
              keywords: parseKeywordsFromDraft(event.target.value),
            })
          }
        />
      </div>

      <div className="panel muted">
        <h2>Privacy</h2>
        <p>
          Preferences are stored in this browser/app with the key{" "}
          <code>cyberdailyfeed.preferences.v1</code>. Clearing site data or
          uninstalling the app removes them. See the privacy policy in this
          repository before Play Store submission.
        </p>
      </div>
    </section>
  );
}

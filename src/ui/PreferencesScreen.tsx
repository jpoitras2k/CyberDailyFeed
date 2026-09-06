import { useState } from "react";
import { mergeKeywords, removeKeyword } from "../core/filters";
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
  const [keywordDraft, setKeywordDraft] = useState("");

  function toggleCategory(category: (typeof THREAT_CATEGORIES)[number]): void {
    const selected = new Set(preferences.selectedCategories);
    if (selected.has(category)) {
      selected.delete(category);
    } else {
      selected.add(category);
    }
    onChange({
      ...preferences,
      selectedCategories: THREAT_CATEGORIES.filter((item) => selected.has(item)),
    });
  }

  function saveKeywords(): void {
    const next = mergeKeywords(preferences.keywords, keywordDraft);
    if (next.length === preferences.keywords.length && keywordDraft.trim() === "") {
      return;
    }
    onChange({ ...preferences, keywords: next });
    setKeywordDraft("");
  }

  function removeOne(keyword: string): void {
    onChange({
      ...preferences,
      keywords: removeKeyword(preferences.keywords, keyword),
    });
  }

  function removeAll(): void {
    onChange({ ...preferences, keywords: [] });
    setKeywordDraft("");
  }

  return (
    <section className="screen">
      <header className="topbar">
        <button type="button" className="text-button" onClick={onBack}>
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
          Save terms to match against headlines (for example <code>cisco</code> or{" "}
          <code>lockbit</code>). Nothing is uploaded.
        </p>
        <form
          className="keyword-add"
          onSubmit={(event) => {
            event.preventDefault();
            saveKeywords();
          }}
        >
          <input
            aria-label="New keyword"
            placeholder="Add a keyword"
            value={keywordDraft}
            onChange={(event) => setKeywordDraft(event.target.value)}
          />
          <button
            type="submit"
            className="solid"
            disabled={keywordDraft.trim().length === 0}
          >
            Save
          </button>
        </form>

        {preferences.keywords.length === 0 ? (
          <p className="lede keyword-empty">No saved keywords.</p>
        ) : (
          <>
            <div className="chip-row wrap keyword-saved">
              {preferences.keywords.map((keyword) => (
                <span key={keyword.toLowerCase()} className="keyword-chip">
                  {keyword}
                  <button
                    type="button"
                    aria-label={`Remove ${keyword}`}
                    onClick={() => removeOne(keyword)}
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
            <button type="button" className="text-button" onClick={removeAll}>
              Remove all keywords
            </button>
          </>
        )}
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

import type { Headline, ThreatCategory, UserPreferences } from "./types";
import { DEFAULT_PREFERENCES } from "./types";

export function parseKeywordsFromDraft(raw: string): string[] {
  return raw
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function applyUserFilters(
  headlines: readonly Headline[],
  preferences: UserPreferences = DEFAULT_PREFERENCES,
): Headline[] {
  const keywords = preferences.keywords
    .map((word) => word.trim().toLowerCase())
    .filter(Boolean);
  const categories = new Set<ThreatCategory>(preferences.selectedCategories);

  return headlines.filter((headline) => {
    if (categories.size > 0) {
      const hits = headline.categories.some((category) => categories.has(category));
      if (!hits) {
        return false;
      }
    }
    if (keywords.length === 0) {
      return true;
    }
    const haystack = headline.title.toLowerCase();
    return keywords.some((keyword) => haystack.includes(keyword));
  });
}

export function sortByNewest(headlines: readonly Headline[]): Headline[] {
  return [...headlines].sort((a, b) => {
    const aTime = Date.parse(a.publishedAt) || 0;
    const bTime = Date.parse(b.publishedAt) || 0;
    return bTime - aTime;
  });
}

export function mergeHeadlines(groups: readonly Headline[][]): Headline[] {
  const seen = new Set<string>();
  const merged: Headline[] = [];
  for (const group of groups) {
    for (const headline of group) {
      if (seen.has(headline.url)) {
        continue;
      }
      seen.add(headline.url);
      merged.push(headline);
    }
  }
  return merged;
}

export function normalizePreferences(raw: unknown): UserPreferences {
  if (!raw || typeof raw !== "object") {
    return { ...DEFAULT_PREFERENCES, keywords: [], selectedCategories: [] };
  }
  const record = raw as Record<string, unknown>;
  const keywords = Array.isArray(record.keywords)
    ? record.keywords
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter(Boolean)
        .slice(0, 20)
    : [];
  const selectedCategories = Array.isArray(record.selectedCategories)
    ? record.selectedCategories.filter(
        (value): value is ThreatCategory =>
          typeof value === "string" &&
          [
            "ransomware",
            "data_breach",
            "vulnerability_patch",
            "nation_state",
            "phishing",
          ].includes(value),
      )
    : [];
  return { keywords, selectedCategories };
}

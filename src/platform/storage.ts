import { DEFAULT_PREFERENCES, type UserPreferences } from "../core/types";
import { normalizePreferences } from "../core/filters";

export const PREFERENCES_STORAGE_KEY = "cyberdailyfeed.preferences.v1";

export function loadPreferences(): UserPreferences {
  try {
    const raw = window.localStorage.getItem(PREFERENCES_STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_PREFERENCES, keywords: [], selectedCategories: [] };
    }
    return normalizePreferences(JSON.parse(raw));
  } catch {
    return { ...DEFAULT_PREFERENCES, keywords: [], selectedCategories: [] };
  }
}

export function savePreferences(preferences: UserPreferences): void {
  window.localStorage.setItem(
    PREFERENCES_STORAGE_KEY,
    JSON.stringify(normalizePreferences(preferences)),
  );
}

export function clearPreferences(): void {
  window.localStorage.removeItem(PREFERENCES_STORAGE_KEY);
}

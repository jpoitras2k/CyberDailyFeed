export const THREAT_CATEGORIES = [
  "ransomware",
  "data_breach",
  "vulnerability_patch",
  "nation_state",
  "phishing",
] as const;

export type ThreatCategory = (typeof THREAT_CATEGORIES)[number];

export interface RssSource {
  id: string;
  name: string;
  /** Official publisher RSS (or listing) endpoint. Used on native / CLI. */
  officialUrl: string;
  /**
   * Optional HTML listing used only when the RSS endpoint is blocked
   * (CISA CDN has been observed returning 403 to some clients).
   */
  htmlFallbackUrl?: string;
  /** Vite-dev proxy path so the browser preview can ingest despite CORS. */
  devProxyPath: string;
  htmlFallbackDevProxyPath?: string;
  homepage: string;
  licensingNote: string;
}

export interface Headline {
  id: string;
  title: string;
  sourceId: string;
  sourceName: string;
  url: string;
  publishedAt: string;
  categories: ThreatCategory[];
}

export interface UserPreferences {
  keywords: string[];
  /** Empty means "all categories". */
  selectedCategories: ThreatCategory[];
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  keywords: [],
  selectedCategories: [],
};

export interface IngestError {
  sourceId: string;
  sourceName: string;
  message: string;
}

export interface SourceIngestResult {
  sourceId: string;
  sourceName: string;
  fetched: number;
  fresh: Headline[];
  stale: number;
  droppedUndated: number;
  error?: string;
}

export interface FeedSnapshot {
  generatedAt: string;
  headlines: Headline[];
  sources: SourceIngestResult[];
  errors: IngestError[];
}

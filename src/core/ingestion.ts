import { parseCisaListingHtml } from "./cisaHtml";
import { filterFreshHeadlines } from "./freshness";
import { mergeHeadlines, sortByNewest } from "./filters";
import { headlineHasBody, parseRssFeed } from "./rss";
import { RSS_SOURCES } from "./sources";
import type {
  FeedSnapshot,
  Headline,
  IngestError,
  RssSource,
  SourceIngestResult,
} from "./types";

export interface FeedFetcher {
  (url: string): Promise<string>;
}

export interface IngestOptions {
  now?: Date;
  useDevProxy?: boolean;
}

const DEFAULT_USER_AGENT =
  "CyberDailyFeed/0.1 (headline aggregator; +https://github.com/jpoitras2k/CyberDailyFeed)";

export async function defaultFetcher(url: string): Promise<string> {
  const headers: Record<string, string> = {
    Accept:
      "application/rss+xml, application/atom+xml, application/xml, text/xml, text/html;q=0.8",
  };
  if (typeof window === "undefined") {
    headers["User-Agent"] = DEFAULT_USER_AGENT;
  }
  const response = await fetch(url, {
    cache: "no-store",
    headers,
  });
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${url}`);
  }
  const body = await response.text();
  if (!body.trim()) {
    throw new Error(`Empty response fetching ${url}`);
  }
  return body;
}

export function looksLikeFeedXml(payload: string): boolean {
  return /<(rss|feed|rdf:RDF)\b/i.test(payload);
}

export async function ingestAllSources(
  fetcher?: FeedFetcher,
  options: IngestOptions = {},
): Promise<FeedSnapshot> {
  const load = fetcher ?? defaultFetcher;
  const now = options.now ?? new Date();
  const results = await Promise.all(
    RSS_SOURCES.map((source) => ingestSource(source, load, now, options.useDevProxy === true)),
  );

  const errors: IngestError[] = results
    .filter((result) => result.error)
    .map((result) => ({
      sourceId: result.sourceId,
      sourceName: result.sourceName,
      message: result.error ?? "unknown error",
    }));

  const merged = sortByNewest(mergeHeadlines(results.map((result) => result.fresh)));

  return {
    generatedAt: now.toISOString(),
    headlines: merged,
    sources: results,
    errors,
  };
}

/** If a refresh comes back empty because fetches failed, keep the last good list. */
export function retainHeadlinesIfRefreshMissed(
  previous: FeedSnapshot | null,
  next: FeedSnapshot,
): FeedSnapshot {
  if (next.headlines.length > 0 || !previous || previous.headlines.length === 0) {
    return next;
  }
  const missedEverySource = next.sources.every(
    (source) => source.fetched === 0 || Boolean(source.error),
  );
  if (!missedEverySource) {
    return next;
  }
  return {
    ...next,
    headlines: previous.headlines,
    sources: next.sources.map((source) => {
      const prior = previous.sources.find((item) => item.sourceId === source.sourceId);
      if (!prior || source.fresh.length > 0) {
        return source;
      }
      return {
        ...prior,
        error: source.error ?? prior.error,
      };
    }),
  };
}

export async function ingestSource(
  source: RssSource,
  fetcher: FeedFetcher,
  now: Date,
  useDevProxy: boolean,
): Promise<SourceIngestResult> {
  const rssUrl = useDevProxy ? source.devProxyPath : source.officialUrl;
  let headlines: Headline[] = [];
  let error: string | undefined;

  try {
    const xml = await fetcher(rssUrl);
    if (!looksLikeFeedXml(xml)) {
      throw new Error("Response was not an RSS/Atom feed");
    }
    headlines = parseRssFeed(xml, source);
    if (headlines.some(headlineHasBody)) {
      throw new Error("Parser leaked article body fields");
    }
  } catch (rssError) {
    error = rssError instanceof Error ? rssError.message : String(rssError);
    const fallbackUrl = useDevProxy
      ? source.htmlFallbackDevProxyPath
      : source.htmlFallbackUrl;
    if (fallbackUrl) {
      try {
        const html = await fetcher(fallbackUrl);
        headlines = parseCisaListingHtml(html, source);
        error = undefined;
      } catch (htmlError) {
        const htmlMessage =
          htmlError instanceof Error ? htmlError.message : String(htmlError);
        error = `RSS failed (${error}); listing fallback failed (${htmlMessage})`;
      }
    }
  }

  const { fresh, stale, undated } = filterFreshHeadlines(headlines, now);
  return {
    sourceId: source.id,
    sourceName: source.name,
    fetched: headlines.length,
    fresh,
    stale,
    droppedUndated: undated,
    error,
  };
}

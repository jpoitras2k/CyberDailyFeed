import { classifyHeadline, decodeEntities, stripTags } from "./classify";
import { parseTimestamp } from "./freshness";
import { canonicalizeUrl, headlineId } from "./rss";
import type { Headline, RssSource } from "./types";

/**
 * Headline-only parser for CISA's public advisories listing.
 * Used when the official RSS XML is blocked by CDN bot protection.
 */
export function parseCisaListingHtml(html: string, source: RssSource): Headline[] {
  const headlines: Headline[] = [];
  const seen = new Set<string>();

  for (const block of splitBlocks(html)) {
    const href = firstHref(block);
    const title = firstLinkText(block);
    const datetime = firstDatetime(block);
    push({ datetime, href, title });
  }

  function push(candidate: { datetime: string; href: string; title: string }): void {
    const title = candidate.title.replace(/\s+/g, " ").trim();
    if (!title || title.length < 8) {
      return;
    }
    if (/skip to|menu|share|advisory definitions/i.test(title)) {
      return;
    }
    const url = absoluteCisaUrl(candidate.href);
    if (!url || !/cisa\.gov\/news-events\//.test(url)) {
      return;
    }
    if (seen.has(url)) {
      return;
    }
    seen.add(url);
    const published = parseTimestamp(candidate.datetime);
    headlines.push({
      id: headlineId(source.id, url),
      title,
      sourceId: source.id,
      sourceName: source.name,
      url,
      publishedAt: published ? published.toISOString() : "",
      categories: classifyHeadline(title),
    });
  }

  return headlines;
}

function splitBlocks(html: string): string[] {
  const articles = [...html.matchAll(/<article\b[\s\S]*?<\/article>/gi)].map(
    (match) => match[0] ?? "",
  );
  if (articles.length > 0) {
    return articles;
  }
  const teasers = [
    ...html.matchAll(/<div[^>]*class="[^"]*c-teaser[^"]*"[\s\S]*?<\/div>/gi),
  ].map((match) => match[0] ?? "");
  return teasers.length > 0 ? teasers : [html];
}

function firstHref(block: string): string {
  const match = block.match(/<a[^>]*href="([^"]+)"[^>]*>/i);
  return match?.[1] ?? "";
}

function firstLinkText(block: string): string {
  const match = block.match(/<a[^>]*href="[^"]+"[^>]*>([\s\S]*?)<\/a>/i);
  return stripTags(decodeEntities(match?.[1] ?? ""));
}

function firstDatetime(block: string): string {
  const datetime = block.match(/<time[^>]*datetime="([^"]+)"/i);
  if (datetime?.[1]) {
    return datetime[1];
  }
  const timeText = block.match(/<time[^>]*>([\s\S]*?)<\/time>/i);
  return stripTags(timeText?.[1] ?? "");
}

function absoluteCisaUrl(href: string): string {
  const trimmed = href.trim();
  if (!trimmed || trimmed.startsWith("#") || trimmed.startsWith("mailto:")) {
    return "";
  }
  try {
    const url = trimmed.startsWith("http")
      ? new URL(trimmed)
      : new URL(trimmed, "https://www.cisa.gov");
    if (!url.hostname.endsWith("cisa.gov")) {
      return "";
    }
    return canonicalizeUrl(url.toString());
  } catch {
    return "";
  }
}

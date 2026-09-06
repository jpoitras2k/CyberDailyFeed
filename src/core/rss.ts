import { XMLParser } from "fast-xml-parser";
import { classifyHeadline, decodeEntities, stripTags } from "./classify";
import { parseTimestamp } from "./freshness";
import type { Headline, RssSource } from "./types";

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "@_",
  trimValues: true,
  cdataPropName: "__cdata",
});

interface ParsedRssItem {
  title: string;
  url: string;
  publishedAt: string | null;
}

/**
 * Parse RSS 2.0 or Atom into headline records.
 * Full-text fields (description, content:encoded) are ignored and never stored.
 */
export function parseRssFeed(xml: string, source: RssSource): Headline[] {
  const doc = parser.parse(xml) as Record<string, unknown>;
  const items = collectItems(doc);
  const headlines: Headline[] = [];

  for (const item of items) {
    const title = cleanTitle(readText(item, ["title"]));
    const url = readLink(item);
    if (!title || !url) {
      continue;
    }
    const publishedRaw =
      readText(item, ["pubDate", "published", "updated", "dc:date", "isoDate"]) ||
      null;
    const published = parseTimestamp(publishedRaw ?? undefined);
    headlines.push({
      id: headlineId(source.id, url),
      title,
      sourceId: source.id,
      sourceName: source.name,
      url: canonicalizeUrl(url),
      publishedAt: published ? published.toISOString() : "",
      categories: classifyHeadline(title),
    });
  }

  return dedupeByUrl(headlines);
}

export function parseRssItemsForDebug(xml: string): ParsedRssItem[] {
  const doc = parser.parse(xml) as Record<string, unknown>;
  return collectItems(doc).map((item) => ({
    title: cleanTitle(readText(item, ["title"])),
    url: readLink(item),
    publishedAt:
      readText(item, ["pubDate", "published", "updated", "dc:date"]) || null,
  }));
}

function collectItems(doc: Record<string, unknown>): Record<string, unknown>[] {
  const rss = asRecord(doc.rss);
  const channel = rss ? asRecord(rss.channel) : undefined;
  if (channel?.item) {
    return asArray(channel.item);
  }

  const feed = asRecord(doc.feed);
  if (feed?.entry) {
    return asArray(feed.entry);
  }

  // Some feeds nest rss -> channel at the root after parser quirks
  if (doc.item) {
    return asArray(doc.item);
  }
  return [];
}

function asRecord(value: unknown): Record<string, unknown> | undefined {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return undefined;
}

function asArray(value: unknown): Record<string, unknown>[] {
  if (Array.isArray(value)) {
    return value.filter(
      (entry): entry is Record<string, unknown> =>
        typeof entry === "object" && entry !== null,
    );
  }
  const record = asRecord(value);
  return record ? [record] : [];
}

function readText(item: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = item[key];
    const text = scalarText(value);
    if (text) {
      return text;
    }
  }
  return "";
}

function scalarText(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (typeof value === "number") {
    return String(value);
  }
  const record = asRecord(value);
  if (!record) {
    return "";
  }
  if (typeof record["#text"] === "string") {
    return record["#text"];
  }
  if (typeof record.__cdata === "string") {
    return record.__cdata;
  }
  return "";
}

function readLink(item: Record<string, unknown>): string {
  const direct = scalarText(item.link);
  if (direct.startsWith("http")) {
    return direct;
  }

  const link = item.link;
  if (Array.isArray(link)) {
    for (const entry of link) {
      const href = linkHref(entry);
      if (href) {
        return href;
      }
    }
  } else {
    const href = linkHref(link);
    if (href) {
      return href;
    }
  }

  const guid = scalarText(item.guid);
  if (guid.startsWith("http")) {
    return guid;
  }

  const id = scalarText(item.id);
  if (id.startsWith("http")) {
    return id;
  }

  return "";
}

function linkHref(value: unknown): string {
  const record = asRecord(value);
  if (!record) {
    return typeof value === "string" && value.startsWith("http") ? value : "";
  }
  const href = record["@_href"] ?? record["@_url"];
  if (typeof href === "string" && href.startsWith("http")) {
    return href;
  }
  const text = scalarText(record);
  return text.startsWith("http") ? text : "";
}

function cleanTitle(raw: string): string {
  return decodeEntities(stripTags(raw)).replace(/\s+/g, " ").trim();
}

export function canonicalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.hash = "";
    return parsed.toString();
  } catch {
    return url.trim();
  }
}

export function headlineId(sourceId: string, url: string): string {
  return `${sourceId}:${canonicalizeUrl(url)}`;
}

function dedupeByUrl(headlines: Headline[]): Headline[] {
  const seen = new Set<string>();
  const unique: Headline[] = [];
  for (const headline of headlines) {
    if (seen.has(headline.url)) {
      continue;
    }
    seen.add(headline.url);
    unique.push(headline);
  }
  return unique;
}

/** Guardrail: parsed objects must not carry article body fields. */
export function headlineHasBody(headline: Headline): boolean {
  const record = headline as unknown as Record<string, unknown>;
  return (
    "description" in record ||
    "content" in record ||
    "body" in record ||
    "contentEncoded" in record
  );
}

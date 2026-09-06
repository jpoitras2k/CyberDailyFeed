import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { parseCisaListingHtml } from "../src/core/cisaHtml";
import { ingestAllSources, retainHeadlinesIfRefreshMissed } from "../src/core/ingestion";
import { RSS_SOURCES } from "../src/core/sources";
import { normalizePreferences } from "../src/core/filters";

const fixtures = dirname(fileURLToPath(import.meta.url));
const now = new Date("2026-09-06T16:00:00.000Z");

describe("CISA listing fallback", () => {
  it("extracts headline, source, link, and timestamp from the public listing", () => {
    const html = readFileSync(join(fixtures, "fixtures/cisa.listing.html"), "utf8");
    const source = RSS_SOURCES.find((item) => item.id === "cisa")!;
    const headlines = parseCisaListingHtml(html, source);
    expect(headlines.length).toBeGreaterThanOrEqual(2);
    expect(headlines[0]?.sourceName).toBe("CISA Cybersecurity Advisories");
    expect(headlines[0]?.url).toMatch(/^https:\/\/www\.cisa\.gov\/news-events\//);
    expect(headlines[0]?.title).toMatch(/Known Exploited Vulnerability/i);
    expect(headlines.every((item) => !("description" in item))).toBe(true);
  });
});

describe("ingest pipeline", () => {
  it("applies the 24h filter after parse and ignores RSS failures per-source", async () => {
    const rss = readFileSync(join(fixtures, "fixtures/sample.rss.xml"), "utf8");
    const atom = readFileSync(join(fixtures, "fixtures/sample.atom.xml"), "utf8");
    const html = readFileSync(join(fixtures, "fixtures/cisa.listing.html"), "utf8");

    const snapshot = await ingestAllSources(
      async (url) => {
        if (url.includes("cisa") && url.includes("html")) {
          return html;
        }
        if (url.includes("cisa")) {
          throw new Error("HTTP 403 fetching CISA RSS");
        }
        if (url.includes("atom") || url.includes("the-hacker-news")) {
          return atom;
        }
        return rss;
      },
      { now },
    );

    expect(snapshot.headlines.every((item) => Date.parse(item.publishedAt) > 0)).toBe(
      true,
    );
    expect(
      snapshot.headlines.every(
        (item) => now.getTime() - Date.parse(item.publishedAt) <= 24 * 60 * 60 * 1000,
      ),
    ).toBe(true);
    expect(snapshot.headlines.some((item) => item.url.includes("old-story"))).toBe(
      false,
    );
    expect(JSON.stringify(snapshot.headlines)).not.toMatch(/FULL ARTICLE TEXT/i);
    // Ingest returns the full fresh set; tag/keyword filters are a view concern.
    expect(snapshot.headlines.length).toBeGreaterThan(1);
  });
});

describe("on-device preferences", () => {
  it("normalizes unknown payload shapes without throwing", () => {
    expect(normalizePreferences(null)).toEqual({
      keywords: [],
      selectedCategories: [],
    });
    expect(
      normalizePreferences({
        keywords: [" Cisco ", "", 1, "lockbit"],
        selectedCategories: ["phishing", "not-a-tag", "ransomware"],
      }),
    ).toEqual({
      keywords: ["Cisco", "lockbit"],
      selectedCategories: ["phishing", "ransomware"],
    });
  });
});

describe("refresh miss handling", () => {
  it("keeps the previous headlines when every source comes back empty", () => {
    const previous = {
      generatedAt: "2026-09-06T16:00:00.000Z",
      headlines: [
        {
          id: "thn:https://example.test/a",
          title: "Existing headline",
          sourceId: "the-hacker-news",
          sourceName: "The Hacker News",
          url: "https://example.test/a",
          publishedAt: "2026-09-06T15:00:00.000Z",
          categories: [],
        },
      ],
      sources: [
        {
          sourceId: "the-hacker-news",
          sourceName: "The Hacker News",
          fetched: 4,
          fresh: [],
          stale: 0,
          droppedUndated: 0,
        },
      ],
      errors: [],
    };
    previous.sources[0]!.fresh = previous.headlines;

    const next = {
      generatedAt: "2026-09-06T16:01:00.000Z",
      headlines: [],
      sources: [
        {
          sourceId: "the-hacker-news",
          sourceName: "The Hacker News",
          fetched: 0,
          fresh: [],
          stale: 0,
          droppedUndated: 0,
          error: "Empty response fetching /proxy/rss/the-hacker-news",
        },
      ],
      errors: [
        {
          sourceId: "the-hacker-news",
          sourceName: "The Hacker News",
          message: "Empty response fetching /proxy/rss/the-hacker-news",
        },
      ],
    };

    const kept = retainHeadlinesIfRefreshMissed(previous, next);
    expect(kept.headlines).toHaveLength(1);
    expect(kept.headlines[0]?.title).toBe("Existing headline");
  });

  it("does not keep stale-empty results that are a real 24h miss", () => {
    const previous = {
      generatedAt: "2026-09-06T16:00:00.000Z",
      headlines: [
        {
          id: "thn:https://example.test/a",
          title: "Existing headline",
          sourceId: "the-hacker-news",
          sourceName: "The Hacker News",
          url: "https://example.test/a",
          publishedAt: "2026-09-06T15:00:00.000Z",
          categories: [],
        },
      ],
      sources: [],
      errors: [],
    };
    const next = {
      generatedAt: "2026-09-07T16:00:00.000Z",
      headlines: [],
      sources: [
        {
          sourceId: "the-hacker-news",
          sourceName: "The Hacker News",
          fetched: 50,
          fresh: [],
          stale: 50,
          droppedUndated: 0,
        },
      ],
      errors: [],
    };
    expect(retainHeadlinesIfRefreshMissed(previous, next).headlines).toEqual([]);
  });
});

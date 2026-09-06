import { describe, expect, it } from "vitest";
import {
  FRESHNESS_WINDOW_MS,
  filterFreshHeadlines,
  isFresh,
  parseTimestamp,
} from "../src/core/freshness";
import { applyUserFilters } from "../src/core/filters";
import type { Headline } from "../src/core/types";

const now = new Date("2026-09-06T16:00:00.000Z");

function headline(overrides: Partial<Headline>): Headline {
  return {
    id: overrides.id ?? "id",
    title: overrides.title ?? "Example",
    sourceId: overrides.sourceId ?? "thn",
    sourceName: overrides.sourceName ?? "The Hacker News",
    url: overrides.url ?? "https://example.test/a",
    publishedAt: overrides.publishedAt ?? now.toISOString(),
    categories: overrides.categories ?? [],
  };
}

describe("24-hour freshness window", () => {
  it("keeps items published exactly at the window boundary", () => {
    const published = new Date(now.getTime() - FRESHNESS_WINDOW_MS);
    expect(isFresh(published, now)).toBe(true);
  });

  it("drops items one second older than 24 hours", () => {
    const published = new Date(now.getTime() - FRESHNESS_WINDOW_MS - 1000);
    expect(isFresh(published, now)).toBe(false);
  });

  it("keeps a 23h 59m item", () => {
    const published = new Date(now.getTime() - FRESHNESS_WINDOW_MS + 60_000);
    expect(isFresh(published, now)).toBe(true);
  });

  it("accepts slightly-future timestamps (clock skew) but not far-future ones", () => {
    expect(isFresh(new Date(now.getTime() + 5 * 60_000), now)).toBe(true);
    expect(isFresh(new Date(now.getTime() + 60 * 60_000), now)).toBe(false);
  });

  it("parses RSS pubDate and ISO-8601 timestamps", () => {
    expect(parseTimestamp("Sun, 06 Sep 2026 15:02:38 +0530")?.toISOString()).toBe(
      "2026-09-06T09:32:38.000Z",
    );
    expect(parseTimestamp("2026-09-06T09:00:00Z")?.toISOString()).toBe(
      "2026-09-06T09:00:00.000Z",
    );
    expect(parseTimestamp("Sep 06, 2026")?.toISOString()).toBe(
      "2026-09-06T00:00:00.000Z",
    );
    expect(parseTimestamp("")).toBeNull();
    expect(parseTimestamp("not a date")).toBeNull();
  });

  it("splits a mixed list into fresh vs stale and drops undated rows", () => {
    const items = [
      headline({
        id: "fresh",
        url: "https://example.test/fresh",
        publishedAt: "2026-09-06T10:00:00.000Z",
      }),
      headline({
        id: "stale",
        url: "https://example.test/stale",
        publishedAt: "2026-09-04T10:00:00.000Z",
      }),
      headline({
        id: "undated",
        url: "https://example.test/undated",
        publishedAt: "",
      }),
    ];
    const result = filterFreshHeadlines(items, now);
    expect(result.fresh.map((item) => item.id)).toEqual(["fresh"]);
    expect(result.stale).toBe(1);
    expect(result.undated).toBe(1);
  });
});

describe("preference filters", () => {
  const pool = [
    headline({
      title: "LockBit ransomware campaign",
      url: "https://example.test/1",
      categories: ["ransomware"],
    }),
    headline({
      title: "Cisco ASA vulnerability patched",
      url: "https://example.test/2",
      categories: ["vulnerability_patch"],
    }),
    headline({
      title: "Phishing kit targets banks",
      url: "https://example.test/3",
      categories: ["phishing"],
    }),
  ];

  it("shows every fresh headline when no category is selected", () => {
    expect(applyUserFilters(pool, { keywords: [], selectedCategories: [] })).toHaveLength(
      3,
    );
  });

  it("filters by selected threat categories", () => {
    const filtered = applyUserFilters(pool, {
      keywords: [],
      selectedCategories: ["ransomware", "phishing"],
    });
    expect(filtered.map((item) => item.url)).toEqual([
      "https://example.test/1",
      "https://example.test/3",
    ]);
  });

  it("filters by on-device keyword interests (case-insensitive)", () => {
    const filtered = applyUserFilters(pool, {
      keywords: ["cisco"],
      selectedCategories: [],
    });
    expect(filtered).toHaveLength(1);
    expect(filtered[0]?.title).toMatch(/Cisco/i);
  });
});

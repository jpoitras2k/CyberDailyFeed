import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { classifyHeadline } from "../src/core/classify";
import { headlineHasBody, parseRssFeed, parseRssItemsForDebug } from "../src/core/rss";
import { RSS_SOURCES } from "../src/core/sources";
import type { RssSource } from "../src/core/types";

const fixtures = dirname(fileURLToPath(import.meta.url));

const fixtureSource: RssSource = {
  id: "fixture",
  name: "Fixture Source",
  officialUrl: "https://example.test/feed",
  devProxyPath: "/proxy/rss/fixture",
  homepage: "https://example.test",
  licensingNote: "test",
};

describe("RSS ingestion", () => {
  it("extracts title, canonical link, and published timestamp only", () => {
    const xml = readFileSync(join(fixtures, "fixtures/sample.rss.xml"), "utf8");
    const headlines = parseRssFeed(xml, fixtureSource);

    expect(headlines.length).toBeGreaterThanOrEqual(5);
    const lockbit = headlines.find((item) => item.url.includes("lockbit-hospital"));
    expect(lockbit?.title).toBe("LockBit ransomware hits hospital network");
    expect(lockbit?.sourceName).toBe("Fixture Source");
    expect(lockbit?.publishedAt).toBe("2026-09-06T12:00:00.000Z");
    expect(lockbit && headlineHasBody(lockbit)).toBe(false);
    expect(lockbit).not.toHaveProperty("description");
    expect(JSON.stringify(lockbit)).not.toMatch(/FULL ARTICLE TEXT/i);
  });

  it("never copies description or content:encoded onto headline records", () => {
    const xml = readFileSync(join(fixtures, "fixtures/sample.rss.xml"), "utf8");
    const headlines = parseRssFeed(xml, RSS_SOURCES[0]!);
    for (const headline of headlines) {
      expect(headlineHasBody(headline)).toBe(false);
      expect(Object.keys(headline).sort()).toEqual(
        [
          "categories",
          "id",
          "publishedAt",
          "sourceId",
          "sourceName",
          "title",
          "url",
        ].sort(),
      );
    }
  });

  it("parses Atom entries including CISA-style published timestamps", () => {
    const xml = readFileSync(join(fixtures, "fixtures/sample.atom.xml"), "utf8");
    const headlines = parseRssFeed(xml, RSS_SOURCES.find((s) => s.id === "cisa")!);
    expect(headlines).toHaveLength(1);
    expect(headlines[0]?.title).toMatch(/Known Exploited Vulnerability/i);
    expect(headlines[0]?.url).toContain("cisa.gov");
    expect(headlines[0]?.publishedAt).toBe("2026-09-06T09:00:00.000Z");
    expect(headlines[0]?.categories).toContain("vulnerability_patch");
  });

  it("falls back to guid when item has no <link>", () => {
    const xml = readFileSync(join(fixtures, "fixtures/sample.rss.xml"), "utf8");
    const items = parseRssItemsForDebug(xml);
    const roundup = items.find((item) => item.title.includes("roundup"));
    expect(roundup?.url).toBe("https://example.test/roundup");
  });

  it("decodes HTML entities in titles", () => {
    const xml = `<?xml version="1.0"?><rss version="2.0"><channel>
      <item>
        <title>Two Alleged &#8216;TeamPCP&#8217; Hackers Arrested</title>
        <link>https://krebsonsecurity.com/teampcp</link>
        <pubDate>Sun, 06 Sep 2026 12:00:00 +0000</pubDate>
      </item>
    </channel></rss>`;
    const headlines = parseRssFeed(xml, RSS_SOURCES.find((s) => s.id === "krebs")!);
    expect(headlines[0]?.title).toBe("Two Alleged ‘TeamPCP’ Hackers Arrested");
  });
});

describe("threat-category tagging", () => {
  it("tags ransomware, vulnerability, breach, nation-state, and phishing", () => {
    expect(classifyHeadline("LockBit ransomware hits hospital network")).toEqual([
      "ransomware",
    ]);
    expect(classifyHeadline("Unpatched Magento zero-day exploited")).toContain(
      "vulnerability_patch",
    );
    expect(classifyHeadline("IDScan sued over alleged data breach")).toContain(
      "data_breach",
    );
    expect(classifyHeadline("APT29 nation-state actors target diplomats")).toContain(
      "nation_state",
    );
    expect(classifyHeadline("Attackers conceal phishing lures")).toEqual(["phishing"]);
  });

  it("allows multiple tags on one headline", () => {
    const tags = classifyHeadline(
      "APT29 nation-state actors phish diplomats with spoofed login portal",
    );
    expect(tags).toEqual(expect.arrayContaining(["nation_state", "phishing"]));
  });

  it("does not tag unrelated roundups", () => {
    expect(classifyHeadline("Weekly security roundup")).toEqual([]);
  });
});

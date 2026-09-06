import type { RssSource } from "./types";

/**
 * Official published endpoints. Headlines + source + original URL only —
 * never persist or render full article text (Krebs ToS; standard RSS practice).
 */
export const RSS_SOURCES: readonly RssSource[] = [
  {
    id: "dark-reading",
    name: "Dark Reading",
    officialUrl: "https://www.darkreading.com/rss.xml",
    devProxyPath: "/proxy/rss/dark-reading",
    homepage: "https://www.darkreading.com",
    licensingNote:
      "Official RSS feed intended for reader use. Headline plus link only.",
  },
  {
    id: "the-hacker-news",
    name: "The Hacker News",
    officialUrl: "https://feeds.feedburner.com/TheHackersNews",
    devProxyPath: "/proxy/rss/the-hacker-news",
    homepage: "https://thehackernews.com",
    licensingNote:
      "Standard DMCA takedown policy; headline plus link is standard RSS practice.",
  },
  {
    id: "bleeping-computer",
    name: "Bleeping Computer",
    officialUrl: "https://www.bleepingcomputer.com/feed/",
    devProxyPath: "/proxy/rss/bleeping-computer",
    homepage: "https://www.bleepingcomputer.com",
    licensingNote:
      "Official RSS feed intended for reader use. Headline plus link only.",
  },
  {
    id: "krebs",
    name: "Krebs on Security",
    officialUrl: "https://krebsonsecurity.com/feed/",
    devProxyPath: "/proxy/rss/krebs",
    homepage: "https://krebsonsecurity.com",
    licensingNote:
      "Prohibits full-text republishing even with attribution. Headline plus link only.",
  },
  {
    id: "cisa",
    name: "CISA Cybersecurity Advisories",
    officialUrl: "https://www.cisa.gov/cybersecurity-advisories/all.xml",
    htmlFallbackUrl: "https://www.cisa.gov/news-events/cybersecurity-advisories",
    devProxyPath: "/proxy/rss/cisa",
    htmlFallbackDevProxyPath: "/proxy/html/cisa",
    homepage: "https://www.cisa.gov/news-events/cybersecurity-advisories",
    licensingNote: "U.S. government work; public domain. Headline plus link only.",
  },
] as const;

export function sourceById(id: string): RssSource | undefined {
  return RSS_SOURCES.find((source) => source.id === id);
}

import type { ThreatCategory } from "./types";
import { THREAT_CATEGORIES } from "./types";

interface CategoryRule {
  category: ThreatCategory;
  patterns: RegExp[];
}

const RULES: CategoryRule[] = [
  {
    category: "ransomware",
    patterns: [
      /\bransomware\b/i,
      /\bransom(?!ware)\b/i,
      /\blockbit\b/i,
      /\bblackcat\b/i,
      /\balphv\b/i,
      /\bclop\b/i,
      /\bakira\b/i,
      /\bransomhub\b/i,
      /\bplay\s+ransomware\b/i,
      /\bencrypt(?:ed|ion)\s+(?:files|estate|servers)\b/i,
      /\bdouble\s+extortion\b/i,
    ],
  },
  {
    category: "data_breach",
    patterns: [
      /\bbreach(?:ed|es)?\b/i,
      /\bdata\s+leak/i,
      /\bleaked\s+(?:data|database|records|credentials)\b/i,
      /\bexposed\s+(?:records|database|credentials|data)\b/i,
      /\bstolen\s+(?:data|records|credentials)\b/i,
      /\binfostealer\b/i,
      /\bcredential(?:s)?\s+dump/i,
      /\bmillion\s+(?:plus\s+)?(?:driver|customer|patient|user)/i,
    ],
  },
  {
    category: "vulnerability_patch",
    patterns: [
      /\bcve-\d{4}-\d+\b/i,
      /\bvulnerabilit(?:y|ies)\b/i,
      /\bzero[- ]day\b/i,
      /\b0[- ]day\b/i,
      /\bunpatched\b/i,
      /\bsecurity\s+patch(?:es)?\b/i,
      /\bpatch(?:es|ed|ing)?\b/i,
      /\bremote\s+code\s+execution\b/i,
      /\brce\b/i,
      /\bknown\s+exploited\s+vulnerabilit/i,
      /\bexploit(?:ed|ing|s)?\b/i,
    ],
  },
  {
    category: "nation_state",
    patterns: [
      /\bnation[- ]state\b/i,
      /\bstate[- ]sponsored\b/i,
      /\bapt[\s-]?\d{1,2}\b/i,
      /\bapt\b/i,
      /\blazarus\b/i,
      /\bvolt\s+typhoon\b/i,
      /\bsandworm\b/i,
      /\bcozy\s+bear\b/i,
      /\bfancy\s+bear\b/i,
      /\biranian[- ]affiliated\b/i,
      /\bnorth\s+korea(?:n)?\b/i,
      /\bprc[- ]affiliated\b/i,
      /\brussian\s+intelligence\b/i,
    ],
  },
  {
    category: "phishing",
    patterns: [
      /\bphish(?:ing|es|ed)?\b/i,
      /\bspear[- ]phish/i,
      /\bsmish(?:ing)?\b/i,
      /\bbusiness\s+email\s+compromise\b/i,
      /\bbec\b/i,
      /\bcredential\s+harvest/i,
      /\bspoof(?:ed|ing)\s+(?:login|email|site|page)/i,
      /\bclickfix\b/i,
    ],
  },
];

/** Classify from headline text only. Description is never required. */
export function classifyHeadline(title: string): ThreatCategory[] {
  const haystack = decodeEntities(stripTags(title));
  const matched: ThreatCategory[] = [];
  for (const rule of RULES) {
    if (rule.patterns.some((pattern) => pattern.test(haystack))) {
      matched.push(rule.category);
    }
  }
  return matched;
}

export function isThreatCategory(value: string): value is ThreatCategory {
  return (THREAT_CATEGORIES as readonly string[]).includes(value);
}

export function stripTags(value: string): string {
  return value.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function decodeEntities(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n: string) =>
      String.fromCodePoint(parseInt(n, 16)),
    );
}

export const CATEGORY_LABELS: Record<ThreatCategory, string> = {
  ransomware: "Ransomware",
  data_breach: "Data breach",
  vulnerability_patch: "Vulnerability / patch",
  nation_state: "Nation-state",
  phishing: "Phishing",
};

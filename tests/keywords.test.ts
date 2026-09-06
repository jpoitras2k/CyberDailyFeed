import { describe, expect, it } from "vitest";
import {
  mergeKeywords,
  parseKeywordsFromDraft,
  removeKeyword,
} from "../src/core/filters";

describe("keyword draft parsing", () => {
  it("keeps commas until parse time so cisco, lockbit stays two terms", () => {
    expect(parseKeywordsFromDraft("cisco, lockbit")).toEqual(["cisco", "lockbit"]);
    expect(parseKeywordsFromDraft("cisco,")).toEqual(["cisco"]);
    expect(parseKeywordsFromDraft("  magento ,  ")).toEqual(["magento"]);
  });
});

describe("save and remove keywords", () => {
  it("saves new terms without duplicating case-insensitive matches", () => {
    expect(mergeKeywords(["cisco"], "Cisco, lockbit")).toEqual(["cisco", "lockbit"]);
    expect(mergeKeywords([], "  magento , lockbit ")).toEqual(["magento", "lockbit"]);
  });

  it("removes one saved keyword or clears the list", () => {
    expect(removeKeyword(["cisco", "lockbit"], "CISCO")).toEqual(["lockbit"]);
    expect(removeKeyword(["lockbit"], "lockbit")).toEqual([]);
  });
});

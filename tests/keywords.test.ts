import { describe, expect, it } from "vitest";
import { parseKeywordsFromDraft } from "../src/core/filters";

describe("keyword draft parsing", () => {
  it("keeps commas until parse time so cisco, lockbit stays two terms", () => {
    expect(parseKeywordsFromDraft("cisco, lockbit")).toEqual(["cisco", "lockbit"]);
    expect(parseKeywordsFromDraft("cisco,")).toEqual(["cisco"]);
    expect(parseKeywordsFromDraft("  magento ,  ")).toEqual(["magento"]);
  });
});

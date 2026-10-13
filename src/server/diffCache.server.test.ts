import { describe, it, expect, beforeEach } from "vitest";
import {
  computeDiffCacheKey,
  getCachedDiffFindings,
  setCachedDiffFindings,
  getDiffCacheStats,
  clearDiffCache,
  type CachedFinding,
} from "./diffCache.server";

describe("Diff & AI Review Caching", () => {
  beforeEach(() => {
    clearDiffCache();
  });

  it("produces deterministic SHA-256 keys for file patches", () => {
    const key1 = computeDiffCacheKey("src/index.js", "@@ -1,2 +1,2 @@ -old +new", "gpt-4o");
    const key2 = computeDiffCacheKey("src/index.js", "@@ -1,2 +1,2 @@ -old +new", "gpt-4o");
    const keyDiff = computeDiffCacheKey("src/index.js", "@@ -1,2 +1,2 @@ -diff +other", "gpt-4o");

    expect(key1).toBe(key2);
    expect(key1).not.toBe(keyDiff);
    expect(key1).toHaveLength(64);
  });

  it("stores and retrieves cached findings with hit tracking", () => {
    const key = computeDiffCacheKey("src/app.ts", "patch-content", "gpt-4o");
    expect(getCachedDiffFindings(key)).toBeNull();

    const mockFindings: CachedFinding[] = [
      {
        title: "Potential Memory Leak",
        severity: "medium",
        category: "performance",
        problem: "Event listener never removed",
      },
    ];

    setCachedDiffFindings(key, mockFindings);

    const retrieved = getCachedDiffFindings(key);
    expect(retrieved).toEqual(mockFindings);

    const stats = getDiffCacheStats();
    expect(stats.hits).toBe(1);
    expect(stats.misses).toBe(1);
    expect(stats.entriesCount).toBe(1);
  });

  it("clears cache and resets stats", () => {
    const key = computeDiffCacheKey("src/app.ts", "patch-content", "gpt-4o");
    setCachedDiffFindings(key, []);
    expect(getDiffCacheStats().entriesCount).toBe(1);

    clearDiffCache();
    expect(getDiffCacheStats().entriesCount).toBe(0);
    expect(getDiffCacheStats().hits).toBe(0);
  });
});

/**
 * Intelligent Diff Caching for AI Code Reviews.
 *
 * Computes a cryptographic hash of (filePath + patchDiff + promptVersion)
 * and caches AI review findings. On multi-commit PRs where only 1 or 2 files
 * changed, unchanged files are served from cache in milliseconds with 0 LLM cost.
 */

import crypto from "crypto";
import { logStructured } from "@/server/logger.server";

export interface CachedFinding {
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  category: string;
  problem: string;
  why_it_matters?: string | null;
  line?: number | null;
  file?: string;
  confidence?: number;
  suggested_fix?: string | null;
  evidence?: string | null;
}

interface CacheEntry {
  findings: CachedFinding[];
  createdAt: number;
  lastAccessedAt: number;
}

const MAX_CACHE_ENTRIES = 1000;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const diffCache = new Map<string, CacheEntry>();

let cacheHits = 0;
let cacheMisses = 0;

/**
 * Computes a deterministic cache key for a given file diff.
 */
export function computeDiffCacheKey(
  filePath: string,
  patch: string,
  modelVersion = "default",
): string {
  const hash = crypto.createHash("sha256");
  hash.update(filePath);
  hash.update("\0");
  hash.update(patch);
  hash.update("\0");
  hash.update(modelVersion);
  return hash.digest("hex");
}

/**
 * Retrieves cached AI review findings for a file diff if available.
 */
export function getCachedDiffFindings(cacheKey: string): CachedFinding[] | null {
  const entry = diffCache.get(cacheKey);
  if (!entry) {
    cacheMisses++;
    return null;
  }

  // Check TTL
  if (Date.now() - entry.createdAt > CACHE_TTL_MS) {
    diffCache.delete(cacheKey);
    cacheMisses++;
    return null;
  }

  entry.lastAccessedAt = Date.now();
  cacheHits++;
  return entry.findings;
}

/**
 * Saves review findings for a file diff into the cache.
 */
export function setCachedDiffFindings(
  cacheKey: string,
  findings: CachedFinding[],
): void {
  // Evict oldest if capacity exceeded
  if (diffCache.size >= MAX_CACHE_ENTRIES) {
    let oldestKey: string | null = null;
    let oldestAccess = Infinity;
    for (const [key, item] of diffCache.entries()) {
      if (item.lastAccessedAt < oldestAccess) {
        oldestAccess = item.lastAccessedAt;
        oldestKey = key;
      }
    }
    if (oldestKey) diffCache.delete(oldestKey);
  }

  diffCache.set(cacheKey, {
    findings,
    createdAt: Date.now(),
    lastAccessedAt: Date.now(),
  });
}

/**
 * Returns cache metrics (hits, misses, ratio, size).
 */
export function getDiffCacheStats() {
  const total = cacheHits + cacheMisses;
  const hitRatio = total > 0 ? Number((cacheHits / total).toFixed(3)) : 0;
  return {
    hits: cacheHits,
    misses: cacheMisses,
    totalRequests: total,
    hitRatio,
    entriesCount: diffCache.size,
  };
}

/**
 * Clears the diff cache (useful for testing or cache resets).
 */
export function clearDiffCache() {
  diffCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
}

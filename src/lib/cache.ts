/**
 * Cache configuration for BioForce Atlas
 * 
 * Uses Next.js built-in `unstable_cache` for server-side caching.
 * All TTLs in seconds. Tags used for targeted invalidation via `revalidateTag()`.
 */

// ── Cache TTLs (seconds) ──────────────────────────────────
export const CACHE_TTL = {
  /** Creatures list — data hiếm khi thay đổi (chỉ khi admin enrichment) */
  CREATURES: 300,        // 5 min
  /** Single creature detail */
  CREATURE_DETAIL: 300,  // 5 min
  /** Battles list — votes thay đổi nhanh hơn */
  BATTLES: 60,           // 1 min
  /** Matchup votes */
  MATCHUP_VOTES: 30,     // 30s
  /** What-if questions & answers — hiếm khi thay đổi */
  WHAT_IFS: 600,         // 10 min
  /** Human splice data — hiếm khi thay đổi */
  HUMAN_SPLICES: 600,    // 10 min
} as const;

// ── Cache Tags ────────────────────────────────────────────
export const CACHE_TAGS = {
  CREATURES: "creatures",
  BATTLES: "battles",
  MATCHUP_VOTES: "matchup-votes",
  WHAT_IFS: "what-ifs",
  HUMAN_SPLICES: "human-splices",
} as const;

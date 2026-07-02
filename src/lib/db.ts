import { supabase } from "./supabase";
import { creatures as staticCreatures, Creature, CreatureStats, Tier } from "@/data/creatures";
import { unstable_cache } from "next/cache";
import { CACHE_TTL, CACHE_TAGS } from "./cache";

export interface DbCreature {
  id: string;
  name: string;
  scientific_name: string;
  class: string;
  order: string;
  family: string;
  real_weight: string;
  size: string;
  characteristics: string;
  habitat: string;
  location: string;
  survival_method: string;
  unique_traits: string;
  short_description: string;
  description: string;
  strengths: string[];
  weaknesses: string[];
  fun_facts: string[];
  sources: { label: string; url: string }[];
  image_color: string;
  enrichment_count?: number;
  diet_type?: "carnivore" | "herbivore" | "omnivore" | "detritivore" | "parasitic";
  diet_items?: string[];
  activity_pattern?: "diurnal" | "nocturnal" | "crepuscular" | "variable";
  lifespan_min?: number;
  lifespan_max?: number;
  lifespan_unit?: "years" | "months" | "days";
  reproduction_type?: "sexual" | "asexual" | "hermaphrodite" | "oviparous" | "viviparous";
  reproduction_notes?: string;
  locomotion?: "swim" | "walk" | "fly" | "crawl" | "burrow" | "hybrid";
  speed_max?: number;
  conservation_status?: "LC" | "NT" | "VU" | "EN" | "CR" | "EX";
  size_min_mm?: number;
  size_max_mm?: number;
  weight_avg_g?: number;
  has_documentary?: boolean;
  grading_count?: number;
  ai_p4p_score?: number;
  ai_tier?: string;
  images?: string[];
  created_at: string;
}

export interface WhatIfQuestion {
  id: string;
  creature_id: string;
  title: string;
  slug: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface WhatIfAnswer {
  id: string;
  question_id: string;
  title: string;
  slug: string;
  perspective_type: "classic_scaling" | "biological_reality" | "evolutionary_mutation" | "custom";
  summary: string | null;
  content: string;
  formulas_and_data: {
    scaling_factor?: number;
    mass_g_original?: number;
    mass_kg_scaled?: number;
    striking_force_n_original?: number;
    striking_force_n_scaled?: number;
    formulas?: Array<{
      name: string;
      equation: string;
      result: string;
    }>;
    [key: string]: any;
  };
  p4p_score_scaled: number;
  tier_scaled: "S" | "A" | "B" | "C" | "D";
  sources: Array<{ label: string; url: string }>;
  created_at: string;
  updated_at: string;
}

export interface HumanSplice {
  id: string;
  creature_id: string;
  title: string;
  trait_name: string;
  slug: string;
  spliced_stats: {
    strength: number;
    durability: number;
    speed: number;
    weaponry: number;
    special: number;
    lethality: number;
  };
  formulas_and_data: {
    human_mass_kg?: number;
    grafted_weight_g?: number;
    punch_velocity_ms?: number;
    impact_force_n?: number;
    formulas?: Array<{
      name: string;
      equation: string;
      result: string;
    }>;
    [key: string]: any;
  };
  summary: string | null;
  sci_fi_hype: string;
  scientific_reality: string;
  created_at: string;
  updated_at: string;
}



// ── Internal: raw Supabase fetch (uncached) ──────────────
async function _fetchCreatures(): Promise<Creature[]> {
  try {
    console.log("⚡ [Server] Calling Supabase API to fetch creatures...");
    // 1. Fetch creatures
    const { data: dbCreatures, error: cErr } = await supabase
      .from("creatures")
      .select("*");

    if (cErr || !dbCreatures || dbCreatures.length === 0) {
      console.warn("Using static fallback for creatures list:", cErr?.message || "No data");
      return staticCreatures;
    }

    // 2. Fetch votes to calculate average stats
    const { data: dbVotes, error: vErr } = await supabase
      .from("votes")
      .select("*");

    const votesMap: Record<string, any[]> = {};
    if (dbVotes) {
      dbVotes.forEach((v) => {
        if (!votesMap[v.creature_id]) {
          votesMap[v.creature_id] = [];
        }
        votesMap[v.creature_id].push(v);
      });
    }

    return dbCreatures.map((dbc: DbCreature) => mapDbCreatureToCreature(dbc, votesMap[dbc.id] || []));
  } catch (err) {
    console.error("Error fetching database creatures, falling back to static:", err);
    return staticCreatures;
  }
}

// ── Helper: map DB row → Creature type ───────────────────
function mapDbCreatureToCreature(dbc: DbCreature, votes: any[]): Creature {
  const staticFall = staticCreatures.find((c) => c.id === dbc.id);
  const defaultStats = staticFall?.stats || {
    strength: 50, durability: 50, speed: 50, weaponry: 50, special: 50, lethality: 50
  };

  const stats: CreatureStats = {
    strength: votes.length > 0 ? Math.round(votes.reduce((acc, curr) => acc + curr.strength, 0) / votes.length) : defaultStats.strength,
    durability: votes.length > 0 ? Math.round(votes.reduce((acc, curr) => acc + curr.durability, 0) / votes.length) : defaultStats.durability,
    speed: votes.length > 0 ? Math.round(votes.reduce((acc, curr) => acc + curr.speed, 0) / votes.length) : defaultStats.speed,
    weaponry: votes.length > 0 ? Math.round(votes.reduce((acc, curr) => acc + curr.weaponry, 0) / votes.length) : defaultStats.weaponry,
    special: votes.length > 0 ? Math.round(votes.reduce((acc, curr) => acc + curr.special, 0) / votes.length) : defaultStats.special,
    lethality: votes.length > 0 ? Math.round(votes.reduce((acc, curr) => acc + curr.lethality, 0) / votes.length) : defaultStats.lethality,
  };

  const communityP4pScore = Math.round(
    (stats.strength + stats.durability + stats.speed + stats.weaponry + stats.special + stats.lethality) / 6
  );

  let communityTier: Tier = "C";
  if (communityP4pScore >= 90) communityTier = "S";
  else if (communityP4pScore >= 80) communityTier = "A";
  else if (communityP4pScore >= 70) communityTier = "B";
  else if (communityP4pScore >= 50) communityTier = "C";
  else communityTier = "D";

  const p4pScore = dbc.ai_p4p_score !== undefined && dbc.ai_p4p_score !== null ? dbc.ai_p4p_score : 50;
  const tier = (dbc.ai_tier || "C") as Tier;

  return {
    id: dbc.id,
    name: dbc.name,
    scientificName: dbc.scientific_name,
    taxonomy: {
      class: dbc.class,
      order: dbc.order,
      family: dbc.family,
    },
    realWeight: dbc.real_weight,
    size: dbc.size,
    characteristics: dbc.characteristics || "",
    habitat: dbc.habitat,
    location: dbc.location || "",
    survival_method: dbc.survival_method || "",
    unique_traits: dbc.unique_traits || "",
    shortDescription: dbc.short_description,
    description: dbc.description,
    stats,
    p4pScore,
    tier,
    communityP4pScore,
    communityTier,
    strengths: dbc.strengths || [],
    weaknesses: dbc.weaknesses || [],
    funFacts: dbc.fun_facts || [],
    sources: dbc.sources || [],
    imageColor: dbc.image_color,
    enrichmentCount: dbc.enrichment_count || 0,
    diet_type: dbc.diet_type,
    diet_items: dbc.diet_items || [],
    activity_pattern: dbc.activity_pattern,
    lifespan_min: dbc.lifespan_min,
    lifespan_max: dbc.lifespan_max,
    lifespan_unit: dbc.lifespan_unit,
    reproduction_type: dbc.reproduction_type,
    reproduction_notes: dbc.reproduction_notes,
    locomotion: dbc.locomotion,
    speed_max: dbc.speed_max,
    conservation_status: dbc.conservation_status,
    size_min_mm: dbc.size_min_mm,
    size_max_mm: dbc.size_max_mm,
    weight_avg_g: dbc.weight_avg_g,
    hasDocumentary: dbc.has_documentary || false,
    gradingCount: dbc.grading_count || 0,
    aiP4pScore: dbc.ai_p4p_score || 50,
    aiTier: (dbc.ai_tier || "C") as Tier,
    images: dbc.images || undefined,
  };
}

// ── Cached: getDBCreatures ───────────────────────────────
export const getDBCreatures = unstable_cache(
  _fetchCreatures,
  ["creatures-list"],
  { revalidate: CACHE_TTL.CREATURES, tags: [CACHE_TAGS.CREATURES] }
);

// ── Cached: getDBCreatureById (optimized: direct query) ──
export const getDBCreatureById = unstable_cache(
  async (id: string): Promise<Creature | undefined> => {
    try {
      console.log(`⚡ [Server] Fetching creature by id: ${id}`);
      const { data: dbc, error } = await supabase
        .from("creatures")
        .select("*")
        .eq("id", id)
        .single();

      if (error || !dbc) {
        // Fallback: try static data
        const staticFall = staticCreatures.find((c) => c.id === id);
        return staticFall;
      }

      // Fetch votes for this creature only
      const { data: votes } = await supabase
        .from("votes")
        .select("*")
        .eq("creature_id", id);

      return mapDbCreatureToCreature(dbc, votes || []);
    } catch (err) {
      console.error(`Error fetching creature ${id}:`, err);
      return staticCreatures.find((c) => c.id === id);
    }
  },
  ["creature-detail"],
  { revalidate: CACHE_TTL.CREATURE_DETAIL, tags: [CACHE_TAGS.CREATURES] }
);

export interface DbBattle {
  id: string;
  creature_a_id: string;
  creature_b_id: string;
  title: string | null;
  duration_days: number;
  ends_at: string;
  created_at: string;
}

export interface DbBattleVote {
  id: string;
  battle_id: string;
  vote_for: string;
  user_id: string | null;
  user_ip: string | null;
  created_at: string;
}

export interface Battle extends DbBattle {
  creature_a: Creature;
  creature_b: Creature;
  votes_a: number;
  votes_b: number;
  user_voted_for?: string;
}

// ── Cached: getDBBattles ──────────────────────────────────
// Note: userSession is user-specific so we cache the raw battle+vote data
// and compute user-specific fields at call site
const _fetchBattlesRaw = unstable_cache(
  async () => {
    try {
      console.log("⚡ [Server] Fetching battles...");
      const { data: dbBattles, error: bErr } = await supabase
        .from("battles")
        .select("*")
        .order("created_at", { ascending: false });

      if (bErr || !dbBattles) return { battles: [], votes: [] };

      const { data: dbVotes } = await supabase
        .from("battle_votes")
        .select("*");

      return { battles: dbBattles, votes: dbVotes || [] };
    } catch (err) {
      console.error("Error fetching battles:", err);
      return { battles: [], votes: [] };
    }
  },
  ["battles-raw"],
  { revalidate: CACHE_TTL.BATTLES, tags: [CACHE_TAGS.BATTLES] }
);

export async function getDBBattles(userSession?: { user_id?: string; user_ip?: string }): Promise<Battle[]> {
  const { battles: dbBattles, votes: dbVotes } = await _fetchBattlesRaw();
  if (dbBattles.length === 0) return [];

  const creatures = await getDBCreatures();

  return dbBattles.map((b: DbBattle) => {
    const creature_a = creatures.find(c => c.id === b.creature_a_id) || creatures[0];
    const creature_b = creatures.find(c => c.id === b.creature_b_id) || creatures[1];

    const votes_a = dbVotes.filter(v => v.battle_id === b.id && v.vote_for === b.creature_a_id).length;
    const votes_b = dbVotes.filter(v => v.battle_id === b.id && v.vote_for === b.creature_b_id).length;

    let user_voted_for: string | undefined = undefined;
    if (userSession) {
      const userVote = dbVotes.find(v => 
        v.battle_id === b.id && 
        ((userSession.user_id && v.user_id === userSession.user_id) || 
         (!userSession.user_id && userSession.user_ip && v.user_ip === userSession.user_ip))
      );
      if (userVote) {
        user_voted_for = userVote.vote_for;
      }
    }

    return { ...b, creature_a, creature_b, votes_a, votes_b, user_voted_for };
  });
}

export async function submitBattleVote(battleId: string, voteFor: string, userId?: string, userIp?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const query = supabase.from("battle_votes").select("id").eq("battle_id", battleId);
    if (userId) {
      query.eq("user_id", userId);
    } else if (userIp) {
      query.eq("user_ip", userIp);
    } else {
      return { success: false, error: "Missing identity" };
    }

    const { data: existing, error: checkErr } = await query;
    if (checkErr) return { success: false, error: checkErr.message };
    if (existing && existing.length > 0) {
      return { success: false, error: "Bạn đã bình chọn cho trận đấu này rồi!" };
    }

    const { error } = await supabase.from("battle_votes").insert({
      battle_id: battleId,
      vote_for: voteFor,
      user_id: userId || null,
      user_ip: userId ? null : (userIp || null)
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Unknown error" };
  }
}

export async function createBattle(creatureAId: string, creatureBId: string, durationDays: number, title?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const ends_at = new Date();
    ends_at.setDate(ends_at.getDate() + durationDays);

    const { error } = await supabase.from("battles").insert({
      creature_a_id: creatureAId,
      creature_b_id: creatureBId,
      duration_days: durationDays,
      ends_at: ends_at.toISOString(),
      title: title || `${creatureAId} vs ${creatureBId}`
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Unknown error" };
  }
}

export interface MatchupVotes {
  matchup_slug: string;
  votes_a: number;
  votes_b: number;
  user_voted_for?: string;
}

// ── Cached: matchup vote counts (user-specific part computed outside cache) ──
const _fetchMatchupVotesRaw = unstable_cache(
  async (matchupSlug: string) => {
    try {
      const { data: dbVotes } = await supabase
        .from("matchup_votes")
        .select("*")
        .eq("matchup_slug", matchupSlug);
      return dbVotes || [];
    } catch {
      return [];
    }
  },
  ["matchup-votes-raw"],
  { revalidate: CACHE_TTL.MATCHUP_VOTES, tags: [CACHE_TAGS.MATCHUP_VOTES] }
);

export async function getMatchupVotes(matchupSlug: string, userSession?: { user_id?: string; user_ip?: string }): Promise<MatchupVotes> {
  const votes = await _fetchMatchupVotesRaw(matchupSlug);
  const [creatureA, creatureB] = matchupSlug.split("-vs-");

  const votes_a = votes.filter(v => v.vote_for === creatureA).length;
  const votes_b = votes.filter(v => v.vote_for === creatureB).length;

  let user_voted_for: string | undefined = undefined;
  if (userSession) {
    const userVote = votes.find(v => 
      (userSession.user_id && v.user_id === userSession.user_id) || 
      (!userSession.user_id && userSession.user_ip && v.user_ip === userSession.user_ip)
    );
    if (userVote) {
      user_voted_for = userVote.vote_for;
    }
  }

  return { matchup_slug: matchupSlug, votes_a, votes_b, user_voted_for };
}

export async function submitMatchupVote(matchupSlug: string, voteFor: string, userId?: string, userIp?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const query = supabase.from("matchup_votes").select("id").eq("matchup_slug", matchupSlug);
    if (userId) {
      query.eq("user_id", userId);
    } else if (userIp) {
      query.eq("user_ip", userIp);
    } else {
      return { success: false, error: "Missing identity" };
    }

    const { data: existing, error: checkErr } = await query;
    if (checkErr) return { success: false, error: checkErr.message };
    if (existing && existing.length > 0) {
      return { success: false, error: "Bạn đã bình chọn cho trận so tài này rồi!" };
    }

    const { error } = await supabase.from("matchup_votes").insert({
      matchup_slug: matchupSlug,
      vote_for: voteFor,
      user_id: userId || null,
      user_ip: userId ? null : (userIp || null)
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || "Unknown error" };
  }
}

// ── Cached: getWhatIfQuestions ────────────────────────────
export const getWhatIfQuestions = unstable_cache(
  async (creatureId?: string): Promise<WhatIfQuestion[]> => {
    try {
      let query = supabase.from("what_if_questions").select("*").order("created_at", { ascending: false });
      if (creatureId) {
        query = query.eq("creature_id", creatureId);
      }
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error("Error fetching what-if questions:", err);
      return [];
    }
  },
  ["what-if-questions"],
  { revalidate: CACHE_TTL.WHAT_IFS, tags: [CACHE_TAGS.WHAT_IFS] }
);

// ── Cached: getWhatIfQuestionWithAnswers ──────────────────
export const getWhatIfQuestionWithAnswers = unstable_cache(
  async (slug: string): Promise<(WhatIfQuestion & { answers: WhatIfAnswer[] }) | null> => {
    try {
      const { data: question, error: qErr } = await supabase
        .from("what_if_questions")
        .select("*")
        .eq("slug", slug)
        .single();

      if (qErr || !question) {
        if (qErr && qErr.code !== "PGRST116") {
          console.error("Error fetching what-if question:", qErr);
        }
        return null;
      }

      const { data: answers, error: aErr } = await supabase
        .from("what_if_answers")
        .select("*")
        .eq("question_id", question.id)
        .order("created_at", { ascending: true });

      if (aErr) throw aErr;

      return {
        ...question,
        answers: answers || []
      };
    } catch (err) {
      console.error("Error fetching what-if question with answers:", err);
      return null;
    }
  },
  ["what-if-question-with-answers"],
  { revalidate: CACHE_TTL.WHAT_IFS, tags: [CACHE_TAGS.WHAT_IFS] }
);

// ── Cached: getCreatureWhatIfs ────────────────────────────
export const getCreatureWhatIfs = unstable_cache(
  async (creatureId: string): Promise<Array<WhatIfQuestion & { answers: WhatIfAnswer[] }>> => {
    try {
      const { data: questions, error: qErr } = await supabase
        .from("what_if_questions")
        .select("*")
        .eq("creature_id", creatureId)
        .order("created_at", { ascending: false });

      if (qErr) throw qErr;
      if (!questions || questions.length === 0) return [];

      const questionIds = questions.map(q => q.id);
      const { data: answers, error: aErr } = await supabase
        .from("what_if_answers")
        .select("*")
        .in("question_id", questionIds)
        .order("created_at", { ascending: true });

      if (aErr) throw aErr;

      const answersMap: Record<string, WhatIfAnswer[]> = {};
      if (answers) {
        answers.forEach(a => {
          if (!answersMap[a.question_id]) {
            answersMap[a.question_id] = [];
          }
          answersMap[a.question_id].push(a);
        });
      }

      return questions.map(q => ({
        ...q,
        answers: answersMap[q.id] || []
      }));
    } catch (err) {
      console.error("Error fetching creature what-ifs:", err);
      return [];
    }
  },
  ["creature-what-ifs"],
  { revalidate: CACHE_TTL.WHAT_IFS, tags: [CACHE_TAGS.WHAT_IFS] }
);

// ── Cached: getCreatureHumanSplices ───────────────────────
export const getCreatureHumanSplices = unstable_cache(
  async (creatureId: string): Promise<HumanSplice[]> => {
    try {
      const { data, error } = await supabase
        .from("human_splices")
        .select("*")
        .eq("creature_id", creatureId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error("Error fetching creature human splices:", err);
      return [];
    }
  },
  ["creature-human-splices"],
  { revalidate: CACHE_TTL.HUMAN_SPLICES, tags: [CACHE_TAGS.HUMAN_SPLICES] }
);





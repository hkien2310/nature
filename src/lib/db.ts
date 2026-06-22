import { supabase } from "./supabase";
import { creatures as staticCreatures, Creature, CreatureStats, Tier } from "@/data/creatures";

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
  created_at: string;
}

export async function getDBCreatures(): Promise<Creature[]> {
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

    return dbCreatures.map((dbc: DbCreature) => {
      const votes = votesMap[dbc.id] || [];
      
      // Calculate average stats, default to static fallback stats if no votes
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

      // Calculate P4P score: average of stats
      const p4pScore = Math.round(
        (stats.strength + stats.durability + stats.speed + stats.weaponry + stats.special + stats.lethality) / 6
      );

      // Determine Tier based on P4P Score
      let tier: Tier = "C";
      if (p4pScore >= 90) tier = "S";
      else if (p4pScore >= 80) tier = "A";
      else if (p4pScore >= 70) tier = "B";
      else if (p4pScore >= 50) tier = "C";
      else tier = "D";

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
      };
    });
  } catch (err) {
    console.error("Error fetching database creatures, falling back to static:", err);
    return staticCreatures;
  }
}

export async function getDBCreatureById(id: string): Promise<Creature | undefined> {
  const list = await getDBCreatures();
  return list.find((c) => c.id === id);
}

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

export async function getDBBattles(userSession?: { user_id?: string; user_ip?: string }): Promise<Battle[]> {
  try {
    const { data: dbBattles, error: bErr } = await supabase
      .from("battles")
      .select("*")
      .order("created_at", { ascending: false });

    if (bErr || !dbBattles) {
      return [];
    }

    const { data: dbVotes, error: vErr } = await supabase
      .from("battle_votes")
      .select("*");

    const creatures = await getDBCreatures();

    return dbBattles.map((b: DbBattle) => {
      const creature_a = creatures.find(c => c.id === b.creature_a_id) || creatures[0];
      const creature_b = creatures.find(c => c.id === b.creature_b_id) || creatures[1];

      const votes = dbVotes || [];
      const votes_a = votes.filter(v => v.battle_id === b.id && v.vote_for === b.creature_a_id).length;
      const votes_b = votes.filter(v => v.battle_id === b.id && v.vote_for === b.creature_b_id).length;

      // Find user's vote if session details are provided
      let user_voted_for: string | undefined = undefined;
      if (userSession) {
        const userVote = votes.find(v => 
          v.battle_id === b.id && 
          ((userSession.user_id && v.user_id === userSession.user_id) || 
           (!userSession.user_id && userSession.user_ip && v.user_ip === userSession.user_ip))
        );
        if (userVote) {
          user_voted_for = userVote.vote_for;
        }
      }

      return {
        ...b,
        creature_a,
        creature_b,
        votes_a,
        votes_b,
        user_voted_for
      };
    });
  } catch (err) {
    console.error("Error fetching battles:", err);
    return [];
  }
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

export async function getMatchupVotes(matchupSlug: string, userSession?: { user_id?: string; user_ip?: string }): Promise<MatchupVotes> {
  try {
    const { data: dbVotes, error } = await supabase
      .from("matchup_votes")
      .select("*")
      .eq("matchup_slug", matchupSlug);

    const votes = dbVotes || [];
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

    return {
      matchup_slug: matchupSlug,
      votes_a,
      votes_b,
      user_voted_for
    };
  } catch (err) {
    console.error("Error fetching matchup votes:", err);
    return {
      matchup_slug: matchupSlug,
      votes_a: 0,
      votes_b: 0
    };
  }
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


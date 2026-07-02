import { supabase } from "./supabase";

export interface HumanSpliceTarget {
  id: string;
  name: string;
  scientific_name: string;
  ai_p4p_score: number;
  characteristics: string;
  unique_traits: string;
  existing_splices_count: number;
  existing_splices: Array<{ id: string; title: string; slug: string }>;
}

export async function selectHumanSpliceTargets(userId?: string, apiKey?: string): Promise<{ success: boolean; error?: string; targets?: HumanSpliceTarget[] }> {
  try {
    // 1. Authenticate (must have valid admin userId or valid apiKey)
    if (userId) {
      const { data: account, error: authErr } = await supabase
        .from("accounts")
        .select("role, username")
        .eq("id", userId)
        .single();
      
      if (authErr || !account || (account.role !== "admin" && account.username !== "admin")) {
        return { success: false, error: "Access Denied: Bạn không có quyền Admin." };
      }
    } else if (apiKey) {
      const expectedKey = process.env.API_SECRET_KEY;
      if (apiKey !== expectedKey) {
        return { success: false, error: "Unauthorized: Invalid API key." };
      }
    } else {
      return { success: false, error: "Access Denied: Missing authorization credentials." };
    }

    // 2. Fetch all creatures
    const { data: dbCreatures, error: cErr } = await supabase
      .from("creatures")
      .select("id, name, scientific_name, ai_p4p_score, characteristics, unique_traits");

    if (cErr || !dbCreatures || dbCreatures.length === 0) {
      return { success: false, error: "Không thể lấy dữ liệu sinh vật." };
    }

    // 3. Fetch all human splices to compute counts
    const { data: dbSplices, error: sErr } = await supabase
      .from("human_splices")
      .select("id, creature_id, title, slug");

    if (sErr) {
      return { success: false, error: "Không thể lấy dữ liệu lai ghép gen: " + sErr.message };
    }

    // Group splices by creature_id
    const splicesMap: Record<string, Array<{ id: string; title: string; slug: string }>> = {};
    dbCreatures.forEach(c => {
      splicesMap[c.id] = [];
    });
    if (dbSplices) {
      dbSplices.forEach(s => {
        if (splicesMap[s.creature_id]) {
          splicesMap[s.creature_id].push({
            id: s.id,
            title: s.title,
            slug: s.slug
          });
        }
      });
    }

    // 4. Map and rank creatures
    const rankedCreatures: HumanSpliceTarget[] = dbCreatures.map(c => {
      const existing = splicesMap[c.id] || [];
      return {
        id: c.id,
        name: c.name,
        scientific_name: c.scientific_name,
        ai_p4p_score: c.ai_p4p_score || 50,
        characteristics: c.characteristics || "",
        unique_traits: c.unique_traits || "",
        existing_splices_count: existing.length,
        existing_splices: existing
      };
    });

    // Sort criteria:
    // 1. Lowest existing_splices_count first (ASC)
    // 2. Highest ai_p4p_score first (DESC)
    // 3. Alphabetical order of id ASC
    rankedCreatures.sort((a, b) => {
      if (a.existing_splices_count !== b.existing_splices_count) {
        return a.existing_splices_count - b.existing_splices_count;
      }
      if (a.ai_p4p_score !== b.ai_p4p_score) {
        return b.ai_p4p_score - a.ai_p4p_score;
      }
      return a.id.localeCompare(b.id);
    });

    // Slice top 3
    const targets = rankedCreatures.slice(0, 3);

    return {
      success: true,
      targets
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Unknown error" };
  }
}

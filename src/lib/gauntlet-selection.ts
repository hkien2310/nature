import { supabase } from "./supabase";

export interface GauntletTarget {
  id: string;
  name: string;
  scientific_name: string;
  ai_p4p_score: number;
  characteristics: string;
  unique_traits: string;
}

export async function selectGauntletTargets(userId?: string, apiKey?: string): Promise<{ success: boolean; error?: string; targets?: GauntletTarget[] }> {
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

    // 3. Fetch all what-if answers that are gauntlet
    const { data: dbAnswers, error: aErr } = await supabase
      .from("what_if_answers")
      .select("id, what_if_questions!inner ( creature_id )")
      .eq("perspective_type", "gauntlet");

    if (aErr) {
      return { success: false, error: "Không thể lấy dữ liệu Gauntlet: " + aErr.message };
    }

    // 4. Find creatures that have NO gauntlet answers
    const gauntletCreatureIds = new Set();
    if (dbAnswers) {
      dbAnswers.forEach((ans: any) => {
        if (ans.what_if_questions && ans.what_if_questions.creature_id) {
          gauntletCreatureIds.add(ans.what_if_questions.creature_id);
        }
      });
    }

    const eligibleCreatures = dbCreatures.filter(c => !gauntletCreatureIds.has(c.id));

    // Sort by Highest ai_p4p_score first (DESC)
    eligibleCreatures.sort((a, b) => {
      if (a.ai_p4p_score !== b.ai_p4p_score) {
        return (b.ai_p4p_score || 0) - (a.ai_p4p_score || 0);
      }
      return a.id.localeCompare(b.id);
    });

    // Slice top 3
    const targets = eligibleCreatures.slice(0, 3).map(c => ({
      id: c.id,
      name: c.name,
      scientific_name: c.scientific_name,
      ai_p4p_score: c.ai_p4p_score || 50,
      characteristics: c.characteristics || "",
      unique_traits: c.unique_traits || ""
    }));

    return {
      success: true,
      targets
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Unknown error" };
  }
}

import { supabase } from "./supabase";

export interface WhatIfTarget {
  id: string;
  name: string;
  scientific_name: string;
  ai_p4p_score: number;
  characteristics: string;
  unique_traits: string;
  existing_questions_count: number;
  existing_questions: Array<{ id: string; title: string; slug: string }>;
  existing_answers_count?: number;
}

export async function selectWhatIfEnrichTargets(userId?: string, apiKey?: string): Promise<{ success: boolean; error?: string; targets?: WhatIfTarget[] }> {
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

    // 3. Fetch all what-if questions and their answers to compute counts per creature
    const { data: dbQuestions, error: qErr } = await supabase
      .from("what_if_questions")
      .select(`
        id,
        creature_id,
        title,
        slug,
        what_if_answers (
          id
        )
      `);

    if (qErr) {
      return { success: false, error: "Không thể lấy dữ liệu câu hỏi What-If: " + qErr.message };
    }

    // Group questions by creature_id
    const questionsMap: Record<string, Array<{ id: string; title: string; slug: string; answers_count: number }>> = {};
    dbCreatures.forEach(c => {
      questionsMap[c.id] = [];
    });
    if (dbQuestions) {
      dbQuestions.forEach(q => {
        if (questionsMap[q.creature_id]) {
          questionsMap[q.creature_id].push({
            id: q.id,
            title: q.title,
            slug: q.slug,
            answers_count: q.what_if_answers ? q.what_if_answers.length : 0
          });
        }
      });
    }

    // 4. Map and rank creatures
    const rankedCreatures: WhatIfTarget[] = dbCreatures.map(c => {
      const existing = questionsMap[c.id] || [];
      const answersCount = existing.reduce((sum, q) => sum + q.answers_count, 0);
      return {
        id: c.id,
        name: c.name,
        scientific_name: c.scientific_name,
        ai_p4p_score: c.ai_p4p_score || 50,
        characteristics: c.characteristics || "",
        unique_traits: c.unique_traits || "",
        existing_questions_count: existing.length,
        existing_questions: existing.map(q => ({ id: q.id, title: q.title, slug: q.slug })),
        existing_answers_count: answersCount
      };
    });

    // Sort criteria:
    // 1. Lowest existing_questions_count first (ASC)
    // 2. Lowest existing_answers_count first (ASC)
    // 3. Highest ai_p4p_score first (DESC)
    // 4. Alphabetical order of id ASC (for deterministic sorting)
    rankedCreatures.sort((a, b) => {
      if (a.existing_questions_count !== b.existing_questions_count) {
        return a.existing_questions_count - b.existing_questions_count;
      }
      const aAnswers = a.existing_answers_count || 0;
      const bAnswers = b.existing_answers_count || 0;
      if (aAnswers !== bAnswers) {
        return aAnswers - bAnswers;
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

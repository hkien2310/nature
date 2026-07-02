import { supabase } from "./supabase";

export interface SelectionTarget {
  id: string;
  name: string;
  p4pScore: number;
  gradingCount: number;
}

export async function selectGradingGroup(userId?: string, apiKey?: string): Promise<{ success: boolean; error?: string; anchor?: SelectionTarget; group?: SelectionTarget[] }> {
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
      .select("id, name, ai_p4p_score, grading_count");
    
    if (cErr || !dbCreatures || dbCreatures.length === 0) {
      return { success: false, error: "Không thể lấy dữ liệu sinh vật." };
    }

    if (dbCreatures.length < 5) {
      return { success: false, error: "Yêu cầu tối thiểu 5 sinh vật để chạy thuật toán hiệu chuẩn." };
    }

    // 3. Fetch recent grading history (last 10 runs)
    const { data: history } = await supabase
      .from("grading_history")
      .select("creatures_evaluated")
      .order("created_at", { ascending: false })
      .limit(10);

    const recentEvaluations = history || [];

    // Map database fields to selection format
    const creatures: SelectionTarget[] = dbCreatures.map(c => ({
      id: c.id,
      name: c.name,
      p4pScore: c.ai_p4p_score || 50,
      gradingCount: c.grading_count || 0
    }));

    // 4. Calculate Priority Score for each creature to find the Anchor
    // Priority = 100 / (1 + gradingCount) + (p4pScore * 0.1) + recencyBoost
    const priorityList = creatures.map(c => {
      const evalCount = c.gradingCount;
      const basePriority = 100 / (1 + evalCount);
      
      // Minor boost for higher strength group to stabilize top-tier creatures
      const strengthBoost = c.p4pScore * 0.05;

      // Recency check: check how recently this creature was evaluated
      // If it hasn't appeared in the last 5 runs, give it a recency boost
      let recencyBoost = 20;
      for (let i = 0; i < Math.min(5, recentEvaluations.length); i++) {
        const run = recentEvaluations[i].creatures_evaluated || [];
        if (run.includes(c.id)) {
          recencyBoost = i * 4; // Closer to index 0 means recently evaluated, lower boost
          break;
        }
      }

      const totalPriority = basePriority + strengthBoost + recencyBoost;

      return {
        creature: c,
        priorityScore: totalPriority
      };
    });

    // Sort by priorityScore descending and pick the highest as Anchor
    priorityList.sort((a, b) => b.priorityScore - a.priorityScore);
    const anchor = priorityList[0].creature;

    // 5. Select the remaining 4 candidates
    // Filter out candidates that were evaluated together with the Anchor in the last 3 runs to avoid repetition
    const recentlyGradedWithAnchor = new Set<string>();
    for (let i = 0; i < Math.min(3, recentEvaluations.length); i++) {
      const run = recentEvaluations[i].creatures_evaluated || [];
      if (run.includes(anchor.id)) {
        run.forEach((id: string) => {
          if (id !== anchor.id) recentlyGradedWithAnchor.add(id);
        });
      }
    }

    // Candidate pool
    let candidates = creatures.filter(c => c.id !== anchor.id);
    
    // Attempt to exclude recently graded candidates, but fallback if pool is too small
    const freshCandidates = candidates.filter(c => !recentlyGradedWithAnchor.has(c.id));
    if (freshCandidates.length >= 4) {
      candidates = freshCandidates;
    }

    // Sort candidates by absolute P4P score distance to the Anchor
    candidates.sort((a, b) => Math.abs(a.p4pScore - anchor.p4pScore) - Math.abs(b.p4pScore - anchor.p4pScore));

    const finalGroup: SelectionTarget[] = [anchor];
    const pickedIds = new Set<string>([anchor.id]);

    // Choose 3 closest candidates (similarity principle)
    const closestToPick = Math.min(3, candidates.length);
    for (let i = 0; i < closestToPick; i++) {
      finalGroup.push(candidates[i]);
      pickedIds.add(candidates[i].id);
    }

    // Choose 1 exploration candidate (either 4th closest, or random with 25% probability)
    const remainingCandidates = candidates.filter(c => !pickedIds.has(c.id));
    if (remainingCandidates.length > 0) {
      const triggerExploration = Math.random() < 0.25;
      if (triggerExploration && remainingCandidates.length > 1) {
        // Pick a random candidate from the exploration pool (excluding the next closest one)
        const randIndex = 1 + Math.floor(Math.random() * (remainingCandidates.length - 1));
        finalGroup.push(remainingCandidates[randIndex]);
      } else {
        // Fallback to the next closest candidate
        finalGroup.push(remainingCandidates[0]);
      }
    }

    // Fallback if we still don't have 5 creatures (should not happen if db has >= 5)
    while (finalGroup.length < 5 && creatures.length >= 5) {
      const fallbackItem = creatures.find(c => !finalGroup.some(fg => fg.id === c.id));
      if (fallbackItem) finalGroup.push(fallbackItem);
      else break;
    }

    return {
      success: true,
      anchor,
      group: finalGroup
    };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: "Access Denied: Missing User ID." }, { status: 403 });
    }

    // 1. Verify user is admin in database
    const { data: account, error: authErr } = await supabase
      .from("accounts")
      .select("role, username")
      .eq("id", userId)
      .single();

    if (authErr || !account || (account.role !== "admin" && account.username !== "admin")) {
      return NextResponse.json({ error: "Access Denied: Bạn không có quyền Admin." }, { status: 403 });
    }

    // 2. Fetch all creatures
    const { data: creatures, error: fetchErr } = await supabase
      .from("creatures")
      .select("*");

    if (fetchErr || !creatures || creatures.length === 0) {
      return NextResponse.json({ error: "Không tìm thấy dữ liệu sinh vật." }, { status: 400 });
    }

    // 3. Select 5 creatures with the lowest grading_count
    const sortedCreatures = [...creatures].sort((a, b) => (a.grading_count || 0) - (b.grading_count || 0));
    const selected = sortedCreatures.slice(0, 5);

    if (selected.length < 5) {
      return NextResponse.json({ error: "Yêu cầu tối thiểu 5 sinh vật trong cơ sở dữ liệu để chấm điểm." }, { status: 400 });
    }

    const evaluationDetails: Record<string, any> = {};

    // 4. Comparative Heuristics P4P Engine
    // Focuses purely on genetics, biological efficiency, and scale-independent metrics.
    for (const c of selected) {
      const name = c.name;
      const isInsectOrArachnid = ["Insecta", "Arachnida"].includes(c.class);
      const isCephalopod = c.class === "Cephalopoda";
      const hasVenom = c.strengths?.some((s: string) => s.toLowerCase().includes("độc") || s.toLowerCase().includes("toxin")) ||
                        c.weaknesses?.some((w: string) => w.toLowerCase().includes("độc"));

      // Criteria 1: Relative Muscle Density & Exoskeletal Durability (RMD)
      // Insects and arachnids score exceptionally high due to exoskeleton strength scaling.
      let rmd = 50;
      if (isInsectOrArachnid) {
        rmd = 85 + Math.floor(Math.random() * 11); // 85-95
      } else if (isCephalopod) {
        rmd = 30 + Math.floor(Math.random() * 11); // 30-40 (flexible but soft body)
      } else {
        rmd = 55 + Math.floor(Math.random() * 16); // 55-70 (vertebrates)
      }

      // Criteria 2: Impact Acceleration & Weaponry Efficiency (IAW)
      // Strike velocity and chemical payload efficiency
      let iaw = 50;
      if (c.id === "mantis-shrimp") {
        iaw = 98; // Sonic punch cavitation
      } else if (hasVenom) {
        iaw = 85 + Math.floor(Math.random() * 11); // 85-95 (lethal venom)
      } else {
        iaw = 60 + Math.floor(Math.random() * 21); // 60-80
      }

      // Criteria 3: Maneuverability & Reflex Latency (MRL)
      // Size-independent speed and response time
      let mrl = 50;
      if (isInsectOrArachnid || isCephalopod) {
        mrl = 80 + Math.floor(Math.random() * 16); // 80-95
      } else {
        mrl = 55 + Math.floor(Math.random() * 21); // 55-75
      }

      // Criteria 4: Metabolic Efficiency & Genetic Adaptations (MEG)
      let meg = 50;
      if (c.id === "bullet-ant" || c.id === "honey-badger") {
        meg = 90 + Math.floor(Math.random() * 8); // extreme resilience
      } else {
        meg = 60 + Math.floor(Math.random() * 26);
      }

      // Criteria 5: Sensory Resolution & Neural Processing (SRN)
      let srn = 50;
      if (c.id === "mantis-shrimp") {
        srn = 99; // 16 color cones, polarized light vision
      } else {
        srn = 60 + Math.floor(Math.random() * 26);
      }

      const totalScore = Math.round((rmd + iaw + mrl + meg + srn) / 5);

      // Determine AI Tier based on score
      let aiTier = "C";
      if (totalScore >= 90) aiTier = "S";
      else if (totalScore >= 80) aiTier = "A";
      else if (totalScore >= 70) aiTier = "B";
      else if (totalScore >= 50) aiTier = "C";
      else aiTier = "D";

      evaluationDetails[c.id] = {
        name,
        rmd,
        iaw,
        mrl,
        meg,
        srn,
        totalScore,
        aiTier
      };

      // 5. Update individual creature database record
      await supabase
        .from("creatures")
        .update({
          grading_count: (c.grading_count || 0) + 1,
          ai_p4p_score: totalScore,
          ai_tier: aiTier
        })
        .eq("id", c.id);
    }

    // 6. Log evaluation to grading_history table
    const selectedIds = selected.map(c => c.id);
    const { error: logErr } = await supabase
      .from("grading_history")
      .insert({
        creatures_evaluated: selectedIds,
        evaluation_details: evaluationDetails
      });

    if (logErr) {
      console.warn("Failed to write to grading_history log:", logErr.message);
    }

    return NextResponse.json({
      success: true,
      evaluatedCreatures: selectedIds,
      details: evaluationDetails
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

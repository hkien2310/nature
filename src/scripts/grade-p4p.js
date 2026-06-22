const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "../.env.local");
let supabaseUrl = "";
let supabaseAnonKey = "";

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL\s*=\s*(.*)/);
  const keyMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY\s*=\s*(.*)/);
  if (urlMatch) {
    supabaseUrl = urlMatch[1].replace(/['"]/g, "").trim();
  }
  if (keyMatch) {
    supabaseAnonKey = keyMatch[1].replace(/['"]/g, "").trim();
  }
}

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("your_supabase")) {
  console.error("Error: Supabase credentials not configured in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  // 1. Fetch creatures
  const { data: creatures, error: fetchErr } = await supabase
    .from("creatures")
    .select("*");

  if (fetchErr) {
    console.error("Error fetching creatures:", fetchErr.message);
    process.exit(1);
  }

  if (!creatures || creatures.length === 0) {
    console.error("No creatures found in database.");
    process.exit(1);
  }

  if (creatures.length < 5) {
    console.error(`Requires at least 5 creatures in the database. Found: ${creatures.length}`);
    process.exit(1);
  }

  // 2. Fetch recent grading history (last 10 runs) for smart selection
  const { data: history, error: historyErr } = await supabase
    .from("grading_history")
    .select("creatures_evaluated")
    .order("created_at", { ascending: false })
    .limit(10);

  if (historyErr) {
    console.warn("Failed to fetch grading history:", historyErr.message);
  }
  const recentEvaluations = history || [];

  // Map database fields to selection format in-memory
  const candidatesList = creatures.map(c => ({
    id: c.id,
    name: c.name,
    p4pScore: c.ai_p4p_score || 50,
    gradingCount: c.grading_count || 0,
    raw: c
  }));

  // Calculate Priority Score for each creature to find the Anchor
  // Priority = 100 / (1 + gradingCount) + (p4pScore * 0.05) + recencyBoost
  const priorityList = candidatesList.map(c => {
    const evalCount = c.gradingCount;
    const basePriority = 100 / (1 + evalCount);
    const strengthBoost = c.p4pScore * 0.05;

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
      candidate: c,
      priorityScore: totalPriority
    };
  });

  // Sort by priorityScore descending and pick the highest as Anchor
  priorityList.sort((a, b) => b.priorityScore - a.priorityScore);
  const anchor = priorityList[0].candidate;

  // Select the remaining 4 candidates
  // Filter out candidates that were evaluated together with the Anchor in the last 3 runs to avoid repetition
  const recentlyGradedWithAnchor = new Set();
  for (let i = 0; i < Math.min(3, recentEvaluations.length); i++) {
    const run = recentEvaluations[i].creatures_evaluated || [];
    if (run.includes(anchor.id)) {
      run.forEach(id => {
        if (id !== anchor.id) recentlyGradedWithAnchor.add(id);
      });
    }
  }

  let candidates = candidatesList.filter(c => c.id !== anchor.id);
  const freshCandidates = candidates.filter(c => !recentlyGradedWithAnchor.has(c.id));
  if (freshCandidates.length >= 4) {
    candidates = freshCandidates;
  }

  // Sort candidates by absolute P4P score distance to the Anchor
  candidates.sort((a, b) => Math.abs(a.p4pScore - anchor.p4pScore) - Math.abs(b.p4pScore - anchor.p4pScore));

  const finalGroup = [anchor];
  const pickedIds = new Set([anchor.id]);

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

  // Fallback if we still don't have 5 creatures
  while (finalGroup.length < 5 && creatures.length >= 5) {
    const fallbackItem = candidatesList.find(c => !finalGroup.some(fg => fg.id === c.id));
    if (fallbackItem) finalGroup.push(fallbackItem);
    else break;
  }

  const selected = finalGroup.map(fg => fg.raw);
  const selectedIds = selected.map(c => c.id);

  console.log(`\nSelected creatures for grading: ${selected.map(c => `${c.name} (${c.id})`).join(", ")}`);

  // Fetch votes for community score calculation
  const { data: dbVotes, error: votesErr } = await supabase
    .from("votes")
    .select("*")
    .in("creature_id", selectedIds);

  if (votesErr) {
    console.warn("Failed to fetch votes:", votesErr.message);
  }

  const votesMap = {};
  if (dbVotes) {
    dbVotes.forEach(v => {
      if (!votesMap[v.creature_id]) {
        votesMap[v.creature_id] = [];
      }
      votesMap[v.creature_id].push(v);
    });
  }

  const evaluationDetails = {};
  const resultsTable = [];

  // 3. Comparative Heuristics P4P Engine
  for (const c of selected) {
    const isInsectOrArachnid = ["Insecta", "Arachnida"].includes(c.class);
    const isCephalopod = c.class === "Cephalopoda";
    const hasVenom = (c.strengths && c.strengths.some(s => s.toLowerCase().includes("độc") || s.toLowerCase().includes("toxin"))) ||
                     (c.weaknesses && c.weaknesses.some(w => w.toLowerCase().includes("độc")));

    // Criteria 1: RMD
    let rmd = 50;
    if (isInsectOrArachnid) {
      rmd = 85 + Math.floor(Math.random() * 11); // 85-95
    } else if (isCephalopod) {
      rmd = 30 + Math.floor(Math.random() * 11); // 30-40
    } else {
      rmd = 55 + Math.floor(Math.random() * 16); // 55-70
    }

    // Criteria 2: IAW
    let iaw = 50;
    if (c.id === "mantis-shrimp") {
      iaw = 98;
    } else if (hasVenom) {
      iaw = 85 + Math.floor(Math.random() * 11); // 85-95
    } else {
      iaw = 60 + Math.floor(Math.random() * 21); // 60-80
    }

    // Criteria 3: MRL
    let mrl = 50;
    if (isInsectOrArachnid || isCephalopod) {
      mrl = 80 + Math.floor(Math.random() * 16); // 80-95
    } else {
      mrl = 55 + Math.floor(Math.random() * 21); // 55-75
    }

    // Criteria 4: MEG
    let meg = 50;
    if (c.id === "bullet-ant" || c.id === "honey-badger") {
      meg = 90 + Math.floor(Math.random() * 8); // 90-97
    } else {
      meg = 60 + Math.floor(Math.random() * 26); // 60-85
    }

    // Criteria 5: SRN
    let srn = 50;
    if (c.id === "mantis-shrimp") {
      srn = 99;
    } else {
      srn = 60 + Math.floor(Math.random() * 26); // 60-85
    }

    const totalScore = Math.round((rmd + iaw + mrl + meg + srn) / 5);

    let aiTier = "C";
    if (totalScore >= 90) aiTier = "S";
    else if (totalScore >= 80) aiTier = "A";
    else if (totalScore >= 70) aiTier = "B";
    else if (totalScore >= 50) aiTier = "C";
    else aiTier = "D";

    // Calculate Community Score
    const cVotes = votesMap[c.id] || [];
    let communityScore = 50; // default
    if (cVotes.length > 0) {
      const sum = cVotes.reduce((acc, v) => acc + v.strength + v.durability + v.speed + v.weaponry + v.special + v.lethality, 0);
      communityScore = Math.round(sum / (cVotes.length * 6));
    }

    const delta = totalScore - communityScore;
    let calibration = "Accurate";
    if (delta >= 15) {
      calibration = "Underrated";
    } else if (delta <= -15) {
      calibration = "Overrated";
    }

    evaluationDetails[c.id] = {
      name: c.name,
      rmd,
      iaw,
      mrl,
      meg,
      srn,
      totalScore,
      aiTier
    };

    resultsTable.push({
      id: c.id,
      name: c.name,
      rmd,
      iaw,
      mrl,
      meg,
      srn,
      aiScore: totalScore,
      aiTier,
      commScore: communityScore,
      delta,
      calibration
    });

    // Update database for the creature
    const { error: updateErr } = await supabase
      .from("creatures")
      .update({
        grading_count: (c.grading_count || 0) + 1,
        ai_p4p_score: totalScore,
        ai_tier: aiTier
      })
      .eq("id", c.id);

    if (updateErr) {
      console.error(`Error updating creature ${c.id}:`, updateErr.message);
    } else {
      console.log(`Updated ${c.name} (${c.id}) in database.`);
    }
  }

  // 4. Log evaluation to grading_history table
  const { error: logErr } = await supabase
    .from("grading_history")
    .insert({
      creatures_evaluated: selectedIds,
      evaluation_details: evaluationDetails
    });

  if (logErr) {
    console.error("Error inserting grading history:", logErr.message);
  } else {
    console.log("Logged grading event to grading_history table.");
  }

  console.log("\n## RESULTS_DATA_JSON_START ##");
  console.log(JSON.stringify(resultsTable, null, 2));
  console.log("## RESULTS_DATA_JSON_END ##");
}

run();

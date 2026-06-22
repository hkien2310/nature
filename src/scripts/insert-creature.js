const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Manually parse .env.local
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

const jsonPath = process.argv[2];
if (!jsonPath) {
  console.error("Error: Please provide path to creature JSON file.");
  process.exit(1);
}

const fullJsonPath = path.resolve(jsonPath);
if (!fs.existsSync(fullJsonPath)) {
  console.error(`Error: File not found at ${fullJsonPath}`);
  process.exit(1);
}

const input = JSON.parse(fs.readFileSync(fullJsonPath, "utf-8"));
const creatures = Array.isArray(input) ? input : [input];

async function run() {
  for (const creature of creatures) {
    console.log(`Inserting creature: ${creature.name} (${creature.id})...`);
    
    // Format for DB schema
    const dbRecord = {
      id: creature.id,
      name: creature.name,
      scientific_name: creature.scientificName || creature.scientific_name,
      class: creature.taxonomy ? (creature.taxonomy.class || creature.taxonomy.Class) : creature.class,
      order: creature.taxonomy ? (creature.taxonomy.order || creature.taxonomy.Order) : creature.order,
      family: creature.taxonomy ? (creature.taxonomy.family || creature.taxonomy.Family) : creature.family,
      real_weight: creature.realWeight || creature.real_weight,
      size: creature.size,
      characteristics: creature.characteristics,
      habitat: creature.habitat,
      location: creature.location,
      survival_method: creature.survival_method,
      unique_traits: creature.unique_traits,
      short_description: creature.shortDescription || creature.short_description,
      description: creature.description,
      strengths: creature.strengths,
      weaknesses: creature.weaknesses,
      fun_facts: creature.funFacts || creature.fun_facts,
      sources: creature.sources,
      image_color: creature.imageColor || creature.image_color,
      enrichment_count: creature.enrichment_count !== undefined ? creature.enrichment_count : 0,
      diet_type: creature.diet_type || creature.dietType,
      diet_items: creature.diet_items || creature.dietItems || [],
      activity_pattern: creature.activity_pattern || creature.activityPattern,
      lifespan_min: creature.lifespan_min || creature.lifespanMin,
      lifespan_max: creature.lifespan_max || creature.lifespanMax,
      lifespan_unit: creature.lifespan_unit || creature.lifespanUnit,
      reproduction_type: creature.reproduction_type || creature.reproductionType,
      reproduction_notes: creature.reproduction_notes || creature.reproductionNotes,
      locomotion: creature.locomotion,
      speed_max: creature.speed_max || creature.speedMax,
      conservation_status: creature.conservation_status || creature.conservationStatus,
      size_min_mm: creature.size_min_mm || creature.sizeMinMm,
      size_max_mm: creature.size_max_mm || creature.sizeMaxMm,
      weight_avg_g: creature.weight_avg_g || creature.weightAvgG,
      grading_count: creature.grading_count !== undefined ? creature.grading_count : (creature.gradingCount !== undefined ? creature.gradingCount : 0),
      ai_p4p_score: creature.ai_p4p_score || creature.aiP4pScore || 50,
      ai_tier: creature.ai_tier || creature.aiTier || 'C'
    };

    const { error: cErr } = await supabase
      .from("creatures")
      .upsert(dbRecord, { onConflict: "id" });

    if (cErr) {
      console.error(`Error inserting creature ${creature.id}:`, cErr.message);
      process.exit(1);
    }
    console.log(`Creature ${creature.id} upserted successfully!`);

    // Check if votes already exist to avoid seeding duplicate sample votes unnecessarily
    const { count, error: countErr } = await supabase
      .from("votes")
      .select("*", { count: "exact", head: true })
      .eq("creature_id", creature.id);

    if (!countErr && count > 0) {
      console.log(`Votes already exist for ${creature.id}. Skipping sample votes generation.`);
      continue;
    }

    // Generate 3-5 sample votes based on the stats provided
    console.log("Generating sample votes...");
    const baseStats = creature.stats;
    const sampleVotes = [];
    const numVotes = 3 + Math.floor(Math.random() * 3); // 3 to 5 votes
    
    for (let i = 0; i < numVotes; i++) {
      // Add small random variance (-5 to +5)
      const vary = (val) => Math.min(100, Math.max(1, val + (-5 + Math.floor(Math.random() * 11))));
      sampleVotes.push({
        creature_id: creature.id,
        strength: vary(baseStats.strength),
        durability: vary(baseStats.durability),
        speed: vary(baseStats.speed),
        weaponry: vary(baseStats.weaponry),
        special: vary(baseStats.special),
        lethality: vary(baseStats.lethality)
      });
    }

    const { error: vErr } = await supabase
      .from("votes")
      .insert(sampleVotes);

    if (vErr) {
      console.error("Error inserting sample votes:", vErr.message);
      process.exit(1);
    }
    
    console.log(`Successfully generated ${numVotes} sample votes!`);
  }
  console.log("Seeding finished.");
}

run();

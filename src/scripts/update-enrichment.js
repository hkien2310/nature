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
  console.error("Error: Please provide path to enriched creatures JSON file.");
  process.exit(1);
}

const fullJsonPath = path.resolve(jsonPath);
if (!fs.existsSync(fullJsonPath)) {
  console.error(`Error: File not found at ${fullJsonPath}`);
  process.exit(1);
}

const enrichedCreatures = JSON.parse(fs.readFileSync(fullJsonPath, "utf-8"));

async function run() {
  console.log(`Enriching ${enrichedCreatures.length} creatures...`);

  for (const creature of enrichedCreatures) {
    console.log(`Updating ${creature.name} (${creature.id}) - setting enrichment_count to ${creature.enrichment_count}...`);

    const dbRecord = {
      id: creature.id,
      name: creature.name,
      scientific_name: creature.scientificName || creature.scientific_name,
      class: creature.taxonomy ? creature.taxonomy.class : creature.class,
      order: creature.taxonomy ? creature.taxonomy.order : creature.order,
      family: creature.taxonomy ? creature.taxonomy.family : creature.family,
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
      enrichment_count: creature.enrichment_count,
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
      weight_avg_g: creature.weight_avg_g || creature.weightAvgG
    };

    const { error } = await supabase
      .from("creatures")
      .upsert(dbRecord, { onConflict: "id" });

    if (error) {
      console.error(`Error updating creature ${creature.id}:`, error.message);
      process.exit(1);
    }
    console.log(`Creature ${creature.id} successfully updated!`);
  }

  console.log("All creatures enriched successfully.");
}

run();

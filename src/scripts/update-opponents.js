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

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes("your_supabase") || supabaseAnonKey.includes("your_supabase")) {
  console.error("❌ Supabase credentials not configured in .env.local yet.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const jsonFilePath = process.argv[2];
if (!jsonFilePath) {
  console.error("❌ Please provide a JSON file path as argument. Example: node src/scripts/update-opponents.js src/scripts/temp-opponents.json");
  process.exit(1);
}

const resolvedPath = path.resolve(jsonFilePath);
if (!fs.existsSync(resolvedPath)) {
  console.error(`❌ File not found: ${resolvedPath}`);
  process.exit(1);
}

async function run() {
  console.log(`⚡ Reading Opponents data from: ${jsonFilePath}...`);
  let data;
  try {
    const rawContent = fs.readFileSync(resolvedPath, "utf8");
    data = JSON.parse(rawContent);
  } catch (err) {
    console.error("❌ Failed to parse JSON file:", err.message);
    process.exit(1);
  }

  const items = Array.isArray(data) ? data : [data];
  console.log(`🚀 Processing ${items.length} Opponents...`);

  let successCount = 0;

  for (const item of items) {
    if (!item.name || !item.type || item.weight_kg === undefined) {
      console.error(`⚠️ Skipping invalid item (missing name, type or weight_kg): ${JSON.stringify(item)}`);
      continue;
    }

    console.log(`\n🔹 Opponent: "${item.name}" (Type: ${item.type}, Weight: ${item.weight_kg} kg)`);

    const { data: opponentData, error } = await supabase
      .from("opponents")
      .upsert({
        name: item.name,
        type: item.type,
        weight_kg: item.weight_kg,
        pull_force_kg: item.pull_force_kg || null,
        punch_force_kg: item.punch_force_kg || null,
        speed_kmh: item.speed_kmh || null,
        description: item.description || "",
        image_url: item.image_url || null,
        updated_at: new Date().toISOString()
      }, { onConflict: "name" })
      .select()
      .single();

    if (error || !opponentData) {
      console.error(`❌ Failed to upsert Opponent "${item.name}":`, error?.message);
    } else {
      successCount++;
      console.log(`   ✅ Upserted successfully (ID: ${opponentData.id})`);
    }
  }

  console.log(`\n🎉 Opponents database update completed! Successfully upserted ${successCount}/${items.length} opponents.`);
}

run().catch((err) => {
  console.error("💥 Unhandled execution error:", err);
});

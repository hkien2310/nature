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
  console.error("❌ Please provide a JSON file path as argument. Example: node update-human-splice.js temp-human-splice.json");
  process.exit(1);
}

const resolvedPath = path.resolve(jsonFilePath);
if (!fs.existsSync(resolvedPath)) {
  console.error(`❌ File not found: ${resolvedPath}`);
  process.exit(1);
}

async function run() {
  console.log(`⚡ Reading Human-Splice data from: ${jsonFilePath}...`);
  let data;
  try {
    const rawContent = fs.readFileSync(resolvedPath, "utf8");
    data = JSON.parse(rawContent);
  } catch (err) {
    console.error("❌ Failed to parse JSON file:", err.message);
    process.exit(1);
  }

  const items = Array.isArray(data) ? data : [data];
  console.log(`🚀 Processing ${items.length} Human-Splice profiles...`);

  for (const item of items) {
    if (!item.creature_id || !item.title || !item.slug || !item.trait_name || !item.spliced_stats) {
      console.error(`⚠️ Skipping invalid item: ${JSON.stringify(item)}`);
      continue;
    }

    console.log(`\n🔹 Graft: "${item.title}" (${item.creature_id})`);

    // Upsert Human Splice profile
    const { data: spliceData, error: sErr } = await supabase
      .from("human_splices")
      .upsert({
        creature_id: item.creature_id,
        title: item.title,
        trait_name: item.trait_name,
        slug: item.slug,
        spliced_stats: item.spliced_stats,
        formulas_and_data: item.formulas_and_data || {},
        summary: item.summary || null,
        sci_fi_hype: item.sci_fi_hype,
        scientific_reality: item.scientific_reality,
        updated_at: new Date().toISOString()
      }, { onConflict: "slug" })
      .select()
      .single();

    if (sErr || !spliceData) {
      console.error(`❌ Failed to upsert Splice Profile "${item.title}":`, sErr?.message);
    } else {
      console.log(`   ✅ Splice profile upserted successfully (ID: ${spliceData.id})`);
    }
  }

  console.log("\n🎉 Human Splicing database update completed!");
}

run().catch((err) => {
  console.error("💥 Unhandled execution error:", err);
});

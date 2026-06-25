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
  console.error("❌ Please provide a JSON file path as argument. Example: node update-what-if.js temp-what-if.json");
  process.exit(1);
}

const resolvedPath = path.resolve(jsonFilePath);
if (!fs.existsSync(resolvedPath)) {
  console.error(`❌ File not found: ${resolvedPath}`);
  process.exit(1);
}

async function run() {
  console.log(`⚡ Reading What-If data from: ${jsonFilePath}...`);
  let data;
  try {
    const rawContent = fs.readFileSync(resolvedPath, "utf8");
    data = JSON.parse(rawContent);
  } catch (err) {
    console.error("❌ Failed to parse JSON file:", err.message);
    process.exit(1);
  }

  const items = Array.isArray(data) ? data : [data];
  console.log(`🚀 Processing ${items.length} What-If scenarios...`);

  for (const item of items) {
    if (!item.creature_id || !item.title || !item.slug) {
      console.error(`⚠️ Skipping invalid item: ${JSON.stringify(item)}`);
      continue;
    }

    console.log(`\n🔹 Scenario: "${item.title}" (${item.creature_id})`);

    // 1. Upsert Question
    const { data: questionData, error: qErr } = await supabase
      .from("what_if_questions")
      .upsert({
        creature_id: item.creature_id,
        title: item.title,
        slug: item.slug,
        description: item.description || null,
        updated_at: new Date().toISOString()
      }, { onConflict: "slug" })
      .select()
      .single();

    if (qErr || !questionData) {
      console.error(`❌ Failed to upsert Question "${item.title}":`, qErr?.message);
      continue;
    }
    console.log(`   ✅ Question upserted (ID: ${questionData.id})`);

    // 2. Upsert Answers
    const answers = item.answers || [];
    if (answers.length === 0) {
      console.log("   ℹ️ No answers defined for this question.");
      continue;
    }

    console.log(`   🚀 Upserting ${answers.length} answers...`);
    let successCount = 0;

    for (const answer of answers) {
      if (!answer.title || !answer.slug || !answer.perspective_type) {
        console.error(`   ⚠️ Skipping invalid answer: ${JSON.stringify(answer)}`);
        continue;
      }

      const { error: aErr } = await supabase
        .from("what_if_answers")
        .upsert({
          question_id: questionData.id,
          title: answer.title,
          slug: answer.slug,
          perspective_type: answer.perspective_type,
          summary: answer.summary || null,
          content: answer.content,
          formulas_and_data: answer.formulas_and_data || {},
          p4p_score_scaled: answer.p4p_score_scaled,
          tier_scaled: answer.tier_scaled,
          sources: answer.sources || [],
          updated_at: new Date().toISOString()
        }, { onConflict: "slug" });

      if (aErr) {
        console.error(`   ❌ Failed to upsert Answer "${answer.title}":`, aErr.message);
      } else {
        successCount++;
        console.log(`     ✔ [${answer.perspective_type}] ${answer.title}`);
      }
    }
    console.log(`   ✅ Successfully upserted ${successCount}/${answers.length} answers.`);
  }

  console.log("\n🎉 What-If database update completed!");
}

run().catch((err) => {
  console.error("💥 Unhandled execution error:", err);
});

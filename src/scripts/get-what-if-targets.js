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

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing keys");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data: dbCreatures, error: cErr } = await supabase
    .from("creatures")
    .select("id, name, scientific_name, ai_p4p_score, characteristics, unique_traits");

  if (cErr || !dbCreatures) {
    console.error("Error fetching creatures:", cErr?.message);
    process.exit(1);
  }

  const { data: dbQuestions, error: qErr } = await supabase
    .from("what_if_questions")
    .select("id, creature_id, title, slug");

  if (qErr) {
    console.error("Error fetching questions:", qErr.message);
    process.exit(1);
  }

  const questionsMap = {};
  dbCreatures.forEach(c => {
    questionsMap[c.id] = [];
  });
  if (dbQuestions) {
    dbQuestions.forEach(q => {
      if (questionsMap[q.creature_id]) {
        questionsMap[q.creature_id].push({
          id: q.id,
          title: q.title,
          slug: q.slug
        });
      }
    });
  }

  const rankedCreatures = dbCreatures.map(c => {
    const existing = questionsMap[c.id] || [];
    return {
      id: c.id,
      name: c.name,
      scientific_name: c.scientific_name,
      ai_p4p_score: c.ai_p4p_score || 50,
      characteristics: c.characteristics || "",
      unique_traits: c.unique_traits || "",
      existing_questions_count: existing.length,
      existing_questions: existing
    };
  });

  rankedCreatures.sort((a, b) => {
    if (a.existing_questions_count !== b.existing_questions_count) {
      return a.existing_questions_count - b.existing_questions_count;
    }
    if (a.ai_p4p_score !== b.ai_p4p_score) {
      return b.ai_p4p_score - a.ai_p4p_score;
    }
    return a.id.localeCompare(b.id);
  });

  const targets = rankedCreatures.slice(0, 3);
  console.log(JSON.stringify(targets, null, 2));
}

run();

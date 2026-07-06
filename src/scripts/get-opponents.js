const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");

// Read from src/.env.local
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
  console.error("❌ Supabase credentials not configured in src/.env.local yet.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const { data, error } = await supabase
    .from("opponents")
    .select("*")
    .order("weight_kg", { ascending: true });

  if (error) {
    console.error("Error fetching opponents:", error.message);
    process.exit(1);
  }

  // Print as JSON string for other scripts/AI to parse
  console.log(JSON.stringify(data, null, 2));
}

run();

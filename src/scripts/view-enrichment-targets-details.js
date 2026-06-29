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

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const targetsPath = path.join(__dirname, "temp-targets.json");
  if (!fs.existsSync(targetsPath)) {
    console.error("temp-targets.json not found! Please run get-enrichment-targets.js first.");
    process.exit(1);
  }

  const { targets } = JSON.parse(fs.readFileSync(targetsPath, "utf-8"));
  const ids = targets.map(t => t.id);

  const { data, error } = await supabase
    .from("creatures")
    .select("*")
    .in("id", ids);

  if (error) {
    console.error("Error:", error);
    process.exit(1);
  }

  console.log(JSON.stringify(data, null, 2));
}

run();

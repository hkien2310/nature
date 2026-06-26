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
  const ids = ["naked-mole-rat", "namib-desert-beetle", "narwhal", "ocean-sunfish", "ogre-faced-spider"];
  const { data, error } = await supabase
    .from("creatures")
    .select("*")
    .in("id", ids);

  if (error) {
    console.error("Error:", error);
    process.exit(1);
  }

  // Write the output to a temp JSON file so we can view it
  fs.writeFileSync(path.join(__dirname, "temp-view-output.json"), JSON.stringify(data, null, 2));
  console.log("Written output to temp-view-output.json");
}

run();

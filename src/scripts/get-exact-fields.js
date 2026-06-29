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
  const ids = [
    "pink-fairy-armadillo",
    "stoplight-loosejaw",
    "surinam-toad",
    "big-headed-turtle",
    "firefly-squid"
  ];
  const { data, error } = await supabase
    .from("creatures")
    .select("*")
    .in("id", ids);

  if (error) {
    console.error(error);
    return;
  }
  fs.writeFileSync(path.join(__dirname, "temp-check-fields.json"), JSON.stringify(data, null, 2));
  console.log("Saved to temp-check-fields.json");
}
run();

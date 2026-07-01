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
  console.error("Missing Supabase keys in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error("Usage: node update-images.js <creature_id> <comma_separated_image_urls>");
    process.exit(1);
  }

  const creatureId = args[0];
  const newImages = args[1].split(",").map(img => img.trim()).filter(Boolean);

  console.log(`[Updating] Fetching current images for ${creatureId}...`);

  // 1. Fetch current images
  const { data: currentData, error: fetchError } = await supabase
    .from("creatures")
    .select("images")
    .eq("id", creatureId)
    .single();

  if (fetchError) {
    console.error("Failed to fetch creature:", fetchError.message);
    process.exit(1);
  }

  let existingImages = [];
  if (currentData && currentData.images && Array.isArray(currentData.images)) {
    existingImages = currentData.images;
  }

  // 2. Merge new images (avoid duplicates)
  const updatedImages = [...new Set([...existingImages, ...newImages])];

  console.log(`[Updating] Setting images to:`, updatedImages);

  // 3. Update DB
  const { error: updateError } = await supabase
    .from("creatures")
    .update({ images: updatedImages })
    .eq("id", creatureId);

  if (updateError) {
    console.error("Failed to update images:", updateError.message);
    process.exit(1);
  }

  console.log(`[Success] Updated images for ${creatureId}. Total images: ${updatedImages.length}`);
}

run();

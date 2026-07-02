const fs = require("fs");
const path = require("path");

// Manually parse .env.local to get API_SECRET_KEY
const envPath = path.join(__dirname, "../../.env.local");
let apiSecretKey = "";

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  const keyMatch = envContent.match(/API_SECRET_KEY\s*=\s*(.*)/);
  if (keyMatch) {
    apiSecretKey = keyMatch[1].replace(/['"]/g, "").trim();
  }
}

if (!apiSecretKey) {
  console.error("❌ API_SECRET_KEY not configured in .env.local yet.");
  process.exit(1);
}

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
  console.log(`🚀 Sending ${items.length} Human-Splice profiles to Backend API...`);

  try {
    const response = await fetch("http://localhost:3000/api/admin/human-splice/upsert", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiSecretKey
      },
      body: JSON.stringify(items)
    });

    const result = await response.json();

    if (!response.ok) {
      console.error("❌ API Request failed:", result.error || response.statusText);
      if (result.errors) {
        console.error("Details:", result.errors);
      }
      process.exit(1);
    }

    console.log(`✅ Successfully upserted ${result.upserted} Splice profiles via Backend.`);
    if (result.errors && result.errors.length > 0) {
      console.warn(`⚠️ Completed with some errors:`, result.errors);
    } else {
      console.log("\n🎉 Human Splicing database update completed!");
    }
  } catch (err) {
    console.error("💥 Failed to connect to Backend API. Make sure 'npm run dev' is running on port 3000.");
    console.error("Error details:", err.message);
    process.exit(1);
  }
}

run().catch((err) => {
  console.error("💥 Unhandled execution error:", err);
});

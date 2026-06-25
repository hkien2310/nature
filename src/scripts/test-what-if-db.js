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

async function runTest() {
  console.log("⚡ Starting database verification for What-If tables...");
  
  // 1. Verify that 'mantis-shrimp' exists in database
  const { data: creature, error: cErr } = await supabase
    .from("creatures")
    .select("id, name")
    .eq("id", "mantis-shrimp")
    .single();
    
  if (cErr || !creature) {
    console.error("❌ Creature 'mantis-shrimp' not found in database. Run seed first.", cErr?.message);
    process.exit(1);
  }
  console.log(`✅ Found creature: ${creature.name} (${creature.id})`);

  // Cleanup existing test what-if for this creature
  const mockSlug = "neu-tom-bo-ngua-to-bang-nguoi-80kg";
  await supabase.from("what_if_questions").delete().eq("slug", mockSlug);
  console.log("🧹 Cleaned up old test data (if any).");

  // 2. Insert What-If Question
  console.log("🚀 Inserting mock What-If Question...");
  const { data: question, error: qErr } = await supabase
    .from("what_if_questions")
    .insert({
      creature_id: creature.id,
      title: `Nếu ${creature.name} phóng to bằng con người (80kg) thì sao?`,
      slug: mockSlug,
      description: "Phân tích giả thuyết khi loài tôm sở hữu cú đấm nhanh nhất đại dương đạt kích thước của một võ sĩ hạng nặng 80kg."
    })
    .select()
    .single();

  if (qErr || !question) {
    console.error("❌ Failed to insert What-If Question:", qErr?.message);
    process.exit(1);
  }
  console.log(`✅ Successfully inserted question ID: ${question.id}`);

  // 3. Insert What-If Answers (1:N relationship)
  console.log("🚀 Inserting 2 mock What-If Answers (Classic Scaling & Biological Reality)...");
  
  const mockAnswers = [
    {
      question_id: question.id,
      title: "Góc nhìn 1: Phóng to lý thuyết (Sci-Fi Hype)",
      slug: "tom-bo-ngua-80kg-ly-thuyet-scifi",
      perspective_type: "classic_scaling",
      summary: "Cú đấm Mach 3 phá hủy vỏ xe tăng. Sức mạnh tuyệt đối phá vỡ mọi quy luật vật lý thông thường.",
      content: `Khi tôm bọ ngựa nặng 80kg, nếu các sợi cơ được phóng to hoàn hảo theo tỷ lệ tuyến tính:
- Cú đấm có vận tốc lên tới Mach 3 (1000 m/s), tạo ra năng lượng động năng khổng lồ.
- Bong bóng áp suất cavitation tạo ra xung quanh càng đấm có thể đạt nhiệt độ plasma tương đương 10,000 độ C.
- Lực đập va chạm đạt mức 60 tấn, dễ dàng xé nát giáp sắt của xe tăng hạng nhẹ.`,
      formulas_and_data: {
        scaling_factor: 800,
        mass_g_original: 100,
        mass_kg_scaled: 80,
        striking_force_n_original: 1500,
        striking_force_n_scaled: 1200000,
        formulas: [
          {
            name: "Lực đấm phóng to (Tỷ lệ lực cơ diện tích cắt ngang)",
            equation: "F_scaled = F_original * (M_scaled / M_original)^(2/3)",
            result: "Lực đấm ~120,000 N"
          }
        ]
      },
      p4p_score_scaled: 98,
      tier_scaled: "S",
      sources: [
        { label: "Stomatopod strike speed analysis", url: "https://doi.org/10.1242/jeb.01370" }
      ]
    },
    {
      question_id: question.id,
      title: "Góc nhìn 2: Giới hạn Sinh học Thực tế (Reality Check)",
      slug: "tom-bo-ngua-80kg-sinh-hoc-thuc-te",
      perspective_type: "biological_reality",
      summary: "Tự hủy ngay lập tức vì ngạt thở và gãy càng dưới sức nặng của chính mình.",
      content: `Trong thế giới thực tế, nếu một con tôm bọ ngựa đột ngột to lên 80kg:
- **Định luật bình phương - lập phương**: Thể tích và khối lượng tăng 800.000 lần (lập phương), trong khi diện tích mặt cắt cơ bắp và độ cứng của vỏ kitin chỉ tăng 10.000 lần (bình phương). Càng đấm của nó sẽ tự vỡ vụn ngay khi đấm vì cấu trúc kitin không chịu nổi phản lực.
- **Hô hấp**: Hệ thống hô hấp khuếch tán qua mang của nó không thể cung cấp đủ oxy cho cơ thể 80kg, nó sẽ chết ngạt trong vòng vài phút.
- **Hệ tuần hoàn hở**: Tim không đủ áp lực để bơm máu đi khắp cơ thể khổng lồ.`,
      formulas_and_data: {
        scaling_factor: 800,
        mass_g_original: 100,
        mass_kg_scaled: 80,
        limitations: [
          {
            type: "Hô hấp",
            issue: "Diện tích mang tăng kém hơn 100 lần so với thể tích nhu cầu oxy"
          },
          {
            type: "Cấu trúc vỏ ngoại cốt",
            issue: "Trọng lượng đè nén vượt quá giới hạn uốn của kitin"
          }
        ]
      },
      p4p_score_scaled: 10,
      tier_scaled: "D",
      sources: [
        { label: "Scaling of exoskeleton mechanics", url: "https://doi.org/10.1086/281313" }
      ]
    }
  ];

  const { data: insertedAnswers, error: aErr } = await supabase
    .from("what_if_answers")
    .insert(mockAnswers)
    .select();

  if (aErr || !insertedAnswers || insertedAnswers.length !== 2) {
    console.error("❌ Failed to insert What-If Answers:", aErr?.message);
    process.exit(1);
  }
  console.log(`✅ Successfully inserted ${insertedAnswers.length} answers!`);

  // 4. Query verify
  console.log("🚀 Querying back data to verify relationships...");
  const { data: queryResult, error: qryErr } = await supabase
    .from("what_if_questions")
    .select(`
      id,
      title,
      slug,
      what_if_answers (
        id,
        title,
        perspective_type,
        p4p_score_scaled,
        tier_scaled
      )
    `)
    .eq("slug", mockSlug)
    .single();

  if (qryErr || !queryResult) {
    console.error("❌ Failed to query back what-if hierarchy:", qryErr?.message);
    process.exit(1);
  }

  console.log("\n=================== VERIFICATION SUCCESS ===================");
  console.log(`Question: "${queryResult.title}"`);
  console.log("Answers:");
  queryResult.what_if_answers.forEach((ans) => {
    console.log(`  - [${ans.perspective_type.toUpperCase()}] ${ans.title} (Tier: ${ans.tier_scaled}, P4P: ${ans.p4p_score_scaled})`);
  });
  console.log("============================================================\n");
  console.log("🎉 All database schema validations passed!");
}

runTest().catch((err) => {
  console.error("💥 Unhandled test error:", err);
});

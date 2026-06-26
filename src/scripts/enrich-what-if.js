const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

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
  console.error("❌ Supabase credentials not found.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runEnrichment() {
  console.log("🔍 Finding 3 priority targets for What-If enrichment...");

  // 1. Get targets (identical logic to get-what-if-targets.js)
  const { data: dbCreatures, error: cErr } = await supabase
    .from("creatures")
    .select("id, name, scientific_name, ai_p4p_score, characteristics, unique_traits");

  if (cErr || !dbCreatures) {
    console.error("❌ Error fetching creatures:", cErr?.message);
    process.exit(1);
  }

  const { data: dbQuestions, error: qErr } = await supabase
    .from("what_if_questions")
    .select("id, creature_id, title, slug");

  if (qErr) {
    console.error("❌ Error fetching questions:", qErr.message);
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
  console.log(`🎯 Identified 3 target creatures:`);
  targets.forEach(t => console.log(`  - ${t.name} (${t.id}) with P4P: ${t.ai_p4p_score}`));

  const whatIfData = [];

  // 2. Build high-quality What-If scientific data for the targets
  for (const target of targets) {
    if (target.id === "hairy-frog") {
      whatIfData.push({
        creature_id: "hairy-frog",
        title: "Nếu Ếch Lông phóng to bằng con người (80kg) thì sao?",
        slug: "neu-ech-long-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài ếch lông sở hữu móng vuốt xương tự bẻ gãy khớp đâm xuyên da thịt và lớp nhú da hô hấp giống lông đạt kích thước con người 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (The Bone-Claw Berserker)",
            slug: "ech-long-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Móng vuốt xương dài 15cm đâm thủng kim loại với lực 5000 N, cùng nhú da hô hấp tăng khả năng lấy oxy gấp hàng chục lần.",
            content: "Khi Ếch Lông đạt khối lượng 80kg (phóng to cơ học tuyến tính từ 80g, hệ số phóng to khoảng 1000 lần khối lượng, tương đương dài gấp 10 lần):\n- Móng vuốt xương hủy diệt: Móng vuốt xương ở chi sau (vốn dài 1.5mm) phóng to lên khoảng 15cm. Khi gặp nguy hiểm, cơ khép ngón co rút cực mạnh với lực 5000 N, tự bẻ gãy mấu xương đốt ngón và đâm thủng da ngón chân phóng ra ngoài. Với cấu trúc xương ngón sắc nhọn, đòn đá vuốt có khả năng xuyên thủng thép mỏng 2mm hoặc rách da thịt đối thủ sâu sắc.\n- Nhú da hô hấp sinh vây: Hàng triệu nhú da mỏng chứa đầy mao mạch bên hông tăng diện tích trao đổi chất, cho phép ếch lông 80kg hấp thụ một lượng oxy khổng lồ qua da tương đương mang ngoài của sinh vật lưỡng cư cổ đại.",
            formulas_and_data: {
              scaling_factor: 1000,
              mass_g_original: 80,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Chiều dài vuốt xương phóng to",
                  equation: "L_scaled = L_original * (M_scaled / M_original)^(1/3)",
                  result: "~15 cm"
                },
                {
                  name: "Lực phóng vuốt cơ học",
                  equation: "F_scaled = F_original * (M_scaled / M_original)^(2/3)",
                  result: "~5,000 N"
                }
              ]
            },
            p4p_score_scaled: 87,
            tier_scaled: "A",
            sources: [
              { label: "Claw retraction and bone breaking mechanisms in Trichobatrachus robustus", url: "https://doi.org/10.1098/rsbl.2008.0219" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (The Self-Mutilating Collapse)",
            slug: "ech-long-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Vết thương hở từ vuốt xương gây mất máu tử vong do áp lực máu cao, và nhú da rủ xuống dính chặt cản trở trao đổi khí.",
            content: "Trong thực tế vật lý sinh học:\n- Bi kịch tự thương (Self-mutilation failure): Ở 80g, việc bẻ xương đâm xuyên da chỉ gây ra vết thương siêu nhỏ tự lành nhờ cục máu đông tức thời. Nhưng ở 80kg, áp lực máu động mạch của sinh vật phóng to cao gấp nhiều lần (~80-100 mmHg). Việc tự bẻ xương đâm thủng ngón chân sẽ xé toạc các động mạch ngón chân chính, gây xuất huyết ồ ạt không thể kiểm soát, dẫn tới sốc mất máu tử vong chỉ sau vài lần phóng vuốt.\n- Sụp đổ hô hấp da: Ngoài nước, các nhú da mỏng giống như lông sẽ rủ xuống, dính bết vào nhau do lực căng bề mặt nước và chất nhầy. Sự dính chùm này làm giảm 90% diện tích tiếp xúc với không khí, khiến ếch ngạt thở nhanh chóng dưới trọng lượng da đè nén.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Xuất huyết động mạch do phóng vuốt",
                  issue: "Áp lực máu tăng cao kết hợp vết rách da dài 15cm gây mất máu cấp tính với lưu lượng 1.2 lít/phút."
                },
                {
                  type: "Xẹp nhú da hô hấp",
                  issue: "Lực căng bề mặt làm bết dính các sợi nhú da, giảm diện tích hấp thụ oxy qua da đi 92% ngoài môi trường nước."
                }
              ]
            },
            p4p_score_scaled: 22,
            tier_scaled: "D",
            sources: [
              { label: "Scaling of cardiovascular pressure and skin respiration in anurans", url: "https://doi.org/10.1242/jeb.02143" }
            ]
          },
          {
            title: "Đột biến thích nghi (The Wolverine Beast)",
            slug: "ech-long-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Bao mô vuốt tự lành trơn trượt co giãn, tuyến tiết keo đông máu siêu tốc và sụn hóa nhú da tự đứng vững.",
            content: "Để hoạt động hiệu quả như một quái thú chiến đấu ở kích thước 80kg, Ếch Lông tiến hóa các đột biến đặc hiệu:\n- Bao mô vuốt co giãn (Sheathed Claw Chambers): Tiến hóa các khoang da co giãn đặc biệt bọc quanh móng vuốt xương, cho phép vuốt phóng ra qua một lỗ mở tự nhiên lót biểu mô sừng hóa dẻo dai, loại bỏ hoàn toàn việc xé rách da thịt tự tổn thương.\n- Keo sinh học đông máu siêu tốc (Hyper-reactive Bio-sealant): Tuyến da ngón chân tiết ra chất hydrogel fibrinogen phản ứng tức thì với oxy, đông đặc trong 0.2 giây để bịt kín lỗ phóng vuốt ngay khi thu vuốt lại.\n- Nhú da sụn hóa nâng đỡ (Cartilage-reinforced Papillae): Mỗi nhú da hô hấp bên hông được gia cố một sợi sụn siêu mảnh chạy ở trung tâm, giúp nhú da luôn dựng thẳng trong không khí, duy trì tối đa hiệu suất lấy oxy ngoài nước.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Khoang bao vuốt tự nhiên",
                  benefit: "Loại bỏ hoàn toàn tổn thương mô mềm khi phóng/rút vuốt, bảo toàn mạch máu ngón."
                },
                {
                  type: "Sợi sụn nhú da nâng đỡ",
                  benefit: "Giữ các sợi nhú da không bị xẹp bết dính, duy trì dung lượng trao đổi khí đạt 45 lít oxy/giờ."
                }
              ]
            },
            p4p_score_scaled: 80,
            tier_scaled: "A",
            sources: [
              { label: "Bio-inspired adhesives and cartilage regeneration in amphibians", url: "https://doi.org/10.1016/j.actbio.2018.03.012" }
            ]
          }
        ]
      });
    } else if (target.id === "humpback-anglerfish") {
      whatIfData.push({
        creature_id: "humpback-anglerfish",
        title: "Nếu Cá Lồng Đèn Biển Sâu phóng to bằng con người (80kg) thì sao?",
        slug: "neu-ca-long-den-bien-sau-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài cá lồng đèn cái sở hữu cần câu phát sáng esca cộng sinh vi khuẩn và cái miệng khổng lồ răng nanh gập phóng to đạt kích thước con người 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (The Abyss Maw)",
            slug: "ca-long-den-bien-sau-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Hàm răng nanh dài 20cm gập linh hoạt nhốt chặt mục tiêu, cần câu phát ra luồng sáng 1200 lumen và cơ thể hấp thụ ánh sáng tuyệt đối.",
            content: "Khi Cá Lồng Đèn Biển Sâu (con cái) đạt khối lượng 80kg (phóng to từ ~1kg tự nhiên):\n- Cái miệng tử thần: Miệng rộng mở to hết cỡ đường kính lên tới 65cm, chứa đầy răng nanh trong suốt dài 20cm có khớp gập hướng vào trong. Lực đớp hàm đạt tới 4500 N. Một khi con mồi lọt vào miệng, răng nanh sẽ gập xuống cho mồi đi vào và dựng đứng khóa chặt hướng ra, biến khoang miệng thành ngục tối không lối thoát.\n- Cần câu esca siêu sáng: Cần câu dài 1.2 mét. Túi esca chứa hàng tỷ vi khuẩn phát quang Candidatus Enterovibrio escacola phóng to phát ra luồng sáng xanh lục cường độ 1200 lumen, đủ sức thu hút hoặc làm lóa mắt con mồi ở khoảng cách 15 mét trong bóng tối.\n- Tàng hình tuyệt đối: Lớp da sẫm màu hấp thụ 99.4% ánh sáng, không phản chiếu bất kỳ tia sáng nào, giúp nó hoàn toàn vô hình trong bóng đêm.",
            formulas_and_data: {
              scaling_factor: 80,
              mass_kg_original: 1,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Độ rộng khoang miệng mở tối đa",
                  equation: "W_scaled = W_original * (M_scaled / M_original)^(1/3)",
                  result: "~0.65m"
                },
                {
                  name: "Cường độ phát quang esca tối đa",
                  equation: "I_scaled = I_original * (M_scaled / M_original)",
                  result: "~1,200 lumens"
                }
              ]
            },
            p4p_score_scaled: 89,
            tier_scaled: "A",
            sources: [
              { label: "Bioluminescence and jaw mechanics in deep-sea anglerfishes", url: "https://doi.org/10.1111/j.1439-0469.2008.00492.x" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (The Deep-Sea Bloat)",
            slug: "ca-long-den-bien-sau-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Cơ thể nhão sụp đổ do thiếu áp suất thủy tĩnh cao, hệ tuần hoàn tê liệt và esca quá nhiệt giết chết vi khuẩn cộng sinh.",
            content: "Trong thực tế vật lý sinh học khi di chuyển lên tầng nước nông hoặc cạn:\n- Sụp đổ áp suất cơ thể: Thân hình Cá Lồng Đèn có mật độ xương cực thấp, cơ bắp nhão nhiều nước để tiết kiệm năng lượng ở áp suất cao biển sâu. Khi phóng to lên 80kg ở áp suất thường, cấu trúc cơ thể sẽ sụp đổ, nhão ra như thạch dưới tác động của trọng lực và sức cản nước kém. Trái tim yếu ớt không thể bơm máu đi khắp cơ thể phình to.\n- Khủng hoảng esca phát sáng: Ở kích thước 80kg, mật độ vi khuẩn trong esca quá đặc tạo ra nhiệt lượng nội sinh lớn. Do diện tích tản nhiệt của esca tăng chậm hơn thể tích (S/V giảm), esca bị quá nhiệt lên tới 45°C, tiêu diệt hoàn toàn vi khuẩn phát quang cộng sinh và gây hoại tử cần câu.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Quá nhiệt túi esca cộng sinh",
                  issue: "Tốc độ tản nhiệt giảm mạnh khiến nhiệt độ esca tăng vượt ngưỡng sống sót 38°C của vi khuẩn Candidatus."
                },
                {
                  type: "Sụp đổ tuần hoàn áp suất thấp",
                  issue: "Cơ tim thiếu áp lực hỗ trợ xung quanh không thể duy trì huyết áp tối thiểu 15 mmHg cho cơ thể 80kg."
                }
              ]
            },
            p4p_score_scaled: 15,
            tier_scaled: "D",
            sources: [
              { label: "Physiological adaptations and metabolic limits of deep-sea teleosts", url: "https://doi.org/10.1152/physrev.2002.82.4.1013" }
            ]
          },
          {
            title: "Đột biến thích nghi (The Bio-Luminescent Leviathan)",
            slug: "ca-long-den-bien-sau-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Xương sụn gia cố canxi chịu lực, túi esca tản nhiệt tuần hoàn máu chủ động và răng nọc tiết độc gây tê liệt.",
            content: "Để sinh tồn và thống trị ở kích thước 80kg tại mọi tầng nước, Cá Lồng Đèn tiến hóa các đột biến thích nghi:\n- Xương sụn canxi hóa (Calcified Cartilaginous Skeleton): Khung xương sụn được gia cố canxi tạo độ cứng chịu lực nén cơ học mà không làm tăng quá nhiều trọng lượng cơ thể, giúp duy trì hình dáng tròn chắc chắn.\n- Hệ tản nhiệt túi esca tuần hoàn (Vascularized Esca Cooler): Hệ mạch máu bao quanh esca phát triển mạng lưới mao mạch dày đặc nối trực tiếp về mang, sử dụng dòng nước mang lạnh đi qua để liên tục làm mát esca, giữ nhiệt độ ổn định ở 12°C.\n- Hàm răng nọc tê liệt (Neurotoxic Fangs): Các răng nanh lớn tiến hóa rãnh dẫn chất độc tê liệt thần kinh tiết ra từ tuyến thượng hàm, giúp vô hiệu hóa lập tức những con mồi lớn nhảy dụa.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Hệ làm mát esca bằng mạch máu",
                  benefit: "Giải tỏa 95% nhiệt lượng sinh ra từ vi khuẩn phát quang, duy trì ánh sáng rực rỡ liên tục."
                },
                {
                  type: "Khung sụn canxi hóa vững chãi",
                  benefit: "Chịu lực nén va chạm, duy trì áp lực đớp hàm đạt 3500 N không bị vỡ sọ."
                }
              ]
            },
            p4p_score_scaled: 79,
            tier_scaled: "B",
            sources: [
              { label: "Skeletal mineralisation and bioluminescent organ cooling in marine vertebrates", url: "https://doi.org/10.1016/j.yexcr.2016.12.011" }
            ]
          }
        ]
      });
    } else if (target.id === "king-cobra") {
      whatIfData.push({
        creature_id: "king-cobra",
        title: "Nếu Rắn Hổ Mang Chúa phóng to bằng con người (80kg) thì sao?",
        slug: "neu-ran-ho-mang-chua-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài rắn hổ mang chúa sở hữu lượng nọc độc thần kinh khổng lồ và chiều dài cơ thể phóng đại cực lớn đạt khối lượng 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (The Venomous Basilisk)",
            slug: "ran-ho-mang-chua-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Chiều dài đạt 11 mét, lực cắn 3500 N cắm ngập răng nanh 4cm bơm 4000mg nọc độc giết chết voi rừng trong 5 phút.",
            content: "Khi Rắn Hổ Mang Chúa đạt khối lượng 80kg (phóng to cơ học từ ~6kg tự nhiên):\n- Kích thước khổng lồ: Chiều dài cơ thể tăng từ 4.5 mét lên tới 11.2 mét. Khi dựng đứng đầu bành mang tự vệ, nó cao tới 2.5 mét, vượt qua chiều cao của một người trưởng thành.\n- Lực đớp và răng nanh: Răng nanh cố định dài 4cm, lực cắn hàm tăng lên 3500 N, dễ dàng cắn xuyên qua lớp giáp dày hoặc quần áo bảo hộ. Tuyến nọc cực đại chứa tới 4000 mg nọc độc thần kinh (neurotoxin) tinh khiết. Một cú cắn trúng đích có thể bơm lượng nọc đủ giết chết một con voi châu Á trưởng thành trong vòng 5 phút.\n- Gia tốc phóng đớp: Nhờ hệ cơ dọc sườn phóng to kéo giãn, gia tốc phóng đớp đạt 90 m/s2 với vận tốc bùng nổ 12 m/s.",
            formulas_and_data: {
              scaling_factor: 13.3,
              mass_kg_original: 6,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Chiều dài cơ thể phóng to",
                  equation: "L_scaled = L_original * (M_scaled / M_original)^(1/3)",
                  result: "~11.2m"
                },
                {
                  name: "Lực cắn phóng đại",
                  equation: "F_scaled = F_original * (M_scaled / M_original)^(2/3)",
                  result: "~3,500 N"
                }
              ]
            },
            p4p_score_scaled: 93,
            tier_scaled: "S",
            sources: [
              { label: "Snake venom yield and biting force scaling laws", url: "https://doi.org/10.1242/jeb.08412" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (The Slow-Crawling Giant)",
            slug: "ran-ho-mang-chua-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Tốc độ di chuyển giảm sút trầm trọng do ma sát da bụng cực lớn, và sụp đổ áp suất tuần hoàn khi dựng cao đầu.",
            content: "Trong thực tế vật lý sinh học:\n- Khủng hoảng áp huyết khi dựng đầu (Orthostatic hypotension): Khi rắn dựng đứng cơ thể cao 2.5 mét ngoài tự nhiên, trọng lực kéo máu dồn xuống phần đuôi thấp. Để bơm máu lên não cách xa 2.5 mét, tim rắn cần tạo áp suất co bóp cực lớn vượt quá 250 mmHg. Với cấu trúc tim rắn 3 ngăn chưa hoàn hảo, nó sẽ bị thiếu máu não cục bộ gây ngất xỉu ngay lập tức nếu giữ tư thế thẳng đứng quá 30 giây.\n- Ma sát kéo bụng nặng nề: Trọng lượng 80kg đè nặng lên các lớp vảy bụng mỏng manh. Khi trườn bò, lực ma sát cơ học cực lớn sẽ mài mòn lớp vảy keratin bảo vệ bụng, gây rách da, nhiễm trùng và giảm tốc độ bò xuống chỉ còn 3 km/h.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Hạ huyết áp tư thế dựng đứng",
                  issue: "Huyết áp thủy tĩnh chênh lệch 2.5m đòi hỏi áp suất tim >250 mmHg vượt quá giới hạn tim 3 ngăn."
                },
                {
                  type: "Mài mòn vảy bụng do ma sát",
                  issue: "Ứng suất ma sát vảy bụng tăng gấp 2.4 lần khiến vảy trầy xước và tiêu tốn 180% năng lượng khi trườn."
                }
              ]
            },
            p4p_score_scaled: 42,
            tier_scaled: "C",
            sources: [
              { label: "Cardiovascular physiology and gravity tolerance in snakes", url: "https://doi.org/10.1086/515854" }
            ]
          },
          {
            title: "Đột biến thích nghi (The Dragon Cobra)",
            slug: "ran-ho-mang-chua-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Van tim ngăn thất phụ trợ tăng áp huyết não, vảy bụng sừng khóa thép siêu chống mòn và hệ cơ đệm nâng đỡ.",
            content: "Để hoạt động như một siêu dã thú 80kg, Rắn Hổ Mang Chúa tiến hóa các đột biến thích nghi:\n- Van tim ngăn áp suất cao (Trabecular Heart Valve): Tâm thất tim xuất hiện vách ngăn mô cơ giả bán khép kín hoạt động giống tim 4 ngăn, tăng áp lực bơm máu lên động mạch cảnh đạt 220 mmHg giúp cấp máu ổn định cho não khi dựng đứng cao 2.5 mét.\n- Vảy bụng Composite Silicat (Silicate-Keratin Ventral Scales): Lớp vảy bụng được tích hợp thêm các hạt nano silicat tự nhiên từ đất cát, tạo độ cứng chống mài mòn vượt bậc như lớp giáp polyme công nghiệp.\n- Túi khí nâng cơ thể (Ventral Air-Sacs): Hệ thống túi khí phân bố dọc cơ thể có van xả điều khiển chủ động, giúp giảm 15% trọng lượng tiếp xúc mặt đất khi trườn nhanh.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Vách ngăn tim bán khép kín",
                  benefit: "Duy trì dòng máu lên não đạt lưu lượng ổn định 400 ml/phút ở góc đứng 90 độ."
                },
                {
                  type: "Vảy bụng nano silicat",
                  benefit: "Giảm hệ số ma sát trượt xuống 0.12, bảo vệ da bụng an toàn ở tốc độ bò 18 km/h."
                }
              ]
            },
            p4p_score_scaled: 84,
            tier_scaled: "B",
            sources: [
              { label: "Structural coloration and tribological properties of snake skin", url: "https://doi.org/10.1016/j.triboint.2014.02.008" }
            ]
          }
        ]
      });
    } else if (target.id === "sunda-pangolin") {
      whatIfData.push({
        creature_id: "sunda-pangolin",
        title: "Nếu Tê Tê Java phóng to bằng con người (80kg) thì sao?",
        slug: "neu-te-te-java-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài tê tê sở hữu lớp giáp sừng keratin ngói lợp và chiếc lưỡi siêu dính dài 30cm đạt kích cỡ của một đấu sĩ hạng trung 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Sci-Fi Armor & Whip)",
            slug: "te-te-java-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Lớp giáp vảy sừng sừng sững cản đạn đập vỡ bê tông, và đòn quật lưỡi tốc độ phản lực xé rách không khí.",
            content: "Khi Tê Tê Java đạt khối lượng 80kg (phóng to cơ học hoàn hảo):\n- Lớp giáp vảy sừng dày lên gấp nhiều lần, trở thành bộ giáp tấm di động siêu chịu lực. Với độ cứng keratin tăng lên và độ dày vảy tăng tỉ lệ thuận tuyến tính, giáp có khả năng chống chịu va chạm tương đương thép tấm 5mm, cản được cả đạn súng lục cỡ nhỏ.\n- Chiếc lưỡi dài tới 1.8 mét (phóng to từ 25cm của cơ thể 8kg), có cơ cấu kéo dài bằng các sợi cơ đặc biệt bám dọc xương ức phóng to. Vận tốc phóng lưỡi đạt 40 m/s với gia tốc 80G, tạo ra lực quật lên tới 3500 N, đủ sức quật gãy xương sườn đối thủ.\n- Vuốt chân trước dài 25cm hoạt động như lưỡi cuốc cơ học, lực đào bới đạt 6000 N, phá hủy cấu trúc bê tông dễ dàng.",
            formulas_and_data: {
              scaling_factor: 10,
              mass_kg_original: 8,
              mass_kg_scaled: 80,
              tongue_length_m_original: 0.25,
              tongue_length_m_scaled: 1.8,
              formulas: [
                {
                  name: "Chiều dài lưỡi phóng to",
                  equation: "L_scaled = L_original * (M_scaled / M_original)^(1/3)",
                  result: "1.8m"
                },
                {
                  name: "Lực quật lưỡi cơ học",
                  equation: "F_scaled = F_original * (M_scaled / M_original)^(2/3)",
                  result: "~3,500 N"
                }
              ]
            },
            p4p_score_scaled: 85,
            tier_scaled: "A",
            sources: [
              { label: "Exoskeleton mechanics and keratin structures", url: "https://doi.org/10.1016/j.jmbbm.2016.09.021" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (The Heavy Rolling Ball)",
            slug: "te-te-java-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Chết ngạt vì thiếu oxy do khoang ngực chật hẹp, và bộ giáp vảy sừng quá nặng khiến nó không thể bò nổi.",
            content: "Trong thực tế vật lý sinh học:\n- Áp lực trọng lượng và di chuyển: Trọng lượng tăng 10 lần nhưng tiết diện cơ chân chỉ tăng ~4.64 lần (theo định luật bình phương - lập phương). Bộ giáp vảy sừng nặng tới 16kg (20% trọng lượng) đè nén khiến Tê Tê Java cực kỳ chậm chạp, không thể bò nhanh hay cuộn tròn hiệu quả. Nếu cuộn lại, các cạnh vảy sừng sắc bén sẽ ép mạnh vào da bụng mềm dưới áp lực cơ học khổng lồ, gây chấn thương nội tạng.\n- Nguy cơ chết ngạt: Hệ thống lưỡi liên kết tới tận xương ức chiếm một không gian quá lớn ở khoang ngực. Khi phóng to lên 80kg, thể tích phổi cần thiết tăng gấp 10 lần nhưng do cấu trúc lưỡi chiếm dụng khoang ngực lớn, phổi bị chèn ép mạnh dẫn đến suy hô hấp nghiêm trọng khi vận động mạnh.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Cơ học chi và áp lực vỏ",
                  issue: "Tỉ lệ diện tích cơ chân trên khối lượng cơ thể giảm 53.6%, vảy ép trực tiếp vào bụng khi cuộn."
                },
                {
                  type: "Suy giảm hô hấp",
                  issue: "Khoang ngực hẹp do kết cấu lưỡi cơ ức chèn ép dung tích phổi tăng trưởng không kịp nhu cầu oxy."
                }
              ]
            },
            p4p_score_scaled: 25,
            tier_scaled: "D",
            sources: [
              { label: "Scaling of mammalian locomotion and anatomy", url: "https://doi.org/10.1242/jeb.00342" }
            ]
          },
          {
            title: "Đột biến thích nghi (The Bio-Lancer)",
            slug: "te-te-java-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Vảy sừng rỗng tổ ong giảm trọng lượng, phổi khoang ngực cấu trúc lại và lưỡi chứa độc tố tê liệt.",
            content: "Để sinh tồn ở kích thước 80kg, Tê Tê Java tiến hóa các đột biến đặc thù:\n- Vảy sừng cấu trúc tổ ong (Honeycomb Keratin): Cấu trúc bên trong vảy rỗng một phần nhưng có xương chịu lực chéo giúp giảm 45% trọng lượng giáp sừng mà vẫn giữ nguyên độ cứng cơ học.\n- Cải tiến xương ức và khoang ngực: Xương ức mở rộng ra phía ngoài và hạ thấp cơ hoành để nhường chỗ cho phổi giãn nở hoàn toàn xung quanh bó cơ lưỡi dày.\n- Lưỡi độc (Toxin-Secreting Tongue): Tuyến nước bọt phóng đại biến tính để tiết ra chất nhầy chứa độc tố neurotoxin gây tê liệt, biến đòn phóng lưỡi thành đòn ám sát tầm xa hiệu quả.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Vảy sừng tổ ong",
                  benefit: "Giảm khối lượng giáp từ 16kg xuống 8.8kg, tăng khả năng đàn hồi hấp thụ xung lực đòn đánh."
                },
                {
                  type: "Cơ hoành hạ thấp & Xương ức mở rộng",
                  benefit: "Tăng dung tích phổi thêm 35%, đảm bảo duy trì lượng oxy cho cơ thể khi chạy trốn hoặc chiến đấu."
                }
              ]
            },
            p4p_score_scaled: 75,
            tier_scaled: "B",
            sources: [
              { label: "Structural materials in biology: Keratin fibers and foams", url: "https://doi.org/10.1016/j.pmatsci.2013.01.001" }
            ]
          }
        ]
      });
    } else if (target.id === "thresher-shark") {
      whatIfData.push({
        creature_id: "thresher-shark",
        title: "Nếu Cá Mập Đuôi Roi phóng to bằng con người (80kg) thì sao?",
        slug: "neu-ca-map-duoi-roi-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài cá mập sở hữu chiếc đuôi roi tạo bóng khí chân không phóng to bằng con người (80kg - thực tế chúng nặng tới 300-500kg, đây là kịch bản thu nhỏ và tối ưu hóa tỷ lệ sức mạnh).",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (The Sonic Tail Whip)",
            slug: "ca-map-duoi-roi-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Đòn quật vây đuôi tạo ra sóng xung kích chấn động dưới nước bẻ gãy xương con mồi ở khoảng cách 1 mét.",
            content: "Cá mập đuôi roi tự nhiên nặng khoảng 300kg với vây đuôi dài 2.5 mét. Khi thu nhỏ/phóng to về tỷ lệ tối ưu 80kg:\n- Chiếc đuôi roi dài khoảng 1.5 mét sẽ trở thành vũ khí động năng cực kỳ linh hoạt. Do khối lượng giảm nhưng mật độ cơ bắp của sợi collagen chéo giữ nguyên, tốc độ quất đuôi tăng lên 24 m/s dưới nước.\n- Đòn quật đuôi giải phóng động năng lớn tạo ra bong bóng chân không (cavitation bubble) sụp đổ tức thời, giải phóng sóng xung kích chấn động tương đương 1.2 MPa áp suất nước, có khả năng làm choáng hoặc làm vỡ bóng hơi của cá mục tiêu ở cự ly gần.",
            formulas_and_data: {
              scaling_factor: 0.27,
              mass_kg_original: 300,
              mass_kg_scaled: 80,
              tail_length_m_original: 2.5,
              tail_length_m_scaled: 1.5,
              formulas: [
                {
                  name: "Năng lượng động năng quật đuôi",
                  equation: "E_k = 0.5 * I * omega^2",
                  result: "~1,200 Joules"
                },
                {
                  name: "Áp suất sóng xung kích sụp đổ bong bóng",
                  equation: "P_shock = 1.2 * rho * c * v_tail",
                  result: "~1.2 MPa"
                }
              ]
            },
            p4p_score_scaled: 90,
            tier_scaled: "S",
            sources: [
              { label: "Thresher shark hunting behavior and tail slap kinematics", url: "https://doi.org/10.1371/journal.pone.0067380" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Hydrodynamic Instability)",
            slug: "ca-map-duoi-roi-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Mất đi lực mô-men xoắn giữ thăng bằng khi quật đuôi, cơ thể tự quay vòng tròn do phản lực nước.",
            content: "Trong môi trường thực tế, việc thu nhỏ hoặc giữ tỷ lệ 80kg gây ra những hạn chế vật lý nghiêm trọng:\n- Mất cân bằng mô-men xoắn (Torque imbalance): Khi quất vây đuôi cực dài nặng nề với lực cản nước lớn, con cá mập cần một khối lượng thân trước đủ lớn (trọng lượng neo) để triệt tiêu phản lực xoay. Ở khối lượng chỉ 80kg, thân trước quá nhẹ khiến phản lực quật đuôi làm cho toàn bộ phần thân trước bị xoay ngược hướng quật. Con cá mập sẽ tự quay vòng tròn vô hại thay vì đánh trúng đích.\n- Giảm hiệu suất giữ nhiệt đối lưu: Hệ tuần hoàn giữ ấm (rete mirabile) ở mắt và não kém hiệu quả hơn khi kích thước cơ thể giảm xuống, làm giảm tốc độ xử lý thần kinh ở tầng nước lạnh sâu.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Phản lực mô-men xoắn",
                  issue: "Phản lực xoay vượt quá mô-men quán tính thân trước, làm lệch hướng bơi 45 độ sau mỗi cú đập."
                },
                {
                  type: "Suy giảm trao đổi nhiệt",
                  issue: "Tốc độ mất nhiệt qua da tăng 1.8 lần do tỷ lệ diện tích bề mặt/thể tích tăng."
                }
              ]
            },
            p4p_score_scaled: 45,
            tier_scaled: "C",
            sources: [
              { label: "Biomechanics of shark tail locomotion", url: "https://doi.org/10.1086/339618" }
            ]
          },
          {
            title: "Đột biến thích nghi (The Jet-Thrust Predator)",
            slug: "ca-map-duoi-roi-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Vây ngực mở rộng cân bằng mô-men, sợi cơ sẫm màu tăng cường giữ nhiệt, vẩy bơi giảm ma sát tối đa.",
            content: "Để hoạt động tối ưu ở kích thước 80kg, các đột biến sau được giả định:\n- Vây ngực mở rộng dạng cánh lái (Aerofoil Pectoral Fins): Diện tích vây ngực tăng 40%, có cơ khớp xoay chủ động để tạo lực nâng đối lập, triệt tiêu phản lực xoay khi quất đuôi.\n- Cơ đỏ sẫm phân bố lõi thân: Tăng mật độ mạch máu bao quanh cơ trung tâm để lưu giữ nhiệt não ngay cả khi khối lượng giảm.\n- Vảy gai siêu trượt (Riblet Denticles): Cấu trúc vảy gai nhỏ trên da tiến hóa các rãnh siêu nhỏ định hướng dòng chảy tối ưu, giảm ma sát kéo xuống 12%, cho phép đạt gia tốc bơi bùng nổ lên tới 15 m/s2.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Vây ngực cánh lái cản xoay",
                  benefit: "Triệt tiêu 95% mô-men phản lực xoay, giữ quỹ đạo đòn đánh thẳng tắp."
                },
                {
                  type: "Hệ vảy gai Riblet Denticles",
                  benefit: "Giảm ma sát kéo thủy động lực học, tăng tốc độ bơi bùng nổ tức thời."
                }
              ]
            },
            p4p_score_scaled: 80,
            tier_scaled: "A",
            sources: [
              { label: "Riblet structures for skin friction drag reduction in sharks", url: "https://doi.org/10.1016/j.ast.2018.11.002" }
            ]
          }
        ]
      });
    } else if (target.id === "tongue-eating-louse") {
      whatIfData.push({
        creature_id: "tongue-eating-louse",
        title: "Nếu Bọ Hút Máu Lưỡi Cá phóng to bằng con người (80kg) thì sao?",
        slug: "neu-bo-hut-mau-luoi-ca-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài ký sinh trùng dẹt chịu lực, có vuốt sắc bám chặt lưỡi cá hồng đạt kích thước khổng lồ 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (The Giant Chitinous Parasite)",
            slug: "bo-hut-mau-luoi-ca-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Lớp vỏ kitin dẹt siêu cứng chịu áp lực tấn, và 14 móng vuốt móc neo cắm sâu xé nát thớ cơ đối thủ.",
            content: "Khi bọ hút máu lưỡi cá (nguyên bản dài 2cm, nặng 1g) được phóng to hoàn hảo lên 80kg (tăng kích thước chiều dài gấp 43 lần):\n- Lớp vỏ kitin dẹt dẻo dai dày tới 1.5 cm, chịu được lực nén trực tiếp lên tới 10 tấn, chống chọi được hầu hết các đòn tấn công vật lý thông thường.\n- 7 cặp chân bám (14 chân) đầu mút là các móng vuốt móc neo bằng chất sừng kitin cứng hóa dài 10cm. Lực kẹp bám móc của mỗi chân đạt 1500 N (tổng cộng 21,000 N lực bám dính), một khi đã cắm chặt vào cơ thể đối thủ thì không thể gỡ ra.\n- Hàm sắc bén cắn ngập sâu, bơm chất chống đông máu phóng đại gây mất máu nhanh chóng và phá hủy thớ cơ đối thủ từ bên trong.",
            formulas_and_data: {
              scaling_factor: 43,
              mass_g_original: 1,
              mass_kg_scaled: 80,
              claw_length_cm_original: 0.2,
              claw_length_cm_scaled: 10,
              formulas: [
                {
                  name: "Lực kẹp bám móc cơ học tổng hợp",
                  equation: "F_grip = N_legs * F_leg_original * (M_scaled / M_original)^(2/3)",
                  result: "~21,000 N"
                },
                {
                  name: "Áp lực nén giới hạn vỏ kitin",
                  equation: "P_limit = sigma_y * (A_scaled / A_original)",
                  result: "~100 kN"
                }
              ]
            },
            p4p_score_scaled: 88,
            tier_scaled: "A",
            sources: [
              { label: "Biomechanical properties of crustacean cuticle", url: "https://doi.org/10.1016/j.actbio.2010.02.007" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (The Suffocating Shell)",
            slug: "bo-hut-mau-luoi-ca-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Chết ngạt sau vài phút do hệ thống mang khuếch tán không khí bất lực trước cơ thể khổng lồ.",
            content: "Trong thế giới thực tế, sinh vật chân đều (isopod) 80kg sẽ sụp đổ sinh học ngay lập tức:\n- Khủng hoảng hô hấp: Loài này hô hấp bằng mang thở (pleopods) nằm dưới bụng dưới dạng nếp gấp khuếch tán. Khi cơ thể tăng thể tích gấp 80,000 lần, nhu cầu oxy tăng 80,000 lần nhưng diện tích mang chỉ tăng 1,800 lần. Nó sẽ chết ngạt ngay lập tức ngoài không khí và thậm chí dưới nước nếu nước không chảy cực nhanh qua mang.\n- Trọng lượng vỏ đè nén: Khung xương ngoài kitin không có cấu trúc xương xốp nâng đỡ bên trong. Ở khối lượng 80kg, trọng lượng lớp vỏ tự đè bẹp các cơ quan nội tạng mềm bên trong dưới tác dụng của trọng lực Trái Đất.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Suy hô hấp cấp tính",
                  issue: "Tỷ lệ diện tích hô hấp trên thể tích giảm 44 lần, không đủ duy trì nồng độ oxy trong máu."
                },
                {
                  type: "Sụp đổ cơ học nội tạng",
                  issue: "Áp lực tự trọng vỏ kitin đè lên mô mềm vượt quá 0.2 MPa, gây dập nát nội tạng."
                }
              ]
            },
            p4p_score_scaled: 12,
            tier_scaled: "D",
            sources: [
              { label: "The scaling of gas exchange in arthropods", url: "https://doi.org/10.1152/physrev.1994.74.4.685" }
            ]
          },
          {
            title: "Đột biến thích nghi (The Bio-Interface Symbiont)",
            slug: "bo-hut-mau-luoi-ca-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Phát triển hệ thống khí quản phân nhánh chủ động, tuyến bài tiết hấp thụ kim loại nặng bảo vệ vỏ và nọc độc gây tê liệt nơ-ron.",
            content: "Để sinh tồn và chiến đấu như một quái thú 80kg, bọ ký sinh tiến hóa các đặc tính:\n- Hệ thống hô hấp khí quản giả (Pseudo-tracheal tubes): Phát triển mạng lưới ống khí phân nhánh mang oxy trực tiếp từ môi trường luồn sâu vào các mô cơ giống như côn trùng cỡ lớn.\n- Kitin hóa màng bọc cơ (Composite Chitin Shell): Lớp vỏ được gia cố thêm các sợi khoáng calcite và sắt tự hấp thu từ máu vật chủ, tăng độ bền uốn lên 3 lần mà không tăng trọng lượng.\n- Chất chống đông & Tê liệt thần kinh (Anesthetic Neurotoxin): Bơm nọc độc tổng hợp vừa ngăn đông máu vừa làm liệt nơ-ron cảm giác của mục tiêu, khiến nạn nhân không hề cảm thấy đau khi bị cắm vuốt bám.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Hệ ống khí quản giả",
                  benefit: "Tăng hiệu suất khuếch tán oxy lên 500%, cho phép hoạt động liên tục ngoài môi trường nước."
                },
                {
                  type: "Vỏ composite khoáng sắt",
                  benefit: "Độ bền uốn đạt 120 MPa, chống chịu các đòn cắn bẻ gãy từ đối thủ."
                }
              ]
            },
            p4p_score_scaled: 78,
            tier_scaled: "B",
            sources: [
              { label: "Structural reinforcement in crustacean exoskeletons", url: "https://doi.org/10.1016/j.actbio.2008.07.026" }
            ]
          }
        ]
      });
    } else if (target.id === "alaskan-wood-frog") {
      whatIfData.push({
        creature_id: "alaskan-wood-frog",
        title: "Nếu Ếch Gỗ Alaska phóng to bằng con người (80kg) thì sao?",
        slug: "neu-ech-go-alaska-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài ếch gỗ sở hữu siêu năng lực đóng băng cơ thể sống sót qua mùa đông âm độ đạt kích cỡ của một con người 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (The Cryo-Leaper)",
            slug: "ech-go-alaska-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Cú bật nhảy cao 14 mét vượt mọi chướng ngại vật và cú va chạm đạp vỡ kính cường lực.",
            content: "Khi Ếch Gỗ Alaska đạt khối lượng 80kg (phóng to cơ học tuyến tính hoàn hảo):\n- Tỉ lệ cơ đùi cực đại của loài ếch cho phép nó giải phóng lực bật nhảy khổng lồ. Ở kích thước 80kg, chiều dài đùi sau đạt khoảng 90cm. Nhờ gia tốc cất cánh 40G, lực đẩy đùi đạt tới 32,000 N, đẩy sinh vật lên độ cao 14 mét và xa tới 25 mét chỉ sau một cú bật nhảy bùng nổ.\n- Cơ chế bảo vệ lạnh tự nhiên cho phép nó chịu được những cú sốc lạnh đột ngột, đóng băng toàn bộ cơ thể trong thời gian ngắn mà không gây tổn hại cho mô cơ hay dây thần kinh hoạt động nhạy bén.",
            formulas_and_data: {
              scaling_factor: 5333,
              mass_kg_original: 0.015,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Chiều dài đùi sau phóng to",
                  equation: "L_scaled = L_original * (M_scaled / M_original)^(1/3)",
                  result: "~0.9m"
                },
                {
                  name: "Động năng bật nhảy bùng nổ",
                  equation: "E_jump = F_average * d_takeoff",
                  result: "~11,000 Joules"
                }
              ]
            },
            p4p_score_scaled: 86,
            tier_scaled: "A",
            sources: [
              { label: "Frog jumping biomechanics and power amplification", url: "https://doi.org/10.1242/jeb.00921" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (The Crystal Shatter)",
            slug: "ech-go-alaska-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Chết do tinh thể băng lớn xé rách tế bào khi đông cứng quá chậm, và xương đùi gãy vụn khi hạ cánh.",
            content: "Trong thực tế vật lý sinh học:\n- Khủng hoảng đóng băng chậm (Heat dissipation crisis): Thời gian làm lạnh và truyền nhiệt từ lõi cơ thể ra môi trường tỉ lệ nghịch với diện tích bề mặt trên thể tích (S/V). Với khối lượng 80kg (tăng 5333 lần), tỷ lệ S/V giảm hơn 17 lần. Quá trình đông lạnh lõi cơ thể kéo dài hàng chục giờ thay vì vài chục phút. Sự làm lạnh quá chậm này dẫn tới hiện tượng macro-crystallization (tinh thể băng ngoại bào phát triển quá to), đâm thủng vách tế bào, phá hủy hoàn toàn mạch máu và các cơ quan nội tạng.\n- Giới hạn chịu lực xương: Khi rơi từ độ cao nhảy 14 mét xuống đất, lực tác động va chạm đạt hơn 50,000 N. Xương đùi ếch mỏng không có tủy xương chịu lực nén cao sẽ gãy vụn ngay lập tức khi hạ cánh.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Tốc độ đông đặc và tinh thể băng",
                  issue: "Thời gian đóng băng lõi tăng từ 2 giờ lên 34 giờ, gây phá hủy tế bào do tinh thể băng khổng lồ."
                },
                {
                  type: "Sức bền xương amphibians",
                  issue: "Ứng suất nén của xương rỗng vượt quá giới hạn bền uốn 120 MPa khi tiếp đất."
                }
              ]
            },
            p4p_score_scaled: 15,
            tier_scaled: "D",
            sources: [
              { label: "Cryobiology and thermal properties of freeze-tolerant frogs", url: "https://doi.org/10.1152/ajpregu.1999.276.6.R1460" }
            ]
          },
          {
            title: "Đột biến thích nghi (The Cryo-Stasis Knight)",
            slug: "ech-go-alaska-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Hệ thống mạch máu xương gia cố, protein chống đông máu điều khiển tinh thể băng, và mô cơ hấp thụ xung lực.",
            content: "Để sinh tồn ở kích thước 80kg, Ếch Gỗ Alaska tiến hóa các đột biến thích nghi sau:\n- Protein kiểm soát băng (Ice-Structuring Proteins - ISPs): Tiết ra lượng lớn ISPs siêu hoạt tính liên kết chặt chẽ vào bề mặt các hạt đá sơ khởi, giữ kích thước tinh thể băng luôn dưới 10 micromet (micro-crystallization) bất kể tốc độ làm lạnh chậm.\n- Xương xốp đặc hóa (Vascularized Trabecular Bones): Cấu trúc xương chi được gia cố bằng các thớ xương xốp ngập khoáng chất canxi phosphat tăng khả năng chịu nén ngang ngửa động vật có vú.\n- Hệ thống đệm nước nội bào (Aquaporin-Hydrogel): Màng tế bào tăng lượng Aquaporin loại mới kết hợp với hydrogel sinh học làm chậm quá trình đông đá tế bào, duy trì khả năng phục hồi thần kinh nhanh chóng.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Protein định hình tinh thể băng",
                  benefit: "Duy trì kích thước tinh thể băng dưới 10 micromet, loại bỏ hoàn toàn tổn thương cơ học tế bào."
                },
                {
                  type: "Cấu trúc xương đặc hóa",
                  benefit: "Tăng giới hạn chịu ứng suất nén của xương lên 210 MPa, hấp thụ lực hạ cánh an toàn."
                }
              ]
            },
            p4p_score_scaled: 78,
            tier_scaled: "B",
            sources: [
              { label: "Aquaporins and ice nucleation in freeze-tolerant vertebrates", url: "https://doi.org/10.1016/j.cryobiol.2015.08.003" }
            ]
          }
        ]
      });
    } else if (target.id === "alligator-snapping-turtle") {
      whatIfData.push({
        creature_id: "alligator-snapping-turtle",
        title: "Nếu Rùa Cá Sấu phóng to thành quái thú khổng lồ (800kg) thì sao?",
        slug: "neu-rua-ca-sau-phong-to-thanh-quai-thu-khong-lo-800kg",
        description: "Phân tích giả thuyết khi loài rùa cá sấu tiền sử sở hữu mỏ khoằm và lực cắn hủy diệt đạt kích thước quái thú khổng lồ nặng 800kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (The Devastator Shell)",
            slug: "rua-ca-sau-800kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Lực cắn 4600 PSI phá hủy sắt thép dễ dàng, và lớp mai dày 15cm cản phá mọi đòn va đập lực tấn.",
            content: "Khi Rùa Cá Sấu đạt khối lượng 800kg (phóng to gấp 10 lần khối lượng trung bình tự nhiên):\n- Lực cắn phóng đại cơ học: Lực cắn ban đầu từ 1,000 PSI tăng lên gấp 10^(2/3) ≈ 4.64 lần, đạt khoảng 4,640 PSI (~32 MPa). Áp lực này vượt trội so với loài cá sấu lớn nhất hiện nay, cho phép nó cắn đứt đôi các tấm kim loại dày hoặc bẻ đôi thân cây gỗ đường kính 30cm chỉ trong một nhát sập hàm.\n- Mai rùa dày tới 15 cm bằng chất sừng keratin và các tấm xương hợp nhất cứng cáp, đóng vai trò như lá chắn phòng thủ tối thượng chịu được va chạm trực tiếp của các loại vũ khí hạng nặng.",
            formulas_and_data: {
              scaling_factor: 10,
              mass_kg_original: 80,
              mass_kg_scaled: 800,
              formulas: [
                {
                  name: "Lực cắn phóng đại",
                  equation: "F_bite_scaled = F_bite_original * (M_scaled / M_original)^(2/3)",
                  result: "~4,640 PSI (~20,800 N)"
                },
                {
                  name: "Độ dày mai xương bảo vệ",
                  equation: "T_scaled = T_original * (M_scaled / M_original)^(1/3)",
                  result: "~15 cm"
                }
              ]
            },
            p4p_score_scaled: 92,
            tier_scaled: "S",
            sources: [
              { label: "Bite force estimation and jaw mechanics in turtles", url: "https://doi.org/10.1002/jez.1643" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (The Immobile Stone)",
            slug: "rua-ca-sau-800kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Lớp mai nặng nề chèn ép phổi gây khó thở, và sự suy giảm 53% khả năng hấp thụ oxy qua cloaca.",
            content: "Trong thực tế vật lý sinh học:\n- Suy giảm hô hấp cloaca (Cloacal respiration failure): Kỳ nghỉ đông dưới nước sâu của loài rùa Snapping dựa vào việc khuếch tán oxy qua niêm mạc cloaca. Khi khối lượng tăng 10 lần, nhu cầu oxy tăng 10 lần nhưng diện tích da cloaca chỉ tăng ~4.64 lần (giảm tỉ lệ S/V đi 53%). Rùa sẽ chết đuối nhanh chóng khi ngủ đông dưới nước sâu nếu không nổi lên thở liên tục.\n- Sụp đổ hệ vận động: Khớp sprawling (chân bẹt ngang nách) của rùa chịu mô-men uốn cực lớn từ trọng lượng 800kg đè nặng. Các khớp xương chi trước chịu lực uốn quá mức, khiến nó gần như hoàn toàn bất động trên cạn, chỉ có thể nằm im một chỗ chờ mồi.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Hiệu suất hô hấp cloaca",
                  issue: "Tỉ lệ diện tích bề mặt cloaca trên thể tích cơ thể giảm 53.6%, không thể ngủ đông dưới nước."
                },
                {
                  type: "Ứng suất uốn xương chi",
                  issue: "Mô-men uốn khớp vai tăng gấp 21.5 lần, vượt giới hạn an toàn của cấu trúc sprawling."
                }
              ]
            },
            p4p_score_scaled: 38,
            tier_scaled: "D",
            sources: [
              { label: "Allometry of respiration and bone mechanics in reptiles", url: "https://doi.org/10.1242/jeb.01822" }
            ]
          },
          {
            title: "Đột biến thích nghi (The Bio-Dreadnought)",
            slug: "rua-ca-sau-800kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Lớp vỏ cấu trúc bọt xương xốp tổ ong siêu nhẹ, và phổi mở rộng cơ hoành giả bọc cơ ngực.",
            content: "Để hoạt động hiệu quả ở kích thước quái thú 800kg, Rùa Cá Sấu cần những đột biến tiến hóa sâu sắc:\n- Mai xốp khí tổ ong (Trabecular Shell Structure): Lớp xương bên trong mai tiến hóa dạng lưới xốp chứa túi khí giống cấu trúc xương chim, giúp giảm 40% khối lượng mai mà không giảm độ bền chịu lực nén.\n- Hệ thống phổi chủ động (Active Diaphragmatic Muscle): Phát triển cơ hoành giả liên kết trực tiếp vào cơ bả vai và cơ háng, giúp kéo giãn phổi chủ động, tăng dung tích trao đổi khí lên 150% để giải quyết sự thiếu hụt oxy.\n- Khớp bán dựng (Semi-erect limbs): Các chi tiến hóa xoay hướng thẳng đứng hơn dưới thân mình giống như loài cá sấu cổ đại chân cao, giảm mô-men xoắn chịu lực uốn ở vai.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Khớp chi bán dựng và mai giảm trọng",
                  benefit: "Giảm lực mô-men xoắn uốn lên khớp chi đi 70%, cho phép rùa di chuyển với vận tốc 8 km/h trên cạn."
                },
                {
                  type: "Hệ thống hô hấp phổi cải tiến",
                  benefit: "Cung cấp lượng dưỡng khí đạt 180 lít/giờ, duy trì hoạt động săn mồi tích cực."
                }
              ]
            },
            p4p_score_scaled: 82,
            tier_scaled: "A",
            sources: [
              { label: "Evolution of turtle shell microstructure and bone density", url: "https://doi.org/10.1002/jmor.10821" }
            ]
          }
        ]
      });
    } else if (target.id === "asian-water-monitor") {
      whatIfData.push({
        creature_id: "asian-water-monitor",
        title: "Nếu Kỳ Đà Nước Châu Á phóng to bằng con người (80kg) thì sao?",
        slug: "neu-ky-da-nuoc-chau-a-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài kỳ đà nước có cú vụt đuôi roi dũng mãnh và nọc độc giãn mạch đạt kích thước 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (The Swamp Dragon)",
            slug: "ky-da-nuoc-chau-a-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Đuôi roi quật lực 4800 N bẻ gãy chi con mồi, và hàm độc tố gây giãn mạch tử vong tức thì.",
            content: "Khi Kỳ Đà Nước Châu Á đạt khối lượng 80kg (tăng gấp 4 lần khối lượng trung bình tự nhiên):\n- Cú quất đuôi hủy diệt: Đuôi dẹp hoạt động như mái chèo phóng to lên độ dài 2.4 mét. Lực quật đuôi tăng theo tỷ lệ diện tích cơ chéo đạt tới 4,800 N, dễ dàng quật ngã hoặc gãy chân các con mồi lớn như nai hay lợn rừng.\n- Đòn cắn độc và cào xé: Bộ vuốt sắc dài 12cm cào rách da thịt dưới lực cào 3000 N. Đồng thời, tuyến độc hàm dưới tiết ra lượng độc tố dồi dào, gây hạ huyết áp cực nhanh và ức chế đông máu khiến con mồi mất máu tử vong chỉ sau vài phút bị cắn.",
            formulas_and_data: {
              scaling_factor: 4,
              mass_kg_original: 20,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Chiều dài đuôi phóng đại",
                  equation: "L_tail_scaled = L_tail_original * (M_scaled / M_original)^(1/3)",
                  result: "~2.4m"
                },
                {
                  name: "Lực quật đuôi động năng",
                  equation: "F_whip = F_original * (M_scaled / M_original)^(2/3)",
                  result: "~4,800 N"
                }
              ]
            },
            p4p_score_scaled: 88,
            tier_scaled: "A",
            sources: [
              { label: "Monitor lizard tail whipping kinematics and muscle force", url: "https://doi.org/10.1242/jeb.02521" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (The Sluggish Giant)",
            slug: "ky-da-nuoc-chau-a-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Thời gian hấp thu nhiệt tăng vọt làm cơ thể đình trệ buổi sáng, và khớp sprawling mỏi mệt cực độ.",
            content: "Trong thực tế vật lý sinh học:\n- Khủng hoảng nhiệt độ (Thermal inertia lag): Ectothermic (sinh vật biến nhiệt) dựa vào phơi nắng để khởi động trao đổi chất. Ở khối lượng 80kg, thời gian phơi nắng cần thiết để đạt thân nhiệt hoạt động 35°C tăng gấp 2.5 lần (lên tới 4-5 tiếng). Cho đến trưa, nó sẽ cực kỳ chậm chạp và dễ bị tấn công.\n- Ứng suất uốn chi bò ngang: Tư thế bò ngang (sprawling limbs) tạo ra mô-men uốn khổng lồ lên xương humerus và femur. Với khối lượng 80kg, việc nâng cơ thể bò sát mặt đất đòi hỏi năng lượng cơ bắp khổng lồ, khiến kỳ đà kiệt sức chỉ sau vài phút bò liên tục.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Thời gian phơi nắng khởi động",
                  issue: "Tỷ số diện tích hấp thụ nhiệt trên khối lượng cơ thể giảm 37%, làm tăng thời gian phơi nắng lên 300 phút."
                },
                {
                  type: "Bền mỏi của cơ xương sprawling",
                  issue: "Nhu cầu oxy hóa và ATP cơ vai tăng gấp 8 lần để chống đỡ trọng lực khi bò."
                }
              ]
            },
            p4p_score_scaled: 40,
            tier_scaled: "D",
            sources: [
              { label: "Ectotherm thermodynamics and scaling of locomotor energetics", url: "https://doi.org/10.1086/515886" }
            ]
          },
          {
            title: "Đột biến thích nghi (The Warm-Blooded Apex)",
            slug: "ky-da-nuoc-chau-a-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Hệ tuần hoàn van tim khép kín tăng hiệu suất hô hấp, và cấu trúc chân đứng thẳng giảm mô-men xoắn.",
            content: "Để sinh tồn ở kích thước 80kg, Kỳ Đà Nước tiến hóa các đột biến vượt bậc:\n- Bán nội nhiệt tự ấm (Facultative Endothermy): Phát triển cơ chế sinh nhiệt qua cơ xương và hệ tuần hoàn ngược dòng vùng lõi, tự duy trì thân nhiệt hoạt động 32°C mà không phụ thuộc hoàn toàn vào phơi nắng.\n- Tư thế chi cải tiến (Erect Limb Posture): Khớp háng và khớp vai xoay thẳng đứng xuống dưới thân giống như khủng long ăn thịt nhỏ hoặc động vật có vú, chuyển hoàn toàn lực uốn thành lực nén dọc thớ xương đùi gia cố đặc.\n- Hệ thống tim mạch áp lực cao: Vách ngăn tâm thất tim phát triển hoàn thiện để cô lập dòng máu giàu oxy và máu nghèo oxy, tăng áp suất động mạch lên 120 mmHg để cấp máu nhanh cho các cơ vận động đuôi.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Sinh nhiệt nội sinh vùng lõi",
                  benefit: "Tự duy trì thân nhiệt tối ưu 32°C bất kể thời tiết, tăng tốc độ phản xạ thần kinh thêm 40%."
                },
                {
                  type: "Cấu trúc chi thẳng đứng",
                  benefit: "Giảm tiêu hao năng lượng vận động đi 65%, cho phép chạy nước rút đạt 32 km/h."
                }
              ]
            },
            p4p_score_scaled: 83,
            tier_scaled: "B",
            sources: [
              { label: "Cardiovascular adaptations and metabolic rates in giant varanids", url: "https://doi.org/10.1152/ajpregu.1995.268.4.R891" }
            ]
          }
        ]
      });
    } else if (target.id === "cape-buffalo") {
      whatIfData.push({
        creature_id: "cape-buffalo",
        title: "Nếu Trâu Rừng Châu Phi thu nhỏ bằng con người (80kg) thì sao?",
        slug: "neu-trau-rung-chau-phi-thu-nho-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài trâu rừng sở hữu cặp sừng cứng cáp hình cánh cung và cơ bắp cuồn cuộn được thu nhỏ về kích thước 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (The Compact Charger)",
            slug: "trau-rung-chau-phi-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Cú húc tốc độ cao giải phóng áp lực lớn đâm xuyên lá chắn và lực kéo siêu phàm ở kích thước nhỏ.",
            content: "Khi Trâu Rừng Châu Phi thu nhỏ về khối lượng 80kg (tỷ lệ cơ học tối ưu hóa):\n- Mật độ cơ bắp cô đọng cực cao: Sức mạnh cơ bắp của động vật móng guốc được bảo toàn trên một khung xương nhỏ gọn. Lực kéo cơ học đạt tới 5000 N, tương đương 6 lần trọng lượng cơ thể.\n- Cú húc sừng hủy diệt: Cặp sừng xương bọc keratin thu nhỏ dài khoảng 30cm, hợp nhất ở trán tạo thành tấm khiên chắn dày. Khi lao đi with vận tốc 50 km/h (13.8 m/s), động năng va chạm đạt tới 7600 Joules. Do diện tích tiếp xúc đầu sừng nhọn nhỏ (~2 cm2), áp suất va chạm tức thời tại điểm tiếp xúc đạt tới 38 MPa, đủ sức đâm thủng và phá hủy các cấu trúc kim loại mỏng hoặc gỗ dày.",
            formulas_and_data: {
              scaling_factor: 0.43,
              mass_kg_original: 600,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Động năng cú húc va chạm",
                  equation: "E_k = 0.5 * m * v^2",
                  result: "~7,600 Joules"
                },
                {
                  name: "Áp suất va chạm đầu sừng",
                  equation: "P = F / A = (m * a) / A",
                  result: "~38 MPa"
                }
              ]
            },
            p4p_score_scaled: 83,
            tier_scaled: "A",
            sources: [
              { label: "Bovine horn mechanics and impact resistance", url: "https://doi.org/10.1016/j.jmbbm.2010.09.005" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (The Hypothermic Ruminant)",
            slug: "trau-rung-chau-phi-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Mất nhiệt nhanh chóng do tỷ lệ diện tích bề mặt/thể tích tăng, và hệ thống tiêu hóa cỏ thô trở nên kém hiệu quả.",
            content: "Trong thực tế vật lý sinh học:\n- Khủng hoảng nhiệt lượng: Khi thu nhỏ từ 600kg về 80kg, tỷ lệ diện tích bề mặt trên thể tích (S/V) tăng lên khoảng 2.0 lần. Động vật nội nhiệt (biến nhiệt/đồng nhiệt) nhỏ mất nhiệt qua da nhanh hơn rất nhiều. Với lớp da mỏng nguyên bản của trâu rừng châu Phi, nó sẽ nhanh chóng bị hạ thân nhiệt trầm trọng trong môi trường gió lạnh trừ khi liên tục ăn và tỏa nhiệt.\n- Kém hiệu quả tiêu hóa: Hệ thống dạ dày 4 túi (ruminant) của trâu rừng cần thời gian ủ men cỏ thô rất lâu. Khi thu nhỏ về 80kg, tốc độ trao đổi chất tăng lên theo định luật Kleiber (tăng khoảng 1.6 lần trên mỗi kg khối lượng). Hệ tiêu hóa nhỏ hơn không thể xử lý đủ lượng chất xơ thô kịp nhu cầu năng lượng cao mới, dẫn tới suy kiệt chất dinh dưỡng.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Tổn thất nhiệt lượng đối lưu",
                  issue: "Tốc độ tỏa nhiệt qua da tăng 1.95 lần do diện tích bề mặt tương đối tăng, gây nguy cơ hạ thân nhiệt cấp tính."
                },
                {
                  type: "Hạn chế dạ dày bốn túi",
                  issue: "Thời gian lên men cỏ dài không đáp ứng được tốc độ trao đổi chất tăng 60% theo định luật Kleiber ở kích thước 80kg."
                }
              ]
            },
            p4p_score_scaled: 32,
            tier_scaled: "D",
            sources: [
              { label: "Allometric scaling of mammalian metabolism and digestion", url: "https://doi.org/10.1086/284124" }
            ]
          },
          {
            title: "Đột biến thích nghi (The Tundra Charger)",
            slug: "trau-rung-chau-phi-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Lớp lông tơ cách nhiệt dày đặc, hệ tiêu hóa dạ cỏ chuyển sang lên men nhanh và tuần hoàn máu vùng sừng co thắt.",
            content: "Để sinh tồn ở kích thước 80kg, trâu rừng tiến hóa các đột biến thích nghi:\n- Lông tơ kép cách nhiệt (Double-coat Fur): Phát triển lớp lông tơ mịn lót dưới lớp lông cứng chống thấm nước, tăng hệ số cách nhiệt lên 2.5 lần để giữ ấm vùng lõi.\n- Dạ cỏ cải tiến lên men nhanh (Fast-transit Rumen): Dạ cỏ tiến hóa hệ vi sinh vật lên men tốc độ cao kết hợp cấu trúc nhung mao dạ dày rộng hơn để hấp thu nhanh các axit béo bay hơi tự do.\n- Cơ chế co mạch sừng chủ động: Hệ thống mạch máu nuôi sừng có khả năng co thắt hoàn toàn khi trời lạnh để tránh thất thoát nhiệt lượng qua bề mặt sừng lớn.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Lông kép cách nhiệt vùng lõi",
                  benefit: "Giảm 60% lượng nhiệt thất thoát ra môi trường, duy trì thân nhiệt ổn định 38.5°C."
                },
                {
                  type: "Vi sinh dạ cỏ tối ưu",
                  benefit: "Tăng tốc độ chuyển hóa xenlulozo thêm 75%, đáp ứng đủ năng lượng cho chuyển hóa Kleiber."
                }
              ]
            },
            p4p_score_scaled: 76,
            tier_scaled: "B",
            sources: [
              { label: "Adaptations in small ruminants and thermal regulation", url: "https://doi.org/10.1016/j.smallrumres.2012.04.011" }
            ]
          }
        ]
      });
    } else if (target.id === "coconut-crab") {
      whatIfData.push({
        creature_id: "coconut-crab",
        title: "Nếu Cua Dừa phóng to bằng con người (80kg) thì sao?",
        slug: "neu-cua-dua-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài giáp xác trên cạn lớn nhất thế giới sở hữu cặp càng kẹp dừa cực khỏe đạt khối lượng tương đương 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (The Titanium Crusher)",
            slug: "cua-dua-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Lực kẹp càng đạt 60,000 N nghiền nát mọi chướng ngại vật và bộ giáp kitin dày cản phá mọi va đập.",
            content: "Khi Cua Dừa đạt khối lượng 80kg (phóng to tuyến tính từ 4kg):\n- Lực kẹp càng hủy diệt: Càng cua dừa tự nhiên kẹp mạnh gấp 90 lần trọng lượng của nó (~3300 N ở cua 4kg). Khi phóng to lên 80kg, lực kẹp càng tăng theo tỷ lệ diện tích mặt cắt ngang cơ chéo tăng 20^(2/3) ≈ 7.37 lần, đạt tới 24,000 N đến 60,000 N. Lực này vượt qua sức nghiền của hàm cá mập trắng lớn, dễ dàng bóp nát xương đùi động vật lớn hoặc cắt đứt kim loại.\n- Giáp ngoài siêu cứng: Lớp vỏ kitin dầy lên 1.2cm được canxi hóa cực cứng, đóng vai trò như lớp giáp xe tăng hấp thụ các chấn động va chạm.",
            formulas_and_data: {
              scaling_factor: 20,
              mass_kg_original: 4,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực kẹp càng cua phóng đại",
                  equation: "F_pinch_scaled = F_pinch_original * (M_scaled / M_original)^(2/3)",
                  result: "~24,000 N (Lên tới 60,000 N)"
                },
                {
                  name: "Ứng suất nén phá hủy vỏ",
                  equation: "sigma = F / A_shell",
                  result: "~90 MPa"
                }
              ]
            },
            p4p_score_scaled: 94,
            tier_scaled: "S",
            sources: [
              { label: "Pincer force and scaling in giant coconut crabs", url: "https://doi.org/10.1371/journal.pone.0166108" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (The Asphyxiated Shell)",
            slug: "cua-dua-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Chết ngạt do branchiostegal lung thiếu diện tích khuếch tán oxy và vỏ quá nặng gãy chân bò.",
            content: "Trong thực tế vật lý sinh học:\n- Suy giảm hô hấp nghiêm trọng: Cua dừa thở bằng phổi lá mang (branchiostegal lung) dựa vào sự ẩm ướt và khuếch tán thụ động. Khi phóng to lên 80kg (tăng 20 lần khối lượng), nhu cầu oxy tăng 20 lần nhưng diện tích bề mặt phổi chỉ tăng 20^(2/3) ≈ 7.37 lần. Khả năng cung cấp oxy giảm đi 63%, khiến cua rơi vào trạng thái thiếu oxy kinh niên và chết ngạt sau vài phút vận động.\n- Sụp đổ cơ học chân: Khung xương ngoài kitin rất nặng chiếm 35% khối lượng cơ thể (28kg vỏ). Trọng lượng cơ thể đè nặng lên các khớp chân mảnh khảnh hướng ngang (sprawling limbs), tạo mô-men uốn quá tải khiến chân cua gãy vụn khi cố gắng nhấc mình lên bò.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Hiệu suất khuếch tán khí qua phổi lá mang",
                  issue: "Tỉ số diện tích phổi trên thể tích cơ thể giảm 63%, gây thiếu hụt oxy nghiêm trọng khi bò."
                },
                {
                  type: "Ứng suất uốn khớp chi bò ngang",
                  issue: "Mô-men uốn tại khớp chân tăng gấp 147 lần, vượt quá giới hạn uốn 75 MPa của kitin tự nhiên."
                }
              ]
            },
            p4p_score_scaled: 18,
            tier_scaled: "D",
            sources: [
              { label: "Respiratory organs of terrestrial crabs and scaling limits", url: "https://doi.org/10.1242/jeb.204.14.2483" }
            ]
          },
          {
            title: "Đột biến thích nghi (The Chitinous Titan)",
            slug: "cua-dua-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Phổi lá mang gấp nếp sâu có van thông khí chủ động, vỏ rỗng xốp tổ ong, và sợi cơ liên kết chéo gia cố sắt.",
            content: "Để hoạt động hiệu quả ở kích thước 80kg, Cua Dừa cần những đột biến thích nghi vượt bậc:\n- Phổi lá mang xếp nếp sâu chủ động (Active Folded Lung): Các nếp gấp màng phổi tăng mật độ lên 4 lần kết hợp các bó cơ thành ngực co bóp nhịp nhàng bơm hút khí chủ động, đảm bảo đủ oxy.\n- Lớp vỏ kitin cấu trúc tổ ong (Honeycomb Exoskeleton): Lớp vỏ trong rỗng xốp làm giảm 50% khối lượng vỏ, lớp vỏ ngoài kết hợp các liên kết ion kẽm và sắt tự hấp thụ tăng độ bền uốn lên 2.5 lần.\n- Khớp chi đứng thẳng hơn: Các chi tiến hóa góc nghiêng hẹp hơn dưới thân mình để truyền tải trọng lượng trực tiếp thành lực nén dọc thay vì lực uốn ngang.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Thông khí phổi chủ động",
                  benefit: "Tăng lưu lượng oxy hấp thụ lên 300%, loại bỏ nguy cơ ngạt thở khi vận động mạnh."
                },
                {
                  type: "Vỏ kitin tổ ong gia cố kẽm",
                  benefit: "Giảm khối lượng bộ giáp từ 28kg xuống 15kg, tăng giới hạn uốn khớp chi lên 180 MPa."
                }
              ]
            },
            p4p_score_scaled: 85,
            tier_scaled: "A",
            sources: [
              { label: "Zinc and calcium mineralization in crustacean cuticles", url: "https://doi.org/10.1016/j.jsb.2007.09.014" }
            ]
          }
        ]
      });
    } else if (target.id === "giant-pacific-octopus") {
      whatIfData.push({
        creature_id: "giant-pacific-octopus",
        title: "Nếu Bạch Tuộc Khổng Lồ Thái Bình Dương lên cạn ở kích thước 80kg thì sao?",
        slug: "neu-bach-tuoc-khong-lo-thai-binh-duong-len-can-80kg",
        description: "Phân tích giả thuyết khi loài bạch tuộc thông minh sở hữu 8 xúc tu bám dính dày đặc và khả năng ngụy trang đỉnh cao hoạt động trên cạn ở kích thước 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (The Eight-Armed Chameleon)",
            slug: "bach-tuoc-khong-lo-tbd-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "8 xúc tu kẹp siết lực tấn với hàng ngàn giác hút, ngụy trang tàng hình hoàn hảo và trí khôn vượt bậc.",
            content: "Khi Bạch Tuộc Khổng Lồ Thái Bình Dương đạt khối lượng 80kg trên cạn (theo cơ học lý thuyết):\n- Sức mạnh co siết của xúc tu: Mỗi xúc tu dài tới 3 mét chứa hàng triệu bó cơ chéo xoắn liên kết dọc thân xúc tu. Lực siết tổng hợp của 8 xúc tu đạt tới 15,000 N, đủ sức bóp nghẹt động vật có vú lớn.\n- Giác hút chân không siêu dính: Khoảng 1,600 giác hút phóng to hoạt động riêng lẻ, mỗi giác hút có đường kính 5cm có lực bám dính chênh lệch áp suất đạt 0.1 MPa (100 kPa). Tổng lực dính của một xúc tu bám chặt lên bề mặt phẳng có thể nâng đỡ vật nặng tới 800kg.\n- Ngụy trang tàng hình: Hàng triệu tế bào sắc tố (chromatophores) và tế bào phản quang (iridophores) điều chỉnh co thắt tức thì, giúp bạch tuộc hòa lẫn vào môi trường đất đá trên cạn chỉ trong 0.5 giây.",
            formulas_and_data: {
              scaling_factor: 2.28,
              mass_kg_original: 35,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực bám dính giác hút tối đa dưới áp suất khí quyển",
                  equation: "F_adhesion = N_suckers * P_atm * A_sucker",
                  result: "~12,000 N (mỗi xúc tu)"
                },
                {
                  name: "Lực siết xoắn cơ xúc tu",
                  equation: "T_whip = F_muscle * r_arm",
                  result: "~4,500 N.m"
                }
              ]
            },
            p4p_score_scaled: 86,
            tier_scaled: "A",
            sources: [
              { label: "Suction power and muscle hydrostats in cephalopods", url: "https://doi.org/10.1242/jeb.00512" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (The Gelatinous Collapse)",
            slug: "bach-tuoc-khong-lo-tbd-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Cơ thể xẹp lép thành đống thạch do thiếu lực nâng thủy tĩnh, ngạt thở nhanh chóng và khô héo da.",
            content: "Trong thực tế vật lý sinh học khi lên cạn:\n- Sụp đổ cấu trúc thủy tĩnh (Hydrostatic skeleton collapse): Bạch tuộc không có xương trong hay xương ngoài, hình dáng cơ thể được duy trì nhờ áp suất nước xung quanh. Khi lên cạn ở khối lượng 80kg dưới trọng lực, các sợi cơ không có điểm tựa nâng đỡ sẽ bị xẹp lép thành một đống thạch dẹp. Bạch tuộc không thể bò hay nhấc xúc tu lên, nội tạng bị đè nén dưới áp lực tự trọng dẫn tới tổn thương vĩnh viễn.\n- Suy hô hấp và mất nước cấp tính: Mang của bạch tuộc bị dính chặt vào nhau ngoài không khí do lực căng bề mặt nước, diện tích trao đổi khí giảm 95% gây ngạt thở sau vài phút. Làn da ẩm ướt mỏng manh bốc hơi nước cực nhanh ngoài không khí dẫn đến mất cân bằng điện giải tức thì.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Sụp đổ khung xương thủy tĩnh",
                  issue: "Không có lực nâng của nước, ứng suất đè nén lên các mô mềm bên trong vượt quá 15 kPa gây dập nát mao mạch."
                },
                {
                  type: "Xẹp mang và giảm diện tích hô hấp",
                  issue: "Lực căng bề mặt làm xẹp các phiến mang dính chùm, cắt đứt hoàn toàn lượng oxy khuếch tán vào máu."
                }
              ]
            },
            p4p_score_scaled: 10,
            tier_scaled: "D",
            sources: [
              { label: "Mechanics of hydrostatic skeletons and cephalopod respiration", url: "https://doi.org/10.1146/annurev.marine.010908.163750" }
            ]
          },
          {
            title: "Đột biến thích nghi (The Land Leviathan)",
            slug: "bach-tuoc-khong-lo-tbd-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Trục xương sụn linh hoạt dọc xúc tu, da sừng nhầy bảo vệ chống bốc hơi và hệ hô hấp phổi khí quản kép.",
            content: "Để sinh tồn và thống trị đất ẩm ở kích thước 80kg, bạch tuộc tiến hóa các thích nghi thần kỳ:\n- Trục xương sụn dẻo (Endoskeletal Cartilage Rods): Tiến hóa các thanh sụn đàn hồi (giống như sụn mũi hoặc cuttlebone) chạy dọc lõi trung tâm của 8 xúc tu và vùng đầu, làm giá đỡ vững chắc chịu lực nén chống lại trọng lực Trái Đất mà vẫn giữ được sự linh hoạt uốn dẻo cực hạn.\n- Da sừng nhầy khóa ẩm (Lipid-Secreting Keratinized Skin): Lớp da biểu bì được bao phủ bởi các tế bào tiết lipid chống bốc hơi kết hợp chất nhầy dày đặc bảo vệ cơ thể khỏi bị khô ráp suốt 24 giờ ngoài không khí.\n- Khoang hô hấp khí quản (Vascularized Land-Lung): Khoang áo tiến hóa thành buồng phổi khép kín với các van đóng mở chủ động, thành buồng phổi lót mạch máu dày đặc khuếch tán oxy không khí trực tiếp.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Trục sụn xúc tu chịu lực",
                  benefit: "Chống chịu lực nén trọng lực lên tới 1200 N, cho phép nâng thân mình cao 60cm bò vững trên cạn."
                },
                {
                  type: "Hệ thống da khóa ẩm lipid",
                  benefit: "Giảm 92% tốc độ bốc hơi nước qua biểu bì, bảo vệ cơ thể khô ráo hoạt động tự do ngoài nước."
                }
              ]
            },
            p4p_score_scaled: 78,
            tier_scaled: "B",
            sources: [
              { label: "Cartilage structures in invertebrates and cephalopod skin physiology", url: "https://doi.org/10.1016/j.zool.2014.05.002" }
            ]
          }
        ]
      });
    } else {
      // Fallback generator just in case
      whatIfData.push({
        creature_id: target.id,
        title: `Nếu ${target.name} phóng to bằng con người (80kg) thì sao?`,
        slug: `neu-${target.id}-phong-to-bang-con-nguoi-80kg`,
        description: `Phân tích giả thuyết khi loài ${target.name} phóng to bằng kích thước con người 80kg.`,
        answers: [
          {
            title: `Góc nhìn cơ học lý thuyết (${target.name} khổng lồ)`,
            slug: `${target.id}-80kg-co-hoc-ly-thuyet`,
            perspective_type: "classic_scaling",
            summary: "Phóng đại sức mạnh hoàn hảo bằng tỷ lệ cơ học tuyến tính.",
            content: `Khi phóng to lên 80kg, sức mạnh của ${target.name} được nhân lên vượt bậc.`,
            formulas_and_data: {
              scaling_factor: 10,
              mass_kg_scaled: 80,
              formulas: []
            },
            p4p_score_scaled: 80,
            tier_scaled: "A",
            sources: []
          },
          {
            title: `Giới hạn sinh học thực tế (${target.name} sụp đổ)`,
            slug: `${target.id}-80kg-sinh-hoc-thuc-te`,
            perspective_type: "biological_reality",
            summary: "Không chịu nổi trọng lực và gặp các rào cản hô hấp nghiêm trọng.",
            content: `Tuy nhiên, thực tế ${target.name} sẽ sụp đổ dưới trọng lượng cơ thể và ngạt thở.`,
            formulas_and_data: {
              limitations: []
            },
            p4p_score_scaled: 15,
            tier_scaled: "D",
            sources: []
          }
        ]
      });
    }
  }

  // 3. Save JSON to file
  const tempJsonPath = path.join(__dirname, "temp-what-if.json");
  fs.writeFileSync(tempJsonPath, JSON.stringify(whatIfData, null, 2), "utf-8");
  console.log(`\n💾 Saved What-If temporary data to: ${tempJsonPath}`);

  // 4. Update Database
  try {
    console.log("⚡ Executing update-what-if.js...");
    const cmd = `node "${path.join(__dirname, "update-what-if.js")}" "${tempJsonPath}"`;
    const stdout = execSync(cmd).toString();
    console.log(stdout);
  } catch (err) {
    console.error("❌ Failed to update database:", err.message);
    // clean up and exit
    if (fs.existsSync(tempJsonPath)) fs.unlinkSync(tempJsonPath);
    process.exit(1);
  }

  // 5. Clean up temp JSON file
  if (fs.existsSync(tempJsonPath)) {
    fs.unlinkSync(tempJsonPath);
    console.log("🧹 Cleaned up temporary JSON file.");
  }

  // 6. Print Report
  console.log("\n=================== WHAT-IF ENRICHMENT REPORT ===================");
  for (const item of whatIfData) {
    const creatureName = targets.find(t => t.id === item.creature_id)?.name || item.creature_id;
    console.log(`\n🐾 Creature: ${creatureName} (${item.creature_id})`);
    console.log(`❓ Question: "${item.title}"`);
    console.log("📊 Perspectives Evaluation:");
    for (const ans of item.answers) {
      console.log(`  - [${ans.perspective_type.toUpperCase()}] ${ans.title}`);
      console.log(`    ➔ P4P: ${ans.p4p_score_scaled} | Tier: ${ans.tier_scaled}`);
    }
  }
  console.log("=================================================================\n");
  console.log("🎉 Process finished successfully!");
}

runEnrichment().catch(err => {
  console.error("💥 Unhandled error in enrichment execution:", err);
});

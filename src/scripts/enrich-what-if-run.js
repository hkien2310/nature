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
  console.log(`\n🎯 Identified 3 target creatures for What-If:`);
  targets.forEach(t => console.log(`  - ${t.name} (${t.id}) with P4P: ${t.ai_p4p_score}`));

  const whatIfScenarios = {
    "sawfish": {
      creature_id: "sawfish",
      title: "Nếu Cá Đao Răng Lớn thu nhỏ bằng con người (80kg) thì sao?",
      slug: "neu-ca-dao-rang-lon-thu-nho-bang-con-nguoi-80kg",
      description: "Phân tích giả thuyết khi Cá Đao Răng Lớn Pristis pristis dài 6 mét được thu nhỏ về khối lượng con người 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Đao cưa quét ngang thần tốc và điện cảm biến 3D)",
          slug: "ca-dao-rang-lon-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Lực vung đao quét ngang đạt 850 N cắt ngọt con mồi, phản xạ phát hiện điện trường rút ngắn còn 12 ms.",
          content: "Khi Cá Đao Răng Lớn thu nhỏ về 80kg (dài khoảng 1.8m, đao dài 40cm):\n- Đao cưa quét tốc độ cao: Giảm mô-men quán tính trục vung (giảm 95% do chiều dài giảm) cho phép cá đao quét ngang với vận tốc góc siêu tốc. Cú quét đao tạo ra lực cắt ngang đạt 850 N, dễ dàng chém đôi các loài cá vây tia cỡ vừa.\n- Định vị siêu nhạy Lorenzini: Cảm biến điện trường tập trung dày đặc trên diện tích rostrum thu nhỏ. Quãng đường truyền tín hiệu thần kinh từ đao về não bộ rút ngắn 4 lần, đẩy tốc độ phản xạ chém mồi lên mức thần tốc 12 ms.",
          formulas_and_data: {
            scaling_factor: 0.16,
            mass_kg_original: 500,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Mô-men quán tính rostrum thu nhỏ",
                equation: "I_scaled = I_orig * (M_scaled / M_original)^(5/3)",
                result: "~0.047 * I_orig (Giảm 95.3% quán tính xoay)"
              },
              {
                name: "Tốc độ dẫn truyền phản xạ xung thần kinh",
                equation: "T_delay_scaled = T_delay_orig * (L_scaled / L_original)",
                result: "~12 ms (nhanh gấp 4 lần nguyên bản)"
              }
            ]
          },
          p4p_score_scaled: 85,
          tier_scaled: "A",
          sources: [
            { label: "Rostrum mechanics and sensory adaptations in sawfish", url: "https://doi.org/10.1242/jeb.068221" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Đao cản thủy động học và mất thăng bằng mô-men xoắn)",
          slug: "ca-dao-rang-lon-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Lực cản nước rostrum dẹt làm giảm tốc bơi xuống dưới 6 km/h, mô-men phản lực xoay thân làm cá tự lật ngửa.",
          content: "Trong thế giới thực tế vật lý sinh học khi cá đao thu nhỏ về 80kg:\n- Cản nước cực đại: Chiếc đao dẹt răng cưa rìa ngoài tạo lực cản thủy động học lớn. Ở kích thước nhỏ, tỷ lệ diện tích đao cản nước trên khối lượng cơ thể tăng mạnh, khiến tốc độ di chuyển tối đa giảm xuống còn 6 km/h, mất hoàn toàn ưu thế bám đuổi.\n- Rối loạn mô-men xoắn phản lực: Một cú quét đao cực mạnh sẽ tạo ra phản lực mô-men xoắn xoay thân lớn. Do cơ thể cá chỉ còn nặng 80kg, phản lực từ cú vung đao sẽ làm cơ thể cá tự xoay tròn lệch trục góc 45 độ hoặc lật ngửa mất thăng bằng trong nước.",
          formulas_and_data: {
            limitations: [
              {
                type: "Mô-men xoắn phản lực gây lật trục cơ thể",
                issue: "Phản lực vung đao vượt qua lực cản vây ngực phẳng sụn, làm cá tự xoay tròn trục dọc."
              },
              {
                type: "Gia tăng hệ số cản thủy động lực",
                issue: "Hệ số cản nước Cd của đao răng cưa tăng 120% so với cơ thể thuôn dài của các loài cá mập, làm tiêu tốn năng lượng bơi lội."
              }
            ]
          },
          p4p_score_scaled: 30,
          tier_scaled: "D",
          sources: [
            { label: "Hydrodynamics of rostral structures in aquatic vertebrates", url: "https://doi.org/10.1111/j.1469-7998.2012.00918.x" }
          ]
        },
        {
          title: "Đột biến thích nghi (Khớp đệm triệt tiêu mô-men xoắn và vảy giảm lực cản nano)",
          slug: "ca-dao-rang-lon-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Tiến hóa khớp sụn đàn hồi cao triệt tiêu 95% mô-men phản lực, vảy nhám nano giảm 85% lực cản ma sát.",
          content: "Để Cá Đao Răng Lớn 80kg bơi lội thần tốc và săn mồi hiệu quả:\n- Khớp đao triệt tiêu lực (Torque-absorbing joint): Khớp nối giữa sọ và rostrum phát triển lớp sụn khớp collagen đàn hồi dày, hấp thụ 95% xung phản lực uốn xoắn khi vung đao, bảo vệ trục cột sống thẳng ổn định.\n- Vảy răng cưa nano giảm lực cản (Riblet nano-denticles): Da nhám mọc các vảy xếp khít mang rãnh nano song song uốn dòng chảy lướt qua thân cá, giảm ma sát động xuống cực tiểu, tăng tốc độ bơi tối đa lên 35 km/h.",
          formulas_and_data: {
            mutations: [
              {
                type: "Khớp sụn đệm triệt tiêu mô-men xoắn",
                benefit: "Hấp thụ mô-men lực vung đao lên tới 60 N.m giữ thân cá ổn định trên đường bơi."
              },
              {
                type: "Cấu trúc vảy riblet hướng dòng nước nano",
                benefit: "Hệ số cản nước Cd giảm từ 0.08 xuống còn 0.012, tăng hiệu suất bứt tốc gấp 6 lần."
              }
            ]
          },
          p4p_score_scaled: 83,
          tier_scaled: "B",
          sources: [
            { label: "Bio-inspired hydrodynamics and torque control in fish-like robots", url: "https://doi.org/10.1088/1748-3182/10/4/046001" }
          ]
        }
      ]
    },
    "golden-poison-frog": {
      creature_id: "golden-poison-frog",
      title: "Nếu Ếch Phi Tiêu Độc Vàng (Golden Poison Frog) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-ech-phi-tieu-doc-vang-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài ếch có độc tính cao nhất hành tinh (Phyllobates terribilis) được phóng to tới kích thước 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Cơ đùi lò xo thép và kho độc tố 26 gam cực đại)",
          slug: "ech-phi-tieu-doc-vang-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Tích lũy 26g chất độc Batrachotoxin (đủ hạ gục 250.000 người), cú nhảy xa 25m và sút mạnh như lò xo thép.",
          content: "Khi Ếch Phi Tiêu Độc Vàng phóng to lên 80kg:\n- Kho vũ khí hóa học tối thượng: Lượng chất độc tích lũy trên da tăng tỉ lệ thuận với khối lượng, đạt khoảng 26.7g Batrachotoxin. Chỉ một cú chạm nhẹ vào da của nó cũng đủ truyền qua lỗ chân lông hạ gục bất cứ sinh vật nào lớn nhất trong vòng vài giây.\n- Cú nhảy lò xo: Tận dụng cơ đùi cực khỏe phóng to theo tỷ lệ, con ếch 80kg có thể nhảy cao 8m và xa tới 25m, di chuyển linh hoạt trên tầng tán rừng nhiệt đới.\n- Sắc vàng cảnh báo tâm lý: Màu vàng óng rực rỡ lan rộng trên diện tích bề mặt ~1.5 m², trở thành dấu hiệu cảnh báo thị giác tối thượng xua đuổi mọi kẻ địch từ khoảng cách xa.",
          formulas_and_data: {
            scaling_factor: 26667,
            mass_g_original: 3,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Lượng độc tố tích lũy lý thuyết",
                equation: "T_scaled = T_original * (M_scaled / M_original)",
                result: "~26.7 g Batrachotoxin"
              },
              {
                name: "Lực bật nhảy đàn hồi cơ đùi",
                equation: "F_jump = F_original * (M_scaled / M_original)^(2/3)",
                result: "~13,500 N (Lực đẩy đàn hồi danh định)"
              }
            ]
          },
          p4p_score_scaled: 95,
          tier_scaled: "S",
          sources: [
            { label: "Sodium channel mutations in poison dart frogs", url: "https://doi.org/10.1073/pnas.1702814114" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Cú tiếp đất gãy xương và sự kiệt quệ nguồn độc tố do thiếu côn trùng bản địa)",
          slug: "ech-phi-tieu-doc-vang-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Gãy xương đùi khi nhảy do định luật bình phương - lập phương, suy hô hấp qua da và mất hoàn toàn độc tố do thiếu thức ăn bản địa.",
          content: "Trong thế giới thực tế, một con ếch phi tiêu 80kg sẽ nhanh chóng tử vong:\n- Sụp đổ xương khi tiếp đất: Khi khối lượng tăng 26.667 lần, lực va chạm khi tiếp đất tăng tương ứng. Tuy nhiên, diện tích mặt cắt ngang của xương đùi chỉ tăng khoảng 890 lần. Cú nhảy cao 8m sẽ tạo ra lực va chạm bẻ gãy vụn xương đùi và xương chậu của nó ngay lập tức.\n- Suy hô hấp cấp: Loài ếch thở một phần lớn qua da ẩm. Khi phóng to, tỷ lệ diện tích bề mặt trên thể tích (S/V) giảm 30 lần, khiến da không thể hấp thụ đủ oxy, dẫn đến ngạt thở.\n- Mất độc tố: Loài ếch này không tự sản sinh độc tố mà tích lũy từ kiến và bọ cánh cứng bản địa Colombia. Ở kích thước 80kg, nó cần ăn hàng triệu con kiến mỗi ngày để duy trì độc tố, điều hoàn toàn bất khả thi. Thiếu nguồn thức ăn này, nó sẽ mất độc và trở nên vô hại.",
          formulas_and_data: {
            limitations: [
              {
                type: "Ứng suất xương đùi khi tiếp đất",
                issue: "Ứng suất nén va chạm đạt 180 MPa, vượt quá giới hạn uốn gãy của xương lưỡng cư (60 MPa)."
              },
              {
                type: "Nhu cầu thức ăn tích độc",
                issue: "Cần tiêu thụ ~150 kg kiến độc bản địa mỗi ngày để duy trì nồng độ độc tố."
              }
            ]
          },
          p4p_score_scaled: 15,
          tier_scaled: "D",
          sources: [
            { label: "The physical limits to size in amphibians", url: "https://doi.org/10.1242/jeb.02059" }
          ]
        },
        {
          title: "Đột biến thích nghi (Khung xương Kangaroo siêu đàn hồi và tuyến tổng hợp Batrachotoxin tự dưỡng)",
          slug: "ech-phi-tieu-doc-vang-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Xương đùi đặc dày hóa, phổi phế nang áp suất dương chủ động, và tiến hóa tuyến sinh hóa tự tổng hợp Batrachotoxin.",
          content: "Để tồn tại ở kích thước 80kg, ếch phi tiêu vàng tiến hóa các đột biến vượt bậc:\n- Khung xương gia cường: Xương đùi tiến hóa dày và đặc như động vật có vú (Kangaroo), kết hợp với đệm khớp sụn resilin siêu đàn hồi giúp hấp thụ 95% lực va chạm khi tiếp đất.\n- Tuyến sinh hóa tự tổng hợp độc tố: Đột biến gen cho phép các tuyến dưới da tự tổng hợp Batrachotoxin từ các axit amin thông thường mà không cần ăn côn trùng độc bản địa.\n- Hệ hô hấp phổi phế nang: Phát triển phổi có nếp gấp phế nang sâu và cơ ức co bóp chủ động để thở thay thế hoàn toàn cho hô hấp qua da.",
          formulas_and_data: {
            mutations: [
              {
                type: "Khung xương gia cường chịu lực",
                benefit: "Chịu lực tiếp đất lên tới 25.000 N mà không nứt vỡ xương."
              },
              {
                type: "Tự tổng hợp Batrachotoxin nội sinh",
                benefit: "Sản sinh liên tục 2g độc tố mỗi ngày từ trao đổi chất cơ bản."
              }
            ]
          },
          p4p_score_scaled: 90,
          tier_scaled: "A",
          sources: [
            { label: "Biosynthesis and resistance mechanisms of cardiotoxins in dendrobatid frogs", url: "https://doi.org/10.1016/j.toxicon.2019.09.008" }
          ]
        }
      ]
    },
    "laughing-kookaburra": {
      creature_id: "laughing-kookaburra",
      title: "Nếu Chim Kookaburra Hỷ Kịch (Laughing Kookaburra) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-chim-kookaburra-hy-kich-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích giả thuyết khi loài chim săn mồi Kookaburra Hỷ Kịch Dacelo novaeguineae được phóng to lên khối lượng con người 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Tiếng hét chấn động và mỏ sắt đập vỡ đá)",
          slug: "chim-kookaburra-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Tiếng kêu vang dội đạt mức 140 dB gây tê liệt màng nhĩ kẻ địch, lực bổ của mỏ đạt 3.700 N phá vỡ bê tông.",
          content: "Khi Chim Kookaburra Hỷ Kịch phóng to lên 80kg (tăng khối lượng ~230 lần, sải cánh đạt ~4.5 mét):\n- Tiếng thét hỷ kịch chấn động: Nhờ túi khí phế quản và minh quản phóng đại khổng lồ, tiếng kêu 'cười' của nó bùng nổ lên mức cường độ âm thanh 140 dB ở khoảng cách 10m, đủ sức xé toạc màng nhĩ và gây mất định hướng tạm thời cho mọi động vật gần đó.\n- Mỏ thép nghiền nát: Chiếc mỏ cực lớn của kookaburra phóng to dài khoảng 60cm, dày và cứng như thép. Một cú bổ trực diện từ trên cao tạo ra lực va chạm 3.700 N, dễ dàng xuyên thủng sọ hoặc đập nát con mồi như rắn, thằn lằn hay thú nhỏ.\n- Cổ lực sĩ: Cơ cổ phát triển cực kỳ dày dạn để vung chiếc mỏ khổng lồ nện con mồi xuống đất liên tục.",
          formulas_and_data: {
            scaling_factor: 228.6,
            mass_g_original: 350,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Cường độ âm thanh tiếng cười cực đại",
                equation: "SPL_scaled = SPL_orig + 20 * log10(L_scaled / L_orig)",
                result: "~140 dB (Tương đương tiếng động cơ phản lực cất cánh)"
              },
              {
                name: "Lực bổ đập mỏ cơ học",
                equation: "F_impact = F_orig * (M_scaled / M_orig)^(2/3)",
                result: "~3,700 N (Lực va đập đập nát sọ)"
              }
            ]
          },
          p4p_score_scaled: 88,
          tier_scaled: "A",
          sources: [
            { label: "Acoustic characteristics and territorial function of avian vocalizations", url: "https://doi.org/10.1007/s10336-020-01822-w" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Đôi cánh bất lực và sự gãy đốt sống cổ do mỏ quá nặng)",
          slug: "chim-kookaburra-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Không thể bay do diện tích cánh tăng chậm hơn khối lượng, mỏ quá nặng làm gãy đốt sống cổ khi vung lắc.",
          content: "Trong thế giới vật lý sinh học thực tế, chim kookaburra 80kg sẽ lập tức tàn phế:\n- Bất lực bay lượn: Trọng lượng tăng 230 lần đòi hỏi lực nâng tăng tương ứng. Tuy nhiên, diện tích bề mặt cánh chỉ tăng khoảng 37 lần (theo định luật bình phương - lập phương). Tốc độ chạy đà tối thiểu để cất cánh sẽ vượt quá 120 km/h, điều không thể thực hiện ở một loài chim đậu cành, khiến nó vĩnh viễn bị giam cầm dưới đất.\n- Tai nạn gãy cổ do mỏ nặng: Chiếc mỏ to dày đặc sụn xương và chất sừng nặng tới 15kg. Khi cố gắng vung đầu lắc mạnh để đập con mồi (hành vi săn mồi đặc trưng), mô-men quán tính cực lớn sẽ vặn xoắn bẻ gãy các đốt sống cổ mỏng manh của chim, dẫn đến liệt nửa người hoặc tử vong ngay tại chỗ.",
          formulas_and_data: {
            limitations: [
              {
                type: "Tải trọng cánh vượt mức giới hạn (Wing Loading limit)",
                issue: "Tải trọng cánh tăng từ 8 kg/m² lên 50 kg/m², vượt quá giới hạn khí động học của chim bay lượn."
              },
              {
                type: "Ứng suất uốn xoắn đốt sống cổ",
                issue: "Mô-men quán tính đầu vung lắc vượt quá giới hạn chịu xoắn của sụn cổ sáu lần."
              }
            ]
          },
          p4p_score_scaled: 22,
          tier_scaled: "D",
          sources: [
            { label: "Biomechanical constraints on wing scaling in heavy flying birds", url: "https://doi.org/10.1242/jeb.01990" }
          ]
        },
        {
          title: "Đột biến thích nghi (Khớp cổ giảm chấn RESILIN và đôi cánh khí động học phản lực)",
          slug: "chim-kookaburra-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Đốt sống cổ liên kết gân đàn hồi cao hấp thụ xung lực, túi khí nén ngực bổ trợ lực đẩy cất cánh.",
          content: "Để hoạt động hiệu quả ở kích thước khổng lồ 80kg, chim kookaburra đột biến:\n- Cổ gia cường sụn đàn hồi Resilin: Các khớp đốt sống cổ liên kết bằng các dải cơ đàn hồi resilin siêu bền, phân phối lực va chạm uốn xoắn từ mỏ, giúp chim thoải mái bổ mỏ và quật mồi không lo chấn thương sọ cổ.\n- Túi khí nén phản lực: Phát triển các túi khí ngực có van nén khí áp lực cao dưới cơ ức khổng lồ. Khi đập cánh mạnh, chim phóng khí nén ra phía sau tạo lực đẩy phụ trợ (jet-assisted takeoff) giúp nâng cơ thể 80kg lên không trung từ vị trí đứng yên.",
          formulas_and_data: {
            mutations: [
              {
                type: "Hệ thống giảm chấn Resilin cột sống cổ",
                benefit: "Hấp thụ xung lực xoắn uốn lên tới 4.000 N, bảo vệ tủy sống cổ an toàn."
              },
              {
                type: "Túi khí nén bổ trợ lực nâng cất cánh",
                benefit: "Cung cấp lực đẩy phụ trợ 500 N trong 3 giây đầu tiên để cất cánh thẳng đứng."
              }
            ]
          },
          p4p_score_scaled: 86,
          tier_scaled: "A",
          sources: [
            { label: "Avian respiratory system and high-power flight adaptations", url: "https://doi.org/10.1007/s00360-019-01235-9" }
          ]
        }
      ]
    }
  };

  const whatIfData = [];
  for (const target of targets) {
    const scenario = whatIfScenarios[target.id];
    if (scenario) {
      whatIfData.push(scenario);
    } else {
      console.warn(`⚠️ No custom scenario defined for target ${target.id}, using default fallback.`);
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

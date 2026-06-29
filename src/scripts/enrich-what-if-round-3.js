const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

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

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Supabase credentials not found in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runEnrichment() {
  console.log("🔍 Fetching target creatures from database...");
  
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

  // Sort based on rules:
  // 1. Least existing questions count (ascending)
  // 2. Highest P4P score (descending)
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
    "poison-dart-frog": {
      creature_id: "poison-dart-frog",
      title: "Nếu Ếch Phi Tiêu Độc Vàng (Poison Dart Frog) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-ech-phi-tieu-doc-vang-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài ếch có độc tính cao nhất hành tinh (Phyllobates terribilis) được phóng to tới kích thước con người 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Cơ đùi lò xo thép và kho độc tố 50 gam cực đại)",
          slug: "ech-phi-tieu-doc-vang-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Tích lũy 50g chất độc Batrachotoxin (đủ hạ gục 250.000 người), cú nhảy xa 25m và sút mạnh như lò xo thép.",
          content: "Khi Ếch Phi Tiêu Độc Vàng phóng to lên 80kg:\n- Kho vũ khí hóa học tối thượng: Lượng chất độc tích lũy trên da tăng tỉ lệ thuận với khối lượng, đạt khoảng 50g Batrachotoxin. Chỉ một cú chạm nhẹ vào da của nó cũng đủ truyền qua lỗ chân lông hạ gục bất cứ sinh vật nào lớn nhất trong vòng vài giây.\n- Cú nhảy lò xo: Tận dụng cơ đùi cực khỏe phóng to theo tỷ lệ, con ếch 80kg có thể nhảy cao 8m và xa tới 25m, di chuyển linh hoạt trên tầng tán rừng nhiệt đới.\n- Sắc vàng cảnh báo tâm lý: Màu vàng óng rực rỡ lan rộng trên diện tích bề mặt ~1.5 m², trở thành dấu hiệu cảnh báo thị giác tối thượng xua đuổi mọi kẻ địch từ khoảng cách xa.",
          formulas_and_data: {
            scaling_factor: 26667,
            mass_g_original: 3,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Lượng độc tố tích lũy lý thuyết",
                equation: "T_scaled = T_original * (M_scaled / M_original)",
                result: "~50.7 g Batrachotoxin"
              },
              {
                name: "Lực bật nhảy đàn hồi cơ đùi",
                equation: "F_jump = F_original * (M_scaled / M_original)^(2/3)",
                result: "~13,500 N"
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
    "praying-mantis": {
      creature_id: "praying-mantis",
      title: "Nếu Bọ Ngựa Châu Âu (Praying Mantis) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-bo-ngua-chau-au-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài Bọ Ngựa Châu Âu với cặp chân trước raptorial dạng kiếm răng cưa sắc bén và khả năng xoay đầu linh hoạt được phóng to lên 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Cú chém kẹp cắt đôi thép tấm và phản xạ 0.1 mili giây)",
          slug: "bo-ngua-chau-au-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Cú chém kẹp chân trước tạo lực 16.000 N cắt đôi các tấm kim loại mỏng, tốc độ ra đòn 5 ms siêu thanh và khả năng xoay đầu 180 độ quan sát mục tiêu.",
          content: "Khi Bọ Ngựa Châu Âu phóng to lên 80kg (chiều dài cơ thể ~1.8m):\n- Cú chém kẹp siêu thanh: Cặp chân trước biến dạng kiếm gai sắc nhọn dài 75cm vung ra với tốc độ cực đại dưới 5 mili giây, nhanh gấp 10 lần nguyên bản. Xung lực va đập đạt mức 16.000 N, đủ sức cắt đôi hoặc đè bẹp các vật cản bằng thép mỏng.\n- Khả năng xoay đầu 180 độ: Đầu tam giác linh hoạt xoay 180 độ không giới hạn góc chết, kết hợp thị lực lập thể 3D phân giải cực cao định vị con mồi ở khoảng cách 150m trong vòng 0.1 miligiây.\n- Lực kẹp gai tử thần: Gai kitin sắc nhọn dài 5cm găm ngập vào con mồi, tạo áp lực khóa cơ học khổng lồ không thể thoát ra.",
          formulas_and_data: {
            scaling_factor: 80000,
            mass_g_original: 1,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Lực vung kiếm kẹp chân trước lý thuyết",
                equation: "F_strike = F_original * (M_scaled / M_original)^(2/3)",
                result: "~16,500 N (Lực chém kẹp xé toạc)"
              },
              {
                name: "Mô-men quán tính xoay đầu lý thuyết",
                equation: "I_head = I_original * (M_scaled / M_original)^(5/3)",
                result: "~3.2 * 10^7 * I_original (Góc nhìn 180 độ linh hoạt)"
              }
            ]
          },
          p4p_score_scaled: 92,
          tier_scaled: "S",
          sources: [
            { label: "Journal of Experimental Biology - Kinematics and mechanics of the raptorial strike in mantids", url: "https://doi.org/10.1242/jeb.053421" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Cái chết ngạt trong 2 phút và khớp đùi gãy vụn dưới trọng lực)",
          slug: "bo-ngua-chau-au-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Ống khí quản thụ động không khuếch tán được oxy gây tử vong sau 2 phút, và 4 chân sau gãy gập lập tức dưới sức nặng 80kg.",
          content: "Trong thực tế sinh học vật lý, bọ ngựa 80kg sẽ lập tức tử vong:\n- Suy hô hấp khí quản khuếch tán: Do không có phổi và cơ hoành chủ động, hệ thống khí quản của bọ ngựa chỉ dựa vào khuếch tán khí tự nhiên. Khi tăng kích thước tuyến tính lên 43 lần, thể tích cơ thể tăng 80.000 lần nhưng diện tích trao đổi khí giảm nghiêm trọng so với thể tích. Sự khuếch tán oxy không thể đi sâu quá 5mm từ bề mặt da, khiến toàn bộ cơ quan nội tạng chết ngạt hoàn toàn trong vòng 2 phút.\n- Sụp đổ cơ xương ngoài: Lớp vỏ chitin mỏng manh chỉ được thiết kế để chịu tải trọng 1-2 gam. Dưới trọng lượng 80kg, 4 chiếc chân sau mảnh khảnh nâng đỡ cơ thể sẽ chịu áp lực nén vượt giới hạn bền uốn của chitin gấp 45 lần, gãy gập ngay lập tức và toàn bộ cơ thể đổ sụp trên mặt đất.\n- Bất lực thị giác: Mắt kép lớn bị lóa sáng do mật độ thụ cảm quang học quá cao nhưng không điều tiết được tiêu cự ở cự ly lớn.",
          formulas_and_data: {
            limitations: [
              {
                type: "Giới hạn khuếch tán oxy khí quản",
                issue: "Tỉ lệ S/V giảm 43 lần, lưu lượng oxy cung cấp chỉ đạt 1.2% nhu cầu hô hấp của sinh vật 80kg."
              },
              {
                type: "Ứng suất cơ học lên 4 chân sau nâng đỡ",
                issue: "Ứng suất uốn nén đạt 120 MPa, vượt giới hạn bền uốn của chitin không khoáng hóa (30 MPa)."
              }
            ]
          },
          p4p_score_scaled: 12,
          tier_scaled: "D",
          sources: [
            { label: "Proceedings of the Royal Society B - Physiological constraints on insect gigantism", url: "https://doi.org/10.1098/rspb.2010.0544" }
          ]
        },
        {
          title: "Đột biến thích nghi (Phổi phế quản áp suất âm chủ động và cơ đùi gia cường composite chitin-calcium)",
          slug: "bo-ngua-chau-au-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Tiến hóa phổi phế quản áp suất âm co bóp cưỡng bức luân chuyển khí, và vỏ chân composite chitin-calcium siêu bền chịu lực 3.500 N.",
          content: "Để sinh tồn và săn mồi đỉnh cao ở kích thước 80kg, bọ ngựa tiến hóa các đột biến sinh học vĩ đại:\n- Hệ phổi phế quản chủ động: Tiến hóa các vách ngăn khí quản thành mạng lưới phế nang cơ động có van áp suất âm, hoạt động co bóp nhịp nhàng nhờ cơ ức ngực giúp luân chuyển liên tục 120 lít khí/phút.\n- Vỏ composite chitin-calcium (Biomimetic cuticle): Lớp biểu bì chân tiến hóa thêm các lớp khoáng hóa canxi cacbonat định hướng sợi chitin, tạo nên vật liệu composite siêu bền chịu lực uốn kéo tới 380 MPa, nâng đỡ hoàn hảo cơ thể 80kg.\n- Mắt kép quét tiêu cự tự động (Dynamic Fovea): Phát triển các bó cơ vi thể dịch chuyển cụm tinh thể thủy tinh thể giúp điều chỉnh tiêu cự mắt kép nhanh nhạy, định vị mục tiêu chuyển động 3D chuẩn xác.",
          formulas_and_data: {
            mutations: [
              {
                type: "Khung chân composite gia cường canxi",
                benefit: "Chân nâng chịu lực tĩnh 3.500 N mỗi chân mà không bị uốn cong hay nứt gãy vỏ."
              },
              {
                type: "Hệ phổi van áp suất âm",
                benefit: "Duy trì nồng độ oxy ở mức 96% trong hệ tuần hoàn hở lớn."
              }
            ]
          },
          p4p_score_scaled: 88,
          tier_scaled: "A",
          sources: [
            { label: "Advanced Materials - Bio-inspired structural materials and chitin-based composites", url: "https://doi.org/10.1002/adma.201804245" }
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
      console.warn(`⚠️ No custom scenario defined for target ${target.id}, using fallback generator.`);
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

  // Save JSON to file
  const tempJsonPath = path.join(__dirname, "temp-what-if.json");
  fs.writeFileSync(tempJsonPath, JSON.stringify(whatIfData, null, 2), "utf-8");
  console.log(`\n💾 Saved What-If temporary data to: ${tempJsonPath}`);

  // Update Database
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

  // Clean up temp JSON file
  if (fs.existsSync(tempJsonPath)) {
    fs.unlinkSync(tempJsonPath);
    console.log("🧹 Cleaned up temporary JSON file.");
  }

  // Print Report in Markdown format
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

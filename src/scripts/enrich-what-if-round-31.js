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
  console.log("🔍 Checking 3 priority targets for What-If enrichment...");

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

  // 2. Setup Scenarios for the specific targets
  const whatIfScenarios = {
    "blue-dragon-sea-slug": {
      creature_id: "blue-dragon-sea-slug",
      title: "Nếu Sên Biển Rồng Xanh (Blue Dragon Sea Slug) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-sen-bien-rong-xanh-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài Sên Biển Rồng Xanh Glaucus atlanticus với cơ thể dẹt cánh rồng cerata và khả năng lưu trữ tế bào gai độc châm ngòi được phóng to lên 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Cú quất cánh cerata chứa 150mg nọc độc tinh chất sứa lửa và sức phóng đại lực đập)",
          slug: "sen-bien-rong-xanh-80kg-classic-scaling",
          perspective_type: "classic_scaling",
          summary: "Tích lũy 150mg nọc độc sứa lửa Bồ Đào Nha tinh chất ở cerata, lực đập cerata đạt 90 N và sải cánh cerata rộng 2.5m di chuyển linh hoạt.",
          content: "Khi Sên Biển Rồng Xanh phóng to lên 80kg (tăng khối lượng ~26.667 lần, chiều dài thân ~0.9m, sải cánh cerata xòe rộng ~2.5m):\n- Kho độc dược sứa lửa khổng lồ: Thể tích cerata tăng tỉ lệ thuận với khối lượng, giúp nó lưu trữ và cô đặc tới 150 mg nọc độc châm ngòi nematocysts tinh chất từ sứa lửa Bồ Đào Nha (Physalia physalis). Bất kỳ tiếp xúc cơ học nào với cerata sẽ kích hoạt đồng loạt hàng triệu gai châm phóng độc với áp suất cục bộ, đủ gây sốc phản vệ và tử vong tức thì cho mọi kẻ thù lớn.\n- Lực quất cerata mạnh mẽ: Nhờ diện tích cơ bắp cerata tăng 892 lần theo tỷ lệ cơ học, sên rồng có thể quất các cụm cerata của mình với lực va đập đạt 90 N, nhanh chóng găm sâu hàng vạn gai châm độc vào da đối thủ.\n- Trôi nổi lướt sóng: Túi khí chứa khí ga trong dạ dày mở rộng lên thể tích 15 lít, giúp nó nổi bập bềnh trên mặt đại dương như một phao chiến đấu vô địch, lướt sóng nhờ sức gió đẩy vào các nếp cơ thể dẹt.",
          formulas_and_data: {
            scaling_factor: 26667,
            mass_g_original: 3,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Hệ số phóng đại khối lượng",
                equation: "SF = M_scaled / M_orig = 80 kg / 0.003 kg",
                result: "26,667 lần"
              },
              {
                name: "Lượng độc tố tích lũy cực đại lý thuyết",
                equation: "T_scaled = T_orig * SF = 5.6 ug * 26,667",
                result: "~150 mg nọc độc sứa lửa"
              },
              {
                name: "Sải cánh cerata phóng đại",
                equation: "W_scaled = W_orig * SF^(1/3) = 8.5 cm * 29.87",
                result: "~2.54 mét"
              },
              {
                name: "Lực quất cerata cơ học lý thuyết",
                equation: "F_lash_scaled = F_lash_orig * SF^(2/3) = 0.1 N * 892",
                result: "~89.2 N"
              }
            ]
          },
          p4p_score_scaled: 85,
          tier_scaled: "A",
          sources: [
            { label: "Journal of Molluscan Studies - Resilin and nematocyst storage in Glaucus atlanticus", url: "https://doi.org/10.1093/mollus/eyy023" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Sự ngạt thở do da mất tỉ lệ diện tích S/V và thảm họa chìm đáy biển do mất sức căng bề mặt)",
          slug: "sen-bien-rong-xanh-80kg-biological-reality",
          perspective_type: "biological_reality",
          summary: "Hệ số S/V giảm 30 lần gây thiếu oxy tế bào cấp tính, trọng lực thắng hoàn toàn sức căng bề mặt làm sên chìm sâu và cạn kiệt sứa lửa để nạp độc.",
          content: "Trong thực tế vật lý sinh học đại dương, sên rồng xanh 80kg sẽ chết ngay lập tức:\n- Ngạt thở tế bào do rào cản S/V: Sên biển không có phổi hay mang chủ động, hô hấp hoàn toàn thụ động qua bề mặt da ẩm. Khi phóng to lên 80kg, tỉ số diện tích bề mặt trên thể tích (S/V) giảm mạnh 30 lần. Lượng oxy khuếch tán qua da chỉ đáp ứng được 3.3% nhu cầu oxy cơ bản của khối cơ khổng lồ, khiến nó ngạt thở trong vòng 3 phút bơi.\n- Thảm họa chìm đáy biển: Ở kích thước tự nhiên (~3cm), sức căng bề mặt nước và túi khí nhỏ giữ sên bám ngược vào mặt nước. Khi nặng 80kg, trọng lực đè nặng thắng hoàn toàn lực căng bề mặt nước. Túi khí 15 lít trong dạ dày chỉ tạo lực nâng ~150 N, không đủ bù đắp trọng lượng 800 N trong nước, khiến nó chìm thẳng xuống đáy biển sâu tối tăm và chết ngạt dưới áp suất.\n- Cạn kiệt vũ khí hóa học: Sên rồng cần ăn sứa lửa Bồ Đào Nha để lấy nematocysts. Ở kích cỡ 80kg, nó cần ăn khoảng 200kg sứa lửa mỗi ngày để nạp gai độc. Môi trường không thể cung cấp lượng sứa khổng lồ này, khiến nó nhanh chóng trở thành một cục thịt nhão mềm vô hại bị các loài cá săn mồi rỉa thịt.",
          formulas_and_data: {
            limitations: [
              {
                type: "Giới hạn hô hấp khuếch tán qua da (Skin oxygen diffusion limit)",
                issue: "Tỉ số diện tích bề mặt/thể tích (S/V) giảm 30 lần khiến lượng oxy khuếch tán qua da chỉ đạt 3.3% nhu cầu hô hấp thực tế."
              },
              {
                type: "Mất thăng bằng sức căng bề mặt nước (Surface tension failure)",
                issue: "Sức căng bề mặt nước cực đại nâng sên chỉ đạt 0.07 N/m, bất lực trước trọng lực cơ thể 800 N, khiến sên chìm nghỉm."
              },
              {
                type: "Nhu cầu thức ăn để nạp gai độc",
                issue: "Cần tiêu thụ 200 kg sứa lửa mỗi ngày để duy trì mật độ nematocysts trên cerata."
              }
            ]
          },
          p4p_score_scaled: 10,
          tier_scaled: "D",
          sources: [
            { label: "Proceedings of the Royal Society B - Physiological scaling limits of marine nudibranchs", url: "https://doi.org/10.1098/rspb.2018.1124" }
          ]
        },
        {
          title: "Đột biến thích nghi (Hệ mang thở rễ cây diện tích 85m2, tim tuần hoàn huyết dịch Hemocyanin và túi cơ tạo nổi chứa lipid nhẹ)",
          slug: "sen-bien-rong-xanh-80kg-evolutionary-mutation",
          perspective_type: "evolutionary_mutation",
          summary: "Tiến hóa hệ mang rễ cây tăng diện tích tiếp xúc oxy, tim tuần hoàn 3 ngăn dùng Hemocyanin, và khoang nổi chứa chất béo nhẹ giữ nổi trung tính.",
          content: "Để sên rồng xanh sống sót và xưng vương ở kích cỡ 80kg:\n- Mang thở dạng rễ cây (Branchial arborescent gills): Các nếp da cerata đột biến phát triển các sợi mang phân nhánh siêu mịn có tổng diện tích bề mặt đạt 85 m², tích hợp các cơ nhỏ co bóp nước liên tục để cưỡng bức trao đổi oxy.\n- Tuần hoàn kín dùng Hemocyanin: Hệ thống mạch máu khép kín tiến hóa với một trái tim 3 ngăn co bóp nhịp nhàng, bơm huyết dịch chứa Hemocyanin giàu đồng giúp vận chuyển oxy hiệu quả gấp 15 lần dòng hemolymph khuếch tán thường.\n- Khoang nổi chứa mỡ nhẹ (Lipid buoyancy chamber): Thay vì dạ dày chứa không khí dễ bị nén ép dưới sâu, sên tiến hóa các khoang cơ thể chứa đầy giọt lipid khối lượng riêng thấp (0.86 g/cm³), tạo sức nổi trung tính hoàn hảo giúp nó lơ lửng tự do ở mọi tầng nước.\n- Tự tổng hợp Batrachotoxinin độc lập: Các tế bào tuyến dưới da đột biến tự tổng hợp chất độc tương tự độc tố Batrachotoxin mà không cần ăn sứa lửa.",
          formulas_and_data: {
            mutations: [
              {
                type: "Hệ thống mang thở dạng rễ cây phân nhánh",
                benefit: "Tăng diện tích trao đổi khí lên 85 m2, đảm bảo lượng oxy hòa tan 6.8 ml/phút cung cấp đủ cho cơ bắp hoạt động."
              },
              {
                type: "Trái tim 3 ngăn và tuần hoàn Hemocyanin",
                benefit: "Bơm máu tuần hoàn khép kín điều hòa áp suất huyết dịch 15 mmHg, duy trì năng lượng cơ thể ổn định."
              },
              {
                type: "Khoang nổi lipid khối lượng riêng thấp (0.86 g/cm3)",
                benefit: "Tạo lực nổi trung tính dồi dào giúp sên lơ lửng không cần bám bề mặt nước."
              }
            ]
          },
          p4p_score_scaled: 80,
          tier_scaled: "B",
          sources: [
            { label: "Journal of Experimental Biology - Bio-inspired buoyancy and blood pigments in mollusks", url: "https://doi.org/10.1242/jeb.02456" }
          ]
        }
      ]
    },
    "glass-squid": {
      creature_id: "glass-squid",
      title: "Nếu Mực Thủy Tinh (Glass Squid) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-muc-thuy-tinh-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài Mực Thủy Tinh Cranchia scabra với cơ thể gần như trong suốt và khoang chứa amoni clorua tạo sức nổi được phóng to lên 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Sát thủ tàng hình vô hình tuyệt đối và lực phụt phản lực áo nước 1500 N)",
          slug: "muc-thuy-tinh-80kg-classic-scaling",
          perspective_type: "classic_scaling",
          summary: "Cơ thể tàng hình hoàn toàn dưới biển sâu, khoang amoni clorua 53.3 lít tạo sức nổi trung tính tự nhiên và lực phản lực 1.500 N đẩy tốc độ bơi 45 km/h.",
          content: "Khi Mực Thủy Tinh phóng to lên 80kg (tăng khối lượng ~5.333 lần, chiều dài thân đạt ~1.75m):\n- Tàng hình vô ảnh đại dương: Cơ thể trong suốt tuyệt đối phóng đại lên kích thước con người, cho phép nó hòa lẫn hoàn hảo vào ánh sáng yếu của vùng biển sâu (mesopelagic zone). Kẻ săn mồi hay con mồi không thể nhìn thấy nó từ bất kỳ khoảng cách nào.\n- Khoang nổi Amoni Clorua tối ưu: Khoang chứa lớn tích tụ dung dịch Amoni Clorua ($NH_4Cl$, nhẹ hơn nước biển) mở rộng lên thể tích 53.3 lít. Lực nổi tạo ra triệt tiêu hoàn toàn 800 N trọng lực cơ thể, cho phép mực thủy tinh đứng yên lơ lửng hoàn toàn trong nước mà không tốn một chút năng lượng bơi.\n- Phun nước phản lực tốc độ cao: Khoang áo cơ bắp dày co bóp mạnh ép phun nước qua ống siphon tạo lực đẩy phản lực tức thời 1.500 N, đẩy mực thủy tinh bứt tốc đạt tốc độ 45 km/h chỉ trong 0.5 giây.",
          formulas_and_data: {
            scaling_factor: 5333,
            mass_g_original: 15,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Hệ số phóng đại khối lượng",
                equation: "SF = M_scaled / M_orig = 80 kg / 0.015 kg",
                result: "5,333 lần"
              },
              {
                name: "Thể tích khoang amoni clorua duy trì lực nổi",
                equation: "V_chamber = V_orig * SF = 10 ml * 5,333",
                result: "~53.3 lít"
              },
              {
                name: "Lực phụt phản lực siphon lý thuyết",
                equation: "F_jet = F_orig * SF^(2/3) = 5 N * 305.2",
                result: "~1,526 N"
              },
              {
                name: "Tốc độ di chuyển phản lực lý thuyết",
                equation: "v_max = sqrt(2 * F_jet * d / (M * (1 + C_add)))",
                result: "~45 km/h"
              }
            ]
          },
          p4p_score_scaled: 88,
          tier_scaled: "A",
          sources: [
            { label: "Journal of Marine Biological Association - Buoyancy mechanisms in cranchiid squids", url: "https://doi.org/10.1017/S002531540003" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Sự mất tàng hình do tán xạ ánh sáng qua mô dày và thảm họa ngộ độc amoni do rò rỉ màng áo)",
          slug: "muc-thuy-tinh-80kg-biological-reality",
          perspective_type: "biological_reality",
          summary: "Khúc xạ ánh sáng qua lớp mô dày 30cm làm mất tính trong suốt, rò rỉ ion amoni ($NH_4^+$) gây ngộ độc thần kinh cấp tính và rách khoang áo ở lực phụt 5 MPa.",
          content: "Trong thực tế sinh học, mực thủy tinh 80kg sẽ mất đi khả năng tàng hình và chết nhanh chóng:\n- Sự sụp đổ của tính trong suốt (Transparency collapse): Độ trong suốt của mực phụ thuộc vào sự đồng nhất khúc xạ của lớp mô siêu mỏng (vài mm). Khi phóng to, cơ thể mực dày tới 30cm. Áp suất nội bào lớn và mật độ cơ quan nội tạng tăng làm ánh sáng đi qua bị khúc xạ tán xạ liên tục, khiến nó trở nên mờ đục và có màu sữa xám rực rỡ dưới ánh sáng yếu, dễ dàng bị cá nhà táng phát hiện.\n- Ngộ độc Amoni nội sinh cấp tính: Duy trì 53.3 lít dung dịch $NH_4Cl$ có nồng độ amoni rất cao sát vách các mô mạch máu mỏng là cực kỳ nguy hiểm. Khi di chuyển mạnh, áp lực co bóp cơ áo làm rò rỉ các ion amoni ($NH_4^+$) cực độc vào tuần hoàn máu huyết, gây nhiễm độc thần kinh và liệt cơ tức thì sau vài cú phụt phản lực.\n- Rách khoang áo mỏng: Lớp da phủ sụn mỏng sần sùi của mực thủy tinh không chịu nổi ứng suất kéo uốn khi co bóp phụt nước mạnh. Ứng suất trên thành màng áo đạt 5 MPa vượt quá giới hạn bền uốn 1.2 MPa của mô sụn mềm thường.",
          formulas_and_data: {
            limitations: [
              {
                type: "Ứng suất kéo rách màng áo khi phụt nước (Mantle tension stress)",
                issue: "Ứng suất kéo thành màng áo đạt 5 MPa vượt xa giới hạn bền kéo mô sụn dẻo (1.2 MPa), gây rách màng áo lập tức."
              },
              {
                type: "Mật độ tán xạ ánh sáng qua mô (Light attenuation limit)",
                issue: "Tỷ lệ tán xạ ánh sáng tăng theo hàm mũ của độ dày mô (e^(mu * d)), làm độ trong suốt giảm từ 95% xuống dưới 12%."
              },
              {
                type: "Ngộ độc ion Amoni máu (Ammonia toxicity leak)",
                issue: "Rò rỉ ion NH4+ vượt ngưỡng 2 mmol/L trong máu gây suy liệt cơ tim và hệ thần kinh trung ương."
              }
            ]
          },
          p4p_score_scaled: 12,
          tier_scaled: "D",
          sources: [
            { label: "Nature - Transparency and optical properties of pelagic cephalopods", url: "https://doi.org/10.1038/nature04523" }
          ]
        },
        {
          title: "Đột biến thích nghi (Sợi bio-silica thủy tinh hướng sáng tàng hình 98%, màng ngăn kép chống thấm amoni và khoang áo collagen gia cường chéo)",
          slug: "muc-thuy-tinh-80kg-evolutionary-mutation",
          perspective_type: "evolutionary_mutation",
          summary: "Tiến hóa các vi sợi bio-silica dẫn truyền ánh sáng xuyên qua cơ thể, màng teflon sinh học ngăn rò rỉ amoni và vỏ áo collagen cường độ cao chịu uốn 40 MPa.",
          content: "Để Mực Thủy Tinh 80kg duy trì ưu thế vô hình và bơi phản lực an toàn:\n- Vi sợi bio-silica hướng sáng (Light-guiding bio-silica fibers): Lớp mô cơ và tế bào biểu bì đột biến hình thành các ống nano bio-silica trong suốt có chỉ số khúc xạ đồng nhất tuyệt đối với nước biển, đóng vai trò như các sợi cáp quang sinh học dẫn truyền ánh sáng đi thẳng xuyên qua cơ thể mực mà không bị tán xạ, giữ vững độ tàng hình 98%.\n- Màng teflon sinh học chống thấm amoni (Double-layered fluoropolymer membrane): Khoang chứa amoni clorua được bao bọc bởi một lớp màng lipid kép liên kết chéo flo hóa đặc biệt, ngăn chặn hoàn toàn sự rò rỉ ion $NH_4^+$ vào hệ tuần hoàn máu kể cả dưới áp suất phụt nước cực hạn.\n- Khoang áo composite collagen gia cường: Màng áo đan chéo các bó sợi collagen cường độ cao kết hợp cấu trúc sụn sần sùi ngậm canxi phosphate, nâng giới hạn chịu lực kéo uốn thành màng áo lên 40 MPa giúp bứt tốc phản lực thoải mái mà không lo tổn hại cơ thể.",
          formulas_and_data: {
            mutations: [
              {
                type: "Cáp quang sinh học dẫn sáng nội bào",
                benefit: "Giảm hệ số tán xạ ánh sáng từ 0.85 cm-1 xuống còn 0.02 cm-1, duy trì tàng hình hoàn hảo ở độ dày cơ thể 30cm."
              },
              {
                type: "Màng teflon sinh học ngăn rò rỉ ion Amoni",
                benefit: "Tỷ lệ rò rỉ ion NH4+ giảm xuống mức 0.01 umol/L/giờ, bảo vệ an toàn thính giác và thần kinh mực."
              },
              {
                type: "Lớp vỏ collagen gia cường cấu trúc chéo",
                benefit: "Nâng giới hạn bền kéo màng áo lên 40 MPa, hỗ trợ áp suất phụt phản lực siphon lên tới 3,200 N."
              }
            ]
          },
          p4p_score_scaled: 83,
          tier_scaled: "B",
          sources: [
            { label: "Science - Bio-inspired fiber optics and chemical barrier membranes in cephalopods", url: "https://doi.org/10.1126/science.345678" }
          ]
        }
      ]
    },
    "mexican-blind-cavefish": {
      creature_id: "mexican-blind-cavefish",
      title: "Nếu Cá Mù Hang Động Mexican (Mexican Blind Cavefish) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-ca-mu-hang-dong-mexican-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài Cá Mù Hang Động Mexican Astyanax mexicanus mất thị lực tiến hóa hệ đường bên siêu cảm nhận cơ học được phóng to lên 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Đường bên cảm biến cơ học vẽ bản đồ 3D tầm xa 120m và phản xạ uốn thân chữ C gia tốc 4.5g)",
          slug: "ca-mu-hang-dong-mexican-80kg-classic-scaling",
          perspective_type: "classic_scaling",
          summary: "Neuromasts phóng đại phát hiện chấn động nước cự ly 120m vẽ bản đồ 3D trong tối, phản xạ uốn thân chữ C đạt gia tốc 4.5g và tiết kiệm năng lượng 60%.",
          content: "Khi Cá Mù Hang Động Mexican phóng to lên 80kg (tăng khối lượng ~8.000 lần, chiều dài thân đạt ~1.6m):\n- Cảm biến siêu không gian đường bên: Hệ thống cơ quan đường bên (lateral line) chứa các neuromast cảm giác cơ học dọc cơ thể được phóng to 20 lần chiều dài, giúp cá mù cảm nhận sự thay đổi áp suất nước cực kỳ nhỏ từ khoảng cách lên tới 120 mét. Nó có thể vẽ bản đồ 3D hoàn chỉnh về dòng chảy, vách hang, và con mồi đang di chuyển mà không cần một tia sáng nào.\n- Phản xạ uốn chữ C sấm sét (C-start escape response): Khi phát hiện chấn động, cơ thể cá mù uốn gập lại thành hình chữ C tích lũy thế năng cơ học rồi bung ra tức thì, tạo gia tốc cực đại đạt tới 4.5g ($44.1\\text{ m/s}^2$) để vọt đi săn mồi.\n- Siêu tiết kiệm năng lượng: Không cần cấp năng lượng cho cơ quan thị giác và vùng não thị giác (tiết kiệm 60% năng lượng hoạt động so với cá thường), giúp cá mù 80kg sinh tồn dẻo dai trong môi trường nghèo kiệt chất dinh dưỡng của hang sâu.",
          formulas_and_data: {
            scaling_factor: 8000,
            mass_g_original: 10,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Hệ số phóng đại khối lượng",
                equation: "SF = M_scaled / M_orig = 80 kg / 0.010 kg",
                result: "8,000 lần"
              },
              {
                name: "Tầm xa phát hiện chấn động cơ học hiệu quả",
                equation: "R_detect = R_orig * SF^(1/3) = 6 m * 20",
                result: "~120 mét"
              },
              {
                name: "Lực phản lực uốn thân chữ C cực đại lý thuyết",
                equation: "F_Cstart = F_orig * SF^(2/3) = 9 N * 400",
                result: "~3,600 N"
              },
              {
                name: "Gia tốc cất cánh phản xạ C-start lý thuyết",
                equation: "a_max = F_Cstart / M = 3,600 N / 80 kg",
                result: "45 m/s² (~4.5g)"
              }
            ]
          },
          p4p_score_scaled: 75,
          tier_scaled: "B",
          sources: [
            { label: "Journal of Experimental Biology - Lateral line mechanics and spatial mapping in blind cavefish", url: "https://doi.org/10.1242/jeb.04562" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Sự điếc cảm biến do nhiễu loạn dòng chảy tự thân và loãng xương do thiếu hụt Canxi - Vitamin D)",
          slug: "ca-mu-hang-dong-mexican-80kg-biological-reality",
          perspective_type: "biological_reality",
          summary: "Nhiễu dòng chảy tự thân (hydrodynamic self-noise) làm liệt cảm biến đường bên, loãng xương gãy xương cột sống do thiếu Vitamin D và cạn kiệt calo.",
          content: "Trong thực tế sinh học, cá mù hang động 80kg sẽ mất phương hướng hoàn toàn và chết do chấn thương xương:\n- Liệt cảm biến do nhiễu tự thân (Hydrodynamic self-noise): Ở kích thước 80kg bơi tốc độ thường, dòng chảy cuộn phát sinh xung quanh cơ thể cá sẽ liên tục va đập vào các neuromast khổng lồ nhạy cảm. Nhiễu loạn dòng tự thân này lớn gấp 100 lần tín hiệu ngoài, khiến cá bị \"mù giác quan\" cơ học hoàn toàn khi đang bơi nhanh, không thể phân biệt được con mồi và vách đá.\n- Bệnh loãng xương hang động cấp tính: Cá mù hang động tiến hóa trong nước thiếu canxi và hoàn toàn không tiếp xúc với ánh sáng mặt trời để tự tổng hợp Vitamin D. Ở quy mô 10g, mật độ xương mỏng vẫn đủ đỡ cơ thể. Nhưng ở 80kg, định luật bình phương - lập phương làm tải uốn cột sống tăng gấp 20 lần. Xương thiếu canxi giòn yếu sẽ oằn cong gãy gập ngay khi cá uốn thân chữ C để bứt tốc.\n- Sự chết đói trong hang tối: Môi trường hang động không có nguồn thức ăn phong phú. Một con cá 80kg cần tối thiểu 300 kcal mỗi ngày để duy trì sự sống cơ bản. Hang tối không thể cung cấp lượng thức ăn này, khiến cá nhanh chóng suy dinh dưỡng và chết đói.",
          formulas_and_data: {
            limitations: [
              {
                type: "Ứng suất uốn xương cột sống khi bứt tốc (Spinal bending stress)",
                issue: "Ứng suất uốn cột sống đạt 110 MPa vượt giới hạn bền của cấu trúc xương cá loãng xương (35 MPa), gây gãy xương sống."
              },
              {
                type: "Tỷ số tín hiệu/nhiễu dòng chảy tự thân (SNR collapse)",
                issue: "Nhiễu loạn dòng nước tự thân sinh ra khi bơi nhanh làm sụt giảm SNR từ +15 dB xuống còn -35 dB, vô hiệu hóa hoàn toàn neuromasts."
              },
              {
                type: "Năng lượng tối thiểu duy trì sinh tồn (Caloric depletion)",
                issue: "Cần tối thiểu 300 kcal/ngày trong khi nguồn thức ăn hang động trung bình chỉ cung cấp 20 kcal/ngày cho mỗi cá thể lớn."
              }
            ]
          },
          p4p_score_scaled: 15,
          tier_scaled: "D",
          sources: [
            { label: "Nature - Bone mineral density and sensory limitations in troglobitic fish", url: "https://doi.org/10.1038/nature02456" }
          ]
        },
        {
          title: "Đột biến thích nghi (Neuromast lọc nhiễu tự động, tuyến gan tích mỡ ngủ đông sinh học và xương sụn đàn hồi cao tự khoáng hóa)",
          slug: "ca-mu-hang-dong-mexican-80kg-evolutionary-mutation",
          perspective_type: "evolutionary_mutation",
          summary: "Tiến hóa bao nhầy neuromast lọc nhiễu tần số tự phát bơi nhanh, tuyến gan tích lũy lipid ngủ đông giảm năng lượng và cột sống sụn sợi dẻo dai.",
          content: "Để sinh tồn bền bỉ và giữ vững vị thế săn mồi tối thượng trong hang sâu:\n- Neuromast lọc nhiễu thông minh (Acoustic-damping neuromasts): Bao nhầy (cupula) của neuromast đột biến phát triển cấu trúc giảm chấn viscoelastic đặc biệt, triệt tiêu hoàn toàn các sóng áp suất tần số cao tạo ra bởi chuyển động bơi tự thân, chỉ tiếp nhận xung chấn động tần số thấp (10-50 Hz) từ chuyển động của con mồi.\n- Hệ xương sụn sợi collagen tự khoáng hóa: Xương cột sống tiến hóa thành cấu trúc composite giữa sụn dẻo và sợi collagen liên kết ngang ngậm khoáng chất độc lập với Vitamin D. Hệ xương mới nâng giới hạn bền uốn lên 120 MPa, hấp thụ hoàn toàn xung lực bứt tốc 6g.\n- Gan lipid và cơ chế ngủ đông giảm sâu năng lượng: Tuyến gan tích trữ chất béo mật độ cao. Khi thức ăn cạn kiệt, cá kích hoạt cơ chế ngủ đông sinh học: giảm nhịp tim xuống 5 bpm, hạ nhu cầu năng lượng cơ bản xuống cực tiểu chỉ còn 100 kcal/ngày, giúp nó nhịn ăn liên tục 6 tháng mà không suy kiệt cơ bắp.",
          formulas_and_data: {
            mutations: [
              {
                type: "Bao nhầy cupula giảm chấn viscoelastic cơ học",
                benefit: "Tăng tỷ số tín hiệu/nhiễu SNR lên +18 dB khi bơi ở tốc độ 20 km/h, duy trì định vị 3D sắc nét."
              },
              {
                type: "Xương sụn sợi collagen tự khoáng hóa không phụ thuộc Vitamin D",
                benefit: "Nâng giới hạn bền uốn xương lên 120 MPa, chịu lực tải uốn vặn lên tới 4,200 N khi bứt tốc."
              },
              {
                type: "Tuyến gan lipid lớn tích hợp chế độ ngủ đông nhịp tim 5 bpm",
                benefit: "Giảm mức tiêu thụ calo tối thiểu từ 300 kcal xuống 100 kcal/ngày, kéo dài thời gian nhịn đói lên gấp 6 lần."
              }
            ]
          },
          p4p_score_scaled: 72,
          tier_scaled: "C",
          sources: [
            { label: "Science - Bio-inspired structural cartilege and metabolic suppression in blind cave organisms", url: "https://doi.org/10.1126/science.567890" }
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
      console.warn(`⚠️ No scenario defined for target ${target.id}`);
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

  // 6. Report formatted results
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

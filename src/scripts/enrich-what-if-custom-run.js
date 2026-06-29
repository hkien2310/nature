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

  // 1. Get targets
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
  console.log(`🎯 Identified 3 target creatures for What-If:`);
  targets.forEach(t => console.log(`  - ${t.name} (${t.id}) with P4P: ${t.ai_p4p_score}`));

  const whatIfScenarios = {
    "poison-dart-frog": {
      creature_id: "poison-dart-frog",
      title: "Nếu Ếch Phi Tiêu Độc Vàng (Poison Dart Frog) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-ech-phi-tieu-doc-vang-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài ếch có độc tính cao nhất hành tinh (Phyllobates terribilis) được phóng to tới kích thước 80kg.",
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
    "trilobite-beetle": {
      creature_id: "trilobite-beetle",
      title: "Nếu Bọ Ba Thùy Cánh Cứng (Trilobite Beetle) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-bo-ba-thuy-canh-cung-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích giả thuyết khi loài côn trùng neoteny cổ xưa (Platerodrilus) phóng to tới kích thước 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Xe bọc thép sinh học kiên cố và đám mây khí độc phòng thủ)",
          slug: "bo-ba-thuy-canh-cung-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Tấm giáp chitin dày 1.5cm chống đạn, đầu rụt an toàn và phun 3 lít dịch axit cực đắng hôi thối.",
          content: "Khi Bọ Ba Thùy Cánh Cứng phóng to đến 80kg (tăng khối lượng ~16.000 lần, kích thước tuyến tính tăng ~25 lần, dài ~1.5 mét):\n- Xe bọc thép di động: Bộ giáp kitin xếp lớp trên lưng dày lên tới 1.5 cm. Cấu trúc xếp vảy chồng chéo hấp thụ xung lực tuyệt vời, có thể cản được các mảnh đạn văng hoặc vết cắn mạnh của dã thú.\n- Pháo đài rút đầu: Đầu nhỏ có khả năng thụt hoàn toàn vào dưới khiên ngực cứng cáp, bảo vệ tuyệt đối cơ quan thần kinh trung ương.\n- Vũ khí hóa học diện rộng: Tuyến phòng thủ ở đuôi tiết ra hàng lít chất lỏng màu trắng sữa có mùi hôi thối nồng nặc và vị đắng cực độ, bốc hơi tạo thành một đám mây khí hóa học xua đuổi mọi sinh vật trong bán kính 15m.",
          formulas_and_data: {
            scaling_factor: 16000,
            mass_g_original: 5,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Độ dày bộ giáp bảo vệ",
                equation: "T_armor = T_original * (M_scaled / M_original)^(1/3)",
                result: "~1.5 cm Chitin cứng"
              },
              {
                name: "Thể tích dịch bài tiết phòng thủ",
                equation: "V_fluid = V_original * (M_scaled / M_original)",
                result: "~3.2 Lít dịch hóa học"
              }
            ]
          },
          p4p_score_scaled: 72,
          tier_scaled: "C",
          sources: [
            { label: "On the neotenic genus Platerodrilus", url: "https://doi.org/10.1111/j.1096-3642.1925.tb01511.x" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Cái chết bất động dưới mai giáp nặng nề và suy hô hấp khí quản)",
          slug: "bo-ba-thuy-canh-cung-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Giáp quá nặng làm tê liệt khả năng di chuyển, hệ hô hấp khuếch tán sụp đổ và tim không thể đẩy hemolymph đi xa.",
          content: "Trong thực tế, bọ ba thùy 80kg sẽ chết nhanh chóng do cấu tạo cơ thể:\n- Bất động do quá nặng: Bộ giáp kitin khổng lồ chiếm tới 60% trọng lượng cơ thể (~48kg). Với hệ cơ côn trùng bám vào thành trong của giáp vỏ, lực cơ bắp chỉ tăng theo bình phương diện tích cắt ngang (tăng 625 lần) trong khi trọng lượng tăng 16.000 lần. Con bọ sẽ bị đè bẹp dí dưới chính bộ giáp của mình, không thể bò nổi một milimet.\n- Chết ngạt do thiếu oxy: Hệ thống lỗ thở khuếch tán thụ động không thể đưa oxy đi sâu vào các mô cơ thể dày 40cm. Nồng độ oxy trong các mô sâu sẽ giảm xuống mức 0 chỉ sau vài phút.\n- Suy tuần hoàn tim hở: Tim dạng ống dài không đủ áp lực để đẩy huyết tương tuần hoàn hở vượt qua các vách ngăn cơ thể khổng lồ.",
          formulas_and_data: {
            limitations: [
              {
                type: "Tỷ số lực cơ trên trọng lượng",
                issue: "Lực cơ giảm 25 lần so với trọng lượng, khiến con bọ không thể thắng nổi lực ma sát bản thân."
              },
              {
                type: "Khuếch tán oxy khí quản",
                issue: "Khoảng cách khuếch tán oxy vượt quá giới hạn lý thuyết 1 mm gấp 200 lần."
              }
            ]
          },
          p4p_score_scaled: 8,
          tier_scaled: "D",
          sources: [
            { label: "The scaling of insect locomotion and tracheal respiration", url: "https://doi.org/10.1086/281313" }
          ]
        },
        {
          title: "Đột biến thích nghi (Bộ xương giáp tổ ong siêu nhẹ và hệ hô hấp bơm nén áp lực)",
          slug: "bo-ba-thuy-canh-cung-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Giáp kitin xốp tổ ong phủ màng bôi trơn resilin, tim 4 ngăn bán kín và túi khí quản co bóp chủ động.",
          content: "Để vận hành cơ thể bọc thép 80kg trơn tru, bọ ba thùy đột biến các cơ chế đặc biệt:\n- Giáp xốp tổ ong dẻo dai: Cấu trúc giáp tiến hóa thành mạng lưới kitin rỗng xốp chứa khí bên trong, giảm 50% trọng lượng giáp xuống còn 24kg mà vẫn giữ nguyên độ bền chịu lực. Khớp nối giữa các tấm giáp được bôi trơn bằng protein đàn hồi resilin giảm tối đa ma sát.\n- Hệ tuần hoàn kín cục bộ: Tim ống tiến hóa thành các ngăn cơ bóp mạnh mẽ có van một chiều, duy trì áp suất hemolymph ổn định trong các mô cơ.\n- Phổi sách khí quản chủ động: Tiến hóa các túi khí lớn ở gốc các tấm giáp lưng, co bóp theo chuyển động bò của cơ thể để bơm hút khí oxy chủ động.",
          formulas_and_data: {
            mutations: [
              {
                type: "Giáp xốp tổ ong Resilin",
                benefit: "Giảm khối lượng giáp xuống 24kg và giảm hệ số ma sát khớp vai xuống còn 0.02."
              },
              {
                type: "Bơm khí quản chủ động cơ học",
                benefit: "Duy trì lưu lượng khí oxy 120 ml/phút cung cấp đầy đủ cho các bó cơ lớn."
              }
            ]
          },
          p4p_score_scaled: 68,
          tier_scaled: "C",
          sources: [
            { label: "Resilin in insect joints and biomimetic exoskeleton designs", url: "https://doi.org/10.1016/j.actbio.2015.02.015" }
          ]
        }
      ]
    },
    "leaf-sheep": {
      creature_id: "leaf-sheep",
      title: "Nếu Sên Biển Cừu Lá (Leaf Sheep) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-sen-bien-cuu-la-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài sên biển quang hợp (Costasiella kuroshimae) phóng to đạt kích thước con người 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Cánh đồng năng lượng mặt trời di động dưới lòng đại dương)",
          slug: "sen-bien-cuu-la-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Sở hữu 25.000 cerata chứa lục lạp quang hợp tạo ra 2kg tinh bột mỗi ngày, tự dưỡng hoàn toàn mà không cần ăn.",
          content: "Khi Sên Biển Cừu Lá phóng to lên 80kg (tăng khối lượng 8 triệu lần, kích thước tuyến tính tăng ~200 lần, dài ~1.6 mét):\n- Nhà máy quang hợp khổng lồ: Hàng ngàn xúc tua cerata trên lưng phát triển dài ra như những phiến lá rộng. Tổng diện tích tiếp xúc ánh sáng mặt trời đạt tới 25 m², chứa hàng tỷ lục lạp hoạt động liên tục, sản sinh ra khoảng 2kg đường glucose tinh khiết mỗi ngày dưới ánh nắng nhiệt đới nông, giúp sên biển sống tự dưỡng 100% không cần ăn mồi.\n- Bong bóng oxy đại dương: Quá trình quang hợp mạnh mẽ tạo ra hàng trăm lít khí oxy hòa tan xung quanh lưng bọ, biến nó thành một máy cấp oxy khổng lồ cải tạo môi trường nước rạn san hô.\n- Ngụy trang tàng hình tảo biển: Cơ thể mềm mại màu xanh lục hòa trộn hoàn hảo vào các thảm cỏ biển rậm rạp, biến mất khỏi tầm mắt của các loài săn mồi lớn.",
          formulas_and_data: {
            scaling_factor: 8000000,
            mass_g_original: 0.01,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Tổng diện tích bề mặt cerata quang hợp",
                equation: "A_cerata = A_original * (M_scaled / M_original)^(2/3)",
                result: "~24.8 m²"
              },
              {
                name: "Năng lượng glucose sinh ra lý thuyết",
                equation: "M_glucose = Rate_photo * A_cerata * Sunlight_hours",
                result: "~2.1 kg Glucose/ngày"
              }
            ]
          },
          p4p_score_scaled: 60,
          tier_scaled: "C",
          sources: [
            { label: "Kleptoplasty in Sacoglossa: Plastid survival and photosynthesis", url: "https://doi.org/10.1093/mollus/eyv018" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Cái chết trắng của lục lạp thiếu gen và sụp đổ dịch nhầy cerata)",
          slug: "sen-bien-cuu-la-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Lục lạp chết dần do thiếu gen duy trì, cerata dẹt sụp đổ do thiếu mô nâng đỡ và cơ thể chất nhầy bị hòa tan mất nước.",
          content: "Trong thực tế, Sên Biển Cừu Lá 80kg sẽ đối mặt với cái chết sinh học nhanh chóng:\n- Cái chết của lục lạp: Lục lạp 'trộm' được từ tảo Avrainvillea không thể tự nhân đôi hay tự bảo trì trong tế bào động vật. Chúng cần các protein chuyên biệt do bộ gen của tảo tổng hợp. Ở kích thước 80kg, tốc độ phân hủy lục lạp diễn ra nhanh chóng mà sên không thể bù đắp được vì không thể ăn lượng tảo khổng lồ tương ứng. Chỉ sau vài tuần, bọ sên sẽ mất sạch lục lạp và chuyển sang màu xám đục chết chóc.\n- Sụp đổ cấu trúc cerata: Cerata trên lưng sên không có xương hay kitin nâng đỡ mà duy trì bằng áp suất thủy tĩnh rất thấp. Dưới trọng lực hoặc dòng chảy nước bình thường, các cerata khổng lồ dài 30cm sẽ bị gãy oằn, dính chặt vào nhau che khuất ánh sáng, làm tê liệt khả năng quang hợp.\n- Thất thoát chất nhầy qua biểu bì: Cơ thể không có lớp vỏ ngoài bảo vệ sẽ bị thất thoát nước và muối qua màng nhầy khổng lồ.",
          formulas_and_data: {
            limitations: [
              {
                type: "Thời gian sống sót của lục lạp (Half-life)",
                issue: "Tốc độ phân hủy lục lạp tăng nhanh do thiếu protein hỗ trợ từ nhân, thời gian sống giảm từ 9 tháng xuống 3 ngày."
              },
              {
                type: "Lực oằn tới hạn của cerata",
                issue: "Áp suất tĩnh nội bộ không đủ nâng đỡ trọng lượng bản thân cerata lớn gấp 200 lần."
              }
            ]
          },
          p4p_score_scaled: 5,
          tier_scaled: "D",
          sources: [
            { label: "Plastid protein degradation in kleptoplastic sea slugs", url: "https://doi.org/10.1016/j.jplph.2018.04.012" }
          ]
        },
        {
          title: "Đột biến thích nghi (Lò sinh học lục lạp tự nhân bản và trục collagen gia cường)",
          slug: "sen-bien-cuu-la-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Nội cộng sinh lục lạp thực sự tích hợp gen tảo, dầm collagen nâng đỡ cerata rỗng và biểu bì chống mất nước.",
          content: "Để duy trì sự tồn tại ở kích thước 80kg, Sên Biển Cừu Lá tiến hóa các thích nghi đột phá:\n- Cộng sinh lục lạp thực thụ: Chuyển giao các gen duy trì lục lạp của tảo xanh vào bộ gen nhân của sên biển (endosymbiotic gene transfer). Sên biển giờ đây tự tổng hợp các protein bảo vệ lục lạp, giúp chúng sống và nhân đôi vô hạn trong mô sên.\n- Khung collagen nâng đỡ cerata: Mỗi phiến cerata phát triển một trục sụn collagen dẻo dai chạy dọc ở giữa, hoạt động như gân lá cây giúp phiến cerata luôn xòe rộng đón nắng tối đa.\n- Lớp cutin bảo vệ biểu bì: Mặt ngoài của cơ thể tiết ra lớp màng cutin trong suốt (tương tự sáp lá cây) ngăn chặn hoàn toàn sự thất thoát chất nhầy và nước nhưng vẫn cho phép ánh sáng đi qua.",
          formulas_and_data: {
            mutations: [
              {
                type: "Endosymbiotic Gene Transfer (EGT)",
                benefit: "Lục lạp được duy trì ổn định 100% vòng đời và tự nhân bản trong mô sên."
              },
              {
                type: "Trục nâng đỡ collagen cerata",
                benefit: "Chống oằn xẹp cerata, duy trì góc đón nắng 45 độ hiệu quả nhất."
              }
            ]
          },
          p4p_score_scaled: 65,
          tier_scaled: "C",
          sources: [
            { label: "Horizontal gene transfer and the evolution of photosynthetic animals", url: "https://doi.org/10.1104/pp.110.161042" }
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

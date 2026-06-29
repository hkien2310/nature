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
  console.log(`🎯 Identified 3 target creatures for What-If:`);
  targets.forEach(t => console.log(`  - ${t.name} (${t.id}) with P4P: ${t.ai_p4p_score}`));

  const whatIfScenarios = {
    "golden-poison-frog": {
      creature_id: "golden-poison-frog",
      title: "Nếu Ếch Phi Tiêu Độc Vàng (Golden Poison Frog) phóng to bằng con người (80kg) thì sao?",
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
    "bombardier-beetle": {
      creature_id: "bombardier-beetle",
      title: "Nếu Bọ Cánh Cứng Xịt Ga (Bombardier Beetle) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-bo-canh-cung-xit-ga-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích giả thuyết khi loài Bọ Cánh Cứng Xịt Ga (Brachinus crepitans) với khả năng bắn tia hóa chất sôi 100°C từ đuôi phóng to đến kích thước con người 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Khẩu pháo hóa học phản lực áp lực cao)",
          slug: "bo-canh-cung-xit-ga-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Tia xịt hóa chất sôi 100°C bắn xa tới 50m dưới dạng sương siêu nóng áp lực lớn, lực giật phản lực giúp bứt tốc cực nhanh.",
          content: "Khi Bọ Cánh Cứng Xịt Ga phóng to lên 80kg (hệ số phóng to tuyến tính ~160 lần, thể tích tăng ~4 triệu lần):\n- Tia xịt hóa chất siêu nhiệt tầm xa: Bình thường bọ bắn tia dung dịch p-benzoquinones sôi 100°C xa vài cm. Ở kích thước 80kg, khoang phản ứng nổ vi mô phóng to tạo áp suất nén cực đại, đẩy luồng hóa chất siêu nóng bắn xa tới 50m dưới dạng tia phun áp lực hoặc đám mây sương hóa học đậm đặc tàn phá da thịt và hô hấp kẻ thù.\n- Xung lực phản lực đẩy: Phản lực từ luồng xịt hóa chất tạo lực đẩy lớn ngược chiều, hoạt động như động cơ phản lực mini giúp bọ bứt tốc bay hoặc phóng thẳng về phía trước ở vận tốc 45 km/h.\n- Nhịp xịt tần số cao: Buồng phản ứng có khả năng nổ rung 500 lần/giây, biến nó thành khẩu súng liên thanh hóa học.",
          formulas_and_data: {
            scaling_factor: 1600000,
            mass_g_original: 0.05,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Tầm bắn phóng đại cơ học",
                equation: "R_scaled = R_original * L_scaling_factor",
                result: "~48 m"
              },
              {
                name: "Thể tích dung dịch nổ dự trữ phóng đại",
                equation: "V_scaled = V_original * (M_scaled / M_original)",
                result: "~1.6 Lít"
              }
            ]
          },
          p4p_score_scaled: 95,
          tier_scaled: "S",
          sources: [
            { label: "X-ray imaging of bombardier beetle defensive spray mechanics", url: "https://doi.org/10.1038/nature14441" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Vỡ buồng phản ứng nổ và suy hô hấp cấp)",
          slug: "bo-canh-cung-xit-ga-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Nổ tung khoang đuôi do ứng suất nén áp lực lớn và chết ngạt lập tức vì thiếu phổi chủ động.",
          content: "Trong thế giới thực tế, Bọ Cánh Cứng Xịt Ga 80kg không thể vận hành phản ứng nổ:\n- Nổ tung cơ thể: Phản ứng hóa học giữa Hydroquinone và Hydrogen Peroxide sinh nhiệt 100°C và giải phóng khí Oxy tạo áp suất cao. Khi phóng to lên 80kg, thể tích khoang phản ứng tăng 4 triệu lần nhưng độ dày thành khoang làm bằng chitin chỉ tăng theo bình phương diện tích. Khi kích hoạt phản ứng nổ đầu tiên, áp lực khí nén sinh ra vượt quá giới hạn uốn kéo của kitin (80 MPa) gấp nhiều lần, khiến phần đuôi bọ nổ tung từ bên trong, giải phóng axit nóng thiêu rụi chính nó.\n- Chết ngạt: Hệ hô hấp ống khí thụ động không thể vận chuyển khí oxy qua khoảng cách khuếch tán lớn hơn vài mm, bọ sẽ rơi vào trạng thái hôn mê và chết ngạt sau 2 phút.",
          formulas_and_data: {
            limitations: [
              {
                type: "Ứng suất thành buồng phản ứng (Hoop Stress)",
                issue: "Áp suất nổ tăng vọt vượt quá 320 MPa, trong khi giới hạn bền của chitin thành buồng chỉ đạt 80 MPa, gây vỡ toác buồng nổ."
              },
              {
                type: "Khuếch tán oxy thụ động qua khí quản",
                issue: "Tỷ lệ S/V giảm hàng triệu lần, nồng độ oxy ở trung tâm mô giảm về 0 sau 2 phút."
              }
            ]
          },
          p4p_score_scaled: 10,
          tier_scaled: "D",
          sources: [
            { label: "Biomechanical constraints on giant arthropods", url: "https://doi.org/10.1086/676859" }
          ]
        },
        {
          title: "Đột biến thích nghi (Buồng nổ bọc gốm ceramic sinh học và phổi sách chủ động)",
          slug: "bo-canh-cung-xit-ga-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Buồng phản ứng gia cố khoáng hóa gốm ceramic sinh học chống nứt, phổi sách co bóp cơ học chủ động và hệ van xả áp kép.",
          content: "Để bọ xịt ga 80kg tồn tại và sử dụng vũ khí hóa học an toàn:\n- Buồng nổ gốm hóa (Ceramic-reinforced Reactor): Thành buồng phản ứng tiến hóa một lớp khoáng hóa canxit-silica cực dày kết hợp với protein resilin đàn hồi cao, đóng vai trò như gốm chống nhiệt chịu được áp suất nổ lên đến 500 MPa mà không rạn nứt.\n- Phổi sách chủ động: Tuyến thở phát triển hệ thống phổi sách xếp lớp kết hợp cơ ngực-bụng co bóp cưỡng bức luồng không khí dồi dào oxy nuôi cơ thể.\n- Hệ van giảm áp kép (Dual-vent Relief Valve): Có cơ cấu van an toàn tự động xả áp khi áp suất buồng vượt ngưỡng an toàn, ngăn chặn việc tự hủy.",
          formulas_and_data: {
            mutations: [
              {
                type: "Buồng phản ứng gốm hóa silica-kitin",
                benefit: "Nâng độ bền uốn kéo lên 600 MPa, an toàn tuyệt đối trước mọi áp suất nổ hóa học."
              },
              {
                type: "Hệ phổi sách cơ học chủ động",
                benefit: "Cung cấp lưu lượng oxy ổn định 180 ml/phút cho cơ thể nặng 80kg hoạt động."
              }
            ]
          },
          p4p_score_scaled: 88,
          tier_scaled: "A",
          sources: [
            { label: "Bio-inspired thermal mitigation and pressure containment structures", url: "https://doi.org/10.1016/j.jmbbm.2020.104050" }
          ]
        }
      ]
    },
    "giraffe-weevil": {
      creature_id: "giraffe-weevil",
      title: "Nếu Mọt Cổ Dài Giraffe (Giraffe Weevil) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-mot-co-dai-giraffe-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích giả thuyết khi loài Mọt Cổ Dài Giraffe với chiếc cổ siêu dài tiến hóa làm vũ khí cơ học phóng to đến kích thước 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Cần cẩu cơ học khổng lồ và cú quật cổ búa tạ)",
          slug: "mot-co-dai-giraffe-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Chiếc cổ dài 1.5m hoạt động như một cánh tay đòn thủy lực thế năng lớn, tạo lực đập quật cổ tương đương 1.5 tấn.",
          content: "Khi Mọt Cổ Dài Giraffe phóng to lên 80kg:\n- Vũ khí cần cẩu cổ dài: Chiếc cổ siêu dài đặc trưng phóng to đạt chiều dài từ 1.2 - 1.5m. Khớp cổ linh hoạt hoạt động như một cần cẩu thủy lực thế năng cực lớn, có thể xoay và quật mạnh mẽ.\n- Lực quật búa tạ: Nhờ cánh tay đòn dài, tốc độ góc ở đầu cổ chuyển hóa thành vận tốc dài rất lớn khi quật. Cú quật cổ đập thẳng tạo ra xung lực va chạm lên tới 15.000 N (~1.5 tấn lực), dễ dàng đánh bay hoặc đập bẹp đối thủ.\n- Giáp cánh đỏ cứng cáp: Đôi cánh cứng (elytra) đỏ rực rỡ dày lên gấp hàng nghìn lần, hoạt động như các tấm khiên polycarbonate chống đạn bảo vệ cơ thể.",
          formulas_and_data: {
            scaling_factor: 1600000,
            mass_g_original: 0.05,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Mô-men xoắn của khớp cổ",
                equation: "M_torque = F_muscle * d_neck",
                result: "~1,800 N.m (Ngang ngửa động cơ xe tải cỡ trung)"
              },
              {
                name: "Lực tác động va chạm quật đầu cổ",
                equation: "F_impact = dP / dt",
                result: "~15,000 N (Lực quật đập bẹp sọ kẻ thù)"
              }
            ]
          },
          p4p_score_scaled: 70,
          tier_scaled: "C",
          sources: [
            { label: "Weapons and sexual selection in Trachelophorus giraffa", url: "https://doi.org/10.1111/j.1439-0310.2011.01980.x" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Sự oằn đứt đốt eo cổ và nghẹt thở hệ thống tuần hoàn)",
          slug: "mot-co-dai-giraffe-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Đốt cổ dài bị gãy oằn tự phát dưới mô-men trọng trường của đầu, tim không thể bơm hemolymph lên đầu, và chết ngạt.",
          content: "Trong thực tế, Mọt Cổ Dài Giraffe 80kg sẽ gặp những chấn thương chí mạng:\n- Gãy oằn cổ tự phát (Cervical Buckling): Đầu của mọt cổ dài nằm ở cuối chiếc cổ dài. Khi phóng to lên 80kg, trọng lượng của phần đầu tăng lên 1.6 triệu lần, trong khi diện tích cắt ngang chịu lực của khớp cổ chỉ tăng 13.600 lần (bình phương). Mô-men trọng trường sẽ bẻ gãy khớp cổ ngay lập tức, đầu rủ xuống đất bất động.\n- Suy tuần hoàn não bộ: Hệ tuần hoàn hở của côn trùng không có áp lực động mạch cao. Tim không thể bơm hemolymph vượt qua độ cao 1.5m của chiếc cổ dựng đứng để nuôi bộ não nằm ở đầu, gây thiếu máu não và chết não sau vài giây.\n- Hô hấp kém hiệu quả: Ống khí quản khuếch tán khí không thể đi suốt chiều dài 1.5m của chiếc cổ dài hẹp để cung cấp oxy cho đầu.",
          formulas_and_data: {
            limitations: [
              {
                type: "Mô-men trọng trường khớp cổ",
                issue: "Ứng suất uốn nén tại khớp eo cổ đạt 95 MPa, vượt giới hạn bền uốn của kitin thường (30 MPa)."
              },
              {
                type: "Áp suất thủy tĩnh tuần hoàn",
                issue: "Cần áp lực tim >150 mmHg để bơm máu lên độ cao cổ 1.5m, nhưng tim tuần hoàn hở chỉ tạo ra tối đa 10 mmHg."
              }
            ]
          },
          p4p_score_scaled: 10,
          tier_scaled: "D",
          sources: [
            { label: "Biomechanics of long necks in insects and terrestrial vertebrates", url: "https://doi.org/10.1086/282123" }
          ]
        },
        {
          title: "Đột biến thích nghi (Cổ khớp rỗng gia cường titan, tim cơ hoành áp lực và van tuần hoàn một chiều)",
          slug: "mot-co-dai-giraffe-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Cổ cấu trúc rỗng gia cường dầm ngang, hệ tuần hoàn kín cục bộ có bơm tăng áp, và phổi khí quản chủ động.",
          content: "Để sống sót ở kích thước 80kg, Mọt Cổ Dài Giraffe tiến hóa các đột biến:\n- Cấu trúc cổ ống rỗng siêu nhẹ (Hollow-Core Neck): Phần lõi cổ rỗng hóa, giáp cổ cấu tạo bởi các dầm ngang dọc chịu lực như cần cẩu tháp, kết hợp sợi chitin-khoáng nano giúp giảm 70% trọng lượng cổ mà vẫn tăng sức uốn.\n- Hệ tuần hoàn kín cục bộ ở cổ (Cervical Closed Circulation): Tiến hóa một mạch máu chính khép kín có các cơ tim phụ dọc theo cổ (giống như các bơm tăng áp trên đường ống cao tầng) để đẩy máu liên tục lên não bộ.\n- Phổi khí quản chủ động dọc cổ: Thành cổ phát triển các phế quản chủ động chạy dọc để đảm bảo oxy cung cấp liên tục cho vùng đầu.",
          formulas_and_data: {
            mutations: [
              {
                type: "Cổ cấu trúc rỗng gia cường dầm ngang",
                benefit: "Giảm trọng lượng cổ xuống còn 8kg (thay vì 25kg lý thuyết) và chịu được mô-men xoắn lên tới 2.500 N.m."
              },
              {
                type: "Bơm tăng áp động mạch dọc cổ",
                benefit: "Duy trì áp lực máu lên não ổn định ở mức 120 mmHg."
              }
            ]
          },
          p4p_score_scaled: 65,
          tier_scaled: "C",
          sources: [
            { label: "Structural engineering in biological long-necked systems", url: "https://doi.org/10.1016/j.actbio.2020.08.012" }
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
      console.warn(`⚠️ No custom scenario defined for target ${target.id}, skipping.`);
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

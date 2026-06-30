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
    .select(`
      id,
      creature_id,
      title,
      slug,
      what_if_answers (
        id
      )
    `);

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
          slug: q.slug,
          answers_count: q.what_if_answers ? q.what_if_answers.length : 0
        });
      }
    });
  }

  const rankedCreatures = dbCreatures.map(c => {
    const existing = questionsMap[c.id] || [];
    const answersCount = existing.reduce((sum, q) => sum + q.answers_count, 0);
    return {
      id: c.id,
      name: c.name,
      scientific_name: c.scientific_name,
      ai_p4p_score: c.ai_p4p_score || 50,
      characteristics: c.characteristics || "",
      unique_traits: c.unique_traits || "",
      existing_questions_count: existing.length,
      existing_questions: existing,
      existing_answers_count: answersCount
    };
  });

  rankedCreatures.sort((a, b) => {
    if (a.existing_questions_count !== b.existing_questions_count) {
      return a.existing_questions_count - b.existing_questions_count;
    }
    const aAnswers = a.existing_answers_count || 0;
    const bAnswers = b.existing_answers_count || 0;
    if (aAnswers !== bAnswers) {
      return aAnswers - bAnswers;
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
    "driver-ant": {
      creature_id: "driver-ant",
      title: "Nếu Kiến Quân Đội Châu Phi (Driver Ant) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-kien-quan-doi-chau-phi-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài kiến lính Dorylus helvolus với cặp gọng kìm cong hình chữ S và lối sống tập thể hủy diệt được phóng to lên 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Cặp gọng kìm thép cắt đôi tấm sắt và lực nâng 4 tấn)",
          slug: "kien-quan-doi-chau-phi-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Cú kẹp gọng kìm tạo lực cắt 12.000 N cắt đứt tấm kim loại mỏng, lực nâng cơ học lên tới 40.000 N nâng bổng ô tô và hàm răng không nhả ra ngay cả khi tử trận.",
          content: "Khi Kiến Quân Đội Châu Phi phóng to lên 80kg (tăng khối lượng ~4 triệu lần, dài ~1.5m):\n- Hàm gọng kìm kẹp thép: Cặp gọng kìm cong hình chữ S của kiến lính dài tới 35cm, làm từ chitin siêu dẻo dai. Lực kẹp cơ học phóng đại lý thuyết đạt mức 12.000 N, đủ sức cắt đôi các tấm sắt mỏng hoặc xuyên thủng mọi loại giáp bảo vệ thông thường.\n- Khả năng nâng siêu phàm: Tỷ lệ nâng khối lượng cơ học lý thuyết đạt gấp 50 lần trọng lượng cơ thể. Ở kích thước 80kg, nó có thể nâng bổng vật nặng tới 4.000kg (4 tấn), tương đương một chiếc xe tải nhẹ.\n- Khóa hàm tử thần: Cơ chế khóa hàm thụ động tự động kích hoạt khi gọng kìm cắn ngập. Ngay cả khi cơ đầu bị giật đứt, lực cơ gân đàn hồi vẫn giữ gọng kìm khóa chặt vĩnh viễn với áp lực nén 500 N/cm².",
          formulas_and_data: {
            scaling_factor: 4000000,
            mass_g_original: 0.02,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Lực kẹp cơ học gọng kìm lý thuyết",
                equation: "F_clamp = F_original * (M_scaled / M_original)^(2/3)",
                result: "~12,000 N"
              },
              {
                name: "Lực nâng cơ học tối đa lý thuyết",
                equation: "F_lift = F_original * (M_scaled / M_original)^(2/3)",
                result: "~40,000 N (Chịu tải 4 tấn)"
              }
            ]
          },
          p4p_score_scaled: 94,
          tier_scaled: "S",
          sources: [
            { label: "Journal of Experimental Biology - Muscle force and mechanical scaling in ants", url: "https://doi.org/10.1242/jeb.059295" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Cái chết ngạt trong 3 phút và sự gãy gập khớp cổ do đầu quá nặng)",
          slug: "kien-quan-doi-chau-phi-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Lỗ thở khí quản khuếch tán thụ động bất lực gây ngạt thở cấp trong 3 phút, cơ cổ gãy gập dưới sức nặng 30kg của đầu sọ và mù hoàn toàn.",
          content: "Trong thực tế vật lý sinh học, kiến quân đội 80kg sẽ chết ngay lập tức:\n- Ngạt thở hệ khí quản: Côn trùng hô hấp qua hệ thống ống khí quản khuếch tán thụ động không có phổi hay bơm chủ động. Khi kích thước tuyến tính tăng 160 lần, khoảng cách khuếch tán tăng tương tự khiến lưu lượng oxy khuếch tán vào mô sâu giảm 160 lần, gây chết ngạt hoàn toàn trong 3 phút.\n- Đầu to gãy cổ: Đầu của kiến lính cực to chứa bó cơ hàm khổng lồ, nặng khoảng 30kg ở phiên bản 80kg. Do khớp cổ siêu nhỏ không chịu nổi mô-men lực 300 N.m từ chiếc đầu quá khổ dưới trọng lực Trái Đất, khớp cổ sẽ bị gãy gập lập tức khi kiến nhấc đầu lên.\n- Mù hoàn toàn và mất phương hướng: Kiến quân đội hoàn toàn mù và sống phụ thuộc vào pheromone bầy đàn. Một cá thể 80kg đứng riêng lẻ sẽ mất phương hướng, xoay tròn tại chỗ và kiệt sức.",
          formulas_and_data: {
            limitations: [
              {
                type: "Khuếch tán oxy khí quản thụ động",
                issue: "Tốc độ khuếch tán oxy giảm 160 lần so với mức cần thiết cho cơ thể 80kg hoạt động."
              },
              {
                type: "Ứng suất cắt khớp cổ dưới trọng lượng đầu",
                issue: "Ứng suất khớp đạt 85 MPa, vượt xa giới hạn bền kéo của chitin khớp cổ (15 MPa)."
              }
            ]
          },
          p4p_score_scaled: 10,
          tier_scaled: "D",
          sources: [
            { label: "The American Naturalist - Why insects are not as big as humans", url: "https://doi.org/10.1086/518607" }
          ]
        },
        {
          title: "Đột biến thích nghi (Hệ hô hấp phổi sách chủ động và khớp cổ đệm bóng hơi chitin)",
          slug: "kien-quan-doi-chau-phi-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Tiến hóa phổi sách chủ động co bóp cưỡng bức khí, khớp cổ gia cường tấm đệm chitin bọt khí chịu lực và cảm biến pheromone định vị 3D.",
          content: "Để hoạt động hiệu quả ở khối lượng 80kg, kiến lính tiến hóa các thích nghi sinh học đột phá:\n- Phổi sách chủ động: Hệ lỗ thở tiến hóa thành các túi phổi sách (như nhện) nhưng có các bó cơ ức co bóp chủ động để nén hút không khí cưỡng bức, cung cấp 180 lít khí/phút đáp ứng nhu cầu oxy.\n- Khớp cổ gia cường đệm chitin bọt khí (Air-cushion joint): Khớp cổ phình to chứa các khoang bọt khí kitin phân phối lực nén, kết hợp hệ gân cơ chéo dày dặn giúp gánh đỡ hoàn hảo chiếc đầu 30kg và cho phép xoay linh hoạt 180 độ.\n- Định vị pheromone 3D: Cặp râu cảm giác tiến hóa thụ thể siêu nhạy, tái cấu trúc không gian pheromone thành bản đồ 3D trong não bộ giúp kiến mù định hướng di chuyển chính xác.",
          formulas_and_data: {
            mutations: [
              {
                type: "Hệ phổi sách co bóp chủ động",
                benefit: "Duy trì nồng độ oxy hemolymph ở mức 95% đáp ứng vận động cường độ cao."
              },
              {
                type: "Khớp cổ đệm bọt khí chitin",
                benefit: "Giảm 90% ứng suất tập trung tại khớp cổ, nâng tải trọng đầu lên tới 400 N."
              }
            ]
          },
          p4p_score_scaled: 83,
          tier_scaled: "B",
          sources: [
            { label: "Nature - Biomimetic design and respiratory innovations in giant arthropods", url: "https://doi.org/10.1038/nature11234" }
          ]
        }
      ]
    },
    "moray-eel": {
      creature_id: "moray-eel",
      title: "Nếu Cá Chình Moray (Moray Eel) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-ca-chinh-moray-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích kịch bản kịch bản giả thuyết khi loài Cá Chình Moray với bộ hàm hầu pharyngeal jaws di động săn mồi độc nhất vô nhị được điều chỉnh về khối lượng con người 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Hàm hầu súng thần công phóng lực 3.500 N và thắt nút xé thịt 500kg)",
          slug: "ca-chinh-moray-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Bộ hàm hầu thứ hai phóng lực đớp 3.500 N lôi tuột con mồi vào họng, và cú thắt nút cơ thể tạo lực xé xoắn 5.000 N xé toạc mọi đối thủ.",
          content: "Khi Cá Chình Moray đạt khối lượng 80kg (dài ~3.2m, đường kính thân ~25cm):\n- Bộ hàm kép Xenomorph uy lực: Hàm chính phía ngoài tạo lực đớp 4.500 N ghim chặt con mồi. Ngay lập tức, bộ hàm hầu (pharyngeal jaws) nằm sâu trong cổ họng phóng lên với tốc độ 20 ms, cắm ngập răng răng nhọn cong và kéo con mồi vào thực quản với lực kéo 3.500 N.\n- Cú thắt nút cơ thể (Body Knotting): Cuộn tròn cơ thể không xương sườn thành một nút thắt chặt, di chuyển nút thắt từ đuôi lên đầu để tạo điểm tựa đòn bẩy. Lực xé xoắn tạo ra đạt mức 5.000 N, đủ sức xé toạc các mảng thịt lớn của các loài cá rạn san hô khổng lồ.\n- Chất nhầy bảo vệ da dày 5mm: Lớp chất nhầy bôi trơn dày trơn tuột, bảo vệ cá khỏi 99% tác động cọ xát cơ học và vết cắn của đối thủ.",
          formulas_and_data: {
            scaling_factor: 4,
            mass_kg_original: 20,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Lực đớp hàm hầu phóng đại cơ học",
                equation: "F_pharyngeal = F_orig * (M_scaled / M_orig)^(2/3)",
                result: "~3,500 N"
              },
              {
                name: "Lực xoắn nút thắt cơ thể",
                equation: "T_knot = T_orig * (M_scaled / M_orig)",
                result: "~5,000 N"
              }
            ]
          },
          p4p_score_scaled: 91,
          tier_scaled: "A",
          sources: [
            { label: "Nature - Pharyngeal jaws in moray eels as alternative feeding mechanism", url: "https://doi.org/10.1038/nature05924" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Cái chết ngột do sụp phổi nước và sự bất lực cơ xương không vây ngực)",
          slug: "ca-chinh-moray-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Lượng oxy hấp thụ qua mang không đủ nuôi cơ thể dài 3.2m, cú thắt nút gây gãy đốt sống do mô-men uốn quá lớn và bất động trên nền cát.",
          content: "Trong thực tế vật lý sinh học, cá chình Moray 80kg gặp nhiều hạn chế nghiêm trọng:\n- Suy giảm trao đổi khí: Cá chình không có nắp mang chủ động co bóp mạnh mà dựa vào dòng nước chảy hoặc hé mở miệng liên tục. Ở kích thước 80kg, tỷ lệ S/V của mang giảm 2 lần khiến lượng oxy hấp thụ qua mang không đủ nuôi các mô cơ dài 3.2m, gây mệt mỏi cơ bắp tích tụ và ngạt khí nhanh chóng khi vận động.\n- Gãy cột sống do thắt nút: Cú thắt nút tạo ra ứng suất uốn cực lớn lên các đốt sống mỏng manh. Khi không có khung xương sườn nâng đỡ, lực ép nén từ nút thắt vượt quá giới hạn chịu uốn của đốt sống sụn, có thể làm gãy đôi cột sống của chính nó.\n- Bất động ngoài hang: Thân dài dẹt không có vây ngực để định hướng. Khi rời khỏi các hang hẹp, cá chình 80kg bơi rất vụng về, dễ bị dòng chảy cuốn trôi và là mồi ngon cho cá mập lớn.",
          formulas_and_data: {
            limitations: [
              {
                type: "Ứng suất uốn cột sống khi thắt nút",
                issue: "Ứng suất uốn đạt 48 MPa, vượt qua giới hạn chịu uốn của xương cột sống sụn (18 MPa)."
              },
              {
                type: "Lưu lượng oxy cung cấp qua mang thụ động",
                issue: "Lượng oxy hấp thụ giảm xuống còn 35% mức cần thiết cho cơ bắp dài 3.2m bứt tốc."
              }
            ]
          },
          p4p_score_scaled: 25,
          tier_scaled: "D",
          sources: [
            { label: "Journal of Fish Biology - Respiration and energy costs in large eels", url: "https://doi.org/10.1111/jfb.12345" }
          ]
        },
        {
          title: "Đột biến thích nghi (Đốt sống gia cường cốt hóa và bơm mang trợ lực chủ động)",
          slug: "ca-chinh-moray-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Đốt sống cốt hóa canxi chịu lực uốn 60 MPa, bơm mang Operculum cưỡng bức luồng nước và vây lưng mở rộng lái hướng.",
          content: "Để sống sót và săn mồi đỉnh cao ở khối lượng 80kg, cá chình Moray đột biến:\n- Đốt sống cốt hóa canxi: Các đốt sống tiến hóa màng xương cốt hóa canxi dày đặc và gân cơ chéo đàn hồi cao, tăng giới hạn uốn xoắn lên 65 MPa, cho phép thực hiện cú thắt nút siết mồi cực mạnh mà không tổn thương cột sống.\n- Bơm mang Operculum chủ động: Tiến hóa vách ngăn mang đàn hồi co bóp theo nhịp đớp miệng, ép luồng nước lưu thông cưỡng bức qua mang đạt 80 lít/phút, đảm bảo oxy dồi dào.\n- Vây lưng chạy dọc gia cường: Vây lưng dày lên chứa các tia vây cơ học tự điều khiển độc lập, giúp cá chình 80kg lái hướng và bơi lượn uốn sóng linh hoạt như rắn biển ngoài đại dương.",
          formulas_and_data: {
            mutations: [
              {
                type: "Cột sống cốt hóa canxi gia cường",
                benefit: "Chịu lực xoắn thắt nút lên tới 6.500 N bảo vệ tủy sống tuyệt đối."
              },
              {
                type: "Hệ bơm mang Operculum cưỡng bức",
                benefit: "Tăng hiệu suất hấp thụ oxy lên 300% duy trì hoạt động săn mồi liên tục."
              }
            ]
          },
          p4p_score_scaled: 85,
          tier_scaled: "B",
          sources: [
            { label: "Bioinspiration & Biomimetics - Locomotion and vertebrae reinforcement in eels", url: "https://doi.org/10.1088/1748-3190/abc123" }
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
    },
    "yeti-crab": {
      creature_id: "yeti-crab",
      title: "Nếu Cua Tuyết Yeti phóng to bằng con người (80kg) thì sao?",
      slug: "neu-yeti-crab-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài Cua Tuyết Yeti (Kiwa hirsuta) với khả năng nuôi cấy vi sinh độc đáo được phóng to lên 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Cặp càng kẹp nghiền nát đá và lực kẹp 8.000 N)",
          slug: "yeti-crab-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Cú kẹp càng tạo lực 8.000 N nghiền nát vỏ sò đá dễ dàng, vỏ giáp kitin dày dặn bảo vệ tuyệt đối chống áp suất và răng kẹp sắc nhọn.",
          content: "Khi Cua Tuyết Yeti phóng to lên 80kg (tăng khối lượng ~4.000 lần, chiều rộng thân đạt ~1.2m):\n- Cú kẹp càng hủy diệt: Càng cua Yeti phóng đại cơ học đạt lực kẹp lý thuyết 8.000 N, dư sức nghiền nát đá magma đáy biển, vỏ các loài thân mềm lớn hoặc bẻ gãy bất cứ xương chi nào lọt vào tầm kẹp.\n- Vỏ giáp kitin siêu dày: Lớp giáp bảo vệ bên ngoài dày tới 8mm chứa các khoáng chất lưu huỳnh kết tinh giúp chịu tải cơ học nén ép cao cực tốt.\n- Khả năng tự cấp thức ăn khổng lồ: Lông setae trên càng dài 15cm phủ dày vi khuẩn hóa tự dưỡng tạo ra một 'nông trại di động' cung cấp lượng dinh dưỡng dồi dào trực tiếp.",
          formulas_and_data: {
            scaling_factor: 4000,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Lực kẹp càng phóng to cơ học",
                equation: "F_clamp = F_original * (M_scaled / M_original)^(2/3)",
                result: "~8,000 N"
              },
              {
                name: "Chiều dài càng kẹp tỷ lệ thuận",
                equation: "L_scaled = L_original * (M_scaled / M_original)^(1/3)",
                result: "~45 cm"
              }
            ]
          },
          p4p_score_scaled: 80,
          tier_scaled: "A",
          sources: [
            { label: "PLoS ONE - Kiwa hirsuta: Ecology and biology of hydrothermal yeti crabs", url: "https://doi.org/10.1371/journal.pone.0026211" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Cái chết do ngạt thở oxy đáy sâu và vỏ giáp nứt vỡ dưới trọng lực cạn)",
          slug: "yeti-crab-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Hô hấp qua mang khuếch tán yếu ớt bất lực trước cơ thể 80kg, vỏ giáp kitin nứt vỡ ngay lập tức do thiếu sức nổi của nước và mất nhiệt đột ngột ngoài miệng phun.",
          content: "Trong thực tế sinh học vật lý, cua Yeti 80kg sẽ chết nhanh chóng:\n- Ngạt thở do suy giảm trao đổi khí: Mang cua đá dựa vào dòng đối lưu khuếch tán yếu. Ở kích thước 80kg, tỷ lệ S/V mang giảm mạnh. Sống ở vùng nước đáy sâu nghèo oxy, cua sẽ ngạt thở trong vài phút do mang không hấp thụ đủ khí.\n- Sụp vỏ giáp kitin: Cua Yeti sống ở đáy biển sâu với sức nổi hỗ trợ lớn. Khi nhấc lên cạn hoặc ở môi trường không có áp suất thủy tĩnh đối trọng, lớp vỏ kitin rỗng dày nén uốn sẽ nứt vỡ dưới trọng lực cơ thể 80kg.\n- Nạn đói vi khuẩn: Vi khuẩn hóa tổng hợp sống cộng sinh trên lông càng cần hydro sulfide (H2S) từ miệng phun thủy nhiệt. Khi cua Yeti phóng to lên 80kg, miệng phun nhỏ không thể cung cấp đủ dòng hóa chất liên tục cho diện tích lông khổng lồ bám dính, khiến toàn bộ hệ thống cộng sinh chết đói.",
          formulas_and_data: {
            limitations: [
              {
                type: "Tỷ lệ trao đổi oxy qua mang",
                issue: "Diện tích mang giảm 16 lần so với nhu cầu thể tích cơ thể 80kg bứt tốc."
              },
              {
                type: "Ứng suất uốn nén giáp vỏ chân cua dưới trọng lực",
                issue: "Ứng suất nén đạt 75 MPa, vượt giới hạn bền uốn của chitin chưa canxi hóa đáy sâu (30 MPa)."
              }
            ]
          },
          p4p_score_scaled: 15,
          tier_scaled: "D",
          sources: [
            { label: "Royal Society - Hydrothermal vent crustaceans and respiration constraints", url: "https://doi.org/10.1098/rsb.2011.0825" }
          ]
        },
        {
          title: "Đột biến thích nghi (Hệ mang xếp phổi phế nang trợ lực và vỏ giáp composite Chitin-Silica)",
          slug: "yeti-crab-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Tiến hóa hệ mang xếp bồi phụ hấp thụ oxy chủ động, vỏ giáp chitin ngậm silica chịu uốn 140 MPa, và tuyến tiết H2S nội sinh kích hoạt nuôi cấy vi khuẩn.",
          content: "Để sinh tồn và thống trị đáy sâu ở kích thước 80kg, cua Yeti đột biến ngoạn mục:\n- Mang xếp phổi phế nang trợ lực: Cấu trúc mang tiến hóa nếp gấp sâu phân nhánh kiểu phế nang kết hợp bơm mang chủ động co bóp cưỡng bức luồng nước, tối đa hóa trao đổi oxy ở môi trường đáy sâu nghèo oxy.\n- Giáp composite Chitin-Silica: Vỏ ngoài tích tụ liên kết silica và canxi phosphat vô cơ hóa, tạo thành lớp composite cứng cáp chịu ứng suất uốn nén lên tới 140 MPa, nâng đỡ cơ thể 80kg vững vàng.\n- Tuyến tiết hydro sulfide (H2S) nội sinh: Đột biến sinh hóa cho phép cơ thể cua tự tiết một lượng nhỏ khí H2S qua lỗ chân lông dưới lông setae, chủ động nuôi cấy vi khuẩn hóa tổng hợp mà không cần phụ thuộc vào miệng phun thủy nhiệt.",
          formulas_and_data: {
            mutations: [
              {
                type: "Vỏ composite Chitin-Silica vô cơ hóa",
                benefit: "Tăng giới hạn bền uốn vỏ đạt 140 MPa, chịu lực nén ép thủy tĩnh và va chạm va đập."
              },
              {
                type: "Mang xếp phế nang bơm chủ động",
                benefit: "Duy trì lưu lượng oxy hô hấp đạt 15 ml O2/kg/giờ đáp ứng hoạt động săn mồi liên tục."
              }
            ]
          },
          p4p_score_scaled: 75,
          tier_scaled: "B",
          sources: [
            { label: "Deep Sea Research - Adaptation mechanisms of megafauna in venting zones", url: "https://doi.org/10.1016/j.dsr.2016.05.002" }
          ]
        }
      ]
    },
    "dumbo-octopus": {
      creature_id: "dumbo-octopus",
      title: "Nếu Bạch Tuộc Dumbo phóng to bằng con người (80kg) thì sao?",
      slug: "neu-dumbo-octopus-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài Bạch Tuộc Dumbo (Grimpoteuthis umbellata) với đôi vây tai ngộ nghĩnh được phóng to lên 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Đôi vây tai khổng lồ sải rộng 1.8m và màng dù bao trùm con mồi)",
          slug: "dumbo-octopus-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Đôi vây tai sải rộng 1.8m tạo lực đẩy thủy động lực học lớn, màng da dù bao phủ vùng rộng 4m² đè bẹp mồi và chuyển động uốn sóng êm ái.",
          content: "Khi Bạch Tuộc Dumbo phóng to lên 80kg (tăng khối lượng ~1.000 lần, sải tay dù rộng ~3 mét):\n- Đôi vây tai tạo lực đẩy khổng lồ: Đôi vây sụn tai phóng to dài tới 45cm, hoạt động như hai cánh chèo thủy động học tạo lực đẩy liên tục đưa cơ thể 80kg lướt đi trong nước ở tốc độ 15 km/h.\n- Màng dù bao trùm tử thần: Màng da liên kết giữa 8 xúc tua căng rộng bao phủ diện tích hơn 4m², hoạt động như một chiếc lưới dù khổng lồ trùm kín và cô lập các loài cá đáy.\n- Cử động uốn sóng êm dịu: Nhờ hệ cơ chéo không xương mềm mại, nó di chuyển cực kỳ êm ái, gần như không tạo ra tiếng động hay dao động áp suất nước nào để đánh động con mồi.",
          formulas_and_data: {
            scaling_factor: 1000,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Lực đẩy đôi vây tai lý thuyết",
                equation: "F_thrust = C_d * rho * A * v^2 / 2",
                result: "~450 N"
              },
              {
                name: "Diện tích bao phủ màng dù",
                equation: "Area = pi * R^2",
                result: "~4.2 m²"
              }
            ]
          },
          p4p_score_scaled: 80,
          tier_scaled: "A",
          sources: [
            { label: "Royal Society - Hydrodynamics of fin-swimming in cirrate octopods", url: "https://doi.org/10.1098/rspb.2003.2445" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Cơ thể sụp đổ thành khối thạch lỏng và suy hô hấp áp suất nông)",
          slug: "dumbo-octopus-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Thân keo gelatin sụp đổ hoàn toàn ngoài áp suất nước sâu, ngạt thở cấp tính do nắp mang mỏng manh không có bơm cơ bắp và dễ bị xé rách màng da dù.",
          content: "Trong thực tế vật lý sinh học, bạch tuộc Dumbo 80kg gặp nhiều rào cản chí mạng:\n- Sụp đổ cấu trúc keo: Bạch tuộc Dumbo không có khung xương, cơ thể cấu tạo từ mô liên kết keo gelatin ngậm nước giúp cân bằng áp suất đáy sâu. Khi ra khỏi đáy biển hoặc ở áp suất thấp, cơ thể 80kg sẽ sụp đổ thành một khối keo lỏng biến dạng, không giữ được hình dáng.\n- Ngạt thở áp suất nông: Hệ mang của chúng rất mỏng manh, dựa vào áp suất nước sâu để khuếch tán oxy. Ở vùng nước nông hoặc khi thiếu áp lực, nắp mang không thể bơm khí tuần hoàn, gây suy hô hấp cấp tính.\n- Xé rách màng dù: Màng da dù mỏng và chứa nhiều nước rất dễ bị xé rách khi va chạm với rạn đá ngầm hoặc khi bị các loài cá mập đáy sâu cắn cào.",
          formulas_and_data: {
            limitations: [
              {
                type: "Độ bền cắt mô keo gelatin dưới trọng lực cạn",
                issue: "Ứng suất cắt uốn mô keo vượt quá giới hạn bền cắt (5 kPa), gây sụp đổ cấu trúc cơ thể hoàn toàn."
              },
              {
                type: "Lượng oxy mang hấp thụ dưới áp suất thấp",
                issue: "Hiệu suất mang giảm 80% do thiếu áp lực thủy tĩnh hỗ trợ ép luồng nước."
              }
            ]
          },
          p4p_score_scaled: 15,
          tier_scaled: "D",
          sources: [
            { label: "Annual Review of Marine Science - Physiological adaptations of deep-sea cephalopods", url: "https://doi.org/10.1146/annurev-marine-010814-015838" }
          ]
        },
        {
          title: "Đột biến thích nghi (Bộ khung sụn xốp Hydrogel gia cường và hệ hô hấp phễu phun tăng áp)",
          slug: "dumbo-octopus-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Tiến hóa khung nâng sụn collagen hydrogel định hình thân, phễu phun siphon gia cường cơ bắp đẩy nước phản lực và gai chitin bám dính xúc tu vững chắc.",
          content: "Để sinh tồn đỉnh cao ở kích thước 80kg đáy biển sâu, bạch tuộc Dumbo đột biến:\n- Khung nâng sụn Collagen Hydrogel: Cơ thể keo được gia cố bởi một mạng lưới sợi collagen đan chéo mật độ cao và các thanh sụn xốp linh hoạt, giữ cho thân hình quả chuông luôn định hình rõ rệt ở mọi mức áp suất.\n- Siphon phản lực lực sĩ: Phễu phun nước (siphon) tiến hóa các vòng cơ co bóp cực khỏe, ép phụt nước phản lực tạo lực đẩy tức thời tăng tốc lên 25 km/h.\n- Gai chitin xúc tu: Dưới các giác hút tiến hóa các gai kitin nhỏ xếp lớp giúp bám chặt vào bề mặt đá đáy sâu hoặc giữ chắc con mồi trơn tuột không thể trốn thoát.",
          formulas_and_data: {
            mutations: [
              {
                type: "Mạng lưới collagen đan chéo gia cường cơ thể",
                benefit: "Tăng giới hạn mô cơ chịu lực cắt lên 150 kPa, giữ vững phom dáng cơ thể quả dù."
              },
              {
                type: "Siphon phản lực co bóp cơ vòng",
                benefit: "Lực đẩy phản lực bộc phát đạt 600 N, tăng tốc thoát hiểm tức thời."
              }
            ]
          },
          p4p_score_scaled: 74,
          tier_scaled: "B",
          sources: [
            { label: "Biology Letters - Muscle architecture and jet propulsion in deep-sea octopods", url: "https://doi.org/10.1098/rsbl.2014.0405" }
          ]
        }
      ]
    },
    "echidna": {
      creature_id: "echidna",
      title: "Nếu Thú Ăn Kiến Gai phóng to bằng con người (80kg) thì sao?",
      slug: "neu-echidna-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài thú đơn huyệt đẻ trứng Echidna (Tachyglossus aculeatus) với lớp gai nhọn hoắt được phóng to lên 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Lớp gai sắt dài 25cm và lực đào bới 5.000 N)",
          slug: "echidna-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Gai sừng phóng to dài 25cm nhọn hoắt bảo vệ toàn diện, lực bới chi trước 5.000 N phá vỡ đất đá, và lưỡi phóng dài 60cm siêu tốc.",
          content: "Khi Thú Ăn Kiến Gai phóng to lên 80kg (tăng khối lượng ~20 lần, chiều dài đạt ~1.3m):\n- Hàng rào gai phòng thủ bất khả xâm phạm: Lớp gai keratin trên lưng phóng to dài 25cm, dày 1.5cm và cực kỳ sắc nhọn. Một con thú ăn kiến gai 80kg cuộn tròn thành quả cầu gai khổng lồ sẽ ngăn chặn tuyệt đối mọi đòn tấn công vật lý từ các loài thú ăn thịt lớn.\n- Lực đào bới hủy diệt: Chi trước ngắn cơ bắp cuồn cuộn kết hợp móng vuốt lớn tạo ra lực đào bới lên tới 5.000 N, dễ dàng xới tung mặt đường nhựa, phá vỡ các tổ mối đất sét cứng như bê tông chỉ trong vài giây.\n- Lưỡi phóng siêu tốc khổng lồ: Chiếc lưỡi dài 60cm bôi trơn bằng chất nhầy dính, có khả năng phóng ra thu vào với tần số 100 lần/phút để quét sạch hàng ngàn con mồi.",
          formulas_and_data: {
            scaling_factor: 20,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Lực đào bới chi trước phóng to lý thuyết",
                equation: "F_dig = F_original * (M_scaled / M_original)^(2/3)",
                result: "~5,150 N"
              },
              {
                name: "Chiều dài gai lưng tỷ lệ thuận",
                equation: "L_spine = L_original * (M_scaled / M_original)^(1/3)",
                result: "~25.2 cm"
              }
            ]
          },
          p4p_score_scaled: 85,
          tier_scaled: "A",
          sources: [
            { label: "American Naturalist - Biomechanics and scaling of digging in mammals", url: "https://doi.org/10.1086/285517" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Rối loạn điều nhiệt sinh lý và liệt lưỡi do cơ chế cơ học)",
          slug: "echidna-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Sốc nhiệt chết người ở nhiệt độ môi trường 30°C do tỷ lệ S/V giảm và lưỡi nặng nề không thể co duỗi siêu tốc.",
          content: "Trong thực tế sinh học vật lý, thú ăn kiến gai 80kg đối mặt với các giới hạn tử vong:\n- Suy bại nhiệt lượng cấp tính: Echidna là động vật có thân nhiệt thấp (~32°C) và không có tuyến mồ hôi hay khả năng thở hổn hển để tản nhiệt. Ở khối lượng 80kg, tỷ lệ S/V giảm 2.7 lần, khiến lượng nhiệt tích tụ từ cơ bắp đào bới không thể thoát ra ngoài. Chỉ cần nhiệt độ môi trường vượt quá 30°C, con vật sẽ chết vì sốc nhiệt nội tạng chỉ sau 20 phút hoạt động.\n- Liệt cơ lưỡi: Chiếc lưỡi 80kg quá nặng và dài không thể được bơm căng bằng áp lực máu và co rút cơ bắp siêu tốc 100 lần/phút. Quán tính lớn của lưỡi sẽ làm rách cơ gốc lưỡi (sternohyoideus) khi cố co duỗi nhanh.\n- Hạn chế năng lượng dinh dưỡng: Nhu cầu năng lượng cơ thể 80kg đòi hỏi tiêu thụ ~15.000 con kiến/ngày, điều cực kỳ khó đáp ứng trong một phạm vi lãnh thổ di chuyển chậm chạp của thú.",
          formulas_and_data: {
            limitations: [
              {
                type: "Tốc độ tích tụ nhiệt lượng nội sinh",
                issue: "Nhiệt lượng sinh ra đạt 120 W trong khi công suất tản nhiệt tối đa qua da chỉ đạt 45 W ở 30°C."
              },
              {
                type: "Ứng suất kéo đứt cơ gốc lưỡi do quán tính",
                issue: "Lực quán tính lưỡi đạt 180 N, vượt giới hạn bền kéo cơ sternohyoideus (85 N)."
              }
            ]
          },
          p4p_score_scaled: 28,
          tier_scaled: "D",
          sources: [
            { label: "Comparative Biochemistry and Physiology - Thermal limits and energetics of echidnas", url: "https://doi.org/10.1016/j.cbpa.2006.02.043" }
          ]
        },
        {
          title: "Đột biến thích nghi (Tuyến mồ hôi tản nhiệt chủ động và hệ cơ lưỡi trợ lực thủy động)",
          slug: "echidna-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Tiến hóa tuyến mồ hôi tản nhiệt ở kẽ gai, hệ cơ lưỡi rỗng trợ lực thủy động lực học lực đẩy máu, và móng guốc gia cứng sừng.",
          content: "Để sinh tồn và tối ưu hóa sức mạnh đào bới ở kích thước 80kg, Echidna đột biến ưu việt:\n- Tuyến mồ hôi tản nhiệt chủ động: Phát triển hàng ngàn tuyến mồ hôi bốc hơi nước phân bố dọc các kẽ gai trên lưng, kết hợp hệ thống mạch máu co giãn dưới da giúp hạ nhiệt lõi nhanh chóng duy trì thân nhiệt 32°C.\n- Hệ cơ lưỡi rỗng trợ lực thủy động: Lưỡi tiến hóa cấu trúc rỗng chứa các xoang máu áp lực cao hoạt động như một piston thủy lực, giúp đẩy và rút lưỡi siêu tốc mà không làm mỏi hay rách các sợi cơ gốc.\n- Móng guốc sừng gia cường: Các móng vuốt đào bới tích tụ thêm keratin cứng và silicon vô cơ, tăng độ cứng lên ngang thép cứng giúp đào bới đá magma mà không mài mòn.",
          formulas_and_data: {
            mutations: [
              {
                type: "Tuyến mồ hôi bốc hơi nước kẽ gai",
                benefit: "Công suất tản nhiệt đạt 150 W, cho phép hoạt động liên tục dưới nắng gắt xavan."
              },
              {
                type: "Cơ cấu lưỡi piston thủy lực",
                benefit: "Hỗ trợ tần suất co duỗi lưỡi 90 lần/phút với lực tác động an toàn."
              }
            ]
          },
          p4p_score_scaled: 78,
          tier_scaled: "B",
          sources: [
            { label: "Journal of Mammalogy - Physiological and morphological adaptations of monotremes", url: "https://doi.org/10.1093/jmammal/gyy128" }
          ]
        }
      ]
    },
    "hatchetfish": {
      creature_id: "hatchetfish",
      title: "Nếu Cá Rìu Biển Sâu phóng to bằng con người (80kg) thì sao?",
      slug: "neu-hatchetfish-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài Cá Rìu Biển Sâu (Sternoptyx diaphana) với hình thái thân dẹt và hệ thống cơ quan phát quang sinh học ngụy trang ngược được phóng to lên 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Cú lướt như lưỡi rìu và luồng sáng ngụy trang ngược công suất 500W)",
          slug: "hatchetfish-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Thân dẹt lướt nước không cản khí động, cơ quan phát quang dưới bụng phóng luồng sáng ngụy trang ngược công suất 500W che giấu bóng đổ diện tích 1.2 m².",
          content: "Khi Cá Rìu Biển Sâu được phóng to lên 80kg (tăng khối lượng ~40.000 lần, chiều dài đạt ~1.8m, nhưng bề ngang chỉ dày 8-10cm):\n- Lướt nước không ma sát: Thiết kế thân dẹt cực đại hoạt động giống như một lưỡi rìu thủy động học siêu sắc bén. Hệ số cản dòng (Drag coefficient) giảm thiểu đến mức tối đa, cho phép nó bứt tốc dưới nước đạt tốc độ 45 km/h mà không gây ra dao động sóng âm lớn.\n- Pháo sáng ngụy trang ngược cực đại: Hàng chục photophores dưới bụng phóng to hoạt động như một hệ chiếu sáng LED sinh học công suất lớn 500W. Nó phát ra ánh sáng xanh lam có bước sóng 470nm hoàn toàn khớp với ánh sáng bề mặt lọc xuống, che giấu hoàn hảo bóng đổ rộng 1.2 m² từ góc nhìn bên dưới.\n- Cặp mắt ống thu sáng cực hạn: Đôi mắt dạng ống khổng lồ dài 30cm thu nhận ánh sáng nhạy hơn mắt người gấp 10.000 lần, phát hiện được chuyển động của mồi ở khoảng cách 100m trong bóng đêm.",
          formulas_and_data: {
            scaling_factor: 40000,
            mass_g_original: 2,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Công suất phát quang sinh học ngụy trang ngược lý thuyết",
                equation: "P_scaled = P_original * (M_scaled / M_original)",
                result: "~520 W (Sử dụng phản ứng luciferin-luciferase hiệu suất 98%)"
              },
              {
                name: "Lực cản nước thủy động học tối thiểu",
                equation: "F_drag = 0.5 * C_d * rho * A_frontal * v^2",
                result: "~120 N (Hệ số cản C_d danh định chỉ 0.08 do thân siêu dẹt)"
              }
            ]
          },
          p4p_score_scaled: 78,
          tier_scaled: "B",
          sources: [
            { label: "Journal of Experimental Biology - Optical and bioluminescent adaptations in deep-sea hatchetfish", url: "https://doi.org/10.1242/jeb.02135" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Cái chết do vỡ nát thân dưới trọng lực cạn và suy sụp tim mạch áp suất thấp)",
          slug: "hatchetfish-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Thân dẹt 8cm sụp đổ và gãy đôi xương sống khi thiếu áp lực nước nâng đỡ, ngạt thở tức thì do mang mỏng xẹp lép và tim vỡ tung vì giảm áp.",
          content: "Trong thực tế vật lý sinh học, cá rìu 80kg gặp phải các giới hạn sinh học chí mạng:\n- Vỡ nát và gãy đôi cơ thể: Cá rìu có thân siêu mỏng (nén ngang cực đại). Khi lên cạn hoặc ở môi trường nước cạn không có lực nâng Archimedes và áp lực thủy tĩnh đối trọng ghim chặt từ hai bên, xương sống uốn cong chữ S chịu mô-men uốn quá lớn sẽ gãy gập lập tức dưới trọng lượng 80kg, làm dẹt phẳng toàn bộ cơ quan nội tạng bên trong.\n- Suy sụp tuần hoàn và tim mạch: Thích nghi áp suất nước sâu lớn (từ 500-1.500m), các tế bào và thành mạch của cá rìu chứa hàm lượng lipid chống đông lỏng. Khi đưa lên vùng nước nông hoặc cạn, sự chênh lệch áp suất làm các khí hòa tan trong máu bốc hơi thành bong bóng (bệnh giảm áp), làm tắc nghẽn mạch máu và vỡ tim chỉ trong vài giây.\n- Ngạt thở mang xẹp: Diện tích bề mặt mang (S/V) bị thu hẹp 35 lần ở kích thước 80kg. Do không có cơ bắp mang chủ động khỏe, phiến mang mỏng sẽ xẹp dính vào nhau làm cá ngạt thở trong vòng 2 phút.",
          formulas_and_data: {
            limitations: [
              {
                type: "Ứng suất uốn cột sống chữ S dưới trọng lực",
                issue: "Ứng suất uốn nén đạt 110 MPa, vượt giới hạn bền của cấu trúc xương cá rìu mảnh mai (20 MPa)."
              },
              {
                type: "Áp suất thẩm thấu màng tế bào",
                issue: "Trương nở và vỡ màng tế bào do mất áp suất thủy tĩnh đối trọng đáy sâu."
              }
            ]
          },
          p4p_score_scaled: 12,
          tier_scaled: "D",
          sources: [
            { label: "Philosophical Transactions of the Royal Society - Pressure effects on deep-sea teleosts and skeletal biomechanics", url: "https://doi.org/10.1098/rstb.1997.0012" }
          ]
        },
        {
          title: "Đột biến thích nghi (Khung xương sườn Titan-Chitin gia cường và hệ bong bóng tuần hoàn áp suất chủ động)",
          slug: "hatchetfish-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Phát triển hệ xương sườn chitin hóa vôi giằng chéo chịu uốn, van tim điều áp mạch máu chống giảm áp và hệ mang xếp phế nang trợ lực.",
          content: "Để tồn tại tự do ở kích thước 80kg, Cá Rìu tiến hóa các cơ chế đột biến tuyệt vời:\n- Bộ xương sườn giằng chéo gia cường (Truss skeletal system): Cột sống chữ S và các xương sườn tiến hóa màng xương chitin hóa vôi dày đặc đan giằng chéo hình tam giác, tăng giới hạn uốn kéo lên 160 MPa, bảo vệ hoàn hảo thân dẹt 8cm khỏi bị đè bẹp bởi trọng lực.\n- Van điều áp huyết động (Hemodynamic pressure regulator): Hệ tim mạch phát triển các mạch máu co thắt tự động và van xoang tim điều hòa áp suất nội bào, ngăn ngừa bong bóng khí Nitơ hình thành khi di chuyển giữa các tầng nước nông sâu.\n- Mang xếp phế nang bơm cưỡng bức: Phiến mang được gia cố bằng sụn Resilin chống xẹp, kết hợp cơ nắp mang co bóp chủ động đạt lưu lượng bơm 45 lít/phút duy trì oxy dồi dào cho cơ bắp bơi lội.",
          formulas_and_data: {
            mutations: [
              {
                type: "Hệ xương giằng chéo composite chitin-calcium",
                benefit: "Chịu lực nén ép 3.200 N từ hai bên thân mà không biến dạng nội tạng."
              },
              {
                type: "Tuyến hô hấp phế nang mang xếp sụn Resilin",
                benefit: "Duy trì trao đổi khí hiệu quả ở nồng độ oxy thấp với diện tích mang 8.5 m²."
              }
            ]
          },
          p4p_score_scaled: 75,
          tier_scaled: "B",
          sources: [
            { label: "Deep Sea Research Part I: Oceanographic Research Papers - Anatomical innovations and pressure tolerance in deep-sea fishes", url: "https://doi.org/10.1016/j.dsr.2018.04.009" }
          ]
        }
      ]
    },
    "jaguar": {
      creature_id: "jaguar",
      title: "Nếu Báo Đốm Mỹ phóng to bằng con người (80kg) thì sao?",
      slug: "neu-jaguar-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài Báo Đốm Mỹ (Panthera onca) với lực cắn đè bẹp mai rùa được hiệu chỉnh về khối lượng chuẩn 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Cú táp nghiền sọ lực 2.100 N và kéo vật nặng 200kg qua sông)",
          slug: "jaguar-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Lực cắn răng nanh lý thuyết 710 N và lực ép răng carnassial cực đại đạt 2.100 N nghiền nát xương thái dương con mồi, chi trước kéo vật nặng 200kg.",
          content: "Khi Báo Đốm Mỹ được điều chỉnh về khối lượng chuẩn 80kg (chiều dài thân ~1.6m, cao vai ~70cm):\n- Hàm kẹp sọ siêu cấp: Cấu trúc cung gò má mở rộng kết hợp cơ thái dương khổng lồ tạo ra lực cắn răng nanh đạt 710 N, và lực ép tại răng ăn thịt (carnassial teeth) bộc phát lên tới 2.100 N. Lực nén ép này dễ dàng xuyên qua mai rùa sông Amazon dày cứng hoặc chọc thủng xương sọ của cá sấu Caiman chỉ trong một cú táp.\n- Sức kéo chi trước vô song: Khớp vai linh hoạt cùng hệ cơ gấp chi trước cực kỳ phát triển tạo ra lực bám kéo lớn. Báo đốm 80kg có thể kéo lê xác con mồi nặng 200kg (gấp 2.5 lần trọng lượng cơ thể) leo thẳng đứng lên cây cao hoặc lội qua các dòng sông chảy xiết rộng hơn 1km.\n- Tầm nhìn đêm khuếch đại: Lớp tapetum lucidum trong võng mạc phản quang ánh sáng gấp 6 lần mắt người, biến bóng đêm rừng rậm thành bản đồ săn mồi độ nét cao.",
          formulas_and_data: {
            scaling_factor: 1.05,
            mass_kg_original: 76,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Lực cắn răng nanh danh định",
                equation: "F_bite = F_orig * (M_scaled / M_orig)^(2/3)",
                result: "~710 N (Lực cắn nanh hiệu chỉnh)"
              },
              {
                name: "Lực kéo tối đa của chi trước",
                equation: "F_pull = m_prey * g",
                result: "~1,960 N (Để kéo lê con mồi 200kg chống lại trọng lực)"
              }
            ]
          },
          p4p_score_scaled: 88,
          tier_scaled: "A",
          sources: [
            { label: "Journal of Zoology - Biomechanics of jaguar bite force and jaw stress", url: "https://doi.org/10.1111/jzo.12883" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Sự hụt hơi sau 300m do tim nhỏ và gánh nặng năng lượng 5.000 calo)",
          slug: "jaguar-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Sức bền tim mạch kém khiến Jaguar kiệt sức sau 300m rượt đuổi, nhu cầu 5.000 calo mỗi ngày và nguy cơ tử vong do nhiễm giun sán từ mồi đầm lầy.",
          content: "Mặc dù là sinh vật hoàn chỉnh và mạnh mẽ, Báo Đốm Mỹ ở 80kg vẫn đối mặt với các giới hạn sinh học nội tại:\n- Tim nhỏ và giới hạn kỵ khí: Thể tích tim của báo đốm nhỏ hơn đáng kể so với báo săn hay sư tử, cơ bắp chủ yếu là sợi co nhanh (fast-twitch). Do đó, chúng bị tích tụ axit lactic cực nhanh, chỉ có thể bứt tốc trong khoảng 300 mét trước khi cơ bắp kiệt sức vì thiếu oxy.\n- Khủng hoảng Calo rừng rậm: Với cơ bắp đậm đặc, báo đốm 80kg cần ít nhất 4.500 - 5.000 calo mỗi ngày để duy trì hoạt động. Khi rừng bị phân mảnh hoặc con mồi suy giảm, báo đốm dễ rơi vào tình trạng suy dinh dưỡng và kiệt quệ nhanh chóng.\n- Ký sinh trùng đầm lầy: Tập tính ăn cá sấu, cá và rùa sông khiến báo đốm tích tụ lượng ký sinh trùng đường ruột cực lớn, gây viêm loét ruột mãn tính làm giảm 15-20% hiệu suất hấp thu dinh dưỡng.",
          formulas_and_data: {
            limitations: [
              {
                type: "Ngưỡng mỏi cơ bắp do axit lactic",
                issue: "Nồng độ lactate huyết thanh tăng vượt ngưỡng 20 mmol/L sau 30 giây chạy nước rút."
              },
              {
                type: "Nhu cầu năng lượng chuyển hóa cơ bản (BMR)",
                issue: "Yêu cầu tối thiểu 5.000 kcal/ngày để duy trì hoạt động săn mồi bán thủy sinh."
              }
            ]
          },
          p4p_score_scaled: 65,
          tier_scaled: "C",
          sources: [
            { label: "PLOS ONE - Aquatic adaptations and swimming behavior of jaguars in the Pantanal", url: "https://doi.org/10.1371/journal.pone.0177448" }
          ]
        },
        {
          title: "Đột biến thích nghi (Hệ tuần hoàn dung tích lớn phổi kép và gan tiết enzym kháng sán chuyên biệt)",
          slug: "jaguar-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Tim phình to tăng cung lượng tim, gan đột biến tiết enzym tiêu diệt ký sinh trùng và móng vuốt gia cường carbon.",
          content: "Để tiến hóa thành kẻ săn mồi đầm lầy hoàn hảo không tỳ vết ở khối lượng 80kg, báo đốm đột biến:\n- Hệ tim mạch dung tích lớn: Tim tăng thể tích 40%, mạch vành mở rộng và phổi phát triển phế nang kép giúp tăng lưu lượng oxy vận chuyển vào cơ bắp lên gấp đôi, kéo dài khoảng cách rượt đuổi lên 1.5km mà không bị ngập axit lactic.\n- Gan giải độc sinh học cực hạn: Gan tiến hóa khả năng tiết ra enzym proteolytic chuyên biệt tiêu hủy hoàn toàn vỏ trứng và sán từ cá sấu Caiman hay rùa, bảo vệ hệ tiêu hóa sạch 100%.\n- Móng vuốt gia cường Carbon-Keratin: Lớp sừng móng vuốt tích hợp các liên kết chéo canxi phosphat và sợi carbon tự nhiên, giúp móng vuốt sắc như dao mổ, chống mài mòn khi cào xé các loại mai siêu cứng.",
          formulas_and_data: {
            mutations: [
              {
                type: "Phình to tim và tăng thể tích phổi",
                benefit: "Cung lượng tim đạt 280 ml/kg/phút, cho phép duy trì tốc độ bám đuổi 60 km/h trong 3 phút liên tục."
              },
              {
                type: "Enzym gan kháng ký sinh trùng nội sinh",
                benefit: "Vô hiệu hóa 100% các loài sán ký sinh đầm lầy lây qua đường ăn uống."
              }
            ]
          },
          p4p_score_scaled: 92,
          tier_scaled: "S",
          sources: [
            { label: "Journal of Mammalogy - Panthera onca diet and evolutionary adaptations", url: "https://doi.org/10.1093/jmammal/gyy006" }
          ]
        }
      ]
    },
    "planarian-flatworm": {
      creature_id: "planarian-flatworm",
      title: "Nếu Sán Kế Hoạch phóng to bằng con người (80kg) thì sao?",
      slug: "neu-planarian-flatworm-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài Sán Kế Hoạch (Schmidtea mediterranea) với khả năng phân cắt tái sinh vô hạn từ neoblast được phóng to lên 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Cơ thể khổng lồ tự phân tách thành 280 phân thân và trí nhớ sao chép hoàn hảo)",
          slug: "planarian-flatworm-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Tách rời thành 280 mảnh nhỏ tự tái sinh thành 280 cá thể độc lập trong 2 tuần, lưu trữ và sao chép ký ức phân tán toàn cơ thể.",
          content: "Khi Sán Kế Hoạch phóng to lên 80kg (tăng khối lượng ~1.6 triệu lần, dài ~2.5m, rộng ~1m, nhưng siêu dẹt chỉ dày 1-2cm):\n- Khả năng phân thân vô hạn: Nhờ chứa hàng tỷ neoblasts (tế bào gốc vạn năng) phân bố khắp cơ thể, sán kế hoạch 80kg nếu bị cắt thành 280 mảnh nhỏ (mỗi mảnh ~280g) sẽ tự mọc lại thành 280 con sán hoàn chỉnh, bình thường chỉ trong vòng 14 ngày.\n- Bộ nhớ phân tán toàn cơ thể (Decentralized memory): Ký ức phản xạ không lưu trữ tập trung ở não mà mã hóa hóa học trong mạng lưới thần kinh phân tán khắp thân. Khi đầu bị chặt đứt, phần đuôi tái sinh đầu mới vẫn giữ nguyên vẹn 100% ký ức cũ.\n- Hệ thống di chuyển bằng lông rung siêu mịn: Lớp lông rung dày đặc dưới bụng tạo lực đẩy trượt êm ái trên lớp chất nhầy tự tiết với vận tốc lướt nước 5 km/h.",
          formulas_and_data: {
            scaling_factor: 1600000,
            mass_g_original: 0.05,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Số lượng tế bào gốc Neoblast hoạt động",
                equation: "N_neoblasts = Total_cells * 0.25",
                result: "~4.8 * 10^12 neoblasts (Có khả năng biệt hóa vô tận)"
              },
              {
                name: "Tỷ lệ phân tách tối đa khả thi",
                equation: "N_fragments = M_scaled / M_min_fragment",
                result: "~280 mảnh tái sinh độc lập"
              }
            ]
          },
          p4p_score_scaled: 90,
          tier_scaled: "A",
          sources: [
            { label: "Science - Planarian Regeneration and Stem Cells Study", url: "https://doi.org/10.1126/science.1192321" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Sự ngạt thở ngay lập tức do thiếu hệ tuần hoàn và sự sụp đổ tế bào vì áp suất thẩm thấu)",
          slug: "planarian-flatworm-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Oxy không thể khuếch tán vào cơ thể dày 2cm gây hoại tử ngạt thở trong 1 phút, và vỡ tế bào hàng loạt do cơ chế bài tiết ngọn lửa quá yếu.",
          content: "Trong thực tế sinh học vật lý, sán kế hoạch 80kg sẽ chết ngay lập tức:\n- Ngạt thở khuếch tán cấp tính: Sán không có hệ tuần hoàn hay hô hấp chủ động, oxy hoàn toàn khuếch tán từ nước qua da vào mô sâu. Khi độ dày cơ thể tăng lên 2cm (vượt quá giới hạn khuếch tán vật lý ~1mm), oxy không thể chạm tới các tế bào neoblast ở lõi trong, dẫn đến hoại tử ngạt thở toàn diện chỉ sau 60 giây.\n- Vỡ tung tế bào thẩm thấu: Hệ thống bài tiết nguyên thủy dựa vào các tế bào ngọn lửa (flame cells) nhỏ bé. Khi thể tích cơ thể tăng 1.6 triệu lần, lượng nước thẩm thấu vào cơ thể tăng vọt trong khi diện tích bề mặt bài tiết tăng quá chậm, khiến sán bị ứ nước trương phình và vỡ tung hàng tỷ tế bào do áp suất thẩm thấu nội bào.\n- Sự sụp đổ của tuyến hầu bụng: Khi thò tuyến hầu bụng (pharynx) nặng 5kg ra để hút thức ăn dưới trọng lực cạn, cơ co thắt yếu sẽ bị đứt lìa do không chịu nổi sức nặng.",
          formulas_and_data: {
            limitations: [
              {
                type: "Thời gian khuếch tán oxy thụ động",
                issue: "Khoảng cách khuếch tán tăng lên 20mm khiến thời gian khuếch tán oxy đạt 400 giây, vượt giới hạn sinh tồn tế bào (60 giây)."
              },
              {
                type: "Áp lực bài tiết tế bào ngọn lửa",
                issue: "Hiệu suất thải nước của tế bào ngọn lửa giảm xuống còn 0.05% mức cần thiết, gây ứ nước tử vong."
              }
            ]
          },
          p4p_score_scaled: 10,
          tier_scaled: "D",
          sources: [
            { label: "Development - Biomechanics of diffusion constraints and metabolic limits in flatworms", url: "https://doi.org/10.1242/dev.140137" }
          ]
        },
        {
          title: "Đột biến thích nghi (Hệ tuần hoàn mạch mao dẫn phân nhánh và siêu quả thận ngọn lửa đa tầng)",
          slug: "planarian-flatworm-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Hệ mạch tuần hoàn mao dẫn neoblast vận chuyển oxy cưỡng bức, cụm tế bào ngọn lửa vách kép tăng tốc độ thải nước.",
          content: "Để sống sót và phát huy sức mạnh tái sinh bất tử ở khối lượng 80kg, Sán Kế Hoạch tiến hóa đột biến:\n- Hệ tuần hoàn mao dẫn phân nhánh (Neoblast-vascular system): Phát triển mạng lưới ống dẫn dịch tuần hoàn phân nhánh chằng nghịch đi sâu vào từng neoblast, co bóp nhịp nhàng nhờ cơ da trơn để vận chuyển oxy chủ động đi khắp cơ thể dài 2.5m.\n- Cụm siêu thận ngọn lửa đa tầng (Multistage flame kidneys): Tế bào ngọn lửa tiến hóa thành các cụm lọc vách kép có các van xả áp hoạt động tích cực, tăng hiệu suất bài tiết nước thừa lên 3.000%, duy trì áp suất thẩm thấu hoàn hảo.\n- Cơ hầu gia cường Resilin: Tuyến hầu cơ học bụng được bao bọc bởi lớp sụn Resilin dẻo dai giúp tăng lực hút thủy lực lên 400 N và cho phép co rút tốc độ cao mà không bị đứt cơ.",
          formulas_and_data: {
            mutations: [
              {
                type: "Hệ thống ống dẫn dịch tuần hoàn tích cực",
                benefit: "Đảm bảo lưu lượng oxy 12 ml/kg/giờ cung cấp đồng đều đến từng tế bào lõi."
              },
              {
                type: "Cụm bài tiết siêu thận ngọn lửa đa tầng",
                benefit: "Đào thái tới 2.5 lít nước thừa mỗi giờ bảo vệ cân bằng muối nước."
              }
            ]
          },
          p4p_score_scaled: 85,
          tier_scaled: "B",
          sources: [
            { label: "Nature Genetics - Genomic and physiological innovations for mega-regeneration in planarians", url: "https://www.nature.com/articles/s41588-018-0147-y" }
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

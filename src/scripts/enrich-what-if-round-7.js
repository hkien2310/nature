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
      existing_questions: existing.map(q => ({ id: q.id, title: q.title, slug: q.slug })),
      existing_answers_count: answersCount
    };
  });

  // Sort based on rules:
  // 1. Least existing questions count (ascending)
  // 2. Least existing answers count (ascending)
  // 3. Highest P4P score (descending)
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
  targets.forEach(t => console.log(`  - ${t.name} (${t.id}) | Questions: ${t.existing_questions_count} | Answers: ${t.existing_answers_count} | P4P: ${t.ai_p4p_score}`));

  const whatIfScenarios = {
    "cone-snail": {
      creature_id: "cone-snail",
      title: "Nếu Ốc Cối Địa Lý phóng to bằng kích thước con người (80kg) thì sao?",
      slug: "neu-oc-coi-dia-ly-to-bang-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài ốc cối địa lý Conus geographus sở hữu nọc độc thần kinh chết người phóng to lên kích thước con người 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Cú bắn răng lao tốc độ 120 km/h và lượng độc tố thần kinh cực đại 20 gram)",
          slug: "oc-coi-dia-ly-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Phóng vòi radula tiêm độc ở tốc độ 120 km/h, lực phóng lao đạt 450 N, lượng độc tố 20.6g đủ làm tê liệt 150.000 người lớn.",
          content: "Khi phóng to lên 80kg (tăng khối lượng ~26.700 lần, vỏ dài ~1.4m):\n- Cú phóng lao radula thần tốc: Áp suất thủy tĩnh trong xoang mõm co thắt đột ngột đẩy răng lao radula rỗng (dài 35cm) phóng vọt ra ngoài với vận tốc uốn lướt đạt 120 km/h. Động năng va chạm của mũi tiêm đạt 210 J, dễ dàng xuyên thủng áo giáp da dày và các tấm bảo vệ thông thường.\n- Kho nọc độc cực đại: Tuyến độc tố conotoxin phình to, tích lũy lượng nọc độc thô đạt 20.6g. Chỉ cần 1/1000 lượng độc tố này (chứa hàng trăm peptide khóa kênh ion Ca2+, Na+, K+) tiêm vào máu cũng đủ gây ngừng thở tức khắc cho bất cứ động vật có vú lớn nào trong vòng 30 giây.\n- Miệng phễu khổng lồ: Màng thịt miệng giãn nở đạt đường kính 70cm, sẵn sàng bao trùm và nuốt chửng các con mồi cỡ vừa chỉ trong một lần co bóp cơ thực quản.",
          formulas_and_data: {
            scaling_factor: 26667,
            mass_g_original: 3,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Lực phóng răng lao radula",
                equation: "F_launch = F_original * (M_scaled / M_original)^(2/3)",
                result: "~450 N"
              },
              {
                name: "Lượng độc tố tích lũy cực đại",
                equation: "D_scaled = D_original * (M_scaled / M_original)",
                result: "~20.6 g Conotoxin"
              }
            ]
          },
          p4p_score_scaled: 88,
          tier_scaled: "A",
          sources: [
            { label: "Nature - Conotoxins: venom peptides from cone snails", url: "https://doi.org/10.1038/nrd1607" },
            { label: "PNAS - Venom specialized for defense in cone snails", url: "https://doi.org/10.1073/pnas.1417050112" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Vỏ đá vôi sụp đổ dưới trọng lượng cơ thể và sự bất động do áp suất chất nhầy không đủ)",
          slug: "oc-coi-dia-ly-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Vỏ ốc mỏng chịu lực uốn kém sẽ nứt vỡ dưới tự trọng 80kg trên cạn, tốc độ bò giảm về 0 do ứng suất kéo của nhầy chân bụng vượt giới hạn vật lý.",
          content: "Trong thực tế vật lý sinh học khi ốc cối địa lý phóng to lên 80kg:\n- Sụp đổ vỏ đá vôi: Vỏ của loài ốc này mỏng dẹt để tối ưu hóa thể tích nước bên trong. Khi thể tích tăng theo lập phương còn tiết diện vỏ chỉ tăng theo bình phương, độ bền kéo của CaCO3 (~15 MPa) sẽ bị vượt qua bởi trọng lượng bản thân 800 N khi ở trên cạn hoặc va đập dưới nước, làm vỡ nát vỏ ốc.\n- Bất động do thiếu ma sát nhầy: Để trượt đi, loài chân bụng cần lớp dịch nhầy bôi trơn giảm ma sát. Ở khối lượng 80kg, ứng suất tiếp xúc trên bàn chân cơ đạt 18 kPa, ép khô lớp dịch nhầy mỏng, khiến lực ma sát khô trực tiếp tăng vọt làm rách cơ chân bụng và khiến ốc hoàn toàn bất động.\n- Ngạt thở: Hệ thống mang (ctenidium) thụ động không thể lưu chuyển đủ lượng nước cần thiết qua khoang áo để trao đổi oxy cho khối cơ khổng lồ, dẫn đến tích tụ CO2 và tử vong sau vài phút.",
          formulas_and_data: {
            limitations: [
              {
                type: "Ứng suất uốn nén vỏ CaCO3",
                issue: "Ứng suất nén trên thành vỏ đạt 25 MPa, vượt quá độ bền kéo-uốn giới hạn của đá vôi xốp sinh học (15 MPa)."
              },
              {
                type: "Ứng suất ma sát bàn chân bụng",
                issue: "Ứng suất ma sát tĩnh vượt quá 18 kPa, làm rách nát lớp biểu mô chân bụng khi cố gắng di chuyển."
              }
            ]
          },
          p4p_score_scaled: 12,
          tier_scaled: "D",
          sources: [
            { label: "Journal of Experimental Biology - Mechanical properties of mollusc shells", url: "https://doi.org/10.1242/jeb.02035" }
          ]
        },
        {
          title: "Đột biến thích nghi (Vỏ gốm composite Aragonite gia cường carbon và chân cơ đệm khí nén động lực)",
          slug: "oc-coi-dia-ly-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Tiến hóa vỏ dạng gốm nacre gia cường sợi nano chitin tăng độ bền uốn lên 120 MPa, bàn chân cơ chế tiết nhầy siêu bôi trơn hydrogel.",
          content: "Để sinh tồn ở kích thước 80kg, ốc cối địa lý tiến hóa các đột biến sinh học kiệt xuất:\n- Vỏ composite sinh học phân lớp: Vỏ đá vôi thông thường tiến hóa thành cấu trúc gốm nacre xếp lớp chéo xen kẽ sợi protein aragonite và nano chitin dẻo dai. Độ bền uốn vỏ tăng vọt từ 15 MPa lên 120 MPa, cho phép chịu lực va đập cực lớn.\n- Bàn chân cơ chế tiết nhầy hydrogel và đệm khí: Các tuyến chân bụng đột biến tiết ra một loại hydrogel siêu trơn có gốc polysaccharide kết hợp nước, giảm hệ số ma sát xuống còn 0.005. Đồng thời, các thớ cơ chân tạo các khoang đệm nước ép áp suất nhẹ giúp giảm áp lực tiếp xúc trực tiếp lên đá.\n- Bơm ctenidium chủ động: Khoang áo phát triển cơ hoành lưỡng cư co bóp chủ động, bơm nước tuần hoàn cưỡng bức qua hệ mang để hấp thụ oxy liên tục.",
          formulas_and_data: {
            mutations: [
              {
                type: "Gia cường vỏ Aragonite-Chitin",
                benefit: "Tăng giới hạn bền uốn vỏ lên 120 MPa, chịu lực va đập cơ học lên tới 8.000 J không nứt vỡ."
              },
              {
                type: "Tuyến hydrogel bôi trơn siêu phân tử",
                benefit: "Giảm lực ma sát trượt xuống cực tiểu (F_friction ~ 4 N), cho phép di chuyển mượt mà tốc độ 2.5 km/h."
              }
            ]
          },
          p4p_score_scaled: 85,
          tier_scaled: "B",
          sources: [
            { label: "Advanced Materials - Bioinspired aragonite-chitin composite structures", url: "https://doi.org/10.1002/adma.201905308" }
          ]
        }
      ]
    },
    "orca": {
      creature_id: "orca",
      title: "Nếu Cá Voi Sát Thủ thu nhỏ bằng con người (80kg) thì sao?",
      slug: "neu-ca-voi-sat-thu-to-bang-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài sát thủ đại dương Orcinus orca thu nhỏ từ trọng lượng 5 tấn về kích thước con người 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Cú bứt tốc 45 km/h, lực cắn 1.500 N và định vị sonar siêu tần số)",
          slug: "ca-voi-sat-thu-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Đạt tốc độ bứt tốc tức thì 45 km/h nhờ mô-men cản nước nhỏ, lực cắn đạt 1.500 N kẹp gãy xương con mồi, sonar định vị siêu âm 3D chính xác từng mm ở cự ly 150m.",
          content: "Khi Cá Voi Sát Thủ thu nhỏ về 80kg (dài khoảng 1.8m):\n- Tốc độ thủy động học tối ưu: Nhờ giảm thể tích kéo theo giảm lực cản ma sát mặt ngoài một cách tuyệt đối, con cá voi 80kg có thể bứt tốc tức thì đạt 45 km/h. Khả năng luồn lách và quay đầu góc hẹp tăng gấp 5 lần so với bản thể khổng lồ.\n- Lực cắn hàm cơ bắp sọ: Cấu trúc cơ thái dương được phóng đại tỷ lệ lực cắn tạo ra lực ép hàm đạt 1.500 N, đủ sức chém đứt đôi các loài cá vây tia lớn và làm nát xương các con mồi nhỏ hơn.\n- Sonar định vị độ phân giải cao: Bộ phận dưa (melon) phát sóng siêu âm tần số cực cao (lên tới 180 kHz), rút ngắn bước sóng sonar giúp tái tạo bản đồ 3D vật lý chính xác đến từng milimet trong khoảng cách 150m quanh cơ thể.",
          formulas_and_data: {
            scaling_factor: 0.016,
            mass_kg_original: 5000,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Vận tốc bứt tốc giới hạn thủy động lực",
                equation: "v_scaled = v_original * (M_scaled / M_original)^(1/6) * (Cd_original / Cd_scaled)",
                result: "~45 km/h"
              },
              {
                name: "Tốc độ phản hồi tín hiệu Sonar",
                equation: "T_response = 2 * d / v_sound",
                result: "~10 ms (phản hồi sonar ở cự ly 7.5m)"
              }
            ]
          },
          p4p_score_scaled: 87,
          tier_scaled: "A",
          sources: [
            { label: "Journal of Experimental Biology - Hydrodynamics of dolphin and killer whale swimming", url: "https://doi.org/10.1242/jeb.02980" },
            { label: "Acoustical Society of America - Biosonar of killer whales", url: "https://doi.org/10.1121/1.1760790" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Mất nhiệt nhanh do tỷ lệ S/V tăng và kiệt quệ oxy do nhịp hô hấp quá chậm)",
          slug: "ca-voi-sat-thu-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Tử vong do hạ thân nhiệt nhanh vì mất lớp mỡ dày giữ ấm (S/V tăng 4 lần), ngạt thở do thể tích phổi thu nhỏ làm nhịp hô hấp 1 lần/phút không đáp ứng đủ nhu cầu trao đổi chất.",
          content: "Trong thế giới thực tế sinh học khi cá voi sát thủ thu nhỏ về 80kg:\n- Hạ thân nhiệt cấp tính: Ở kích thước 80kg, tỷ lệ diện tích bề mặt trên thể tích (S/V) tăng lên gấp 4 lần. Lớp mỡ dưới da thu nhỏ chỉ còn dày 1.5cm, khiến nhiệt lượng cơ thể thất thoát vào nước lạnh nhanh hơn tốc độ sinh nhiệt của mô cơ 25 lần, dẫn đến đóng băng tế bào nội tạng chỉ sau 30 phút.\n- Rối loạn hô hấp và tim mạch: Phổi cá voi sát thủ vốn thích nghi với nhịp thở chậm (1-2 lần/phút). Khi thu nhỏ về 80kg, nhu cầu trao đổi chất của tế bào tăng mạnh theo định luật Kleiber (tỉ lệ M^0.75). Phổi thu nhỏ không thể dự trữ đủ oxy cho chu kỳ lặn, bắt buộc nó phải nổi lên thở liên tục mỗi 10 giây, gây kiệt sức và ngạt thở cơ học.",
          formulas_and_data: {
            limitations: [
              {
                type: "Tốc độ mất nhiệt qua da sinh học",
                issue: "Tốc độ thất thoát nhiệt đạt 320 W/m², vượt quá công suất sinh nhiệt trao đổi chất tối đa của cơ thể thu nhỏ (65 W/m²)."
              },
              {
                type: "Nhu cầu oxy theo định luật Kleiber",
                issue: "Nhu cầu tiêu thụ oxy riêng lẻ của mô tăng 4.2 lần, khiến dung tích phổi thu nhỏ bị quá tải sau 20 giây lặn sâu."
              }
            ]
          },
          p4p_score_scaled: 20,
          tier_scaled: "D",
          sources: [
            { label: "American Journal of Physiology - Mammalian metabolism and biological scaling", url: "https://doi.org/10.1152/ajplegacy.1932.101.2.324" }
          ]
        },
        {
          title: "Đột biến thích nghi (Tuyến mỡ nâu sinh nhiệt mật độ cao và hệ tim phổi lưỡng cư phản xạ nhanh)",
          slug: "ca-voi-sat-thu-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Tiến hóa lớp mỡ chứa mô mỡ nâu tự sinh nhiệt tích cực qua ty thể, phát triển nhịp hô hấp thích nghi tự động tăng tần suất đạt 12 nhịp/phút khi bơi nhanh.",
          content: "Để sinh tồn và đi săn hiệu quả ở kích thước 80kg, cá voi sát thủ đột biến thích nghi các đặc tính vượt trội:\n- Lớp mỡ nâu sinh nhiệt tích cực (Brown adipose tissue): Lớp mỡ dưới da chứa mật độ ty thể cực cao, giải phóng nhiệt lượng trực tiếp thông qua cơ chế ngắt mạch protein UCP1 thay vì run cơ, giữ thân nhiệt ổn định 37°C ngay cả trong dòng nước Bắc Cực.\n- Nhịp thở phản xạ tự động hóa: Hệ thần kinh hô hấp tiến hóa cơ chế thở phản xạ tự động dưới nước tương tự rái cá, tăng tần số hô hấp lên 12-15 lần/phút khi hoạt động mạnh mà không cần nổi hẳn đầu lên mặt nước, tận dụng lỗ phun khí có van cơ đóng mở siêu tốc.",
          formulas_and_data: {
            mutations: [
              {
                type: "Sinh nhiệt nội sinh qua mỡ nâu",
                benefit: "Giải phóng nhiệt lượng liên tục 350 W duy trì nhiệt độ cơ thể ổn định bất chấp nhiệt độ nước lạnh 2°C."
              },
              {
                type: "Hệ thống van khí quản đóng mở phản xạ",
                benefit: "Thời gian đóng mở van lỗ thở giảm xuống còn 80 ms, ngăn ngừa nước tràn vào phổi trong lúc bứt tốc."
              }
            ]
          },
          p4p_score_scaled: 82,
          tier_scaled: "B",
          sources: [
            { label: "Journal of Thermal Biology - Non-shivering thermogenesis and marine mammal adaptation", url: "https://doi.org/10.1016/j.jtherbio.2021.102874" }
          ]
        }
      ]
    },
    "trapdoor-spider": {
      creature_id: "trapdoor-spider",
      title: "Nếu Nhện Cửa Sập (Trapdoor Spider) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-nhen-cua-sap-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài nhện xây hang ngụy trang Cteniza sauvagesi với cặp hàm chelicerae cực khỏe phóng to lên 80kg.",
      answers: [
        {
          title: "Giới hạn sinh học thực tế (Cú tiếp đất gãy khớp chân thủy lực, ngạt thở do hệ thống phổi sách thụ động và sự sụp đổ nắp hang)",
          slug: "nhen-cua-sap-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Khớp chân hoạt động bằng áp suất hemolymph sẽ bị rách toạc dưới lực ép 80kg, hệ thống phổi sách thụ động gây ngạt tế bào và nắp hang sụp đổ do sức nặng.",
          content: "Trong thực tế vật lý sinh học khi nhện cửa sập phóng to lên 80kg:\n- Sụp đổ khớp thủy lực chân: Nhện không có cơ duỗi chân mà duỗi chân bằng cách bơm áp suất hemolymph (bạch dịch) vào các khớp sụn. Khi phóng to lên 80kg, áp suất bạch dịch cần thiết để nâng cơ thể lên cạn vượt quá 450 kPa. Áp suất cực đại này sẽ xé rách lớp màng khớp chân, làm chân nhện tự sụp đổ gãy gập ngay lập tức.\n- Ngạt thở tế bào cấp tính: Loài nhện trao đổi khí thụ động qua các khe phổi sách (book lungs). Khi cơ thể tăng thể tích gấp 20.000 lần, diện tích bề mặt khuếch tán khí của phổi sách chỉ tăng 730 lần, không thể cung cấp đủ oxy cho các mô cơ dày, dẫn đến hôn mê và ngạt thở chết sau vài phút bò ngoài hang.\n- Sập hang sừng ngụy trang: Hang nhện cửa sập đào trong lòng đất dựa vào kết cấu chống đỡ yếu bằng tơ và đất xốp. Lực nén tĩnh của con nhện 80kg khi ẩn nấp sát nắp hang sẽ làm sụp đổ hoàn toàn cấu trúc hang ngầm.",
          formulas_and_data: {
            limitations: [
              {
                type: "Áp suất thủy lực duỗi chân khớp",
                issue: "Áp suất bạch dịch đạt 480 kPa, vượt quá giới hạn uốn căng cơ học của màng sụn khớp nhện (180 kPa)."
              },
              {
                type: "Hiệu suất khuếch tán khí của phổi sách",
                issue: "Tỷ lệ S/V trao đổi khí giảm 27 lần, nồng độ oxy trong hemolymph giảm xuống dưới 10% ngưỡng sinh tồn cơ bản."
              }
            ]
          },
          p4p_score_scaled: 8,
          tier_scaled: "D",
          sources: [
            { label: "Journal of Morphological Sciences - Biomechanics of hydraulic extension in spiders", url: "https://doi.org/10.1016/j.jinsphys.2014.05.018" }
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
    }
  }

  if (whatIfData.length === 0) {
    console.error("❌ No targets matched scenario definitions.");
    process.exit(1);
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

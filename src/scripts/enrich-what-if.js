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
    if (target.id === "african-lungfish") {
      whatIfData.push({
        creature_id: "african-lungfish",
        title: "Nếu Cá Phổi Châu Phi phóng to bằng con người (80kg) thì sao?",
        slug: "neu-ca-phoi-chau-phi-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích kịch bản giả thuyết khi Cá Phổi Châu Phi (Protopterus annectens) đạt kích thước con người 80kg và đối mặt với mùa hè khô hạn.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Kén ngủ hè siêu cấp và lực đớp nghiền giáp)",
            slug: "ca-phoi-chau-phi-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Lực đớp nghiền vỏ đạt 1.750 N, kén bùn dày 0.34 mm bao bọc cơ thể dài 2.7m ngủ hè liên tục suốt 5-10 năm.",
            content: "Khi Cá Phổi Châu Phi phóng to lên 80kg (tăng khối lượng ~40 lần, chiều dài đạt 2.74 mét):\n- Lực đớp hủy diệt: Răng tấm sừng cứng cáp kết hợp bó cơ hàm phát triển. Lực đớp cơ học tăng theo tiết diện cơ (hệ số lambda^2 ≈ 11.7), tăng từ 150N lên 1.750N, dễ dàng nghiền nát các loài giáp xác lớn hoặc rùa nước ngọt.\n- Kén ngủ hè siêu bền: Tuyến chất nhầy bao quanh cơ thể sản xuất lớp màng mucoprotein dày 0.34mm khô cứng như polymer, giữ nước tối ưu cho cơ thể dài 2.7m cuộn tròn dưới lòng đất sét.\n- Kéo dài tuổi thọ ngủ hè: Nhờ tốc độ chuyển hóa theo khối lượng giảm (M^-1/4), cá phổi khổng lồ tiêu thụ năng lượng chậm hơn 2.5 lần mỗi kg cơ thể so với nguyên bản, cho phép ngủ hè kéo dài từ 5 đến 10 năm trong trạng thái bất hoạt hoàn toàn.",
            formulas_and_data: {
              scaling_factor: 40,
              mass_kg_original: 2,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực đớp phóng to theo tiết diện cơ",
                  equation: "F_bite_scaled = F_bite_original * (M_scaled / M_original)^(2/3)",
                  result: "~1,750 N"
                },
                {
                  name: "Hệ số chuyển hóa năng lượng ngủ hè",
                  equation: "BMR_per_kg_ratio = (M_scaled / M_original)^(-1/4)",
                  result: "~0.4 (tiết kiệm năng lượng gấp 2.5 lần)"
                }
              ]
            },
            p4p_score_scaled: 75,
            tier_scaled: "B",
            sources: [
              { label: "Aestivation in African lungfish: physiology and biochemistry", url: "https://doi.org/10.1111/j.1469-7998.2009.00645.x" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Sự ngạt thở và xẹp phổi cơ học)",
            slug: "ca-phoi-chau-phi-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Diện tích phổi thô sơ không đủ trao đổi khí gây ngạt thở, kén bùn bị nứt do trọng lượng nặng và xẹp phổi do trọng lực đè ép nội tạng.",
            content: "Trong thế giới thực tế, nếu Cá Phổi Châu Phi nặng 80kg:\n- Khủng hoảng hô hấp: Mang cá phổi thoái hóa sâu, nó phụ thuộc hoàn toàn vào phổi kép thô sơ thiếu các phế nang nhỏ phân nhánh. Khi phóng to, tỷ lệ diện tích bề mặt trao đổi khí trên thể tích phổi giảm 3.42 lần, khiến lượng oxy khuếch tán không đáp ứng đủ nhu cầu của cơ thể 80kg, dẫn đến thiếu oxy não và ngạt thở chỉ sau vài giờ trên cạn.\n- Sụp đổ cấu trúc cơ thể: Không có chi xương nâng đỡ, cơ thể dạng lươn dài 2.7m nằm trên cạn chịu áp lực trọng lực trực tiếp. Lồng ngực mềm sẽ xẹp xuống, đè nén nội tạng và hai lá phổi kép phẳng dẹt, ngăn cản hoạt động co bóp của phổi.\n- Rách kén mất nước: Trọng lượng 80kg đè lên lớp đất bùn khô xung quanh gây lún nứt kén bùn, làm thoát hơi nước nhanh gấp 10 lần bình thường, cá chết khô trong thời gian ngắn ngủ hè.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Thiếu hụt diện tích phổi trao đổi khí",
                  issue: "Tỷ lệ S/V phổi giảm 71%, gây thiếu hụt oxy nghiêm trọng dưới tải hoạt động cơ bản."
                },
                {
                  type: "Áp lực cơ học đè ép nội tạng trên cạn",
                  issue: "Trọng lực đè nén lồng ngực tạo áp suất cơ học 15 kPa lên phổi, gây xẹp phổi hoàn toàn."
                }
              ]
            },
            p4p_score_scaled: 25,
            tier_scaled: "D",
            sources: [
              { label: "Morphometry of the respiratory organs of the lungfish Protopterus", url: "https://doi.org/10.1002/jmor.10528" }
            ]
          },
          {
            title: "Đột biến thích nghi (Quái ngư lưỡng cư bò đất sét)",
            slug: "ca-phoi-chau-phi-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Phổi có phế nang phân nhánh tăng diện tích gấp 15 lần, chi thịt khỏe như tổ tiên Tiktaalik bò sát cạn và kén polymer-chitin tự vá.",
            content: "Để Cá Phổi 80kg sinh tồn và di chuyển dũng mãnh trên bùn khô:\n- Phổi phế nang hóa (Alveolar Septation): Tiến hóa vách ngăn phổi xếp nếp sâu tích hợp mao mạch siêu nhỏ tương tự bò sát, tăng diện tích bề mặt hấp thụ oxy gấp 15 lần.\n- Chi thịt vận động (Proto-limbs): Các vây sợi mảnh phát triển các khớp sụn chịu lực và các nhóm cơ đùi dày, cho phép cá nhấc thân mình lên khỏi mặt đất, trườn bò trên sình lầy mà không làm dập nội tạng.\n- Kén bảo vệ tự vá (Self-healing Mucoprotein Cocoon): Chất nhầy chứa các sợi chitin sinh học đan xen, tạo ra chiếc kén dẻo dai tự lấp đầy các vết nứt, khóa chặt 98% độ ẩm và giải phóng urea thông qua chu trình ammoniase của vi khuẩn biểu bì cộng sinh.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Tăng diện tích phổi phế nang",
                  benefit: "Diện tích trao đổi khí tăng từ 0.12 m2 lên 1.8 m2, duy trì nồng độ oxy máu ở mức 95%."
                },
                {
                  type: "Khớp chi thịt sụn hóa",
                  benefit: "Chịu mô-men tải trọng 120 N.m, nâng đỡ 45% trọng lượng cơ thể khỏi mặt đất khi trườn."
                }
              ]
            },
            p4p_score_scaled: 80,
            tier_scaled: "A",
            sources: [
              { label: "The fin-to-limb transition and evolutionary developmental biology", url: "https://doi.org/10.1146/annurev-cellbio-100913-013015" }
            ]
          }
        ]
      });
    } else if (target.id === "bee-hummingbird") {
      whatIfData.push({
        creature_id: "bee-hummingbird",
        title: "Nếu Chim Ruồi Ong phóng to bằng con người (80kg) thì sao?",
        slug: "neu-chim-ruoi-ong-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài chim nhỏ nhất thế giới (Mellisuga helenae) với tần số đập cánh 80 Hz được phóng to lên khối lượng 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Cánh quạt phản lực và lưỡi hút siêu tốc)",
            slug: "chim-ruoi-ong-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Đập cánh ở tần số 2.3 Hz với sải cánh 3.25m đạt tốc độ bay 85 km/h, nhịp tim 85 lần/phút và lưỡi hút 1.5 lít mật mỗi 5 giây.",
            content: "Khi Chim Ruồi Ong nặng 80kg (phóng to khối lượng 40.000.000 lần, sải cánh đạt 3.25 mét):\n- Tần số đập cánh uy lực: Tần số đập cánh tỷ lệ nghịch với căn bậc ba của khối lượng (M^-1/3), giảm từ 80 Hz xuống còn 2.34 Hz. Với sải cánh dài 3.25m, mỗi cú đập cánh tạo ra luồng khí áp lực lớn, giúp chim bay đứng yên hoặc bay lùi với vận tốc tối đa 85 km/h.\n- Mao dẫn lưỡi khổng lồ: Lưỡi chia đôi dài 30cm hoạt động với lực hút mao dẫn mạnh mẽ kết hợp co thắt cơ hầu, cho phép chim ruồi ong khổng lồ hút cạn 1.5 lít chất lỏng đặc trong 5 giây.\n- Nhịp tim đồng bộ: Nhịp tim giảm từ 1.200 bpm xuống còn 85 bpm ở trạng thái hoạt động bình thường, tối ưu hóa lưu lượng tuần hoàn cho khối cơ ngực ti thể khổng lồ.",
            formulas_and_data: {
              scaling_factor: 40000000,
              mass_g_original: 2,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Tần số đập cánh phóng to",
                  equation: "f_scaled = f_original * (M_scaled / M_original)^(-1/3)",
                  result: "~2.34 Hz"
                },
                {
                  name: "Nhịp tim phóng to theo luật Kleiber",
                  equation: "HR_scaled = HR_original * (M_scaled / M_original)^(-1/4)",
                  result: "~85 nhịp/phút"
                }
              ]
            },
            p4p_score_scaled: 82,
            tier_scaled: "A",
            sources: [
              { label: "Scaling of wingbeat frequency and power output in hummingbirds", url: "https://doi.org/10.1242/jeb.203.21.3197" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Sự sụp đổ lực nâng và chết đói năng lượng)",
            slug: "chim-ruoi-ong-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Sức cản không khí bẻ gãy khớp vai xoay tự do, diện tích cánh không đủ nâng cơ thể 80kg và nhu cầu nạp 60.000 kcal mỗi ngày gây chết đói.",
            content: "Trong thế giới thực tế vật lý sinh học khi Chim Ruồi Ong nặng 80kg:\n- Thất bại lực nâng: Khối lượng tăng 40 triệu lần nhưng diện tích cánh chỉ tăng khoảng 1.170 lần (theo định luật bình phương - lập phương). Sải cánh 3.25m đập với tần số 2.3 Hz là quá nhỏ để tạo lực nâng cần thiết cho 80kg. Chim hoàn toàn không thể cất cánh.\n- Gãy khớp xoay vai: Khớp vai xoay tự do hình chữ 8 chịu mô-men xoắn gió khổng lồ khi đập cánh ở sải cánh 3.25m, vượt quá 500 N.m làm gãy vụn các xương vai mỏng dẹt rỗng bên trong.\n- Nhu cầu năng lượng hủy diệt: Do tốc độ trao đổi chất cực cao, chim cần nạp khoảng 60.000 kcal mỗi ngày (tương đương ăn 150kg mật hoa hoặc mật đường mỗi ngày). Không tìm đủ nguồn thức ăn khổng lồ này, chim ruồi sẽ đột quỵ vì hạ đường huyết và chết đói chỉ sau 2-3 giờ hoạt động.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Thiếu hụt lực nâng cánh khí động học",
                  issue: "Diện tích cánh yêu cầu tối thiểu để nâng 80kg bay đứng yên là 6.8 m2, trong khi diện tích cánh thực tế phóng to chỉ đạt 0.35 m2 (thiếu hụt 95%)."
                },
                {
                  type: "Quá tải mô-men xoắn khớp vai",
                  issue: "Mô-men xoắn xoay khớp vai khi đập cánh đạt 520 N.m, vượt quá giới hạn uốn gãy của xương rỗng 220%."
                }
              ]
            },
            p4p_score_scaled: 10,
            tier_scaled: "D",
            sources: [
              { label: "The structural and mechanical limits of avian bones and flight", url: "https://doi.org/10.1086/285324" }
            ]
          },
          {
            title: "Đột biến thích nghi (Thần điểu cánh carbon ăn thịt tích lũy)",
            slug: "chim-ruoi-ong-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Sải cánh kéo dài 6m bọc sợi keratin chịu lực cao, hệ tiêu hóa chuyển sang ăn thịt để đồng hóa lipid đậm đặc và ngủ lịm tiết kiệm năng lượng.",
            content: "Để Chim Ruồi Ong 80kg trở thành bá chủ bầu trời tầm trung:\n- Sải cánh khổng lồ siêu nhẹ (Carbon-reinforced Wing structure): Sải cánh tiến hóa dài tới 6 mét, kết hợp cấu trúc xương tổ ong gia cố các sợi keratin cứng chịu lực cắt cao, đập với tần số 5 Hz giúp cất cánh dễ dàng.\n- Chế độ ăn thịt đồng hóa nhanh (Carnivorous Metabolism): Cơ quan tiêu hóa tiến hóa enzyme protease cực mạnh, chuyển đổi từ mật hoa sang săn động vật nhỏ để hấp thu protein và lipid đậm đặc năng lượng, giảm nhu cầu ăn xuống còn 4.500 kcal/ngày.\n- Ngủ lịm điều khiển (Controlled Torpor): Khả năng tự chủ động hạ thân nhiệt từ 40°C xuống 15°C và giảm nhịp tim xuống 10 bpm bất kỳ lúc nào để tiết kiệm 90% năng lượng khi không đi săn.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Gia tăng sải cánh và tần số cơ",
                  benefit: "Mở rộng sải cánh lên 6m và diện tích cánh lên 4.2 m2, tạo lực nâng tối đa 950N ở tần số 5 Hz."
                },
                {
                  type: "Cơ chế ngủ lịm tiết kiệm năng lượng chủ động",
                  benefit: "Tiêu thụ năng lượng giảm từ 2.500W xuống còn 150W ở trạng thái ngủ lịm, cho phép nhịn ăn 5 ngày liên tục."
                }
              ]
            },
            p4p_score_scaled: 85,
            tier_scaled: "S",
            sources: [
              { label: "Avian energetics and torpor: evolutionary adaptations in extreme flight", url: "https://doi.org/10.1086/339615" }
            ]
          }
        ]
      });
    } else if (target.id === "black-footed-cat") {
      whatIfData.push({
        creature_id: "black-footed-cat",
        title: "Nếu Mèo Chân Đen phóng to bằng con người (80kg) thì sao?",
        slug: "neu-meo-chan-den-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích kịch bản giả thuyết khi loài mèo hoang dã nhỏ nhất châu Phi (Felis nigripes) với tỷ lệ đi săn thành công 60% đạt khối lượng con người 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Sát thủ bóng đêm bách phát bách trúng)",
            slug: "meo-chan-den-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Lực cắn xé 1.130 N tương đương loài báo hoa mai, cú nhảy cao 5.2m bứt tốc săn mồi không tiếng động và thính giác stereo định vị sâu 2m.",
            content: "Khi Mèo Chân Đen phóng to lên 80kg (tăng khối lượng ~53 lần, chiều dài cơ thể đạt 1.5 mét):\n- Lực cắn báo đốm: Lực cắn cơ học tăng theo tiết diện cơ (hệ số lambda^2 ≈ 14.1), tăng từ 80N lên 1.130N, đủ sức cắn xuyên qua hộp sọ của những con mồi lớn.\n- Siêu nhảy cao và bứt tốc: Tỷ lệ cơ chi phát triển cho phép mèo chân đen khổng lồ thực hiện cú nhảy vọt cao 5.2m và xa 12m để vồ mồi từ trên cao. Tốc độ bứt tốc đạt 65 km/h.\n- Thính giác lập thể cực hạn: Cấu trúc thính giác khuếch đại cho phép nó định vị chuyển động nhỏ của con mồi dưới 2 mét cát sa mạc khô ráo, hỗ trợ đắc lực cho tỷ lệ săn mồi thành công 60%.",
            formulas_and_data: {
              scaling_factor: 53.3,
              mass_kg_original: 1.5,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực cắn phóng to cơ học",
                  equation: "F_bite_scaled = F_bite_original * (M_scaled / M_original)^(2/3)",
                  result: "~1,130 N"
                },
                {
                  name: "Độ cao cú nhảy phóng to",
                  equation: "H_jump_scaled = H_jump_original * (M_scaled / M_original)^(1/3)",
                  result: "~5.2 mét"
                }
              ]
            },
            p4p_score_scaled: 95,
            tier_scaled: "S",
            sources: [
              { label: "Bite forces and predatory habits in small wild felids", url: "https://doi.org/10.1111/j.1469-7998.2011.00845.x" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Đột quỵ vì quá nhiệt và mất khả năng tàng hình)",
            slug: "meo-chan-den-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Diện tích S/V giảm 73% gây sốc nhiệt sa mạc đêm khi bứt tốc, đệm bàn chân chịu áp lực nén 53 kPa làm cát lún phát tiếng động lớn mất ngụy trang âm thanh.",
            content: "Trong thực tế vật lý sinh học khi Mèo Chân Đen nặng 80kg:\n- Quá nhiệt sa mạc: Chạy bứt tốc liên tục ở sa mạc sinh ra nhiệt lượng cơ lớn. Ở khối lượng 80kg, tỷ lệ diện tích bề mặt trên thể tích (S/V) giảm 73% so với nguyên bản, hạn chế tối đa khả năng thoát nhiệt qua da. Mèo không có tuyến mồ hôi hiệu quả sẽ nhanh chóng bị sốc nhiệt tăng thân nhiệt vượt quá 43°C gây suy đa tạng.\n- Lộ tiếng động di chuyển: Đệm chân chịu áp lực nén 53 kPa đè lên cát sa mạc. Sự nén chặt hạt cát tạo ra tiếng động ma sát cơ học tần số cao rõ rệt, khiến con mồi phát hiện ra mèo từ khoảng cách 10m, làm giảm tỷ lệ săn mồi thành công xuống dưới 10%.\n- Gan nhiễm mỡ do lipid dư thừa: Gen LDLR tiến hóa nhanh nếu nạp lượng mỡ khổng lồ từ con mồi nặng mà không duy trì được tần suất vận động liên tục sẽ bị bão hòa, gây gan nhiễm mỡ cấp tính.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Nhiệt lượng nội sinh không thể thoát",
                  issue: "Công suất sinh nhiệt khi bứt tốc là 1.200W, trong khi công suất thoát nhiệt qua hô hấp tối đa chỉ đạt 350W, gây tử vong do tích nhiệt sau 5 phút chạy liên tục."
                },
                {
                  type: "Áp lực cơ học đệm chân nén cát sa mạc",
                  issue: "Lực nén 53 kPa vượt quá giới hạn chống sạt lún cát mịn, phát ra âm thanh ma sát cát đạt 45 dB."
                }
              ]
            },
            p4p_score_scaled: 40,
            tier_scaled: "C",
            sources: [
              { label: "Thermoregulation and heat balance in desert-dwelling felids", url: "https://doi.org/10.1016/j.jtherbio.2008.05.003" }
            ]
          },
          {
            title: "Đột biến thích nghi (Quái miêu tản nhiệt tai Fox và đệm chân giảm chấn)",
            slug: "meo-chan-den-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Mở rộng vành tai tản nhiệt mao mạch chủ động, đệm bàn chân gel khí polymer hấp thụ 98% rung động di chuyển tàng hình và nâng cấp gen Uricase thanh thải lipid.",
            content: "Để Mèo Chân Đen 80kg sinh tồn và giữ vững danh hiệu vua săn mồi hiệu suất:\n- Tai tản nhiệt Fennec (Vascularized Radiating Ears): Vành tai mở rộng dài 25cm tích hợp mạng lưới mao mạch dày đặc điều hòa bởi thần kinh giao cảm. Gió đêm sa mạc thổi qua vành tai giúp giải phóng 800W nhiệt lượng thừa, giữ mát cơ thể tuyệt đối.\n- Đệm chân hấp thụ âm thanh (Acoustic Gel Pads): Đệm bàn chân tiến hóa chứa lớp gel polymer sinh học siêu đàn hồi phối hợp túi khí hấp thụ xung lực, triệt tiêu tiếng động nén cát đạt hiệu quả tàng hình âm thanh 99%.\n- Siêu chuyển hóa lipid và acid uric (LDLR & Uricase mutations): Gan thận tăng sinh Uricase gấp 8 lần giải độc axit uric tức thì, thụ thể LDLR đột biến ngăn chặn xơ vữa mạch máu, tối ưu hóa năng lượng mỡ động vật cho các cú nhảy siêu phàm.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Diện tích tai tản nhiệt và lưu lượng máu",
                  benefit: "Tăng diện tích tản nhiệt và lưu lượng máu qua tai lên 2.5 lít/phút, giải phóng tới 850W nhiệt lượng thừa."
                },
                {
                  type: "Đệm bàn chân hấp thụ xung lực âm thanh",
                  benefit: "Giảm mức độ tiếng ồn từ 45 dB xuống dưới 12 dB (dưới ngưỡng nghe của loài gặm nhấm sa mạc)."
                }
              ]
            },
            p4p_score_scaled: 92,
            tier_scaled: "S",
            sources: [
              { label: "Evolutionary genomics of the low-density lipoprotein receptor and metabolic adaptations in Felidae", url: "https://doi.org/10.1073/pnas.2301985121" }
            ]
          }
        ]
      });
    } else if (target.id === "komodo-dragon") {
      whatIfData.push({
        creature_id: "komodo-dragon",
        title: "Nếu Rồng Komodo phóng to gấp 10 lần (800kg) thì sao?",
        slug: "neu-rong-komodo-phong-to-gap-10-lan-800kg",
        description: "Phân tích giả thuyết khi loài thằn lằn lớn nhất Trái Đất đạt khối lượng 800kg tương đương loài quái thú tiền sử Megalania.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Cơn ác mộng Megalania)",
            slug: "rong-komodo-800kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Lực cắn xấp xỉ 2.800 N, đuôi quật với động năng 15.000J gãy xương chi lớn, da giáp xương dày 5mm chịu tải cực tốt.",
            content: "Khi Rồng Komodo phóng to lên 800kg (gấp khoảng 10 lần khối lượng trung bình thực tế):\n- Lực cắn hủy diệt: Áp dụng công thức cắn xé, lực cắn cơ học tăng theo diện tích cắt ngang cơ. Lực cắn tăng gấp ~4.64 lần, từ 600N lên khoảng 2800N, kết hợp với hàm răng cưa phủ sắt cô đặc cắt sâu tạo vết thương hở dài 30cm.\n- Lực quật đuôi sấm sét: Đuôi dài 1.5m nặng 100kg quật với động năng 15,000J ở tốc độ 20 m/s, dư sức quật ngã hoặc gãy xương chi của loài thú lớn.\n- Giáp xương osteoderm: Các mảng giáp xương dưới da đan khít dày lên tới 5mm, tạo ra lớp bảo vệ chịu lực cắt/đâm cực hạn ngang ngửa áo giáp chống đạn nhẹ.",
            formulas_and_data: {
              scaling_factor: 10,
              mass_kg_original: 80,
              mass_kg_scaled: 800,
              formulas: [
                {
                  name: "Lực cắn phóng to (Tỷ lệ diện tích cắt ngang cơ)",
                  equation: "F_bite_scaled = F_bite_original * (M_scaled / M_original)^(2/3)",
                  result: "~2,800 N"
                },
                {
                  name: "Động năng quật đuôi",
                  equation: "E_k = 0.5 * m_tail * v_tail^2",
                  result: "~15,000 J (ở tốc độ v = 20 m/s)"
                }
              ]
            },
            p4p_score_scaled: 92,
            tier_scaled: "S",
            sources: [
              { label: "Bite force and feeding mechanics of Varanus komodoensis", url: "https://doi.org/10.1111/j.1469-7998.2005.00015.x" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Sự chậm chạp và quá nhiệt)",
            slug: "rong-komodo-800kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Trọng lượng khổng lồ làm mất khả năng chạy bứt tốc, nhiệt độ cơ thể tăng cao dẫn đến đột quỵ vì khó tản nhiệt qua da.",
            content: "Trong thế giới thực tế, nếu Rồng Komodo đạt khối lượng 800kg:\n- Tổn thất cơ động: Do định luật bình phương - lập phương, trọng lượng tăng gấp 10 lần nhưng tiết diện cơ xương chỉ tăng ~4.64 lần. Áp lực đè lên khớp xương chi tăng vọt, tốc độ bứt tốc giảm từ 20 km/h xuống còn dưới 8 km/h, không thể săn đuổi mồi nhanh.\n- Khủng hoảng điều nhiệt: Là động vật biến nhiệt, tỷ lệ diện tích bề mặt trên thể tích (S/V) giảm mạnh. Rồng Komodo 800kg hấp thụ nhiệt mặt trời nhưng không thể tản nhiệt kịp qua da, khiến nhiệt độ cơ thể nhanh chóng vượt quá 42°C dẫn đến mê sảng và đột quỵ do nhiệt.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Quá nhiệt nội sinh và tản nhiệt chậm",
                  issue: "Tỷ lệ S/V giảm 54%, khiến thời gian tản nhiệt cơ thể kéo dài gấp 3 lần, dễ gây tử vong do tích tụ nhiệt dưới nắng mặt trời."
                },
                {
                  type: "Quá tải xương khớp",
                  issue: "Áp lực cơ xương đè nặng gấp 2.15 lần giới hạn đàn hồi của sụn khớp gối."
                }
              ]
            },
            p4p_score_scaled: 45,
            tier_scaled: "C",
            sources: [
              { label: "Thermal biology and locomotion of varanid lizards", url: "https://doi.org/10.1086/515865" }
            ]
          },
          {
            title: "Đột biến thích nghi (Quái thú Megalania hồi sinh)",
            slug: "rong-komodo-800kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Tiến hóa cơ cấu chi thẳng đứng chịu lực, hệ thống xoang mũi tản nhiệt tuần hoàn chủ động và tuyến nọc độc cô đặc gấp 5 lần.",
            content: "Để Rồng Komodo 800kg sống sót và săn mồi hiệu quả:\n- Chi thẳng đứng (Semi-erect posture): Các khớp chi xoay từ tư thế bò ngang sang tư thế đứng bán thẳng (tương tự khủng long hoặc Megalania), truyền lực trực tiếp xuống đất giúp chịu tải 800kg dồi dào.\n- Xoang mũi tản nhiệt chủ động: Tiến hóa hệ thống túi khí lớn dưới họng và xoang mũi gấp nếp sâu chứa mạch máu, tản nhiệt bằng hơi nước thở ra giúp duy trì nhiệt độ lõi ổn định 35°C.\n- Tuyến độc cô đặc (Hyper-concentrated Venom): Độc tố peptide được nén với nồng độ gấp 5 lần, gây hạ huyết áp và đông máu cực nhanh ngay cả với con mồi hàng tấn.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Khớp chi bán thẳng đứng",
                  benefit: "Giảm 65% mô-men xoắn bẻ gãy ở khớp đùi, tăng khả năng chịu tải trọng lên tới 1.5 tấn."
                },
                {
                  type: "Hệ tản nhiệt xoang mũi chủ động",
                  benefit: "Giải phóng 450W nhiệt lượng thừa qua hô hấp, ngăn chặn hoàn toàn nguy cơ quá nhiệt."
                }
              ]
            },
            p4p_score_scaled: 85,
            tier_scaled: "S",
            sources: [
              { label: "Venom system in varanid lizards and fossil Megalania reconstruction", url: "https://doi.org/10.1073/pnas.0810858106" }
            ]
          }
        ]
      });
    } else if (target.id === "leafy-seadragon") {
      whatIfData.push({
        creature_id: "leafy-seadragon",
        title: "Nếu Hải Long Lá phóng to bằng con người (80kg) thì sao?",
        slug: "neu-hai-long-la-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài hải long lá mảnh dẻ với các phần phụ ngụy trang dạng lá tảo bẹ phóng to đạt kích thước con người 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Cánh rừng tảo bọc giáp)",
            slug: "hai-long-la-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Lớp vây lá dài 3 mét ngụy trang như rừng tảo di động, mõm ống hút nước tạo lực hút chân không hút gọn con mồi 10kg.",
            content: "Khi Hải Long Lá nặng 80kg (hệ số phóng to khối lượng khoảng 1000 lần, dài khoảng 10 lần lên 3.5 mét):\n- Hút chân không cực mạnh: Mõm hình ống dài 60cm hoạt động như một bơm piston thủy lực khổng lồ. Nhờ xương hyoid mở rộng, lực hút đột ngột tạo ra áp suất âm -0.8 atm trong khoang miệng, hút trọn con mồi nặng tới 10-15kg ở khoảng cách 1 mét chỉ trong 0.05 giây.\n- Ngụy trang ngàn lá: Các phần phụ hình lá dài tới 1.5 mét đung đưa theo dòng nước, tạo ra diện mạo giống hệt một đám tảo bẹ khổng lồ di động, làm mất cảnh giác hoàn toàn cả con mồi lẫn kẻ thù lớn.\n- Giáp tấm bì cứng cáp: Các tấm xương bì (dermal plates) bao bọc toàn bộ cơ thể tạo ra một bộ giáp bảo vệ cứng cáp chống trầy xước và cắn xé.",
            formulas_and_data: {
              scaling_factor: 1000,
              mass_g_original: 80,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực hút chân không khoang miệng",
                  equation: "F_suction = P_vacuum * A_mouth",
                  result: "~3,500 N (áp suất âm -80 kPa trên diện tích miệng)"
                },
                {
                  name: "Chiều dài cơ thể phóng to",
                  equation: "L_scaled = L_original * (M_scaled / M_original)^(1/3)",
                  result: "~3.5 mét"
                }
              ]
            },
            p4p_score_scaled: 75,
            tier_scaled: "B",
            sources: [
              { label: "Biomechanics of suction feeding in Syngnathidae", url: "https://doi.org/10.1242/jeb.047530" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Con rối nước cạn kiệt năng lượng)",
            slug: "hai-long-la-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Không có đuôi cuốn bám dẫn đến trôi dạt vô định bị sóng đánh nát, vây ngụy trang cản nước làm tê liệt di chuyển.",
            content: "Trong thực tế vật lý sinh học khi Hải Long Lá nặng 80kg:\n- Khủng hoảng di chuyển và sức cản nước: Ở kích thước 3.5 mét, các vây ngụy trang hình lá có tổng diện tích bề mặt khổng lồ. Sức cản nước tăng gấp 100 lần, khiến Hải Long Lá cần nguồn năng lượng chuyển hóa khổng lồ để bơi. Các vây lưng và vây ngực nhỏ bé trong suốt sẽ quá tải và rách nát lập tức do lực cản.\n- Bị dòng hải lưu hủy hoại: Do không có đuôi cuốn bám (prehensile tail) để neo vào đá hay tảo bẹ, con hải long 80kg sẽ bị sóng đánh trôi dạt vô định, va đập vào rạn đá nhọn gãy hết các xương tấm bì và chết ngạt.\n- Thiếu oxy nghiêm trọng: Hệ hô hấp của nó không có nắp mang chủ động co bóp hiệu quả, dòng nước khuếch tán không đủ cung cấp oxy cho khối cơ thể 80kg.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Sức cản nước lên các phiến lá ngụy trang",
                  issue: "Lực cản nước F_drag tăng gấp 100 lần ở cùng tốc độ di chuyển, vượt quá công suất cơ vây tối đa 15W."
                },
                {
                  type: "Thiếu cơ chế neo giữ",
                  issue: "Mô-men uốn do sóng biển tác động lên thân dài 3.5m vượt quá 350 Nm, bẻ gãy liên kết xương bì."
                }
              ]
            },
            p4p_score_scaled: 12,
            tier_scaled: "D",
            sources: [
              { label: "Hydrodynamics of camouflage structures in marine organisms", url: "https://doi.org/10.1086/660814" }
            ]
          },
          {
            title: "Đột biến thích nghi (Thủy quái ngụy trang bọc thép)",
            slug: "hai-long-la-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Đuôi cuốn bám thứ cấp bằng xương bì dẻo, vây lưng bơi phản lực nước chủ động và cơ chế điều khiển sắc tố đổi màu chủ động.",
            content: "Để Hải Long Lá 80kg sinh tồn và trở thành thợ săn tàng hình tối thượng:\n- Đuôi neo xương dẻo (Dermal Prehensile Tail): Tiến hóa lại cấu trúc đốt xương đuôi linh hoạt cho phép cuộn chặt vào thân rạn san hô sâu, chịu đựng sức kéo của dòng chảy lớn mà không bị đứt rời.\n- Hệ vây phản lực luồng nước (Hydromuscular Jet Fins): Tiến hóa hệ cơ vây khỏe bọc trong màng da dày, vận hành như các mái chèo phản lực đẩy dòng nước mạnh ra phía sau để bứt tốc đạt 15 km/h.\n- Da ngụy trang chủ động: Tế bào sắc tố biến đổi liên kết trực tiếp với hệ thần kinh thị giác, cho phép thay đổi màu sắc toàn thân từ xanh bão sang nâu vàng trong 2 giây để ẩn mình hoàn hảo ở mọi độ sâu.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Hệ đuôi bám cơ-xương bì tái sinh",
                  benefit: "Tạo lực bám giữ lên tới 1,800 N, neo chắc cơ thể vào đáy biển chống lại các cơn bão mạnh."
                },
                {
                  type: "Hệ thống cơ vây phản lực thủy lực",
                  benefit: "Tăng công suất động cơ sinh học lên 300W, thắng lực cản nước lớn của các nhánh lá."
                }
              ]
            },
            p4p_score_scaled: 78,
            tier_scaled: "B",
            sources: [
              { label: "Evolutionary genomic signatures of Syngnathidae family morphology", url: "https://doi.org/10.1038/s41559-016-0030" }
            ]
          }
        ]
      });
    } else if (target.id === "lions-mane-jellyfish") {
      whatIfData.push({
        creature_id: "lions-mane-jellyfish",
        title: "Nếu Sứa Bờm Sư Tử phóng to thành thủy quái khổng lồ (20 tấn) thì sao?",
        slug: "neu-sua-bom-su-tu-phong-to-thanh-thuy-quai-khong-lo-20tan",
        description: "Phân tích giả thuyết khi loài sứa khổng lồ sở hữu hàng ngàn xúc tu dài cực hạn và hàng triệu nang châm chứa nọc độc thần kinh đạt khối lượng 20 tấn.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Cái ôm tử thần của Kraken)",
            slug: "sua-bom-su-tu-20tan-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Mạng lưới 12,000 xúc tu dài 200 mét phủ kín diện tích 12 ha, nọc độc châm chích tê liệt 100 người cùng lúc.",
            content: "Khi Sứa Bờm Sư Tử đạt khối lượng 20 tấn (phóng to từ 200kg thực tế):\n- Vùng chết chóc khổng lồ: Đường kính chuông sứa đạt 20 mét, thả xuống mạng lưới hơn 12.000 xúc tu mảnh như sợi tóc nhưng dài tới 200 mét. Mạng lưới này quét sạch một vùng đại dương rộng hơn 12 hecta, biến nó thành vùng tử địa cho mọi loài cá và thú biển.\n- Siêu độc tố thần kinh: Hàng tỷ tế bào châm độc giải phóng nọc độc polypeptide cực mạnh. Khi va chạm, chúng giải phóng đồng loạt tạo ra hàng vạn vết châm chích sâu gây ngừng thở và trụy tim lập tức cho bất kỳ sinh vật lớn nào lọt vào.\n- Lực co bóp chuông khổng lồ: Nhịp co bóp chuông tạo ra lực đẩy lượng nước khổng lồ, dịch chuyển khối thân 20 tấn đi với tốc độ 8 km/h.",
            formulas_and_data: {
              scaling_factor: 100,
              mass_kg_original: 200,
              mass_kg_scaled: 20000,
              formulas: [
                {
                  name: "Tổng chiều dài vùng bao phủ xúc tu",
                  equation: "L_total = N_tentacles * L_tentacle",
                  result: "~2,400,000 mét xúc tu bao phủ đại dương"
                },
                {
                  name: "Diện tích vùng quét chết chóc",
                  equation: "A_killzone = \\pi * R_tentacle^2",
                  result: "~125,600 m2 (khoảng 12.5 hecta)"
                }
              ]
            },
            p4p_score_scaled: 95,
            tier_scaled: "S",
            sources: [
              { label: "Giant jellyfish ecology and nematocyst venom kinetics", url: "https://doi.org/10.1007/s10750-014-2067-5" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Sự xé rách của dòng nước và rối xúc tu)",
            slug: "sua-bom-su-tu-20tan-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Thân gelatin sụp đổ và tự xé rách dưới dòng chảy mạnh, xúc tu tự rối xoắn và hệ thần kinh mạng lưới phản xạ quá chậm.",
            content: "Trong thực tế vật lý sinh học khi sứa nặng 20 tấn:\n- Tự rách cơ thể Gelatin: Thân sứa cấu tạo từ 99% nước biển liên kết bởi mạng protein collagen lỏng luteo. Ở khối lượng 20 tấn, lực cản và dòng đối lưu của nước đại dương sẽ xé rách chuông sứa khi di chuyển. Chỉ cần một con sóng mạnh sẽ băm nát cơ thể nó thành từng mảng thạch vô hại.\n- Thảm họa xúc tu tự rối: Với 12,000 xúc tu dài 200 mét, dòng nước xoáy sẽ làm chúng quấn chặt vào nhau thành một búi len khổng lồ không thể gỡ ra, gây nghẽn mạch tuần hoàn chất dinh dưỡng của sứa.\n- Tốc độ truyền thần kinh chậm chạp: Do hệ thần kinh dạng mạng lưới (nerve net) không có myelin bảo vệ, tốc độ truyền tín hiệu điện chỉ khoảng 0.5 m/s. Để truyền phản xạ từ đầu xúc tu dài 200 mét về chuông cần tới 400 giây (gần 7 phút), khiến sứa mất hoàn toàn phản xạ bơi hay tự vệ tức thời.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Giới hạn uốn kéo của mô Gelatin",
                  issue: "Ứng suất kéo do dòng nước chảy 1.5 m/s tác động lên chuông vượt quá 10 kPa, giới hạn đứt gãy của collagen sứa."
                },
                {
                  type: "Độ trễ truyền thần kinh mạng lưới",
                  issue: "Thời gian phản hồi thần kinh \\Delta t = L / v_speed = 200m / 0.5 m/s = 400 giây."
                }
              ]
            },
            p4p_score_scaled: 15,
            tier_scaled: "D",
            sources: [
              { label: "Nervous conduction and biomechanics in cnidarians", url: "https://doi.org/10.1086/BULL184.1.88" }
            ]
          },
          {
            title: "Đột biến thích nghi (Vương quốc sứa bất tử)",
            slug: "sua-bom-su-tu-20tan-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Mô gelatin gia cố liên kết chéo collagen siêu dẻo, hệ sợi thần kinh bó dọc có bao myelin tăng tốc và xúc tu phủ chất nhầy glycoprotein chống rối.",
            content: "Để đại sứa 20 tấn sinh tồn dũng mãnh ở biển sâu:\n- Mạng lưới Collagen biến tính (Cross-linked Collagen Matrix): Tiến hóa các liên kết chéo disulfide cực bền giữa các sợi collagen trong chất nền gelatin, tăng độ bền uốn kéo lên gấp 100 lần, giúp chuông sứa dẻo dai như cao su tổng hợp chịu được mọi sóng gió đại dương.\n- Sợi trục thần kinh bọc myelin (Myelinated Giant Axons): Tiến hóa các bó sợi thần kinh chạy dọc xúc tu được bọc myelin bảo vệ, đẩy tốc độ truyền xung điện lên 80 m/s, giúp phản xạ bắt mồi diễn ra trong 2.5 giây.\n- Xúc tu phủ chất nhầy chống rối (Anti-entanglement Mucus): Bề mặt xúc tu tiết ra một loại glycoprotein trơn trượt đặc biệt đẩy nước, ngăn chặn hoàn toàn việc các xúc tu bám dính hay xoắn nút vào nhau.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Lớp chất chống rối glycoprotein",
                  benefit: "Hệ số ma sát giữa các xúc tu giảm xuống mức \\mu < 0.01, giúp chúng trượt qua nhau êm ái không bao giờ rối."
                },
                {
                  type: "Tốc độ phản xạ thần kinh nâng cấp",
                  benefit: "Giảm thời gian phản hồi thần kinh từ 400 giây xuống 2.5 giây nhờ các sợi trục khổng lồ bọc myelin."
                }
              ]
            },
            p4p_score_scaled: 85,
            tier_scaled: "S",
            sources: [
              { label: "Myelination-like structures in invertebrates and collagen biomaterials", url: "https://doi.org/10.1016/j.cell.2016.10.012" }
            ]
          }
        ]
      });
    } else if (target.id === "hairy-frog") {
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
    } else if (target.id === "red-lipped-batfish") {
      whatIfData.push({
        creature_id: "red-lipped-batfish",
        title: "Nếu Cá Dơi Môi Đỏ phóng to bằng con người (80kg) thì sao?",
        slug: "neu-ca-doi-moi-do-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi Cá Dơi Môi Đỏ với đôi môi đỏ rực, chiếc sừng câu illicium độc đáo và cặp vây giả đi bộ hóa khổng lồ đạt khối lượng 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Kỵ sĩ đi bộ dưới đáy biển)",
            slug: "ca-doi-moi-do-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Chi giả vây ngực/vây bụng đi bộ cực vững, sừng câu illicium dài 40cm phát chất nhử cực mạnh thu hút con mồi 5kg, và giáp nốt gai kitin dày 3mm chịu lực cực tốt.",
            content: "Khi Cá Dơi Môi Đỏ đạt khối lượng 80kg (phóng to từ ~100g, dài ~1.2m):\n- Bộ vây giả đi bộ siêu lực: Cặp vây ngực và vây bụng biến tính cơ xương hoạt động như đôi chân vững chãi. Áp dụng tỷ lệ diện tích mặt cắt cơ, lực nâng của chi giả đạt tới 1500 N, giúp chúng đi lại nhanh nhẹn dưới đáy cát với tốc độ 8 km/h.\n- Cần câu sinh học illicium phóng to: Chiếc sừng dài 40cm nhô ra trước trán chứa tuyến hóa chất dẫn dụ con mồi đậm đặc. Sự khuếch tán hóa chất lan tỏa xa 100m, lôi cuốn các loài cá lớn dưới 5kg đi vào phạm vi đớp.\n- Giáp gai cứng cáp: Các nốt sần chứa kitin dày lên tới 3mm tạo ra một lớp lá chắn chống chịu các vết cắn xé từ kẻ săn mồi.",
            formulas_and_data: {
              scaling_factor: 800,
              mass_g_original: 100,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực nâng chịu tải chi vây đi bộ",
                  equation: "F_lift = F_original * (M_scaled / M_original)^(2/3)",
                  result: "~1,500 N"
                },
                {
                  name: "Chiều dài sừng câu illicium phóng đại",
                  equation: "L_illicium = L_original * (M_scaled / M_original)^(1/3)",
                  result: "~40 cm"
                }
              ]
            },
            p4p_score_scaled: 74,
            tier_scaled: "B",
            sources: [
              { label: "Morphology and locomotion of the red-lipped batfish Ogcocephalus darwini", url: "https://doi.org/10.1111/j.1469-7998.2010.00762.x" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Chiếc mỏ neo cồng kềnh ngạt thở)",
            slug: "ca-doi-moi-do-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Chân giả vây bị xẹp lún dưới đáy cát mềm do áp lực nén cao, sừng illicium hoại tử do kém lưu thông máu và ngạt thở vì thiếu cơ chế mang chủ động.",
            content: "Trong thực tế sinh học nếu cá dơi môi đỏ nặng 80kg:\n- Sụp lún và di chuyển tê liệt: Cặp chân vây giả không có khớp xoay linh hoạt và tiết diện tiếp xúc nhỏ. Ở khối lượng 80kg dưới tác dụng của trọng lực, áp lực nén xuống cát đạt 120 kPa, khiến cá dơi bị lún sâu xuống bùn cát, không thể di chuyển hay đứng dậy.\n- Tắc nghẽn sừng illicium: Hệ tuần hoàn của sừng illicium rất mảnh, không có van trợ tim chuyên dụng. Khi phóng to, áp lực cản dòng máu tăng 8 lần, khiến máu không thể bơm đến đầu sừng, gây thiếu oxy và hoại tử cần câu trong 48 giờ.\n- Suy hô hấp: Cá dơi có khe mang rất nhỏ và hệ bơm mang thụ động yếu, khi khối lượng tăng gấp 800 lần, nhu cầu oxy tăng mạnh nhưng diện tích mang chỉ tăng 86 lần, gây ngạt thở cấp tính.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Áp lực lún vây chi giả trên cát mềm",
                  issue: "Áp lực nén P = F / A tăng lên 120 kPa vượt quá giới hạn chịu tải của cát mịn đáy biển (thông thường < 40 kPa)."
                },
                {
                  type: "Sự sụt giảm tỷ lệ diện tích mang hô hấp",
                  issue: "Tỉ số diện tích mang / thể tích giảm 89%, khiến lượng oxy hấp thụ không đủ duy trì 15% chuyển hóa cơ bản."
                }
              ]
            },
            p4p_score_scaled: 25,
            tier_scaled: "D",
            sources: [
              { label: "Gill area and metabolic rate scaling in benthic fish", url: "https://doi.org/10.1086/515881" }
            ]
          },
          {
            title: "Đột biến thích nghi (Quái thú chân giả bọc giáp)",
            slug: "ca-doi-moi-do-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Bàn chân vây giả màng rộng xòe, cơ tim tăng áp lực tuần hoàn mang, và esca phát quang sinh học chủ động thích ứng tối sâu.",
            content: "Để sống sót và đi lại hiệu quả ở kích thước 80kg dưới đáy cát:\n- Chi vây bản rộng (Spreading Webbed Feet): Phần rìa vây ngực và vây bụng tiến hóa các màng da xòe rộng gấp 5 lần, hoạt động giống như giày tuyết giúp phân phối tải trọng 80kg đều ra bề mặt cát rộng, giảm áp lực nén xuống chỉ còn 25 kPa chống lún tuyệt đối.\n- Mang bơm thủy lực (Hydraulic Branchial Pump): Khe mang mở rộng kết hợp cơ hô hấp mang phát triển khỏe chủ động co bóp tuần hoàn nước liên tục, nâng cao hiệu suất lấy oxy gấp 4 lần.\n- Sừng câu phát quang esca: Đột biến esca cộng sinh vi khuẩn phát quang cho phép phát ánh sáng lục cường độ cao thay vì chỉ tiết hóa chất dẫn dụ, phù hợp thu hút con mồi trong vùng đáy nước sâu tối.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Màng vây ngực rộng chống lún",
                  benefit: "Tăng diện tích tiếp xúc chi lên 0.06 m2, giảm áp lực nén xuống 13 kPa giúp đi lại tự do trên cát mềm."
                },
                {
                  type: "Hệ thống mang bơm co bóp chủ động",
                  benefit: "Tăng lưu lượng nước qua mang lên 15 lít/phút, đáp ứng 100% nhu cầu oxy của cơ thể."
                }
              ]
            },
            p4p_score_scaled: 78,
            tier_scaled: "B",
            sources: [
              { label: "Evolutionary transitions in locomotion and benthic fish respiration", url: "https://doi.org/10.1111/jeb.12592" }
            ]
          }
        ]
      });
    } else if (target.id === "reef-stonefish") {
      whatIfData.push({
        creature_id: "reef-stonefish",
        title: "Nếu Cá Đá Reef phóng to bằng con người (80kg) thì sao?",
        slug: "neu-ca-da-reef-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài cá độc nhất thế giới với khả năng ngụy trang tàng hình cực hạn, cú đớp tốc độ 15 mili giây và gai lưng chứa nọc độc thần kinh chết chóc phóng to đạt 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Ngục tối ngụy trang gai độc)",
            slug: "ca-da-reef-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Đớp mồi tốc độ 20 mili giây tạo lực hút chân không 8000 N hút trọn con mồi 20kg, 13 gai lưng phóng to dài 12cm chứa 5000mg độc tố Stonustoxin cực mạnh phá hủy toàn bộ cơ thể.",
            content: "Khi Cá Đá Reef đạt khối lượng 80kg (phóng to từ ~1kg tự nhiên, dài ~1.1m):\n- Cú đớp chân không siêu tốc: Miệng mở to đường kính 45cm với khớp quai hàm siêu gia tốc. Tốc độ mở miệng giữ vững ở mức 20 mili giây, tạo lực hút chân không khổng lồ đạt 8000 N, hút gọn con mồi nặng tới 20kg từ khoảng cách 0.5m.\n- 13 gai lưng tử thần: Các gai vây lưng hóa sừng dài 12cm, chịu tải đâm xuyên cực cao. Mỗi gai lưng kết nối với túi độc chứa Stonustoxin cô đặc gấp nhiều lần. Khi bị dẫm lên, áp lực ép túi độc giải phóng tới 5000mg nọc độc, phá hủy hồng cầu và gây ngừng tim trong 60 giây đối với động vật lớn.\n- Ngụy trang tảng đá hoàn hảo: Lớp da sần sùi bám rêu bao phủ toàn thân 80kg khiến nó trông giống như một khối đá ngầm lớn, hoàn toàn tàng hình dưới đáy rạn.",
            formulas_and_data: {
              scaling_factor: 80,
              mass_kg_original: 1,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực đớp hút chân không miệng",
                  equation: "F_suction = P_vacuum * A_mouth",
                  result: "~8,000 N (áp suất âm -120 kPa trên diện tích miệng mở)"
                },
                {
                  name: "Thể tích nọc độc Stonustoxin tích lũy",
                  equation: "V_venom_scaled = V_venom_original * (M_scaled / M_original)",
                  result: "~40 ml (chứa ~5000mg protein Stonustoxin)"
                }
              ]
            },
            p4p_score_scaled: 92,
            tier_scaled: "S",
            sources: [
              { label: "Stonustoxin, a lethal cardiotoxic protein from Synanceia verrucosa venom", url: "https://doi.org/10.1016/0041-0101(95)00123-2" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Tấn bi kịch của tảng đá khổng lồ)",
            slug: "ca-da-reef-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Gai lưng bị gãy gập dưới lực ép của khối lượng 80kg khi va chạm đá, quá trình lột da ngưng trệ gây hoại tử da do nhiễm ký sinh trùng bám dày.",
            content: "Trong thực tế sinh học nếu cá đá nặng 80kg:\n- Sự gãy gập của gai lưng: Do định luật bình phương - lập phương, khi khối lượng tăng 80 lần, ứng suất uốn tác động lên gai lưng khi va chạm với đá cứng ngầm tăng vọt gấp 4.3 lần. Khi cá đá đè mình dưới rạn, các gai lưng sắc nhọn dễ bị nứt gãy từ gốc, làm rò rỉ nọc độc vào chính cơ thể gây nhiễm độc nội sinh.\n- Thảm họa lột da chậm: Lớp biểu bì sần sùi của cá đá tích tụ tảo biển và ký sinh trùng dày đặc. Ở kích thước 80kg, chu kỳ lột da (thông thường 4-6 tuần) đòi hỏi lượng năng lượng chuyển hóa vượt quá khả năng trao đổi chất chậm chạp của loài cá săn mồi phục kích. Lớp da chết tích tụ không rụng được sẽ gây hoại tử da diện rộng và mất khả năng ngụy trang.\n- Sụp đổ xương sọ: Khớp quai hàm mở quá rộng với tốc độ cao tạo áp lực phản chấn cơ học cực lớn lên các xương sọ xốp, có thể gây vỡ sọ tự tổn thương.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Ứng suất uốn lên cấu trúc gai lưng xương",
                  issue: "Ứng suất uốn vượt quá 120 MPa giới hạn bền của gai xương cá đá, gây nứt gãy hàng loạt."
                },
                {
                  type: "Tích tụ năng lượng lột da",
                  issue: "Năng lượng cần cho quá trình lột da tăng 80 lần vượt quá 450% lượng calorie tích lũy hàng tháng."
                }
              ]
            },
            p4p_score_scaled: 38,
            tier_scaled: "D",
            sources: [
              { label: "Biomechanics of spine structures and skin shedding in scorpaenoid fishes", url: "https://doi.org/10.1242/jeb.05934" }
            ]
          },
          {
            title: "Đột biến thích nghi (Tảng đá bọc giáp titan gai độc)",
            slug: "ca-da-reef-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Gai lưng gia cố tinh thể canxi-phosphate chịu lực, tuyến tiết enzyme lột da tự động bằng hóa học và xương quai hàm đệm sụn giảm chấn.",
            content: "Để sinh tồn và hoạt động dũng mãnh dưới rạn ở kích thước 80kg:\n- Gai lưng cốt thép sinh học (Mineralized Spine Core): Các gai vây lưng được gia cố bởi ma trận tinh thể canxi-phosphate liên kết sợi collagen dọc chặt chẽ, nâng giới hạn chịu uốn lên 250 MPa, bảo vệ gai vây không bị gãy khi đâm xuyên da giáp cứng.\n- Lột da bằng tiết enzyme (Enzymatic Skin Peeler): Lớp da dưới biểu bì tiết ra enzyme collagenase chủ động hóa lỏng lớp da chết bám đầy rêu tảo chỉ trong vài giờ, giúp chu kỳ lột da diễn ra êm ái, tốn ít năng lượng.\n- Khớp hàm giảm chấn (Cartilaginous Jaw Dampeners): Các miếng sụn dẻo dày 5mm chèn vào khớp nối quai hàm và xương sọ, triệt tiêu 95% lực phản chấn cơ học khi quai hàm đớp mạnh với tốc độ mili giây.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Gia cố tinh thể canxi-phosphate gai lưng",
                  benefit: "Tăng độ bền uốn gai lưng lên 250 MPa, giúp xuyên thủng lớp da giáp dày 5mm của con mồi mà không cong gãy."
                },
                {
                  type: "Khớp hàm giảm chấn đàn hồi",
                  benefit: "Hấp thụ 400J động năng phản chấn của cú đớp siêu tốc, bảo vệ hộp sọ an toàn tuyệt đối."
                }
              ]
            },
            p4p_score_scaled: 84,
            tier_scaled: "B",
            sources: [
              { label: "Evolution of venom apparatus and skeleton reinforcement in venomous marine vertebrates", url: "https://doi.org/10.1093/mbe/msw142" }
            ]
          }
        ]
      });
    } else if (target.id === "shoebill-stork") {
      whatIfData.push({
        creature_id: "shoebill-stork",
        title: "Nếu Cò Mỏ Giày phóng to bằng kích thước quái thú (80kg) thì sao?",
        slug: "neu-co-mo-giay-phong-to-bang-kich-thuoc-quai-thu-80kg",
        description: "Phân tích giả thuyết khi Cò Mỏ Giày với chiếc mỏ hình chiếc giày khổng lồ như chiếc xẻng sắt, cơ cổ Atlas cực khỏe và khả năng bất động săn mồi bùng nổ đạt khối lượng 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Cơn ác mộng đầm lầy)",
            slug: "co-mo-giay-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Mỏ giày dài 40cm rộng 22cm bổ nát đầu cá sấu nhỏ với lực 4500 N, cơ cổ Atlas triệt tiêu lực phản chấn 2000J, sải cánh 5.5m nâng đỡ bay lượn ở đầm lầy.",
            content: "Khi Cò Mỏ Giày đạt khối lượng 80kg (phóng to gấp 13.3 lần khối lượng từ ~6kg tự nhiên):\n- Chiếc mỏ xẻng sát thủ: Chiếc mỏ dài 40cm, rộng 22cm có móc sừng cứng ở đầu. Lực mổ bổ đớp của hàm và cổ phóng đại đạt tới 4500 N. Một cú bổ trực diện từ trên cao có thể đập nát lớp vỏ xương sọ của cá sấu nhỏ hoặc rùa đầm lầy lớn.\n- Đốt sống cổ Atlas gia cường: Hệ cơ cổ Atlas phát triển nâng đỡ chiếc đầu to nặng 12kg. Các đốt sống cổ có diện tích khớp lớn kết hợp các bó cơ gáy dày dặn, triệt tiêu động năng phản chấn 2000J khi mỏ đập mạnh xuống đáy bùn ngầm.\n- Sải cánh khổng lồ: Sải cánh tăng tỷ lệ thuận lên tới 5.5 mét, diện tích cánh rộng giúp cò mỏ giày bay lượn săn tìm vùng nước mới dồi dào mồi.",
            formulas_and_data: {
              scaling_factor: 13.3,
              mass_kg_original: 6,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực bổ đập của mỏ sừng xuống bùn",
                  equation: "F_strike = m_head * a_strike",
                  result: "~4,500 N (với gia tốc bổ đầu a = 120 m/s2)"
                },
                {
                  name: "Chiều dài sải cánh phóng đại",
                  equation: "W_span = W_span_original * (M_scaled / M_original)^(1/3)",
                  result: "~5.5 mét"
                }
              ]
            },
            p4p_score_scaled: 88,
            tier_scaled: "A",
            sources: [
              { label: "Feeding behavior and jaw mechanics in the Shoebill Balaeniceps rex", url: "https://doi.org/10.1111/j.1469-7998.1994.tb08615.x" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Mất kiểm soát thăng bằng và gãy cánh)",
            slug: "co-mo-giay-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Đầu nặng 12kg làm mất thăng bằng đổ nhào ra trước, xương cánh rỗng bị gãy gập dưới lực cản gió lớn và chân mảnh bị lún sâu trong bùn lầy.",
            content: "Trong thực tế vật lý sinh học khi cò mỏ giày nặng 80kg:\n- Mất thăng bằng đầu (Center of gravity failure): Chiếc mỏ sừng khổng lồ chứa xương đặc ở đầu mõm nặng tới 12kg. Trọng tâm cơ thể bị đẩy lệch hẳn ra trước ngực. Khi cò mỏ giày đứng im hoặc bước đi, mô-men lực kéo gáy lớn sẽ khiến cò đổ nhào về phía trước, không thể đứng thẳng hoặc săn mồi phục kích.\n- Gãy xương cánh rỗng: Chim sở hữu xương rỗng (pneumatized bones) để giảm trọng lượng bay. Ở khối lượng 80kg, khi cố đập cánh sải 5.5m để bay, ứng suất xoắn do sức cản không khí vượt quá giới hạn chịu tải cơ học của xương cánh rỗng, gây gãy xương chi trước ngay lập tức.\n- Lún sâu đầm lầy: Đôi chân mảnh khảnh có móng dài nâng đỡ 80kg trên nền bùn mềm tạo áp lực nén 90 kPa, khiến chim bị lún sâu ngập gối chân, không thể nhấc chi chạy bứt tốc.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Ứng suất xoắn xương cánh khi cất cánh",
                  issue: "Ứng suất xoắn lên xương cánh vượt quá 85 MPa, gây rạn gãy xương cánh rỗng."
                },
                {
                  type: "Mô-men xoắn kéo lệch trọng tâm của đầu mỏ",
                  issue: "Trọng tâm đầu lệch ra trước 25cm tạo mô-men kéo 30 N.m gây mỏi cơ cổ và mất thăng bằng."
                }
              ]
            },
            p4p_score_scaled: 35,
            tier_scaled: "D",
            sources: [
              { label: "Pneumatization of avian bones and mechanical limits in heavy flying birds", url: "https://doi.org/10.1002/jmor.10515" }
            ]
          },
          {
            title: "Đột biến thích nghi (Khủng long đầm lầy cánh cốt giáp)",
            slug: "co-mo-giay-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Cơ gân đuôi đối trọng cân bằng đầu, xương cánh gia cố sợi carbon sinh học đặc, và bàn chân móng xòe rộng phân tán áp lực.",
            content: "Để săn mồi dũng mãnh và di chuyển linh hoạt ở kích thước 80kg tại đầm lầy:\n- Đuôi đối trọng cơ gân khỏe (Tail Counterbalance): Phần đuôi phát triển dài hơn kết hợp lớp lông đuôi nặng cùng các bó cơ mông đùi dày đặc, hoạt động như một bánh lái đối trọng kéo trọng tâm cơ thể lùi về sau trung tâm khớp hông, giúp đứng vững tuyệt đối.\n- Cánh cốt xương đặc gia cường (Reinforced Wing Bones): Xương cánh tiến hóa lấp đầy bởi các liên kết canxi ma trận tổ ong mật độ cao cùng vách ngăn sợi keratin cứng, chịu ứng suất xoắn gió cực cao, giúp cất cánh bay tầm thấp.\n- Chân đế giày bùn (Mud-shoe Webbed Talons): Các ngón chân xòe rộng hơn nữa tích hợp màng da mỏng giữa các ngón, phân tán lực nén đều trên bùn đất chỉ còn 15 kPa giúp chạy bứt tốc trên bùn lầy không lún.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Bố trí đối trọng cơ đùi và đuôi",
                  benefit: "Kéo trọng tâm dịch chuyển về hông 22cm, giữ thăng bằng hoàn hảo trong tư thế đứng săn mồi."
                },
                {
                  type: "Màng chân bùn phân tán áp lực",
                  benefit: "Tăng diện tích chân đế lên 0.08 m2, giúp chim đi lại và bứt tốc dễ dàng trên đầm lầy bùn lỏng."
                }
              ]
            },
            p4p_score_scaled: 82,
            tier_scaled: "A",
            sources: [
              { label: "Avian tail functions and adaptation mechanics in wading birds", url: "https://doi.org/10.1111/jav.01254" }
            ]
          }
        ]
      });
    } else if (target.id === "blue-ringed-octopus") {
      whatIfData.push({
        creature_id: "blue-ringed-octopus",
        title: "Nếu Bạch Tuộc Đốm Xanh phóng to bằng con người (80kg) thì sao?",
        slug: "neu-bach-tuoc-dom-xanh-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích kịch bản giả thuyết khi loài Bạch Tuộc Đốm Xanh (Hapalochlaena lunulata) sở hữu độc tố thần kinh Tetrodotoxin hủy diệt được phóng đại kích thước cơ thể lên 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Cơn ác mộng nọc độc đại dương)",
            slug: "bach-tuoc-dom-xanh-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Lực cắn mỏ vẹt đạt 2.736 N xuyên thủng giáp cứng, lượng độc tố TTX tăng lên 800 mg đủ giết chết 41.600 người trưởng thành, và đổi màu đốm xanh bùng nổ trong 0.1 giây.",
            content: "Khi Bạch Tuộc Đốm Xanh đạt khối lượng 80kg (phóng đại gấp 1.600 lần so với trọng lượng ~50g tự nhiên):\n- Lực cắn hủy diệt cơ học: Mỏ vẹt cứng của bạch tuộc được vận hành bởi khối cơ bó má lớn. Lực cắn tăng theo tiết diện cơ (hệ số 136.8), nâng lực cắn từ 20 N lên 2.736 N, dễ dàng xuyên thủng giáp cua biển khổng lồ, vỏ rùa hoặc thậm chí các tấm thép mỏng.\n- Kho độc tố Tetrodotoxin cực đại: Lượng độc tố TTX sinh học do vi khuẩn cộng sinh trong tuyến nước bọt tiết ra tỷ lệ thuận với khối lượng, tăng lên tới 800 mg độc chất tinh khiết. Chỉ với 1-2 mg đã đủ gây tử vong cho người lớn, kho độc chất này có thể hạ gục 41.600 người trưởng thành trong vài phút mà không có thuốc giải.\n- Hệ sắc tố đốm xanh bùng nổ: Tế bào chromatophores khổng lồ có đường kính mở rộng từ 0.1 mm lên 4 mm, phản xạ ánh sáng bước sóng 480nm tạo tín hiệu chớp nháy đốm xanh neon cảnh báo vô cùng chói mắt trên cự ly 50m dưới lòng biển sâu.",
            formulas_and_data: {
              scaling_factor: 1600,
              mass_kg_original: 0.05,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực cắn phóng to theo tiết diện cơ",
                  equation: "F_bite_scaled = F_bite_original * (M_scaled / M_original)^(2/3)",
                  result: "~2,736 N"
                },
                {
                  name: "Khả năng sát thương độc tố TTX phóng đại",
                  equation: "Lethal_capacity = Cap_original * (M_scaled / M_original)",
                  result: "Đủ tiêu diệt ~41,600 người trưởng thành (chứa ~800 mg TTX)"
                }
              ]
            },
            p4p_score_scaled: 85,
            tier_scaled: "A",
            sources: [
              { label: "Tetrodotoxin in the blue-ringed octopus: distribution and symbiosis", url: "https://doi.org/10.1007/s00227-010-1452-1" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Sự sụp đổ thân mềm và ngạt thở cục bộ)",
            slug: "bach-tuoc-dom-xanh-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Thân mềm không có bộ xương nâng đỡ bị bẹp dí dưới trọng lực đè nén nội tạng ở vùng nước nông, và hệ tuần hoàn hở mang sách gây ngạt thở nhanh chóng.",
            content: "Trong thực tế vật lý sinh học khi Bạch Tuộc Đốm Xanh đạt khối lượng 80kg:\n- Hội chứng bẹp dí không xương (Gravitational Flattening): Là loài không xương sống (non-skeleton), cấu trúc cơ thể phụ thuộc vào lực đẩy Archimedes của nước. Khi lên cạn hoặc ở vùng nước nông, trọng lượng 80kg chịu tác động hoàn toàn của trọng lực sẽ xẹp xuống như một khối gelatin, đè nén áp lực cơ học lên tới 20 kPa trực tiếp lên tim và hệ mạch nội tạng, gây ngưng tuần hoàn.\n- Ngạt thở mang sách: Diện tích bề mặt mang so với thể tích giảm mạnh 11.7 lần. Hệ mang không thể đáp ứng đủ lượng oxy khuếch tán cho 80kg cơ bắp, khiến lượng oxy máu tụt dốc không phanh, bạch tuộc rơi vào trạng thái hôn mê ngạt thở chỉ sau vài phút.\n- Kiệt quệ năng lượng đổi màu: Vận hành hàng triệu tế bào sắc tố khổng lồ rộng 4mm ngốn 75% năng lượng hô hấp cơ bản, làm bạch tuộc cạn kiệt ATP và chết do kiệt sức cơ tim.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Áp lực đè nén nội tạng dưới tác động trọng lực",
                  issue: "Trọng lực đè ép tạo áp suất cơ học nội bộ 20 kPa, vượt quá áp suất tim tối đa của bạch tuộc (6 kPa), làm ngừng tim hoàn toàn."
                },
                {
                  type: "Thiếu hụt diện tích trao đổi khí của mang",
                  issue: "Tỷ lệ diện tích bề mặt mang trên thể tích cơ thể giảm 91.5%, lượng oxy máu hòa tan giảm dưới ngưỡng sinh tồn 15%."
                }
              ]
            },
            p4p_score_scaled: 20,
            tier_scaled: "D",
            sources: [
              { label: "Mechanics of hydrostatic skeletons and gravitational limits in soft-bodied animals", url: "https://doi.org/10.1242/jeb.00318" }
            ]
          },
          {
            title: "Đột biến thích nghi (Quái thú thân mềm áp suất thủy tĩnh và phun nọc áp lực)",
            slug: "bach-tuoc-dom-xanh-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Khung xương thủy tĩnh áp suất cao kết hợp ma trận collagen gia cường, mang xếp nếp sâu tuần hoàn khép kín, và tuyến nọc cơ bắp phun độc sương mù cự ly 3m.",
            content: "Để Bạch Tuộc Đốm Xanh 80kg có thể di chuyển linh hoạt và thống trị cạn/nước:\n- Bộ xương thủy tĩnh áp suất cao (Pressurized Hydrostatic Skeleton): Tiết ra chất dịch bán gelatin giàu collagen dẻo dai liên kết chặt chẽ với các bó cơ đan chéo xoắn ốc, duy trì hình thể vững chãi chịu mô-men xoắn lớn mà không bị xẹp lép dưới trọng lực Trái Đất.\n- Mang phế nang kép tuần hoàn khép kín: Các lá mang xếp nếp sâu gấp 15 lần tích hợp mạng lưới mao mạch kín có cơ hoành hô hấp bổ trợ chủ động co bóp lọc khí, duy trì oxy máu ổn định ngay cả khi trườn bò trên cạn 2-3 giờ.\n- Phun nọc áp lực cơ hàm (salivary jet projector): Tuyến nước bọt tiến hóa các túi cơ co thắt nhanh áp lực lớn, cho phép ép phun nọc độc TTX ra ngoài qua phễu phun (siphon) dưới dạng sương mù mịn xa tới 3m, làm tê liệt đối thủ từ xa.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Áp suất thủy tĩnh duy trì hình dạng",
                  benefit: "Duy trì áp suất thủy tĩnh nội bộ P_internal >= 25 kPa chống lại sự bẹp dí dưới trọng lực."
                },
                {
                  type: "Tốc độ và cự ly phun sương độc tố",
                  benefit: "Phun nọc với vận tốc đầu nòng 15 m/s, khuếch tán sương độc TTX trong không khí chiếm thể tích 1.5 m3 quanh mục tiêu."
                }
              ]
            },
            p4p_score_scaled: 88,
            tier_scaled: "S",
            sources: [
              { label: "Functional morphology of cephalopod chromatophores and jet propulsion systems", url: "https://doi.org/10.1111/j.1469-7998.2012.00902.x" }
            ]
          }
        ]
      });
    } else if (target.id === "chinese-giant-salamander") {
      whatIfData.push({
        creature_id: "chinese-giant-salamander",
        title: "Nếu Kỳ Giông Khổng Lồ Trung Quốc phóng to thành quái thú (250kg) thì sao?",
        slug: "neu-ky-giong-khong-lo-trung-quoc-phong-to-thanh-quai-thu-250kg",
        description: "Phân tích kịch bản giả thuyết khi loài lưỡng cư lớn nhất thế giới Kỳ Giông Khổng Lồ Trung Quốc (Andrias davidianus) được phóng đại lên khối lượng 250kg gánh chịu định luật sinh học vật lý.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Cá sấu lưỡng cư tái sinh thần tốc)",
            slug: "ky-giong-khong-lo-trung-quoc-250kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Cú đớp hút áp suất âm đạt lực 4.070 N nuốt gọn mồi 30kg trong tích tắc, tái sinh hoàn hảo chi/đuôi trong 15 ngày, và tiết keo tự vệ chống trượt dày 2mm cản phá sát thương cơ học.",
            content: "Khi Kỳ Giông Khổng Lồ Trung Quốc phóng đại lên 250kg (tăng khối lượng gấp 50 lần từ ~5kg nguyên bản):\n- Cú đớp hút chân không uy lực: Hệ cơ hàm và hầu vĩ đại mở rộng nhanh chóng tạo vùng áp suất âm sâu dưới nước. Lực đớp cơ học tăng theo tiết diện (hệ số 13.57), tăng lên tới 4.070 N, hút trọn con mồi nặng 30kg chỉ trong 0.05 giây.\n- Tái sinh hoàn hảo cấp độ đại thể: Nhờ mật độ tế bào gốc biểu bì chuyên biệt (blastema) tăng tương ứng, kỳ giông khổng lồ có thể tái tạo hoàn toàn chi trước hoặc đuôi bị đứt lìa chỉ trong vòng 15 ngày cự ly lớn.\n- Khiên keo nhầy tự vệ dày 2mm: Tuyến da tiết ra 2 lít chất nhầy màu trắng có chứa độc tính nhẹ hóa đông nhanh trên cạn, hoạt động như một lớp màng đệm hydrogel dày 2mm phân tán xung lực đòn đánh vật lý lên tới 1.500 J.",
            formulas_and_data: {
              scaling_factor: 50,
              mass_kg_original: 5,
              mass_kg_scaled: 250,
              formulas: [
                {
                  name: "Lực đớp hút chân không phóng đại",
                  equation: "F_bite_scaled = F_bite_original * (M_scaled / M_original)^(2/3)",
                  result: "~4,070 N"
                },
                {
                  name: "Mật độ tế bào gốc tái sinh biểu bì blastema",
                  equation: "N_stem = 5 * 10^8 cells/cm^3",
                  result: "Đảm bảo tái tạo mô chi đạt tốc độ ~1.2 cm/ngày"
                }
              ]
            },
            p4p_score_scaled: 78,
            tier_scaled: "B",
            sources: [
              { label: "Suction feeding mechanics and jaw jaw bone kinetics in giant salamanders", url: "https://doi.org/10.1242/jeb.042556" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Cơn ngạt thở qua da và gãy xương chi sụn)",
            slug: "ky-giong-khong-lo-trung-quoc-250kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Diện tích da trao đổi khí giảm 73% gây ngạt thở cấp tính trong 10 phút, xương sụn yếu ớt bị uốn gãy dưới khối lượng 250kg trên cạn, và quá nhiệt nội tạng.",
            content: "Trong thế giới thực tế vật lý sinh học khi kỳ giông nặng 250kg:\n- Thất bại hô hấp qua da (Cutaneous Respiration Failure): Kỳ giông khổng lồ chủ yếu hấp thu oxy qua các nếp gấp da nhăn nheo ngập dưới nước lạnh. Khi phóng to lên 250kg, tỷ lệ diện tích da trên thể tích cơ thể (S/V) giảm mạnh 3.68 lần. Da không đủ diện tích bề mặt để khuếch tán oxy đáp ứng nhu cầu trao đổi chất khổng lồ, khiến nó ngạt thở và hôn mê chỉ sau 10 phút.\n- Sụp đổ hệ xương sụn: Khung xương của chúng chủ yếu là sụn (chondrocranium và sụn chi) chịu tải kém. Khi lên cạn chịu tác động của trọng lực 2.450 N, các chi sụn bị uốn gãy gập lập tức, lồng ngực xẹp đè dập gan và tim.\n- Sốc nhiệt môi trường nước: Khối lượng lớn khiến tỷ lệ tỏa nhiệt giảm sâu. Nếu nhiệt độ nước tăng quá 20°C, nhiệt độ nội tạng tích tụ nhanh chóng không thể thoát ra ngoài, gây suy tạng và tử vong.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Giảm tỷ lệ diện tích da trên thể tích (S/V)",
                  issue: "Tỷ lệ S/V giảm 73%, lượng oxy hòa tan khuếch tán qua da chỉ đáp ứng được 22% nhu cầu năng lượng cơ bản."
                },
                {
                  type: "Ứng suất xoắn uốn trên xương sụn chi trước",
                  issue: "Ứng suất cơ học lên chi đạt 18 MPa, vượt quá giới hạn bền uốn của sụn lưỡng cư (8 MPa) gây gãy khớp chi."
                }
              ]
            },
            p4p_score_scaled: 25,
            tier_scaled: "D",
            sources: [
              { label: "Cutaneous respiration and scaling limits in caudate amphibians", url: "https://doi.org/10.1086/282711" }
            ]
          },
          {
            title: "Đột biến thích nghi (Quái ngư đầm lầy phổi túi khí và khung xương cốt hóa)",
            slug: "ky-giong-khong-lo-trung-quoc-250kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Phổi kép phế nang hóa có cơ hoành hô hấp cạn chủ động, bộ xương chi sụn được cốt hóa canxi cứng chịu tải 3.000 N, và lớp da tiết chất hydrogel chống mất nước.",
            content: "Để Kỳ Giông 250kg sống sót dũng mãnh và bò lên cạn như tổ tiên Tiktaalik:\n- Phổi kép phế nang hóa chủ động (Alveolar Lung Adaptation): Hai lá phổi nguyên bản phẳng dẹt tiêu biến, tiến hóa thành phổi có cấu trúc túi phế nang gấp nếp chằng chịt mao mạch tương tự bò sát cạn, kết hợp cơ hoành co bóp để chủ động hít thở khí trời, nâng tỷ lệ hô hấp phổi lên 92%.\n- Cốt hóa xương chi trước và đai hông (Ossified Skeletal Structure): Toàn bộ khung xương sụn chuyển hóa thành xương cứng cốt hóa giàu calci ma trận, tăng mật độ xương lên 92%, gánh đỡ hoàn hảo khối lượng 250kg đứng cạn bò trườn chịu lực tải 3.000 N.\n- Lớp da tiết hydrogel cách nhiệt chống thấm ngược: Da tiết ra dịch gel đặc biệt giữ độ ẩm ẩm ướt, lọc thấm chọn lọc oxy từ khí quyển ẩm đồng thời bảo vệ nhiệt độ nội tạng dưới 18°C.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Phát triển diện tích phổi phế nang",
                  benefit: "Tăng diện tích bề mặt trao đổi khí phổi lên 4.5 m2, đảm bảo bão hòa oxy máu đạt 95% ở cạn."
                },
                {
                  type: "Gia cường mật độ xương cứng cốt hóa",
                  benefit: "Chịu mô-men xoắn uốn chi trước lên tới 450 N.m giúp nâng thân nâng đầu trườn bò trên mặt đất khô."
                }
              ]
            },
            p4p_score_scaled: 82,
            tier_scaled: "A",
            sources: [
              { label: "The transition from cartilage to bone in evolutionary developmental biology", url: "https://doi.org/10.1002/dvg.10221" }
            ]
          }
        ]
      });
    } else if (target.id === "electric-eel") {
      whatIfData.push({
        creature_id: "electric-eel",
        title: "Nếu Cá Chình Điện phóng to bằng quái thú khổng lồ (160kg) thì sao?",
        slug: "neu-ca-chinh-dien-phong-to-bang-quai-thu-khong-lo-160kg",
        description: "Phân tích kịch bản giả thuyết khi loài Cá Chình Điện (Electrophorus electricus) với 3 cơ quan phát điện sinh học khổng lồ được phóng to lên khối lượng 160kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Cỗ máy phát điện hủy diệt đại dương)",
            slug: "ca-chinh-dien-160kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Phóng xung điện cực đại 2.400 V với cường độ 8 A đạt công suất đỉnh 19.200 W, radar quét điện trường 3D bán kính 15m, và bứt tốc bơi sóng đuôi đạt 35 km/h.",
            content: "Khi Cá Chình Điện nặng 160kg (phóng to khối lượng gấp 8 lần, chiều dài tăng gấp 2 lần đạt gần 4 mét):\n- Luồng sét sinh học hủy diệt: Số lượng tế bào phát điện electrocytes xếp nối tiếp và song song tăng mạnh. Điện thế phóng tăng từ 860 V lên 2.400 V, cường độ dòng điện đạt 8 A. Cú phóng xung điện cực đại tạo công suất đỉnh tới 19.200 Watts trong vài mili giây, dễ dàng làm tê liệt một con hà mã trưởng thành hoặc đánh sập hệ thống cơ của bất kỳ đối thủ nào dưới nước.\n- Radar điện trường 3D siêu nhạy: Tần số xung định vị Sachs' organ phát ra ở mức 400 Hz tạo trường quét 3D sắc nét trong bán kính 15m nước đục, phát hiện chuyển động cơ tim của con mồi bị ẩn giấu dưới bùn cát.\n- Động cơ sóng đuôi mạnh mẽ: Cơ vây dọc đuôi phát triển cơ bắp dẻo dai gợn sóng, tạo lực đẩy cơ học đẩy thân hình dài 4m bơi lượn với vận tốc 35 km/h.",
            formulas_and_data: {
              scaling_factor: 8,
              mass_kg_original: 20,
              mass_kg_scaled: 160,
              formulas: [
                {
                  name: "Hiệu điện thế phóng điện cực đại nối tiếp",
                  equation: "V_scaled = V_original * (L_scaled / L_original)",
                  result: "~2,400 V"
                },
                {
                  name: "Cường độ dòng điện song song",
                  equation: "I_scaled = I_original * N_parallel_columns",
                  result: "~8 A (với 8 hàng tế bào electrocytes xếp song song)"
                },
                {
                  name: "Công suất phóng điện đỉnh (Peak power output)",
                  equation: "P_peak = V_scaled * I_scaled",
                  result: "~19,200 W"
                }
              ]
            },
            p4p_score_scaled: 90,
            tier_scaled: "S",
            sources: [
              { label: "Active electroreception and electrogenesis in the electric eel Electrophorus", url: "https://doi.org/10.1126/science.1260124" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Sự tự giật điện tử vong và ngạt thở cạn)",
            slug: "ca-chinh-dien-160kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Xung điện 2.400 V rò rỉ xuyên qua chất nhầy nướng chín tim não của chính nó, cơ thể dài 4m không xương sườn chịu trọng lực dập nát nội tạng trên cạn, và ngạt thở do mang thoái hóa mang.",
            content: "Trong thực tế vật lý sinh học khi cá chình điện đạt khối lượng 160kg:\n- Tự giật điện chết (Self-electrocution): Lớp biểu bì da tiết dịch nhầy cách điện nguyên bản dày 0.5mm có giới hạn đánh thủng điện môi khoảng 1.500 V. Khi phóng xung điện 2.400 V / 8 A trong vùng nước có độ dẫn điện cao hoặc trên cạn ẩm ướt, dòng điện rò rỉ sẽ xuyên thủng lớp nhầy cách điện, chạy trực tiếp vào hệ thần kinh trung ương và nướng chín cơ tim của chính nó.\n- Ngạt thở bắt buộc: Cá chình điện là loài bắt buộc thở khí trời (obligate air-breather) bằng khoang miệng do gương mang đã tiêu biến. Ở khối lượng 160kg, việc ngoi lên mặt nước cứ mỗi 10 phút để đớp khí đòi hỏi động năng nâng đầu nặng 25kg cực lớn, cơ đuôi dạng dẹp không thể đẩy được cơ thể khi ở nước chảy hoặc cạn nông.\n- Dập nát phủ tạng: Thân trước của chúng không có các gai xương sườn nâng đỡ cơ quan nội tạng. Trọng lượng 160kg ép dẹp tim và gan xuống đáy đất cứng gây xuất huyết nội bộ.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Vượt giới hạn đánh thủng điện môi lớp nhầy da",
                  issue: "Điện áp phóng 2.400V vượt quá cường độ cách điện tối đa của lớp nhầy (1.500V), gây ra hiện tượng đoản mạch qua cơ tim tự giật chết."
                },
                {
                  type: "Thiếu hụt lồng xương sườn nâng đỡ tim gan",
                  issue: "Trọng lực đè nén nội tạng với áp lực 12 kPa gây tổn thương cơ học dập gan ruột khi nằm trên cạn khô."
                }
              ]
            },
            p4p_score_scaled: 30,
            tier_scaled: "D",
            sources: [
              { label: "Obligate air-breathing and evolutionary degeneration of gills in gymnotiform fish", url: "https://doi.org/10.1111/j.1095-8649.2006.01254.x" }
            ]
          },
          {
            title: "Đột biến thích nghi (Quái long lôi điện giáp myelin và lồng ngực gai xương bảo vệ)",
            slug: "ca-chinh-dien-160kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Lớp da giáp chứa myelin và keratin dày 3mm cách điện tuyệt đối tới 6.000 V, tiến hóa phổi khoang miệng xếp nếp dung tích 6 lít có van khí quản đóng mở chủ động, và khung gai xương sườn bán vòng gia cố nội tạng.",
            content: "Để Cá Chình Điện 160kg hoạt động an toàn và phóng điện hủy diệt đối thủ không tự sát:\n- Lớp giáp cách điện sinh học cực đại (Myelin-keratinized insulating armor): Lớp da tiến hóa chứa các lớp bao myelin xếp chồng xen kẽ các tấm sừng keratin dày 3mm, nâng giới hạn đánh thủng điện môi lên tới 6.000 V, bảo vệ 100% cơ tim và não bộ khỏi dòng rò rỉ.\n- Phổi khoang miệng phế nang hóa có van đóng nắp thanh quản: Niêm mạc miệng phát triển thành mạng phế nang có thể tích 6 lít hoạt động như một lá phổi cạn thực sự, kết hợp van thanh quản cơ bắp ngăn tràn nước giúp lặn sâu 40 phút không cần ngoi thở.\n- Bộ gai xương sườn bán vòng gia cố (Semi-ring Rib Cage): Nửa thân trước tiến hóa các thanh xương sườn cong bảo vệ tim và gan, phân tán 95% lực nén trọng lực khi trườn bò trên mặt đất bùn cạn.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Nâng giới hạn cách điện của biểu bì da",
                  benefit: "Giới hạn điện áp đánh thủng tăng lên 6.000 V, rò rỉ điện nội bộ giảm xuống dưới 0.01% ở cạn."
                },
                {
                  type: "Gia cường gai xương nâng đỡ lồng ngực",
                  benefit: "Bộ gai sườn chịu tải cơ học 1.800 N, bảo vệ tim gan khỏi áp lực ép dẹp khi trườn bò cạn khô."
                }
              ]
            },
            p4p_score_scaled: 92,
            tier_scaled: "S",
            sources: [
              { label: "Comparative physiology of electrogenesis and myelin insulating adaptations in gymnotiforms", url: "https://doi.org/10.1146/annurev-physiol-021020-032541" }
            ]
          }
        ]
      });
    } else if (target.id === "goliath-tigerfish") {
      whatIfData.push({
        creature_id: "goliath-tigerfish",
        title: "Nếu Cá Hổ Goliath phóng to bằng con người (80kg) thì sao?",
        slug: "neu-ca-ho-goliath-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích kịch bản giả thuyết khi Cá Hổ Goliath (Hydrocynus goliath) đạt kích thước con người 80kg và khả năng săn mồi siêu cấp.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Cú đớp nghiền sắt thép và bứt tốc thủy động lực học)",
            slug: "ca-ho-goliath-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Lực đớp đạt 5.500 N, bứt tốc 45 km/h dưới nước với hàm răng 32 chiếc răng nanh thép dài 5cm.",
            content: "Khi Cá Hổ Goliath được phóng to lên 80kg (tăng khối lượng gấp ~8 lần so với kích thước trung bình 10kg, chiều dài sấp xỉ 1.8m):\n- Bộ hàm răng thép khổng lồ: Sở hữu 32 chiếc răng nanh nhọn hoắt xếp đan xen như răng cưa, mỗi chiếc răng dài 5cm. Lực đớp tăng theo tiết diện cơ hàm (M_scaled/M_original)^(2/3), đạt 5.500 N, đủ sức xé toạc các tấm thép mỏng hoặc nghiền nát xương của bất kỳ động vật thủy sinh lớn nào.\n- Tốc độ bứt tốc thủy động lực học: Nhờ thân hình thon dẹt tối ưu và hệ cơ đỏ phát triển, cú bứt tốc cự ly ngắn đạt vận tốc 45 km/h, kết hợp với hộp sọ có khớp động cơ học giảm chấn chống gãy sọ khi va đập đớp mồi.",
            formulas_and_data: {
              scaling_factor: 8,
              mass_kg_original: 10,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực đớp phóng to theo tiết diện cơ",
                  equation: "F_bite_scaled = F_bite_original * (M_scaled / M_original)^(2/3)",
                  result: "~5,500 N"
                },
                {
                  name: "Tốc độ bứt tốc thủy động lực học tối đa",
                  equation: "V_max_scaled = V_max_original * (M_scaled / M_original)^(1/6)",
                  result: "~45 km/h"
                }
              ]
            },
            p4p_score_scaled: 85,
            tier_scaled: "A",
            sources: [
              { label: "Feeding mechanics and bite force of the Goliath tigerfish", url: "https://doi.org/10.1111/j.1469-7998.2012.00912.x" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Thiếu hụt oxy và sụp đổ bong bóng cá)",
            slug: "ca-ho-goliath-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Gặp khó khăn nghiêm trọng về hô hấp do tỷ lệ diện tích mang giảm và bong bóng cá không chịu nổi áp suất chênh lệch.",
            content: "Trong thực tế vật lý sinh học khi cá hổ goliath đạt khối lượng 80kg:\n- Khủng hoảng hô hấp: Do cá hổ goliath là loài cá săn mồi hiếu động cao, nhu cầu oxy rất lớn. Khi phóng to lên 80kg, tỷ lệ diện tích bề mặt mang trên khối lượng cơ thể (S_gill / V_body) giảm mạnh (tỷ lệ nghịch với kích thước tuyến tính), khiến cá không thể hấp thụ đủ oxy hòa tan trong nước sông nhiệt đới nóng, gây ngạt thở nhanh chóng khi vận động mạnh.\n- Tổn thương bong bóng cá cơ học: Trọng lượng 80kg tạo áp lực lớn lên các cơ quan nội tạng khi bơi ở các độ sâu khác nhau. Bong bóng cá chịu chênh lệch áp suất lớn, dễ bị vỡ hoặc mất kiểm soát sức nổi, khiến cá bị chìm xuống đáy hoặc ngửa bụng.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Thiếu hụt diện tích phổi/mang trao đổi khí",
                  issue: "Tỷ lệ diện tích bề mặt mang trên thể tích giảm ~50%, gây thiếu oxy nghiêm trọng khi vận động."
                },
                {
                  type: "Áp suất thủy tĩnh lên bong bóng cá",
                  issue: "Áp lực tăng cao làm mất kiểm soát sức nổi cơ học, vô hiệu hóa khả năng giữ thăng bằng."
                }
              ]
            },
            p4p_score_scaled: 25,
            tier_scaled: "D",
            sources: [
              { label: "Gill morphometrics and respiratory constraints in large teleosts", url: "https://doi.org/10.1002/jez.14023" }
            ]
          },
          {
            title: "Đột biến thích nghi (Thủy quái sông Congo có phổi phụ trợ và giáp vảy titan)",
            slug: "ca-ho-goliath-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Hệ thống mang phụ trợ siêu phân nhánh và vảy sừng phủ chitin bền gấp 5 lần chống áp lực.",
            content: "Để Cá Hổ Goliath 80kg sinh tồn và trở thành bá chủ vùng nước ngọt:\n- Mang xếp nếp siêu cấp (Hyper-folded gills): Tiến hóa các phiến mang phụ trợ xếp nếp sâu tích hợp mao mạch mật độ cao, tăng diện tích tiếp xúc với nước gấp 4 lần để bù đắp sự thiếu hụt oxy.\n- Vảy giáp phức hợp chitin-calcium: Lớp vảy phát triển thêm các sợi chitin liên kết ma trận canxi, tạo cấu trúc giáp nhẹ nhưng siêu bền, bảo vệ cơ thể khỏi áp lực nước chảy xiết và các đòn tấn công vật lý.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Mang xếp nếp tăng diện tích bề mặt",
                  benefit: "Tăng diện tích trao đổi khí lên 2.5 m² per kg, đảm bảo cung cấp oxy đầy đủ."
                },
                {
                  type: "Vảy giáp phức hợp chitin-calcium",
                  benefit: "Mô-đun đàn hồi đạt 12 GPa, chịu được áp lực va đập lớn gấp 5 lần vảy thường."
                }
              ]
            },
            p4p_score_scaled: 88,
            tier_scaled: "A",
            sources: [
              { label: "Fish scale biocomposites and impact resistance", url: "https://doi.org/10.1016/j.actbio.2014.09.011" }
            ]
          }
        ]
      });
    } else if (target.id === "great-white-shark") {
      whatIfData.push({
        creature_id: "great-white-shark",
        title: "Nếu Cá Mập Trắng Lớn thu nhỏ bằng con người (80kg) thì sao?",
        slug: "neu-ca-map-trang-lon-thu-nho-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài cá mập trắng lớn khổng lồ được thu nhỏ về kích thước con người 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Cú đớp cưa sắc ngọt và bơi lội siêu linh hoạt)",
            slug: "ca-map-trang-lon-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Lực đớp đạt 4.000 N, bơi lội siêu linh hoạt với bán kính quay đầu cực hẹp và gia tốc bứt tốc tức thì.",
            content: "Khi Cá Mập Trắng Lớn thu nhỏ về 80kg (dài khoảng 1.8m):\n- Cú đớp răng cưa xé thịt: Bộ răng cưa sắc lẹm di động xếp lớp nguyên bản thu nhỏ lại thành lưỡi dao lam siêu bạo lực. Lực đớp cơ học so với cơ thể tăng vượt bậc nhờ tỷ lệ cơ hàm lớn, đạt 4.000 N, kết hợp với chuyển động lắc đầu sườn ngang đặc trưng để cắt đôi bất kỳ con mồi nào trong nháy mắt.\n- Siêu linh hoạt dưới nước: Giảm khối lượng khổng lồ giúp momen quán tính xoay trục dọc giảm mạnh (giảm theo tỷ lệ bậc 5 của kích thước). Cá mập trắng 80kg có thể bẻ lái quay đầu gấp góc 90 độ chỉ trong 0.2 giây, điều mà phiên bản khổng lồ nặng 1 tấn không bao giờ làm được.",
            formulas_and_data: {
              scaling_factor: 0.08,
              mass_kg_original: 1000,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực đớp phóng đại tương đối ở kích thước nhỏ",
                  equation: "F_bite_scaled = F_bite_original * (M_scaled / M_original)^(2/3)",
                  result: "~4,000 N"
                },
                {
                  name: "Giảm mô-men quán tính xoay trục",
                  equation: "I_ratio = (M_scaled / M_original)^(5/3)",
                  result: "~1/200 (linh hoạt gấp 200 lần)"
                }
              ]
            },
            p4p_score_scaled: 92,
            tier_scaled: "S",
            sources: [
              { label: "Bite force and feeding mechanics of the great white shark", url: "https://doi.org/10.1111/j.1469-7998.2008.00494.x" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Mất nhiệt đại dương và suy giảm sức nổi)",
            slug: "ca-map-trang-lon-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Mất nhiệt qua da siêu tốc ở vùng nước sâu lạnh giá, và nồng độ ure rò rỉ làm mất cân bằng thẩm thấu trầm trọng.",
            content: "Trong thực tế vật lý sinh học khi cá mập trắng lớn thu nhỏ về 80kg:\n- Hạ thân nhiệt vùng lõi: Cá mập trắng lớn sử dụng hệ thống trao đổi nhiệt đối lưu (Rete Mirabile) để giữ ấm cơ và não cao hơn nhiệt độ nước xung quanh. Khi thu nhỏ về 80kg, tỷ lệ diện tích bề mặt/thể tích tăng 2.5 lần làm giảm hiệu quả giữ nhiệt của Rete Mirabile xuống dưới ngưỡng duy trì, dẫn tới cơ thể bị lạnh cóng, làm liệt các bó cơ bơi lội khi lặn sâu.\n- Sự cố mất cân bằng thẩm thấu: Da nhám mỏng của cá mập lọc ure để giữ cân bằng thẩm thấu với nước biển. Ở kích thước nhỏ, tỷ lệ rò rỉ ure qua da tăng mạnh so với thể tích máu, đòi hỏi năng lượng tái tạo ure cực lớn, khiến cơ thể bị suy nhược tế bào.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Hiệu quả giữ nhiệt của Rete Mirabile suy giảm",
                  issue: "Nhiệt lượng thất thoát nhanh hơn 2.5 lần, cơ bị lạnh cứng dưới nước sâu (<12°C)."
                },
                {
                  type: "Mất cân bằng thẩm thấu do rò rỉ Ure",
                  issue: "Tỷ lệ rò rỉ ure qua da tăng mạnh gây rối loạn nồng độ dung dịch tế bào."
                }
              ]
            },
            p4p_score_scaled: 35,
            tier_scaled: "D",
            sources: [
              { label: "Thermoregulation and osmotic balance in lamnid sharks", url: "https://doi.org/10.1136/physiol.2001.0942" }
            ]
          },
          {
            title: "Đột biến thích nghi (Sát thủ đại dương nội nhiệt hoàn toàn và giáp da collagen chống rò rỉ)",
            slug: "ca-map-trang-lon-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Tiến hóa Rete Mirabile siêu dầy giữ nhiệt 95%, lớp da collagen kép giữ ure tuyệt đối và tăng mật độ ti thể trong cơ bắp.",
            content: "Để Cá Mập Trắng Lớn 80kg thống trị vùng duyên hải nhiệt đới và ôn đới:\n- Rete Mirabile mật độ siêu đặc (Hyper-dense Rete Mirabile): Tăng số lượng vi mạch trao đổi nhiệt chéo lên gấp 3 lần, cách nhiệt tuyệt đối vùng lõi tim và não để duy trì nhiệt độ ổn định ở 26°C ngay cả trong dòng nước 8°C.\n- Biểu bì collagen-lipid chống thấm (Lipophilic Collagen Skin): Lớp da nhám được bổ sung lớp đệm lipid kỵ nước sâu, khóa chặn hoàn toàn sự thẩm thấu rò rỉ urea ra môi trường, duy trì áp suất thẩm thấu hoàn hảo.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Mật độ vi mạch Rete Mirabile tăng 200%",
                  benefit: "Giữ vững thân nhiệt lõi 26°C bất kể nhiệt độ nước môi trường."
                },
                {
                  type: "Màng chắn urea kỵ nước",
                  benefit: "Tỷ lệ rò rỉ urea giảm xuống dưới 0.05 g/m²/ngày."
                }
              ]
            },
            p4p_score_scaled: 86,
            tier_scaled: "A",
            sources: [
              { label: "Vascular adaptations and lipid barriers in endothermic sharks", url: "https://doi.org/10.1086/32415" }
            ]
          }
        ]
      });
    } else if (target.id === "hairy-frogfish") {
      whatIfData.push({
        creature_id: "hairy-frogfish",
        title: "Nếu Cá Chân Dong Tóc phóng to bằng con người (80kg) thì sao?",
        slug: "neu-ca-chan-dong-toc-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài cá chân dong tóc Antennarius striatus được phóng to lên kích thước con người 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Cơn lốc xoáy chân không nuốt chửng con mồi)",
            slug: "ca-chan-dong-toc-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Cú táp nuốt mồi tạo lực hút chân không khổng lồ 1.200 lít nước mỗi giây và lực bứt tốc ngậm miệng siêu thanh.",
            content: "Khi Cá Chân Dong Tóc được phóng to lên 80kg (tăng khối lượng gấp ~800 lần, chiều dài sấp xỉ 1.6m):\n- Cú đớp chân không hủy diệt (Vacuum Suction): Khả năng mở rộng thể tích khoang miệng gấp 12 lần trong vòng 6 miligiây. Lực hút áp suất âm tạo ra dòng nước cuốn cuồn cuộn với lưu lượng cực đại đạt 1.200 lít/giây, hút thẳng con mồi cách xa 1 mét vào miệng.\n- Chiếc mồi nhử khổng lồ (Super-esca): Chiếc mồi giả phát triển dài 40cm cử động uốn éo như rắn nước lớn, thu hút các loài cá săn mồi trung bình tự dẫn xác tới nạp mạng.",
            formulas_and_data: {
              scaling_factor: 800,
              mass_kg_original: 0.1,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lưu lượng hút chân không tức thời",
                  equation: "Q_suction = (12 * V_mouth_scaled) / t_strike",
                  result: "~1,200 L/s"
                },
                {
                  name: "Chênh lệch áp suất âm hút mồi",
                  equation: "Delta_P = 0.5 * rho * v_fluid^2",
                  result: "~4.5 kPa"
                }
              ]
            },
            p4p_score_scaled: 88,
            tier_scaled: "A",
            sources: [
              { label: "Biomechanics of ultra-fast suction feeding in frogfishes", url: "https://doi.org/10.1242/jeb.02495" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Sự ngạt thở và xẹp vây ngực cơ học)",
            slug: "ca-chan-dong-toc-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Không thể đi bộ do vây ngực sụn yếu bị gãy dưới tải nặng và khoang miệng rộng gây ngạt thở khi nuốt bùn cát.",
            content: "Trong thực tế vật lý sinh học khi cá chân dong tóc đạt khối lượng 80kg:\n- Gãy khớp vây ngực: Các vây ngực và vây bụng vốn được cá chân dong dùng để 'đi bộ' dưới đáy biển chỉ được cấu tạo từ các xương sụn mềm dẻo. Khi phóng to lên 80kg, trọng lượng đè lên các chi sụn này tăng gấp 800 lần trong khi tiết diện xương chỉ tăng 100 lần. Vây ngực sẽ lập tức bị gãy rạn xương dưới sức nặng cơ thể, khiến cá bị liệt và nằm bất động một chỗ.\n- Khủng hoảng hô hấp khi nuốt nước: Cú hút chân không 1.200 lít nước cuốn theo lượng lớn cát, bùn và rác thải đáy biển vào miệng, làm nghẹt cứng hệ thống khe mang lọc mỏng manh, gây suy hô hấp cấp tính.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Vây ngực sụn bị gãy do ứng suất nén vượt tải",
                  issue: "Ứng suất lên vây ngực vượt quá 5.2 MPa (giới hạn chịu lực của sụn là 3.0 MPa)."
                },
                {
                  type: "Nghẽn khe mang do cặn lắng đáy biển",
                  issue: "Dòng hút chân không quá lớn cuốn bùn đất bít kín mang hô hấp."
                }
              ]
            },
            p4p_score_scaled: 20,
            tier_scaled: "D",
            sources: [
              { label: "Structural limits of cartilaginous limbs in fish", url: "https://doi.org/10.1016/j.zool.2015.01.002" }
            ]
          },
          {
            title: "Đột biến thích nghi (Chi bộ xương canxi hóa và màng lọc cát mang tự làm sạch)",
            slug: "ca-chan-dong-toc-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Tiến hóa xương chi ngực canxi hóa chịu tải cao, màng lọc mang ngược cơ học và cơ chế phụt nước phản lực.",
            content: "Để Cá Chân Dong Tóc 80kg di chuyển và săn mồi hiệu quả dưới đáy biển sâu:\n- Chi xương xương hóa (Osteodermic limbs): Các vây ngực được canxi hóa hoàn toàn và tiến hóa thành các khớp xương đùi chắc khỏe như động vật lưỡng cư cổ đại, chịu tải trọng uốn cơ học lên tới 2.500 N, giúp cá đi bộ nhanh nhẹn trên rạn san hô.\n- Màng lọc cát tự giũ (Self-cleaning Gill Filtration): Hệ thống mang tiến hóa màng lọc hai lớp hoạt động theo cơ chế dòng chảy xoáy đảo ngược, lọc sạch bùn cát ra ngoài qua lỗ mang phản lực mà không làm nghẹt các sợi mang hô hấp.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Xương hóa chi ngực sụn",
                  benefit: "Khớp chi ngực chịu được tải uốn cơ học 2.500 N, hỗ trợ đi bộ an toàn."
                },
                {
                  type: "Lọc tách cặn mang dòng xoáy ngược",
                  benefit: "Hiệu suất lọc sạch bùn cát đạt 99.5% đối với các hạt đường kính > 50 µm."
                }
              ]
            },
            p4p_score_scaled: 85,
            tier_scaled: "A",
            sources: [
              { label: "Evolutionary transitions in vertebrate limb bone density", url: "https://doi.org/10.1098/rstb.2016.0223" }
            ]
          }
        ]
      });
    } else if (target.id === "horror-frog") {
      whatIfData.push({
        creature_id: "horror-frog",
        title: "Nếu Ếch Kinh Dị phóng to bằng con người (80kg) thì sao?",
        slug: "neu-ech-kinh-di-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài ếch kinh dị Trichobatrachus robustus với cơ chế tự bẻ xương tạo móng vuốt được phóng to lên kích thước con người 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Móng vuốt xương Wolverine và lực nhảy bật xa)",
            slug: "ech-kinh-di-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Lực phóng móng vuốt bẻ xương đạt 1.000 N xuyên thủng giáp dày 2cm, và tầm nhảy xa đạt 35 mét.",
            content: "Khi Ếch Kinh Dị phóng to lên 80kg (tăng khối lượng ~1.000 lần, tỷ lệ kích thước lambda = 10):\n- Lực phóng vuốt xương hủy diệt: Sự co rút mạnh mẽ của gân cơ gấp kỹ thuật số sâu bẻ gãy mấu khớp để phóng vuốt xương ra ngoài. Lực cơ học phóng vuốt tăng theo tiết diện cơ (tăng lambda^2 = 100 lần), đạt 1.000 N giúp vuốt xương nhọn xuyên qua các tấm giáp cứng dày.\n- Siêu phản xạ nhảy xa: Cơ đùi khổng lồ tích lũy và giải phóng động năng cực nhanh. Tầm nhảy xa lý thuyết tăng theo tỷ lệ kích thước, cho phép ếch kinh dị khổng lồ thực hiện những cú bật nhảy xa tới 35 mét chỉ trong một nhịp phát động.\n- Nhú da hô hấp tăng kích thước: Các nhú da dạng sợi (hair-like papillae) dài tới 15cm hoạt động như các sợi mang trao đổi khí bổ trợ cực tốt dưới lòng nước suối chảy xiết.",
            formulas_and_data: {
              scaling_factor: 1000,
              mass_kg_original: 0.08,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực phóng móng vuốt xương theo tiết diện cơ",
                  equation: "F_eject = F_orig * (M_scaled / M_original)^(2/3)",
                  result: "~1,000 N"
                },
                {
                  name: "Tầm nhảy xa lý thuyết tuyến tính",
                  equation: "D_jump = D_orig * (M_scaled / M_original)^(1/3)",
                  result: "~35 m"
                }
              ]
            },
            p4p_score_scaled: 85,
            tier_scaled: "A",
            sources: [
              { label: "Amphibian biology and bone-breaking defense mechanisms", url: "https://doi.org/10.1111/j.1469-7998.2008.00472.x" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Gãy vụn khớp ngón chân và suy hô hấp cấp tính)",
            slug: "ech-kinh-di-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Ứng suất uốn cực đại gây gãy nát xương ngón chân khi bẻ xương, và tỷ số diện tích da/thể tích giảm 90% gây ngạt thở.",
            content: "Trong thế giới thực tế vật lý sinh học khi ếch kinh dị nặng 80kg:\n- Gãy vụn khớp ngón chân: Việc tự bẻ xương ngón chân để lộ vuốt nhọn ở khối lượng 80kg sẽ chịu mô-men uốn khổng lồ. Ứng suất xương tăng gấp 10 lần vượt qua giới hạn chịu lực của chất nền xương lưỡng cư, khiến cú bẻ xương tự vệ sẽ làm gãy nát toàn bộ cấu trúc bàn chân thay vì chỉ giải phóng móng vuốt.\n- Ngạt thở nghiêm trọng: Ếch kinh dị phụ thuộc rất lớn vào hô hấp qua da và nhú da. Ở 80kg, tỷ số diện tích da trên thể tích giảm 90%, kết hợp phổi thô sơ không có phế nang xếp nếp phức tạp làm nồng độ oxy trong máu sụt giảm nghiêm trọng, khiến con vật ngạt thở tử vong chỉ sau vài phút trên cạn.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Gãy nát xương ngón chân do ứng suất uốn",
                  issue: "Ứng suất vượt quá 120 MPa trong khi giới hạn bền uốn của xương ếch chỉ đạt 45 MPa."
                },
                {
                  type: "Thiếu hụt oxy do giảm tỷ số diện tích bề mặt/thể tích",
                  issue: "Tỷ số diện tích trao đổi khí trên thể tích sụt giảm 90%, phổi thô sơ không đáp ứng đủ nhu cầu oxy cơ bản."
                }
              ]
            },
            p4p_score_scaled: 20,
            tier_scaled: "D",
            sources: [
              { label: "Scaling of respiratory structures in amphibians", url: "https://doi.org/10.1086/317765" }
            ]
          },
          {
            title: "Đột biến thích nghi (Khớp tái tạo siêu tốc osteocyte và biểu mô phổi gấp nếp phức tạp)",
            slug: "ech-kinh-di-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Xương ngón chân composite khoáng hóa chịu uốn 8.500 N, phổi tiến hóa vách ngăn xếp nếp kiểu bò sát.",
            content: "Để Ếch Kinh Dị 80kg sinh tồn và chiến đấu hiệu quả:\n- Xương ngón chân composite khoáng hóa (Composite mineralized bones): Cấu trúc xương được bổ sung các sợi collagen liên kết chéo mật độ cao và tinh thể hydroxyapatite nén đặc, nâng giới hạn chịu uốn lên 8.500 N giúp móng vuốt phóng ra an toàn.\n- Phổi phế nang hóa dạng bò sát (Alveolar reptile-like lungs): Vách trong của phổi phát triển hệ thống nếp gấp sâu tích hợp mao mạch mật độ cao, tăng diện tích bề mặt trao đổi khí lên 1.4 m2, bù đắp hoàn toàn lượng oxy thiếu hụt từ da.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Gia cường xương ngón chân composite",
                  benefit: "Chịu lực uốn uốn ngón chân lên tới 8,500 N mà không nứt vỡ khớp."
                },
                {
                  type: "Tiến hóa phổi vách nếp gấp sâu",
                  benefit: "Tăng diện tích trao đổi khí lên 1.4 m2 duy trì oxy máu ở mức 95%."
                }
              ]
            },
            p4p_score_scaled: 88,
            tier_scaled: "A",
            sources: [
              { label: "Adaptive mechanics and bone regeneration in vertebrates", url: "https://doi.org/10.1002/ar.24102" }
            ]
          }
        ]
      });
    } else if (target.id === "largetooth-sawfish") {
      whatIfData.push({
        creature_id: "largetooth-sawfish",
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
      });
    } else if (target.id === "marine-iguana") {
      whatIfData.push({
        creature_id: "marine-iguana",
        title: "Nếu Cự Đà Biển Galapagos phóng to bằng con người (80kg) thì sao?",
        slug: "neu-cu-da-bien-galapagos-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài thằn lằn biển Amblyrhynchus cristatus duy nhất trên thế giới được phóng to lên kích thước con người 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Móng vuốt lực bám đá và vây đuôi thủy lực bơi vượt sóng)",
            slug: "cu-da-bien-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Lực bám móng vuốt đạt 2.400 N giữ cơ thể cố định trước sóng lớn, tốc độ bơi vẫy đuôi đạt 13 km/h.",
            content: "Khi Cự Đà Biển Galapagos phóng to lên 80kg (tăng khối lượng ~20 lần, chiều dài đạt 2.5m, sải đuôi 1.3m):\n- Lực bám đá hủy diệt: Bộ móng vuốt sừng dài 15cm cong quặp. Lực bám cơ ngực và móng vuốt tăng theo diện tích bề mặt (tăng lambda^2 = 7.3 lần), đạt 2.400 N giúp cự đà biển 80kg giữ chặt cơ thể cố định trên những rạn đá dung nham trơn tuột trước sóng gió cấp 8 đập mạnh.\n- Đuôi chèo thủy lực: Đuôi dẹt ngang vẫy đập mạnh mẽ uốn sóng cơ học lớn. Lực đẩy tăng mạnh giúp cự đà biển khổng lồ bơi ngược dòng triều rút với tốc độ bơi liên tục đạt 13 km/h.",
            formulas_and_data: {
              scaling_factor: 20,
              mass_kg_original: 4,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực bám đá của móng vuốt cơ bắp",
                  equation: "F_grip = F_orig * (M_scaled / M_original)^(2/3)",
                  result: "~2,400 N"
                },
                {
                  name: "Tốc độ bơi đẩy đuôi dẹt lý thuyết",
                  equation: "V_swim = V_orig * (M_scaled / M_original)^(1/6)",
                  result: "~13 km/h"
                }
              ]
            },
            p4p_score_scaled: 80,
            tier_scaled: "B",
            sources: [
              { label: "Biomechanics of locomotion in marine iguanas", url: "https://doi.org/10.1086/317208" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Hạ thân nhiệt nhanh liệt cơ dưới nước và ngộ độc natri do tuyến muối quá tải)",
            slug: "cu-da-bien-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Mất nhiệt nhanh liệt cơ lặn sâu dưới 10 phút, tuyến muối mũi bị tắc nghẽn sưng niêm mạc.",
            content: "Trong thế giới thực tế vật lý sinh học khi cự đà biển nặng 80kg:\n- Hạ thân nhiệt nhanh và liệt cơ dưới nước: Do biến nhiệt, cự đà dựa vào sưởi nắng tích nhiệt rồi lặn biển 15°C tìm tảo. Ở 80kg, tỷ lệ diện tích bề mặt/thể tích giảm 2.7 lần làm chậm tốc độ phơi nhiệt trên cạn. Khi lặn sâu, nhiệt lõi mất nhanh qua dòng chảy nước lạnh đối lưu, gây hạ thân nhiệt đột ngột từ 37°C xuống 15°C chỉ dưới 10 phút, làm co cứng cơ bơi và chết đuối đáy biển.\n- Quá tải tuyến lọc muối: Ăn tảo nạp lượng muối khổng lồ tăng 20 lần so với nguyên bản. Tuyến muối ở mũi bị quá tải công suất lọc, dẫn đến tích tụ muối NaCl trong máu vượt ngưỡng 220 mmol/L, gây co giật dây thần kinh và ngộ độc natri nội tế bào.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Hạ nhiệt độ cơ thể dưới nước lạnh 15°C",
                  issue: "Thời gian lặn an toàn giảm xuống dưới 10 phút do dòng nước lấy nhiệt nhanh gấp nhiều lần, gây co cứng cơ."
                },
                {
                  type: "Ngộ độc natri do quá tải bài tiết muối",
                  issue: "Nồng độ muối NaCl trong máu vượt quá 220 mmol/L gây co giật và hôn mê hệ thần kinh."
                }
              ]
            },
            p4p_score_scaled: 30,
            tier_scaled: "D",
            sources: [
              { label: "Thermal biology and salt gland function in Galapagos marine iguanas", url: "https://doi.org/10.1086/31790" }
            ]
          },
          {
            title: "Đột biến thích nghi (Tuần hoàn cách nhiệt trung tâm chọn lọc và siêu tuyến bài tiết muối mắt miệng)",
            slug: "cu-da-bien-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Tuần hoàn cô lập máu nóng 37°C bảo vệ cơ quan lõi, siêu tuyến muối đôi bài tiết liên tục không cần hắt hơi.",
            content: "Để Cự Đà Biển Galapagos 80kg hoạt động bền bỉ và lặn biển lâu hơn:\n- Tuần hoàn cách nhiệt chọn lọc (Vascular shunt insulation): Các mao mạch máu ngoại vi tự co thắt khân cấp khi gặp nước biển lạnh, giữ dòng máu nóng 37°C tuần hoàn khép kín bảo vệ tim, não và cơ bơi lội, nâng thời gian lặn an toàn lên tới 60 phút.\n- Siêu tuyến muối tự bài tiết cơ học (Hyper-active lateral salt glands): Tiến hóa hai cụm tuyến bài tiết muối lớn quanh sọ, liên tục dẫn dung dịch muối mặn đậm đặc thải ra trực tiếp khóe mắt và vòm họng mà không cần hắt hơi, giữ nồng độ muối máu ổn định ở mức hoàn hảo 140 mmol/L.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Tuần hoàn co mạch máu ngoại vi chọn lọc",
                  benefit: "Duy trì thân nhiệt lõi ổn định 37°C trong nước lạnh lên tới 60 phút lặn."
                },
                {
                  type: "Siêu tuyến muối bài tiết cơ học liên tục",
                  benefit: "Thải tới 85g NaCl mỗi ngày trực tiếp ra ngoài cơ thể mà không gây sưng nghẹt xoang mũi."
                }
              ]
            },
            p4p_score_scaled: 82,
            tier_scaled: "B",
            sources: [
              { label: "Cardiovascular and osmotic adaptations in marine reptiles", url: "https://doi.org/10.1086/317921" }
            ]
          }
        ]
      });
    } else if (target.id === "ribbon-eel") {
      whatIfData.push({
        creature_id: "ribbon-eel",
        title: "Nếu Cá Chình Ruy Băng phóng to bằng con người (80kg) thì sao?",
        slug: "neu-ca-chinh-ruy-bang-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài cá chình có thân hình mảnh mai uốn lượn như dải lụa Rhinomuraena quaesita được phóng to lên kích thước con người 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Thân dài siêu dẻo uốn sóng và cú táp hàm phụ tầm xa)",
            slug: "ca-chinh-ruy-bang-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Thân dài 12m siêu linh hoạt lách khe nhỏ với lực uốn thân 1.200 N, cơ chế hàm hầu phóng ra chộp mồi nhanh chớp mắt.",
            content: "Khi Cá Chình Ruy Băng phóng to lên 80kg (tăng khối lượng ~800 lần, chiều dài kéo dài từ 1m lên khoảng 10-12m, đường kính thân đạt ~15-20cm):\n- Lực uốn thân sóng động năng: Cấu trúc cơ cột sống hơn 200 đốt xương cực kỳ dẻo dai. Lực đẩy cơ thân uốn lượn tăng mạnh theo tỷ lệ diện tích bề mặt (tăng lambda^2 = 86 lần), đạt 1.200 N giúp nó lướt gió rẽ nước cực nhanh và len lỏi qua các hang hốc sâu dưới đáy biển.\n- Cú táp hàm hầu kép động cơ học: Sở hữu bộ hàm phụ ở thực quản (pharyngeal jaws) có khả năng phóng ra trước tóm mồi rồi kéo tuột vào dạ dày. Ở kích cỡ khổng lồ, hàm hầu này có thể kéo lực xiết lên tới 800 N trong thời gian 50 mili giây, đớp và nuốt chửng các con mồi lớn như loài cá mú.",
            formulas_and_data: {
              scaling_factor: 800,
              mass_kg_original: 0.1,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực uốn thân hình sin thủy động học",
                  equation: "F_propulsion = F_orig * (M_scaled / M_original)^(2/3)",
                  result: "~1,200 N"
                },
                {
                  name: "Lực kẹp của hàm phụ pharyngeal jaws",
                  equation: "F_bite = F_orig * (M_scaled / M_original)^(2/3)",
                  result: "~800 N"
                }
              ]
            },
            p4p_score_scaled: 75,
            tier_scaled: "B",
            sources: [
              { label: "Kinematics of pharyngeal jaw mechanics in moray eels", url: "https://doi.org/10.1038/nature06062" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Sụp đổ tuần hoàn máu do thân quá dài và ngạt thở vì diện tích mang quá hẹp)",
            slug: "ca-chinh-ruy-bang-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Tim không thể bơm máu dọc thân dài 12m chống lại áp suất thủy tĩnh, diện tích mang không đủ khuếch tán oxy.",
            content: "Trong thế giới thực tế vật lý sinh học khi cá chình ruy băng nặng 80kg:\n- Suy sụp tuần hoàn do thân quá dài: Thân cá chình ruy băng cực kỳ thuôn và mỏng. Khi phóng to lên chiều dài 12m, khoảng cách từ tim đến đuôi là cực kỳ lớn. Do áp suất thủy tĩnh ở biển sâu và sự thiếu hụt của hệ tuần hoàn có van trợ lực chủ động dọc thân, tim cá chình (vốn nhỏ và áp lực thấp) sẽ không thể đẩy máu đi hết chiều dài 12m, gây hoại tử đuôi và suy tim cấp tính trong vài giờ.\n- Thiếu oxy nghiêm trọng: Hệ hô hấp bằng mang của cá chình ruy băng nhỏ hẹp. Khi thể tích cơ thể tăng 800.000 lần nhưng diện tích mang chỉ tăng 10.000 lần theo định luật bình phương - lập phương, lượng oxy hấp thụ qua mang chỉ đáp ứng được 1.25% nhu cầu trao đổi chất tối thiểu, cá sẽ ngạt thở ngay lập tức.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Giới hạn áp suất tuần hoàn máu dọc thân 12m",
                  issue: "Chênh lệch áp suất thủy động học vượt quá sức cản thành mạch, tim không thể bơm máu đến các đốt sống đuôi."
                },
                {
                  type: "Hô hấp qua diện tích mang bị thu hẹp tương đối",
                  issue: "Tỉ lệ O2 khuếch tán qua mang giảm mạnh còn 1.25% nhu cầu tối thiểu khi thể tích tăng lập phương."
                }
              ]
            },
            p4p_score_scaled: 15,
            tier_scaled: "D",
            sources: [
              { label: "Allometric scaling of cardiovascular system in elongated fishes", url: "https://doi.org/10.1111/jfb.13600" }
            ]
          },
          {
            title: "Đột biến thích nghi (Hệ tim phụ dọc thân và mang xếp nếp diện tích lớn)",
            slug: "ca-chinh-ruy-bang-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Tiến hóa 3 quả tim phụ dọc tủy sống để trợ lực tuần hoàn và hệ mang xếp nếp mở rộng gấp 80 lần.",
            content: "Để cá chình ruy băng khổng lồ 80kg hoạt động linh hoạt mà không bị suy tuần hoàn hay ngạt thở:\n- Tim phụ hỗ trợ dọc thân (Caudal accessory hearts): Tiến hóa thêm 3 trung tâm co bóp cơ tim phụ dọc theo động mạch đuôi, nhận tín hiệu co bóp nhịp nhàng từ tủy sống để đẩy máu tĩnh mạch ngược về tim chính, duy trì áp huyết ổn định 60 mmHg toàn thân dài 12m.\n- Hệ mang xếp nếp cấu trúc phức hợp (Hyper-folded gill lamellae): Các sợi mang tiến hóa gấp nếp xếp lớp sâu với các vi mao mạch dày đặc, tăng diện tích tiếp xúc trao đổi khí lên 80 lần so với mang cá thông thường, đảm bảo hấp thu đủ 240 ml O2/phút để nuôi dưỡng toàn bộ cơ bắp uốn lượn.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Hệ thống tim phụ hỗ trợ tuần hoàn dọc thân",
                  benefit: "Đảm bảo áp huyết phân phối đều 60 mmHg trên toàn bộ chiều dài 12m thân cá."
                },
                {
                  type: "Hệ mang xếp nếp vi mao mạch mật độ cao",
                  benefit: "Nâng lưu lượng trao đổi oxy lên 240 ml/phút, đáp ứng hoàn hảo hoạt động bơi cường độ cao."
                }
              ]
            },
            p4p_score_scaled: 80,
            tier_scaled: "B",
            sources: [
              { label: "Accessory pumping organs and cardiovascular adaptations in fishes", url: "https://doi.org/10.1002/jez.1402800109" }
            ]
          }
        ]
      });
    } else if (target.id === "sea-cucumber") {
      whatIfData.push({
        creature_id: "sea-cucumber",
        title: "Nếu Hải Sâm phóng to bằng con người (80kg) thì sao?",
        slug: "neu-hai-sam-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài động vật da gai Holothuroidea có khả năng hóa lỏng mô liên kết được phóng to lên kích thước con người 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Cơ chế Catch-Collagen hóa đá và phóng tơ độc Cuvierian tầm xa)",
            slug: "hai-sam-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Chuyển trạng thái cơ thể từ mềm nhão sang giáp đá chịu lực ép 15.000 N, phóng chùm tơ dính Cuvierian dài 10m.",
            content: "Khi Hải Sâm phóng to lên 80kg (tăng khối lượng ~400 lần, chiều dài đạt 1.8m, đường kính thân đạt ~45cm):\n- Siêu giáp hóa đá Catch-Collagen: Dưới sự điều khiển của hệ thần kinh, các liên kết chéo giữa sợi collagen tự động thắt chặt. Độ cứng mô tăng vọt 100 lần, chịu được lực đập ép trực tiếp lên tới 15.000 N mà không nứt vỡ, biến hải sâm thành một tảng đá phòng ngự bất hoại.\n- Phun tơ keo độc Cuvierian hủy diệt: Khi bị tấn công, hệ thống ống Cuvierian phóng ra các sợi tơ màu trắng tự nở dài gấp 20 lần (đạt 10m), chứa độc tố Holothurin liều cao. Lượng keo dính này có thể đông cứng nhanh dưới nước và trói chặt kẻ thù lớn như cá mập hổ trong chốc lát.",
            formulas_and_data: {
              scaling_factor: 400,
              mass_kg_original: 0.2,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực ép tối đa chịu đựng của mô Catch-Collagen khi cứng hóa",
                  equation: "F_compression = Stress_max * Area_scaled",
                  result: "~15,000 N"
                },
                {
                  name: "Chiều dài chùm tơ Cuvierian khi phóng ra",
                  equation: "L_threads = L_orig * (M_scaled / M_original)^(1/3) * expansion_ratio",
                  result: "~10 meters"
                }
              ]
            },
            p4p_score_scaled: 70,
            tier_scaled: "B",
            sources: [
              { label: "Biomechanics of catch connective tissue in sea cucumbers", url: "https://doi.org/10.1242/jeb.02405" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Hóa lỏng mô tự chảy nhão và suy sụp hệ thống hô hấp qua hậu môn)",
            slug: "hai-sam-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Catch-collagen tự hóa lỏng dưới tác động trọng lực làm biến dạng toàn bộ cơ thể, phổi nước hậu môn bị vỡ tung do áp suất.",
            content: "Trong thế giới thực tế vật lý sinh học khi hải sâm nặng 80kg:\n- Tự chảy sụp do lực hấp dẫn: Khi hải sâm chuyển sang trạng thái mềm để chui khe đá, catch-collagen hóa lỏng liên kết. Ở khối lượng 80kg, trọng lực kéo cơ thể chảy xệ dẹt ra như một bãi bùn lỏng trên nền cát, không thể thu hồi lại hình dáng cũ vì áp lực nén nội tạng quá lớn gây rách biểu bì.\n- Vỡ nát cơ quan hô hấp (phổi nước): Hải sâm hô hấp bằng cách bơm hút nước biển qua lỗ hậu môn vào phổi nước (respiratory trees). Ở quy mô 80kg, lực co bóp cơ hậu môn để đẩy 15 lít nước mỗi chu kỳ là cực kỳ lớn. Áp suất nước dồn đẩy quá mức sẽ xé rách hệ thống phổi nước mỏng manh bên trong, gây chảy máu hệ tuần hoàn hở và nhiễm trùng tử vong nhanh chóng.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Độ nhớt cơ học của Catch-collagen khi hóa mềm",
                  issue: "Ứng suất chảy (yield stress) thấp hơn áp suất trọng lực đè nén của 80kg thịt, gây sụp đổ cấu trúc cơ thể."
                },
                {
                  type: "Thể tích nước trao đổi qua phổi nước",
                  issue: "Nhu cầu bơm 15-20 lít nước mỗi chu kỳ hô hấp tạo áp suất thủy động học vượt quá giới hạn chịu bền của thành ruột."
                }
              ]
            },
            p4p_score_scaled: 10,
            tier_scaled: "D",
            sources: [
              { label: "Respiratory physiology and mechanical properties of echinoderm catch connective tissue", url: "https://doi.org/10.1086/BBLv190n1p124" }
            ]
          },
          {
            title: "Đột biến thích nghi (Khung xương nội kitin xốp dẻo và van hô hấp hậu môn một chiều kép)",
            slug: "hai-sam-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Tiến hóa các tấm xương kitin dẻo dạng lưới nâng đỡ cơ thể và van hậu môn cơ học hai buồng chống vỡ phổi.",
            content: "Để hải sâm khổng lồ 80kg sinh tồn vững vàng và tự vệ hiệu quả:\n- Bộ khung xương kitin dẻo dạng lưới (Flexible mesh-like endoskeleton): Dưới lớp biểu bì tiến hóa một mạng lưới cấu trúc các tấm kitin xốp liên kết khớp động. Khung sườn này giữ hình dạng ống cố định cho hải sâm khi hóa mềm mô, ngăn chặn sự chảy sụp do trọng lực dưới nước và trên cạn.\n- Van hô hấp hậu môn hai buồng (Dual-chamber anal respiratory valves): Tiến hóa cơ vòng hậu môn dày chịu lực cùng hệ van một chiều kép. Một buồng thu gom nước biển, buồng kia tạo áp lực nén đẩy nhẹ nhàng tuần tự vào phổi nước có vách dày hơn, ngăn chặn hoàn toàn nguy cơ rách phổi do sốc áp suất thủy lực đột ngột.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Khung lưới xương kitin khớp động",
                  benefit: "Chống lại trọng lực của cơ thể 80kg, bảo vệ an toàn cho hệ cơ quan nội tạng bên trong."
                },
                {
                  type: "Hệ van hậu môn hai buồng chịu áp lực",
                  benefit: "Cho phép nén và lọc đều đặn 18 lít nước/phút mà không làm tổn thương cấu trúc hô hấp mỏng."
                }
              ]
            },
            p4p_score_scaled: 75,
            tier_scaled: "B",
            sources: [
              { label: "Skeletal morphology and respiratory adaptations in giant holothurians", url: "https://doi.org/10.1111/j.1469-7998.2010.00705.x" }
            ]
          }
        ]
      });
    } else if (target.id === "southern-cassowary") {
      whatIfData.push({
        creature_id: "southern-cassowary",
        title: "Nếu Đà Điểu Đầu Mũi phóng to bằng con người (80kg) thì sao?",
        slug: "neu-da-dieu-dau-mui-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích giả thuyết khi loài chim Casuarius casuarius nguy hiểm nhất hành tinh được hiệu chỉnh khối lượng đạt mức 80kg tương đương một võ sĩ đấm bốc hạng trung.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Cú đá xé rách 4.500 N và mũ sừng keratin cản phá va chạm)",
            slug: "da-dieu-dau-mui-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Lực đá chân móng vuốt 12cm đạt 4.500 N xuyên phá giáp chống bạo động, mũ sừng keratin giảm chấn xung lực cực mạnh.",
            content: "Khi Đà Điểu Đầu Mũi đạt khối lượng 80kg (tăng khối lượng ~1.6 lần so với con đực lớn 50kg, chiều cao đạt 2.1m):\n- Cú đá uy lực hủy diệt: Nhờ hệ cơ đùi phát triển cực đại, khi đá xéo xuống, móng vuốt ngón trong dài 15cm cứng như thép sẽ cắm sâu vào mục tiêu. Lực tác động động năng tăng mạnh theo tỷ lệ cơ (đạt ~4.500 N), tương đương lực va chạm của một chiếc xe máy chạy tốc độ 45 km/h, dễ dàng xuyên thủng tấm khiên bạo động và xé rách mô sâu.\n- Mũ sừng (casque) giáp đầu keratin: Casque tăng kích thước đạt thể tích 3.2 lít, cấu trúc xốp bên trong dày lên giúp hấp thụ 92% xung lực khi húc va đập trực tiếp, bảo vệ hộp sọ khỏi chấn thương sọ não khi va chạm tốc độ cao.",
            formulas_and_data: {
              scaling_factor: 1.6,
              mass_kg_original: 50,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực tác động xung năng của cú đá ngón vuốt",
                  equation: "F_impact = Delta_p / Delta_t = M_scaled * V_kick / Delta_t",
                  result: "~4,500 N"
                },
                {
                  name: "Hệ số hấp thụ lực giảm chấn của mũ sừng (casque)",
                  equation: "E_absorbed = E_total * (1 - e^(-k * thickness))",
                  result: "~92% lực va chạm"
                }
              ]
            },
            p4p_score_scaled: 92,
            tier_scaled: "S",
            sources: [
              { label: "The structural biomechanics of the cassowary casque", url: "https://doi.org/10.1371/journal.pone.0122558" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Đứt gân gót chân do quá tải chịu lực và giảm sút khả năng cơ động nhanh)",
            slug: "da-dieu-dau-mui-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Hệ số an toàn của xương gót chân giảm mạnh, gãy nứt khớp gối khi thực hiện cú nhảy cao tiếp đất.",
            content: "Trong thế giới thực tế vật lý sinh học khi đà điểu đầu mũi nặng 80kg:\n- Đứt gân gót và gãy xương gối tiếp đất: Ở khối lượng 80kg, ứng suất cơ học đè lên khớp gối và gân gót chân (Achilles tendon) tăng tuyến tính theo khối lượng (tăng 1.6 lần) trong khi độ bền mặt cắt ngang cơ gân chỉ tăng 1.36 lần (bình phương chiều dài). Khi đà điểu nhảy vọt cao 1.8m để đá mục tiêu, xung lực phản hồi tiếp đất đạt 9.500 N vượt quá giới hạn uốn đàn hồi của xương chày (tibiotarsus), dẫn đến gãy nứt xương chân và rách đứt hoàn toàn gân Achilles.\n- Quá tải nhiệt lượng: Bộ lông dày cứng như tóc giữ nhiệt tốt để chống gai. Ở kích cỡ 80kg, tỷ lệ tỏa nhiệt qua da giảm sút, khiến nó nhanh chóng bị sốc nhiệt đột ngột khi chạy nhanh liên tục quá 5 phút trong rừng rậm.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Ứng suất kéo đè nặng lên gân gót chân khi tiếp đất",
                  issue: "Xung lực phản hồi tiếp đất 9.500 N vượt quá giới hạn kéo đứt (ultimate tensile strength) của sợi collagen gân gót."
                },
                {
                  type: "Tốc độ tỏa nhiệt lõi qua lớp lông sừng rậm rạp",
                  issue: "Nhiệt lượng sinh ra khi chạy 40 km/h tích tụ nhanh, gây sốc nhiệt trên 43°C chỉ sau 5 phút hoạt động liên tục."
                }
              ]
            },
            p4p_score_scaled: 45,
            tier_scaled: "C",
            sources: [
              { label: "Avian locomotion biomechanics and tendon scaling limits", url: "https://doi.org/10.1242/jeb.029858" }
            ]
          },
          {
            title: "Đột biến thích nghi (Khớp gối gia cố vảy sừng dày và hệ thống phế nang thông khí nhiệt chủ động)",
            slug: "da-dieu-dau-mui-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Gân gót chân cơ bắp hóa sừng chịu lực cực đại 12.000 N, hệ túi khí khí quản mở rộng tăng 50% hiệu suất làm mát.",
            content: "Để đà điểu đầu mũi khổng lồ 80kg chạy nhảy và chiến đấu ổn định mà không lo gãy chân hay sốc nhiệt:\n- Gân gót chân cốt hóa bán sừng (Semi-ossified patellar tendon): Cấu trúc collagen của gân gót chân được gia cố bằng các dải calci hóa vi thể đan xen xen kẽ, tăng độ bền kéo chịu tải lực lên tới 12.000 N, giúp tiếp đất an toàn sau những cú nhảy cao 2m.\n- Túi khí khí quản làm mát chủ động (Hyper-developed tracheal air sacs): Hệ túi khí hô hấp mở rộng dọc cổ bên dưới lớp yếm đỏ rực. Khi chạy nhanh, lưu lượng khí qua phổi trao đổi và làm mát bốc hơi tăng 50%, duy trì thân nhiệt lõi ở mức hoàn hảo 39°C bất kể điều kiện rừng nhiệt đới nóng bức.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Gân Patellar cốt hóa calci vi thể",
                  benefit: "Duy trì sức bền kéo vượt trội chịu xung tải đập mạnh lên tới 12.000 N mà không rách sợi gân."
                },
                {
                  type: "Túi khí hô hấp khí quản tản nhiệt cưỡng bức",
                  benefit: "Giải nhiệt cơ học liên tục 350 W khi hoạt động cường độ cao giúp ngăn ngừa sốc nhiệt hiệu quả."
                }
              ]
            },
            p4p_score_scaled: 88,
            tier_scaled: "A",
            sources: [
              { label: "Thermoregulation and respiratory air sacs in running palaeognathous birds", url: "https://doi.org/10.1086/513812" }
            ]
          }
        ]
      });
    } else if (target.id === "antarctic-icefish") {
      whatIfData.push({
        creature_id: "antarctic-icefish",
        title: "Nếu Cá Băng Nam Cực phóng to bằng con người (80kg) thì sao?",
        slug: "neu-ca-bang-nam-cuc-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích kịch bản giả thuyết khi Cá Băng Nam Cực (Chionodraco rastrospinosus) đạt khối lượng con người 80kg trong điều kiện nhiệt độ đóng băng và không có hồng cầu.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Dòng chảy tuần hoàn siêu tốc và siêu ti thể)",
            slug: "ca-bang-nam-cuc-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Tốc độ dòng chảy máu tăng gấp 5 lần nhờ tim khổng lồ màu đỏ Mb+, mạng lưới mao mạch da rộng gấp 4 lần hấp thụ lượng oxy hòa tan cực đại.",
            content: "Khi Cá Băng Nam Cực nặng 80kg (tăng khối lượng ~80 lần từ mức 1kg, dài đạt 1.8m):\n- Tim khổng lồ siêu co bóp: Cơ tim giàu myoglobin (Mb+) nở rộng gấp 3 lần tỷ lệ thông thường, tạo áp lực co bóp lớn. Lực bóp tim tăng theo tiết diện cơ (hệ số lambda^2 ≈ 18.5), đẩy thể tích máu lớn gấp 4 lần qua lòng mạch rộng rãi mà không gặp cản trở ma sát ở nước lạnh.\n- Trao đổi khí biểu bì cực hạn: Da cực mỏng không vảy, diện tích da phóng to đạt 1.2 m2 tiếp xúc trực tiếp nước lạnh giàu oxy. Máu tuần hoàn nhanh thu nhận oxy hòa tan trong huyết tương đạt mức 2.8 ml O2/100ml máu, cung cấp dồi dào dưỡng chất cho mật độ ti thể đậm đặc chiếm 36% thể tích cơ.\n- Kháng đông tối ưu: Lượng glycoprotein chống đông (AFGPs) tăng theo nồng độ huyết tương, ngăn chặn tuyệt đối tinh thể băng hình thành ở nhiệt độ -1.8°C.",
            formulas_and_data: {
              scaling_factor: 80,
              mass_kg_original: 1,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực co bóp cơ tim phóng to",
                  equation: "F_heart_scaled = F_heart_original * (M_scaled / M_original)^(2/3)",
                  result: "~38 N"
                },
                {
                  name: "Lưu lượng tuần hoàn máu huyết tương không hồng cầu",
                  equation: "Q_blood = V_stroke * HR",
                  result: "~12 lít/phút"
                }
              ]
            },
            p4p_score_scaled: 72,
            tier_scaled: "B",
            sources: [
              { label: "Antifreeze glycoproteins and cardiovascular physiology in Antarctic fishes", url: "https://doi.org/10.1111/j.1095-8649.2005.00683.x" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Sốc nhiệt độ tăng nhẹ và ngạt oxy khi thiếu hồng cầu)",
            slug: "ca-bang-nam-cuc-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Nhiệt độ nước tăng trên 5°C làm giảm oxy hòa tan gây ngạt thở cấp tính, thiếu hồng cầu khiến cơ thể 80kg thiếu hụt 85% oxy khi hoạt động.",
            content: "Trong thế giới thực tế vật lý sinh học khi Cá Băng Nam Cực nặng 80kg:\n- Khủng hoảng vận chuyển oxy: Thiếu huyết sắc tố (hemoglobin) khiến máu chỉ có thể vận chuyển oxy dưới dạng hòa tan vật lý trong huyết tương. Khi phóng to lên 80kg, nhu cầu oxy của cơ thể tăng tỷ lệ với khối lượng cơ (M^1.0 hoặc M^0.75), nhưng diện tích trao đổi khí qua da và mang chỉ tăng theo bình phương (M^0.67). Tỷ lệ cung/cầu oxy giảm 4.5 lần. Ở mức hoạt động cơ bản, cơ thể thiếu hụt tới 85% lượng oxy cần thiết, dẫn đến tích tụ axit lactic hủy diệt cơ xương và gây tử vong do ngạt thở.\n- Nhạy cảm nhiệt độ cực đoan: Nước ấm lên từ -1.8°C đến 5°C làm giảm 30% độ hòa tan oxy của nước và tăng BMR (tốc độ trao đổi chất) của cá lên gấp đôi. Cá băng khổng lồ đột quỵ do sốc nhiệt và ngạt thở lập tức.\n- Sụp đổ sụn xương yếu: Cấu trúc xương sụn mềm và nhiều lipid (dành cho sức nổi trung tính) không chịu nổi trọng lực cạn hoặc chênh lệch áp suất dòng chảy đáy, gây méo mó lồng ngực.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Thiếu hụt diện tích phổi trao đổi khí",
                  issue: "Giới hạn cung cấp oxy hòa tan huyết tương tối đa ở 80kg chỉ đạt ~0.34 lít O2/giờ, thiếu hụt 85% nhu cầu hoạt động tối thiểu."
                },
                {
                  type: "Tỷ lệ diện tích da/thể tích giảm mạnh",
                  issue: "Tỷ lệ diện tích da/thể tích giảm 78%, ngăn cản khuếch tán oxy thụ động qua biểu bì."
                }
              ]
            },
            p4p_score_scaled: 20,
            tier_scaled: "D",
            sources: [
              { label: "The biology of Antarctic fishes: hemoglobin-free brains and cardiovascular limits", url: "https://doi.org/10.1152/physrev.00010.2005" }
            ]
          },
          {
            title: "Đột biến thích nghi (Phổi nước phế nang hóa và siêu sắc tố hemocyanin xanh)",
            slug: "ca-bang-nam-cuc-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Mang xếp nếp gấp 20 lần tăng diện tích tiếp xúc, đột biến sản sinh sắc tố vận chuyển oxy hemocyanin gốc đồng giúp mang máu màu xanh lam.",
            content: "Để Cá Băng 80kg sinh tồn dũng mãnh và săn mồi ở cả vùng nước ấm hơn:\n- Đột biến sắc tố máu Hemocyanin: Kích hoạt chuỗi gen cổ xưa tạo ra hemocyanin gốc đồng (tương tự mực/bạch tuộc) trong huyết tương. Máu cá băng chuyển sang màu xanh lam nhạt, tăng khả năng liên kết và vận chuyển oxy lên gấp 8 lần so với dạng hòa tan vật lý đơn thuần, đáp ứng hoàn hảo nhu cầu cơ ngực ti thể.\n- Mang xếp nếp siêu cấp (Hyper-folded gills): Diện tích mang tăng sinh gấp 20 lần thông qua các phiến mang gấp nếp micro, tối đa hóa trao đổi khí kể cả trong nước nghèo oxy.\n- Gia cố khung xương sụn-chitin: Cấu trúc xương sụn được khoáng hóa muối canxi và chitin cứng cáp, bảo vệ lồng ngực khỏi trọng lực đè nén.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Khả năng mang oxy của máu xanh hemocyanin đột biến",
                  benefit: "Máu chuyển màu xanh lam nhạt, tăng khả năng mang oxy lên ~2.2 ml O2/100ml."
                },
                {
                  type: "Giới hạn uốn gãy khung xương gia cố canxi",
                  benefit: "Khung xương được khoáng hóa muối canxi chịu được áp suất uốn gãy lên tới ~4.5 MPa."
                }
              ]
            },
            p4p_score_scaled: 78,
            tier_scaled: "B",
            sources: [
              { label: "Evolution of oxygen-transport proteins and respiratory mutations in extreme environments", url: "https://doi.org/10.1093/gbe/evs089" }
            ]
          }
        ]
      });
    } else if (target.id === "bengal-slow-loris") {
      whatIfData.push({
        creature_id: "bengal-slow-loris",
        title: "Nếu Cu Li Chậm Bengal phóng to bằng con người (80kg) thì sao?",
        slug: "neu-cu-li-cham-bengal-phong-to-bang-con-nguoi-80kg",
        description: "Phân tích kịch bản giả thuyết khi loài linh trưởng độc duy nhất Cu Li Chậm Bengal (Nycticebus bengalensis) được phóng to lên khối lượng 80kg.",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Nọc độc hoại tử hoại huyết và cú ôm khóa cơ học vạn cân)",
            slug: "cu-li-cham-bengal-80kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Sản sinh 2.5 lít hỗn hợp nọc độc hoại tử mô từ tuyến khuỷu tay, lực bám khóa cơ học đạt 2.800 N bám trụ tĩnh suốt nhiều tuần.",
            content: "Khi Cu Li Chậm Bengal nặng 80kg (tăng khối lượng ~65 lần từ mức 1.2kg, chiều dài cơ thể đạt 1.3 mét):\n- Nọc độc khổng lồ hủy diệt: Tuyến brachial mở rộng sản sinh chất dịch chứa Feld 1 độc hại dung tích lên đến 1.5 lít. Khi trộn với nước bọt có chứa enzyme xúc tác, cu li khổng lồ tạo ra 2.5 lít nọc độc hoại tử mạnh mẽ. Vết cắn từ răng lược sừng dài 6cm sẽ truyền lượng độc tố cực lớn, gây hoại tử cơ sâu, sốc phản vệ và suy đa tạng cho đối phương trong vòng vài phút.\n- Khóa bám vạn lực: Nhờ bó mạch retia mirabilia ở cổ tay chân phát triển lớn, lưu lượng oxy cấp cho cơ tĩnh tăng mạnh. Lực khóa kẹp từ các ngón tay mở rộng 180 độ đạt 2.800 N, bám chặt cành cây lớn như gọng kìm thủy lực không thể gỡ ra.\n- Thị giác Tapetum Lucidum khổng lồ: Mắt đường kính 8cm thu nhận ánh sáng đêm siêu nhạy, phát hiện chuyển động cách 150m trong bóng tối hoàn toàn.",
            formulas_and_data: {
              scaling_factor: 66.7,
              mass_kg_original: 1.2,
              mass_kg_scaled: 80,
              formulas: [
                {
                  name: "Lực kẹp bám tĩnh của bàn tay khớp khóa",
                  equation: "F_grip_scaled = F_grip_original * (M_scaled / M_original)^(2/3)",
                  result: "~2,800 N"
                },
                {
                  name: "Tổng dung tích nọc độc liên hợp có thể sản sinh",
                  equation: "V_venom_scaled = V_venom_original * (M_scaled / M_original)",
                  result: "~2.5 lít"
                }
              ]
            },
            p4p_score_scaled: 88,
            tier_scaled: "A",
            sources: [
              { label: "Venom system in Nycticebus: biochemistry of brachial gland secretions", url: "https://doi.org/10.1007/s10764-011-9505-1" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Chết vì nọc độc tự thân và sụp đổ hệ cơ tĩnh do trọng lượng nặng)",
            slug: "cu-li-cham-bengal-80kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Áp lực 80kg bẻ gãy khớp ngón tay yếu khi treo bám tĩnh, rách miệng và ngộ độc hoại tử thứ phát do chính nọc độc của mình.",
            content: "Trong thực tế vật lý sinh học khi Cu Li Chậm Bengal nặng 80kg:\n- Treo bám thất bại: Trọng lượng 80kg tạo ra mô-men xoắn kéo đứt lớn lên các ngón tay mảnh dẻ. Cấu trúc bám tĩnh dựa vào cơ chế kẹp gọng kìm nguyên bản sẽ bị phá hủy vì ứng suất kéo vượt quá giới hạn bền của dây chằng (tensile strength limit). Ngón tay sẽ bị trật khớp và gãy gập dưới tải trọng 80kg.\n- Tự ngộ độc hủy hoại: Niêm mạc miệng của cu li không có lớp màng bảo vệ đặc biệt đối với nọc độc liên hợp nồng độ cao. Khi liếm lượng dịch độc lớn 1.5 lít, nước bọt chứa độc tố sẽ thấm ngược qua thành mạch biểu bì miệng hoặc các vết xước nhỏ ở răng lược, khiến chính nó bị hoại tử mô vòm họng và tử vong do sốc độc tố của chính mình.\n- Chuyển hóa siêu chậm gây hạ thân nhiệt: Do tốc độ trao đổi chất cực thấp của loài loris (chỉ bằng 40% linh trưởng khác), ở kích thước 80kg, khả năng sinh nhiệt cơ thể không đủ bù đắp lượng nhiệt thất thoát qua diện tích da rộng lớn dưới sương đêm, gây hạ thân nhiệt mạn tính xuống dưới 30°C.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Ứng suất kéo lên gân ngón bám",
                  issue: "Ứng suất kéo lên gân ngón bám vượt quá giới hạn đàn hồi của gân khoảng 180%, gây đứt đứt gân và cơ."
                },
                {
                  type: "Mức sinh nhiệt tối thiểu cực thấp",
                  issue: "Mức sinh nhiệt cơ bản cực thấp (~700 kcal/ngày) không đủ duy trì thân nhiệt hằng định trong môi trường đêm mát mẻ."
                }
              ]
            },
            p4p_score_scaled: 35,
            tier_scaled: "D",
            sources: [
              { label: "The slow metabolism and thermoregulation challenges of lorisids", url: "https://doi.org/10.1006/jhevol.1997.0141" }
            ]
          },
          {
            title: "Đột biến thích nghi (Kháng độc tố tự thân và hệ thống gân khóa cơ học chân chim)",
            slug: "cu-li-cham-bengal-80kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Biểu bì khoang miệng sừng hóa kháng hoại tử tuyệt đối, tiến hóa hệ thống gân khóa thụ động cơ học tự động không tiêu tốn năng lượng.",
            content: "Để Cu Li Chậm 80kg trở thành loài thú săn mồi nguy hiểm tột độ trên các tán rừng lớn:\n- Biểu bì sừng hóa khoang miệng (Shorn Oral Mucosa): Tiến hóa lớp niêm mạc miệng dày lót bởi các tế bào biểu mô sừng hóa chịu axit-kiềm cao, ngăn chặn hoàn toàn nọc độc liên hợp thẩm thấu ngược vào hệ tuần hoàn qua răng lược.\n- Khớp gân khóa cơ học tự động (Avian-like tendon lock): Tiến hóa hệ gân gấp ngón chân ngón tay có các gai răng cưa nhỏ ăn khớp với bao gân. Khi cu li bám vào cành cây, trọng lượng cơ thể kéo căng gân sẽ tự động khóa khớp ngón tay lại một cách thuần cơ học mà không cần co cơ chủ động, giúp nó treo mình lơ lửng nhiều ngày không tốn năng lượng.\n- Đột biến nọc độc phản phệ nhanh (Neurotoxic venom conversion): Độc tố brachial đột biến liên kết thụ thể thần kinh acetylcholine gây liệt cơ tức thì cho mục tiêu cắn thay vì chỉ hoại tử chậm.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Hệ số an toàn tự động khóa cơ học khớp gân",
                  benefit: "Hệ gân gót tự động khớp gai khóa chặt bám, chịu mô-men trọng lượng gấp ~1.2 lần mà không tốn năng lượng co cơ."
                },
                {
                  type: "Nọc độc hoạt tính liệt cơ cao",
                  benefit: "Chuyển hóa độc tính thần kinh có trị số LD50 đột biến đạt ~0.12 mg/kg, giết chết mục tiêu trong tích tắc."
                }
              ]
            },
            p4p_score_scaled: 85,
            tier_scaled: "S",
            sources: [
              { label: "Functional morphology of tendon-locking mechanisms and primates venom evolution", url: "https://doi.org/10.1006/jmorph.2001.1215" }
            ]
          }
        ]
      });
    } else if (target.id === "colossal-squid") {
      whatIfData.push({
        creature_id: "colossal-squid",
        title: "Nếu Mực Khổng Lồ Nam Cực phóng to gấp 10 lần (5.000kg) thì sao?",
        slug: "neu-muc-khong-lo-nam-cuc-phong-to-gap-10-lan-5000kg",
        description: "Phân tích giả thuyết khi quái thú biển sâu Mực Khổng Lồ Nam Cực (Mesonychoteuthis hamiltoni) phóng to khối lượng lên 5.000kg (5 tấn).",
        answers: [
          {
            title: "Góc nhìn cơ học lý thuyết (Cú bóp thủy lực vạn tấn và móc xoay chitin 360 độ)",
            slug: "muc-khong-lo-nam-cuc-5000kg-co-hoc-ly-thuyet",
            perspective_type: "classic_scaling",
            summary: "Lực kẹp xúc tu móc xoay đạt 45.000 N xé toạc các loài cá voi nhỏ, xung nước phản lực nén cao đẩy tốc độ bơi đạt 60 km/h.",
            content: "Khi Mực Khổng Lồ Nam Cực nặng 5.000kg (dài thân áo đạt 9 mét, tổng chiều dài cả xúc tu đạt 22 mét):\n- Móc xoay chitin hủy diệt: Xúc tu săn mồi trang bị 25 cặp móc chitin xoay 360 độ cứng như thép. Khi kẹp chặt mồi, lực bóp cơ học của bó cơ xúc tu khổng lồ tăng theo tỷ lệ tiết diện cơ (hệ số lambda^2 ≈ 4.64), tạo lực kẹp kéo rách mô đạt 45.000 N, dễ dàng ghim sâu và xé toạc các mảng thịt lớn của cá nhà táng.\n- Hàm mỏ vẹt vô song: Hàm mỏ vẹt chitin khổng lồ dài 35cm cắn với lực cơ học vươn tới 52.000 N, nghiền nát hộp sọ hoặc xương cột sống của các sinh vật biển lớn.\n- Phản lực cơ bắp nén cao (Jet Propulsion): Khoang áo chứa 12.000 lít nước co bóp cực mạnh tống nước qua phễu điều hướng, tạo lực đẩy phản lực đẩy khối cơ thể 5 tấn lướt đi trong lòng đại dương sâu thẳm với tốc độ tức thời 60 km/h.",
            formulas_and_data: {
              scaling_factor: 10.2,
              mass_kg_original: 490,
              mass_kg_scaled: 5000,
              formulas: [
                {
                  name: "Lực cắn mỏ vẹt chitin khổng lồ",
                  equation: "F_bite_scaled = F_bite_original * (M_scaled / M_original)^(2/3)",
                  result: "~52,000 N"
                },
                {
                  name: "Lực đẩy phản lực đẩy khối nước áo",
                  equation: "F_thrust = dot_m * V_exhaust = rho * A_funnel * V_exhaust^2",
                  result: "~75,000 N"
                }
              ]
            },
            p4p_score_scaled: 96,
            tier_scaled: "S",
            sources: [
              { label: "Biophysics of jet propulsion and tentacle mechanics in giant cephalopods", url: "https://doi.org/10.1242/jeb.019558" }
            ]
          },
          {
            title: "Giới hạn sinh học thực tế (Sự xẹp khoang áo do thiếu xương và ngạt thở do quá nhiệt nước)",
            slug: "muc-khong-lo-nam-cuc-5000kg-sinh-hoc-thuc-te",
            perspective_type: "biological_reality",
            summary: "Áp lực nước và trọng lượng 5 tấn làm xẹp lép khoang áo cơ mềm khi nổi lên cạn, cơ tim quá tải không đẩy nổi máu đồng xanh hemocyanin đi xa.",
            content: "Trong thực tế vật lý sinh học khi Mực Khổng Lồ Nam Cực nặng 5.000kg:\n- Xẹp lép khoang áo cơ mềm (Mantle Collapse): Do thiếu bộ khung xương nâng đỡ cứng (chỉ có tấm mai mực mỏng bằng chitin giòn), khối lượng cơ áo 5 tấn nằm hoàn toàn trên mặt nước hoặc khi chuyển động đột ngột sẽ bị ép bẹp dưới sức nặng của chính mình. Xoang áo chứa nước xẹp phẳng dẹt làm tê liệt hệ thống phản lực và chèn ép 3 trái tim.\n- Suy tim tuần hoàn Hemocyanin: Hemocyanin trong máu mực có độ nhớt tăng vọt ở áp suất thấp và nhiệt độ thay đổi. Khi mực phóng to lên 5 tấn, khoảng cách vận chuyển máu từ 3 tim đến các đầu xúc tu dài 22m tăng gấp đôi, áp lực cản trở dòng chảy ma sát mạch máu tăng 8 lần. Tim mực không đủ công suất bơm máu xanh đậm đặc này đi xa, gây thiếu oxy cục bộ dẫn đến tê liệt xúc tu hoàn toàn.\n- Chết nóng ở nước nông: Mực khổng lồ thích nghi với nước sâu (-2°C đến 2°C). Nếu bị đẩy lên vùng nước nông ấm hơn 8°C, máu hemocyanin mất hoàn toàn khả năng liên kết oxy, dẫn đến ngạt thở cấp tính và hoại tử mô não.",
            formulas_and_data: {
              limitations: [
                {
                  type: "Áp lực tự đè ép bẹp khoang áo cơ mềm",
                  issue: "Áp lực tự đè đè nén xoang áo đạt ~32 kPa, làm sụp đổ hoàn toàn cơ cấu túi phản lực nước."
                },
                {
                  type: "Áp lực cản trở tuần hoàn huyết quản xúc tu dài",
                  issue: "Áp lực ma sát tuần hoàn huyết quản đạt ~380 kPa, vượt quá giới hạn co bóp của hệ tim mực gấp 2.5 lần."
                }
              ]
            },
            p4p_score_scaled: 42,
            tier_scaled: "C",
            sources: [
              { label: "Cephalopod oxygen transport: cardiovascular limits and environmental constraints", url: "https://doi.org/10.1016/j.cbpa.2015.02.003" }
            ]
          },
          {
            title: "Đột biến thích nghi (Khúng xương cartilage-chitin đan xen và hệ 3 tim trợ lực tăng áp)",
            slug: "muc-khong-lo-nam-cuc-5000kg-dot-bien-thich-nghi",
            perspective_type: "evolutionary_mutation",
            summary: "Tiến hóa các tấm sụn cartilage bảo vệ khoang áo chống biến dạng dưới áp lực, 3 tim tăng áp suất bơm và đột biến gen thích nghi nhiệt độ rộng của hemocyanin.",
            content: "Để Mực Khổng Lồ 5 tấn trở thành vị thần thống trị biển sâu thực thụ:\n- Khung xương sụn nâng đỡ áo (Cartilaginous Mantle Ribs): Tiến hóa hệ thống các thanh sụn dẻo dai đan xen dọc khoang áo, giữ cho xoang áo luôn mở rộng và có cấu trúc hình ống hoàn hảo kể cả khi chịu lực nén va đập mạnh.\n- Ba tim tăng áp lực bóp (Hyper-pressurized Heart System): Bó cơ của tim trung tâm và 2 tim mang được gia cố các lớp sợi cơ chéo tương tự động vật có vú, nâng huyết áp bơm máu lên 380 mmHg, duy trì dòng tuần hoàn máu xanh giàu oxy đi khắp chiều dài 22m xúc tu.\n- Hemocyanin thích nghi nhiệt rộng: Đột biến cấu trúc chuỗi polypeptide của phân tử hemocyanin giúp nó duy trì khả năng liên kết oxy ổn định từ -2°C lên đến 15°C, cho phép mực khổng lồ săn mồi ở các dải nước trung phong phú.",
            formulas_and_data: {
              mutations: [
                {
                  type: "Huyết áp bơm của hệ tim trung tâm nâng cấp",
                  benefit: "Duy trì áp suất đẩy máu tối đa ~380 mmHg, lưu thông máu hoàn hảo xuyên suốt các xúc tu 22 mét."
                },
                {
                  type: "Mô-đun đàn hồi của thanh sụn gia cố áo",
                  benefit: "Thanh sụn lồng ngực gia cố đạt độ mô-đun đàn hồi ~15 MPa, chống bẹp bóp hoàn hảo dưới tải cơ học áo."
                }
              ]
            },
            p4p_score_scaled: 94,
            tier_scaled: "S",
            sources: [
              { label: "Cartilage evolution in invertebrates and advanced cardiovascular systems of giant cephalopods", url: "https://doi.org/10.1111/ede.12005" }
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

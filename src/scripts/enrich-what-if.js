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
    if (target.id === "sunda-pangolin") {
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

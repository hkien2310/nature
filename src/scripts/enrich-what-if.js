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

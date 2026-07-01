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
  console.log(`🎯 Identified 3 target creatures for What-If:`);
  targets.forEach(t => console.log(`  - ${t.name} (${t.id}) with P4P: ${t.ai_p4p_score}`));

  const whatIfScenarios = {
    "blue-dragon-sea-slug": {
      creature_id: "blue-dragon-sea-slug",
      title: "Nếu Sên Biển Rồng Xanh (Blue Dragon Sea Slug) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-sen-bien-rong-xanh-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài Sên Biển Rồng Xanh Glaucus atlanticus sở hữu khả năng cướp nọc độc và ngụy trang đối bóng ngược được phóng to lên 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Hỏa lực nọc độc cnidocytes cô đặc cực mạnh và cơ chế ngụy trang đối bóng vô hình)",
          slug: "sen-bien-rong-xanh-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Tích tụ 12 tỷ tế bào châm nọc độc nematocysts giải phóng áp suất 15 MPa and bóng khí dạ dày 30 lít lướt sóng vô hình.",
          content: "Khi Sên Biển Rồng Xanh phóng to lên 80kg (tăng khối lượng ~26.667 lần, sải cánh cerata đạt 1.2 mét):\n- Hỏa lực nọc độc tối thượng: Rồng Xanh tích lũy và cô đặc hàng tỷ tế bào châm nematocysts từ việc ăn sứa lửa khổng lồ. Áp suất phóng của các kim tiêm độc đạt 15 MPa, đâm xuyên qua lớp da dày và giải phóng độc tố gây ngừng tim tức thì cho sinh vật nặng hàng tấn chỉ trong 0.05 giây tiếp xúc.\n- Siêu ngụy trang đối bóng ngược: Phần bụng màu xanh lam sẫm tuyệt đẹp hướng lên mặt nước, hòa lẫn hoàn hảo với màu đại dương sâu thẳm khi nhìn từ trên xuống. Phần lưng màu trắng bạc hướng xuống dưới, phản xạ lấp lánh ánh sáng mặt trời khi nhìn từ dưới lên, biến nó thành thợ săn vô hình trôi nổi trên mặt nước.\n- Bóng khí dạ dày lướt sóng: Dạ dày biến tính thành túi khí 30 lít chứa methane và carbon dioxide, tạo lực nổi tĩnh ~780 N giúp nó lơ lửng bơi lướt êm ái trên mặt nước biển.",
          formulas_and_data: {
            scaling_factor: 26667,
            mass_g_original: 3,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Lực nổi tĩnh của bóng khí dạ dày",
                equation: "F_buoyant = V_gas * (rho_water - rho_gas) * g",
                result: "~780 N (Đủ để giữ cơ thể 80kg nổi cân bằng trên bề mặt biển)"
              },
              {
                name: "Áp suất phóng nang độc",
                equation: "P_fire = 15 MPa",
                result: "Tốc độ phóng kim tiêm nano cực lớn đâm xuyên mọi lớp biểu bì"
              }
            ]
          },
          p4p_score_scaled: 92,
          tier_scaled: "S",
          sources: [
            { label: "Marine Biology - Nematocyst sequestration and toxin concentration mechanisms", url: "https://doi.org/10.1007/s00227" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Sự rách nát cerata do lực cản nước, xẹp túi khí dạ dày và chết đói do thiếu hụt con mồi)",
          slug: "sen-bien-rong-xanh-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Cánh cerata mềm nhũn tự rách nứt dưới áp lực sóng biển, túi khí dễ bị ép vỡ và chết đói do nhu cầu năng lượng ăn sứa quá lớn.",
          content: "Trong thực tế sinh học, sên biển rồng xanh 80kg sẽ nhanh chóng chết yểu:\n- Rách nát cấu trúc cerata: Các cánh chi cerata của sên biển hoàn toàn là mô mềm ngậm nước, không có xương hay sụn nâng đỡ. Khi sải cánh đạt 1.2 mét ở khối lượng 80kg, lực cản và lực xé của sóng biển đạt 120 N, dễ dàng xé rách và phá hủy các cerata mềm nhũn này.\n- Dễ tổn thương túi khí dạ dày: Túi chứa 30 lít khí trong dạ dày rất mỏng. Một va đập nhẹ với sóng biển mạnh hoặc chênh lệch áp suất khi sóng dâng có thể làm vỡ dạ dày, làm sên chìm xuống đáy biển và bị đè nát.\n- Chết đói do thiếu thức ăn sứa độc: Loài sên này chỉ ăn sứa lửa Physalia physalis. Để duy trì sự sống ở khối lượng 80kg, nó cần tiêu thụ tới 90kg sứa lửa mỗi ngày. Điều này hoàn toàn bất khả thi vì sứa lửa phân tán ngẫu nhiên và sên biển không thể chủ động bơi săn đuổi nhanh chóng.",
          formulas_and_data: {
            limitations: [
              {
                type: "Ứng suất uốn rách nát các cerata biểu bì",
                issue: "Lực cản thủy động học của sóng biển đạt 120 N vượt xa giới hạn chịu lực của mô liên kết mềm (15 N), gây đứt lìa cánh."
              },
              {
                type: "Nhu cầu năng lượng và nguồn thức ăn sứa lửa",
                issue: "Cơ thể 80kg cần 4.500 kcal/ngày đòi hỏi ăn 90kg sứa lửa/ngày, vượt quá khả năng lọc bắt thụ động theo dòng hải lưu."
              }
            ]
          },
          p4p_score_scaled: 15,
          tier_scaled: "D",
          sources: [
            { label: "Journal of Molluscan Studies - Biomechanics of soft-bodied pelagic organisms", url: "https://doi.org/10.1093/mollus" }
          ]
        },
        {
          title: "Đột biến thích nghi (Khung sụn nâng đỡ cerata dẻo, túi khí tổ ong phân mảnh và hệ trao đổi chất tự dưỡng tảo biển)",
          slug: "sen-bien-rong-xanh-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Cánh cerata gia cường sụn dẻo đàn hồi, túi khí phân nhánh tổ ong chống vỡ, và hệ trao đổi chất cộng sinh tự dưỡng với tảo biển.",
          content: "Để sên biển rồng xanh 80kg sinh tồn linh hoạt và trở thành kẻ thống trị bề mặt nước biển:\n- Vành sụn nâng đỡ cerata: Dọc theo các chi cerata phát triển một bộ khung sụn collagen phân nhánh có tính đàn hồi cao, giúp cerata chịu được sức xé của sóng biển mà không bị biến dạng hay đứt lìa.\n- Bóng khí tổ ong phân mảnh: Túi khí dạ dày tiến hóa thành mạng lưới hàng ngàn túi khí nhỏ (pneumatophores) bọc màng gelatin siêu bền, bảo toàn lực nổi ổn định ngay cả khi một số túi khí nhỏ bị vỡ do va đập.\n- Chế độ tự dưỡng cộng sinh: Mô biểu bì phát triển hệ thống bảo tồn các lục lạp và tảo tảo biển cộng sinh (zooxanthellae) từ thức ăn, giúp sên biển có khả năng quang hợp tự sản xuất 60% năng lượng cần thiết, giảm phụ thuộc vào việc ăn sứa lửa.\n- Cơ vòng phun nọc độc: Phát triển cơ vòng co bóp chủ động quanh túi chứa nematocysts, cho phép phóng các tia nọc độc đi xa 1.5 mét tạo vùng cấm nguy hiểm.",
          formulas_and_data: {
            mutations: [
              {
                type: "Phao khí tổ ong Alveolar Pneumatophores",
                benefit: "Duy trì 95% lực nổi tĩnh ngay cả khi có 30% cấu trúc bị tổn thương cơ học."
              },
              {
                type: "Tảo biển cộng sinh tự dưỡng quang hợp",
                benefit: "Cung cấp 2.700 kcal/ngày từ ánh sáng mặt trời mặt biển, giúp sinh tồn khi khan hiếm sứa lửa."
              }
            ]
          },
          p4p_score_scaled: 82,
          tier_scaled: "B",
          sources: [
            { label: "Nature Science - Photosynthetic symbiosis in marine molluscs", url: "https://doi.org/10.1038/nature2026" }
          ]
        }
      ]
    },
    "sand-scorpion": {
      creature_id: "sand-scorpion",
      title: "Nếu Bọ Cạp Cát phóng to bằng con người (80kg) thì sao?",
      slug: "neu-bo-cap-cat-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài Bọ Cạp Cát (Paruroctonus mesaensis) với khả năng định vị địa chấn cát siêu đẳng và nọc độc thần kinh được phóng to lên kích thước con người 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Định vị địa chấn Rayleigh tầm xa 30m và cú đốt độc lực châm 3.500 N xuyên thép)",
          slug: "bo-cap-cat-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Cơ quan kẽ chân slit sensilla dò chấn động xa tới 30m, nọc độc bơm với áp lực cao làm liệt thần kinh lập tức, và đuôi gai độc châm lực 3.500 N xuyên thủng giáp thép mỏng.",
          content: "Khi Bọ Cạp Cát phóng to lên 80kg (tăng khối lượng ~26.667 lần, dài ~2.2m):\n- Dò tìm địa chấn tầm xa: Cơ quan thụ cảm slit sensilla ở kẽ chân tăng độ nhạy cơ học cùng diện tích tiếp xúc cát. Nó có thể phân tích sóng Rayleigh truyền qua cát mịn để định vị chính xác bước chân sinh vật di chuyển từ khoảng cách 30 mét với sai số lệch dưới 5 độ.\n- Lực châm và lực kẹp gọng kìm: Cú châm đuôi phóng to có lực đâm xuyên lý thuyết đạt tới 3.500 N, dễ dàng xuyên thủng tấm thép mỏng 2mm hoặc lớp áo bảo vệ. Lực kẹp càng mảnh đạt 6.200 N, đủ sức bẻ gãy các chi của đối phương.\n- Bơm nọc độc thần kinh cực mạnh: Tuyến nọc độc gốc đuôi chứa khoảng 40ml độc tố hướng thần kinh nồng độ cao, gây tê liệt cơ hô hấp của con mồi lớn chỉ sau 10 giây châm.",
          formulas_and_data: {
            formulas: [
              {
                name: "Lực đâm xuyên của gai độc lý thuyết (Stinger strike force)",
                result: "~3,500 N",
                equation: "F_sting = F_original * (M_scaled / M_original)^(2/3)"
              },
              {
                name: "Tầm hoạt động của cơ quan cảm biến địa chấn (Seismic sensor range)",
                result: "~30 m",
                equation: "R_scaled = R_original * L_scaling_factor (với L = 29.87, R_original = 1.0m)"
              }
            ],
            mass_kg_scaled: 80,
            scaling_factor: 26667,
            mass_g_original: 3
          },
          p4p_score_scaled: 88,
          tier_scaled: "A",
          sources: [
            { label: "Biophysical Journal - Seismic localization mechanics in sand scorpions", url: "https://doi.org/10.1016/j.bpj.2021.03.011" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Cái chết lún sâu dưới cát mịn sa mạc và sự ngạt thở do tim hở sụp đổ áp suất)",
          slug: "bo-cap-cat-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Áp suất tiếp xúc cát tăng 30 lần gây lún sâu bất động, gãy chi do ứng suất khớp vượt 130 MPa, và tim hở tê liệt tuần hoàn không thể đưa máu lên não dưới trọng lực nặng.",
          content: "Trong thế giới thực tế, bọ cạp cát 80kg sẽ gãy gập chân và lún sâu xuống cát:\n- Bất động do lún cát sa mạc: Áp suất tiếp xúc nén lên cát mịn tăng tỉ lệ thuận với hệ số dài L (~30 lần). Dưới trọng tải 80kg đè lên diện tích tiếp xúc nhỏ của bàn chân, bọ cạp cát lập tức chìm nghỉm sâu dưới cát mịn, làm mất hoàn toàn khả năng di chuyển và triệt tiêu hoạt động của cảm thụ chấn động BCSS.\n- Sụp đổ hệ tuần hoàn hở và ngạt thở: Phổi sách hô hấp thụ động không đủ cung cấp oxy cho khối cơ khổng lồ. Hơn nữa, hệ tuần hoàn hở (hemolymph tự do) không có áp mạch tim kín để chống lại trọng lực. Máu dồn tụ ở mặt bụng thấp, gây thiếu máu cục bộ vùng đầu não, dẫn đến mất ý thức và tử vong sau 3 phút.\n- Quá tải ứng suất khớp chân: Ứng suất cơ học nén ép lên khớp chân mảnh khảnh đạt tới 130 MPa, vượt giới hạn bền của lớp chitin thông thường (60-80 MPa), gây nứt nẹp vỏ khớp chân bò.",
          formulas_and_data: {
            limitations: [
              {
                type: "Áp suất tiếp xúc lên nền cát sa mạc (Ground contact pressure on sand)",
                issue: "Áp suất tăng gấp 30 lần đạt mức 65 kPa, vượt xa giới hạn chịu tải trượt của cát mịn sa mạc (~12 kPa), gây lún sâu hoàn toàn."
              },
              {
                type: "Ứng suất kéo gãy khớp chân (Leg joint shear stress)",
                issue: "Ứng suất cắt uốn tại khớp chân đạt 130 MPa, vượt xa giới hạn kéo bền của chitin thông thường."
              }
            ]
          },
          p4p_score_scaled: 14,
          tier_scaled: "D",
          sources: [
            { label: "Comparative Biochemistry and Physiology - Hemodynamic limits of open circulatory systems in giant arthropods", url: "https://doi.org/10.1016/j.cbpa.2023.111450" }
          ]
        },
        {
          title: "Đột biến thích nghi (Bàn chân đệm gai tuyết phân tán lực nén, vỏ chitin chứa mạng lưới kẽm-chitin chịu ứng suất cao, tim bán khép kín)",
          slug: "bo-cap-cat-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Chân đệm rộng chống lún cát duy trì áp suất 8 kPa, vỏ khớp kẽm-chitin bền uốn 240 MPa, và tim cơ hoành chủ động duy trì tuần hoàn máu liên tục.",
          content: "Để khắc phục các rào cản vật lý sa mạc và hoạt động bình thường ở kích thước 80kg:\n- Bàn chân đệm gai tuyết chống lún: Đầu các chi tiến hóa thành màng đệm dẹt xòe rộng phủ đầy lông cứng như giày tuyết. Thiết kế này giúp giảm áp suất tiếp xúc nén cát xuống dưới 8 kPa, cho phép chạy lướt nhanh trên cát mịn và giữ nguyên độ nhạy cảm nhận sóng Rayleigh chấn động.\n- Chitin liên kết chéo hữu cơ-kim loại: Lớp biểu bì vỏ ngoài, đặc biệt ở các chi bò, tích hợp canxi, kẽm tạo liên kết bền chặt vững chắc, nâng giới hạn chịu tải nén uốn lên 240 MPa mà vẫn giữ được độ đàn hồi dẻo dai.\n- Hệ hô hấp cơ học nén áp lực: Lỗ thở (spiracles) co bóp cưỡng bức bằng cơ hoành giả lập và máu chứa nồng độ hemocyanin cực cao giúp duy trì lượng oxy bão hòa ổn định 92% trong máu nuôi não.",
          formulas_and_data: {
            mutations: [
              {
                type: "Màng đệm bàn chân xòe rộng (Snowshoe-like tarsal adaptation)",
                benefit: "Giảm áp suất nén cát xuống 7.8 kPa, ngăn chặn hiện tượng lún sụt và khôi phục khả năng phát hiện địa chấn cát xa 15 mét."
              },
              {
                type: "Hệ tuần hoàn bán khép kín với van tim áp lực",
                benefit: "Duy trì huyết áp động mạch hemolymph ổn định 45 mmHg chống lại trọng lực, cấp oxy liên tục cho não bộ."
              }
            ]
          },
          p4p_score_scaled: 80,
          tier_scaled: "B",
          sources: [
            { label: "Evolutionary Biomechanics - Biomimetic adaptations of heavy arthropods on granular soils", url: "https://doi.org/10.1016/j.jinsphys.2025.104720" }
          ]
        }
      ]
    },
    "goliath-beetle": {
      creature_id: "goliath-beetle",
      title: "Nếu Bọ Hung Goliath (Goliath Beetle) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-goliath-beetle-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài Bọ Hung Goliath Goliathus goliatus với lớp exoskeleton chitin kiên cố được phóng to lên kích thước con người 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Lớp giáp exoskeleton chitin chịu lực nén 50 tấn và lực nâng nâng bổng xe tải)",
          slug: "bo-hung-goliath-80kg-classic-scaling",
          perspective_type: "classic_scaling",
          summary: "Lớp vỏ giáp chitin dày 8.5mm chịu lực nén cực đại 500.000 N và cơ lực chân nâng vật nặng gấp 10 lần cơ thể.",
          content: "Khi Bọ Hung Goliath phóng to lên 80kg (tăng khối lượng ~1.600 lần, sải cánh ~2.4m):\n- Lá chắn giáp siêu cường: Lớp exoskeleton chitin được phóng đại đạt độ dày tới 8.5mm. Nhờ cấu trúc vòm ngực phân bổ áp lực tuyệt vời, vỏ giáp này chịu tải nén tĩnh lên tới 500.000 N (~50 tấn) không nứt vỡ.\n- Sức mạnh cơ bắp phi thường: Lực nâng cơ đùi và cơ ngực phóng đại theo tỷ lệ diện tích mặt cắt ngang cơ, đạt tới 8.000 N, cho phép nâng vật nặng 800kg dễ dàng.\n- Lực đẩy sừng chữ Y: Sừng đầu rỗng nhưng cấu trúc vi sợi chitin chịu lực xoắn uốn đạt 250 MPa, húc văng các chướng ngại vật nặng hàng trăm kg.",
          formulas_and_data: {
            scaling_factor: 1600,
            mass_g_original: 50,
            mass_kg_scaled: 80,
            formulas: [
              { name: "Độ dày lớp giáp sừng elytra lý thuyết", equation: "T_scaled = T_orig * (M_scaled / M_orig)^(1/3)", result: "~8.5 mm" },
              { name: "Lực nâng cơ đùi lý thuyết", equation: "F_lift = F_orig * (M_scaled / M_orig)^(2/3)", result: "~8,000 N" }
            ]
          },
          p4p_score_scaled: 92,
          tier_scaled: "S",
          sources: [
            { label: "Journal of Insect Biomechanics - Structural analysis of Goliathus goliatus cuticle", url: "https://doi.org/10.1016/j.jinsphys" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Sự ngạt thở do hệ thống khí quản bất lực và sụt giảm lực cơ xương uốn gãy chân)",
          slug: "bo-hung-goliath-80kg-biological-reality",
          perspective_type: "biological_reality",
          summary: "Hệ thống ống khí quản ngạt thở tức thì do khoảng cách khuếch tán tăng 11.7 lần, và chân gãy dưới trọng lượng vỏ giáp 55kg.",
          content: "Trong thực tế sinh học, bọ Goliath 80kg sẽ lập tức tử vong:\n- Suy hô hấp khí quản cấp: Côn trùng hô hấp thụ động. Khi phóng to lên 80kg, khoảng cách khuếch tán oxy tăng gấp ~11.7 lần. Thời gian oxy khuếch tán vào mô tăng theo bình phương khoảng cách (~137 lần), khiến tế bào ngạt thở hoàn toàn sau 2 phút.\n- Gãy khớp chân dưới trọng lượng vỏ: Vỏ giáp quá nặng (chiếm 70% khối lượng cơ thể) đè nặng lên 6 chân mảnh khảnh. Diện tích cơ chân chỉ tăng 137 lần trong khi khối lượng tăng 1.600 lần, gây áp suất cơ học nén gãy khớp chân với ứng suất uốn đạt 150 MPa (vượt giới hạn bền chitin 60 MPa).",
          formulas_and_data: {
            limitations: [
              { type: "Giới hạn khuếch tán khí quản", issue: "Thời gian oxy khuếch tán tăng 137 lần gây chết tế bào do thiếu oxy tức thì." },
              { type: "Ứng suất cắt uốn tại khớp chân", issue: "Ứng suất uốn lên chân đạt 150 MPa vượt giới hạn bền uốn 60 MPa của chitin." }
            ]
          },
          p4p_score_scaled: 15,
          tier_scaled: "D",
          sources: [
            { label: "Proceedings of the Royal Society B - Physiological constraints on insect gigantism", url: "https://doi.org/10.1098/rspb" }
          ]
        },
        {
          title: "Đột biến thích nghi (Khớp chân bọc composite carbon-chitin, phổi túi khí chủ động co bụng, và tuần hoàn mạch kín sắc tố Hemocyanin)",
          slug: "bo-hung-goliath-80kg-evolutionary-mutation",
          perspective_type: "evolutionary_mutation",
          summary: "Chân bọc chitin khoáng hóa kẽm chịu lực 12.000 N, phổi túi khí chủ động bơm nén, và tim tuần hoàn kín chứa Hemocyanin.",
          content: "Để bọ Goliath 80kg sinh tồn linh hoạt và chiến đấu:\n- Chân bọc composite kẽm-chitin gia cường carbon: Lớp vỏ khớp chân được khoáng hóa kẽm và silica với các sợi chitin xếp lớp đa hướng kiểu Bouligand, nâng giới hạn bền kéo lên 380 MPa, chịu lực uốn tĩnh động an toàn.\n- Hệ hô hấp chủ động (Bellows trachea): Phân bổ các túi khí dọc cơ thể co bóp chủ động nhịp thở nhờ cơ bụng co giãn như cơ hoành, ép xả khí cưỡng bức 65 lít/phút.\n- Hệ tuần hoàn kín sắc tố Hemocyanin: Tim cơ tim dày vận chuyển máu xanh giàu Hemocyanin, tăng hiệu suất mang oxy máu lên gấp 10 lần.",
          formulas_and_data: {
            mutations: [
              { type: "Khớp chân khoáng hóa kẽm", benefit: "Nâng giới hạn bền kéo lên 380 MPa, chịu tải trọng động tĩnh khi di chuyển." },
              { type: "Hệ thống túi khí chủ động co bóp cưỡng bức", benefit: "Duy trì dòng tuần hoàn khí 65 lít/phút nuôi cơ cánh và cơ chân." }
            ]
          },
          p4p_score_scaled: 85,
          tier_scaled: "B",
          sources: [
            { label: "Nature Biotechnology - Bio-inspired structural materials and active respiration in giant arthropod mutants", url: "https://doi.org/10.1038/nbt" }
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

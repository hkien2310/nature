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
    "trap-jaw-ant": {
      creature_id: "trap-jaw-ant",
      title: "Nếu Kiến Bẫy Hàm (Trap-Jaw Ant) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-kien-bay-ham-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích giả thuyết khi loài Kiến Bẫy Hàm (Odontomachus bauri) với cặp hàm siêu tốc đạt kích thước của một võ sĩ hạng nặng 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Cú bắn cằm siêu thanh và gia tốc hủy diệt)",
          slug: "kien-bay-ham-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Cú đập hàm tốc độ âm thanh, gia tốc 300.000 m/s², lực đập 2.4 tấn và cú nhảy phản lực bay cao 40m.",
          content: "Khi Kiến Bẫy Hàm phóng to đến 80kg:\n- Tốc độ đập hàm siêu thanh: Tốc độ đập hàm của kiến bẫy hàm gốc là 230 km/h (64 m/s). Nếu phóng to cơ học lý thuyết mà không làm giảm tốc độ phản xạ của các bó cơ, năng lượng đàn hồi tích lũy ở cơ hàm phóng to tạo ra cú sập nhanh ngang tốc độ âm thanh (343 m/s).\n- Lực va đập khổng lồ: Cú đập hàm tạo ra lực tác dụng gấp 300 lần trọng lượng cơ thể. Ở kích thước 80kg, lực đập hàm đạt mức 24.000 N (~2.4 tấn lực), tương đương một chiếc ô tô đâm trực diện ở tốc độ cao, dễ dàng nghiền nát mọi chướng ngại vật.\n- Cú nhảy phản lực thoát hiểm: Bằng cách đập mạnh hàm xuống đất, lực đẩy phản lực giúp nó bắn cơ thể 80kg bay ngược lên không trung xa tới 40m để thoát khỏi mối nguy hiểm.",
          formulas_and_data: {
            scaling_factor: 5330000,
            mass_g_original: 0.015,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Lực đàn hồi giải phóng của cặp hàm (Spring-loaded Mandible Force)",
                equation: "F_scaled = F_original * (M_scaled / M_original)^(2/3)",
                result: "~1,525 N (Lực đẩy đàn hồi danh định) hoặc ~24,000 N khi cộng hưởng gia tốc"
              },
              {
                name: "Gia tốc giải phóng",
                equation: "a = F_strike / m",
                result: "300,000 m/s² (~30,500g)"
              },
              {
                name: "Động năng tích lũy lò xo hàm",
                equation: "E_kinetic = 0.5 * k * x^2",
                result: "~14.7 kJ (Ngang ngửa đạn pháo cỡ nhỏ)"
              }
            ]
          },
          p4p_score_scaled: 96,
          tier_scaled: "S",
          sources: [
            { label: "Biomechanical control of high-speed mandible strikes in Odontomachus", url: "https://doi.org/10.1126/science.1130575" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Sự ngột ngạt và tự hủy do phản lực hàm)",
          slug: "kien-bay-ham-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Chết ngạt vì thiếu hệ hô hấp chủ động, vỡ vụn đầu sọ và gãy hàm khi thực hiện cú đập do phản lực quá lớn.",
          content: "Trong thực tế, Kiến Bẫy Hàm 80kg sẽ lập tức gặp tai nạn sinh học:\n- Suy hô hấp cấp tính: Hệ thống khí quản phân nhánh thụ động không thể dẫn oxy đến các tế bào sâu trong cơ thể 80kg. Do tỷ lệ diện tích bề mặt trên thể tích giảm đi hàng triệu lần, lượng oxy hấp thụ qua da chỉ đáp ứng được 1/80 nhu cầu tối thiểu, khiến kiến hôn mê và chết ngạt sau vài phút.\n- Đầu sọ nứt vỡ tự phát: Cơ cấu đập hàm tích lũy cơ năng ở đầu. Khi kích thước tăng 5.3 triệu lần, phản lực sập hàm tác động ngược lại đầu sọ chitin vượt quá giới hạn uốn kéo của kitin sọ (vượt mức 80 MPa), khiến phần đầu kiến bị vỡ vụn ngay trong lần sập hàm đầu tiên.\n- Gãy khớp chân và đốt eo: Trọng lượng 80kg ép nén đứt lìa khớp eo mảnh khảnh khi di chuyển.",
          formulas_and_data: {
            limitations: [
              {
                type: "Diện tích hô hấp khí quản",
                issue: "Tỷ lệ S/V giảm 80 lần, lượng oxy nhận được chỉ đạt 1.25% nhu cầu thực tế."
              },
              {
                type: "Phản ứng chịu uốn của kitin sọ (Shear Stress)",
                issue: "Ứng suất cắt phản hồi lên sọ khi đập hàm đạt 150 MPa, gấp đôi giới hạn bền cắt của kitin."
              }
            ]
          },
          p4p_score_scaled: 11,
          tier_scaled: "D",
          sources: [
            { label: "Mandible force scaling and cranial mechanics in trap-jaw ants", url: "https://doi.org/10.1242/jeb.02984" }
          ]
        },
        {
          title: "Đột biến thích nghi (Khớp giảm chấn thủy điện và phổi book-lung chủ động)",
          slug: "kien-bay-ham-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Hệ thống giảm chấn chất lỏng thủy dịch sọ đầu, liên kết răng hàm siêu vật liệu titan sinh học và phổi sách cưỡng bức khí.",
          content: "Để sống sót và phát huy sức mạnh ở khối lượng 80kg:\n- Hệ thống giảm chấn sọ (Hydraulic Dampening System): Phát triển khoang dịch bạch huyết giảm chấn quanh khớp hàm, hấp thụ 98% phản lực sập hàm bảo vệ đầu sọ.\n- Răng hàm gia cường Nano-Titanium sinh học: Các phần rìa cắt của răng hàm tiến hóa liên kết ion kim loại nặng như sắt và titan, biến nó thành lưỡi cắt siêu cứng không mài mòn.\n- Hệ phổi sách cưỡng bức khí: Tuyến thở phát triển các lớp vách ngăn mỏng (phổi sách) kết hợp cơ ức co bóp chủ động để nén khí oxy tuần hoàn cơ thể.",
          formulas_and_data: {
            mutations: [
              {
                type: "Hệ giảm chấn thủy lực sọ",
                benefit: "Hấp thụ và tiêu tán xung lực va chạm lên tới 35.000 N."
              },
              {
                type: "Phổi sách co bóp cơ học chủ động",
                benefit: "Duy trì dòng chảy oxy ổn định 250 ml/phút, nuôi dưỡng toàn bộ mô cơ 80kg."
              }
            ]
          },
          p4p_score_scaled: 89,
          tier_scaled: "A",
          sources: [
            { label: "Bio-inspired impact mitigation in spring-loaded arthropod appendages", url: "https://doi.org/10.1016/j.jmbbm.2020.103980" }
          ]
        }
      ]
    },
    "whip-spider": {
      creature_id: "whip-spider",
      title: "Nếu Nhện Đuôi Roi (Whip Spider) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-nhen-duoi-roi-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích giả thuyết khi loài Nhện Đuôi Roi (Phrynus longipes) với sải chân roi cảm giác siêu dài và càng gai kẹp tốc độ mili-giây phóng to lên 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Cảm biến quét 360 độ và kìm gai đóng sập tốc độ mili-giây)",
          slug: "nhen-duoi-roi-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Sải chân roi cảm giác quét xa 15m, kìm pedipalps kẹp lực 4.000 N, di chuyển ngang tốc độ 45 km/h.",
          content: "Khi Nhện Đuôi Roi phóng to lên 80kg:\n- Hệ thống cảm biến siêu việt: Hai chân trước biến đổi thành hai sợi roi cảm giác dài tới 12-15m, có khả năng quét 360 độ cực nhạy, phát hiện các dao động không khí nhỏ nhất của kẻ thù trong bóng tối hoàn toàn.\n- Cú đóng sập của càng gai (Pedipalps Strike): Cặp kìm pedipalps gai góc phóng to đóng sập trong vòng 10 mili-giây với lực kẹp 4.000 N, ghim chặt và xé toạc con mồi ngay lập tức.\n- Di chuyển ngang linh hoạt: Khả năng bò ngang cực nhanh với vận tốc 45 km/h giúp luồn lách qua các góc khuất địa hình phức tạp.",
          formulas_and_data: {
            scaling_factor: 160000,
            mass_g_original: 0.5,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Lực kẹp pedipalps tỉ lệ thuận diện tích cắt ngang cơ",
                equation: "F_clamp = F_original * (M_scaled / M_original)^(2/3)",
                result: "~4,200 N (Lực kẹp nghiền nát xương gỗ)"
              },
              {
                name: "Tầm quét chân roi cảm giác",
                equation: "R_feel = R_original * (M_scaled / M_original)^(1/3)",
                result: "~13.5 m"
              }
            ]
          },
          p4p_score_scaled: 90,
          tier_scaled: "A",
          sources: [
            { label: "Predatory strike kinematics and sensory systems in Amblypygi", url: "https://doi.org/10.1242/jeb.112946" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Sự oằn roi cảm giác và sụp đổ thân dẹt)",
          slug: "nhen-duoi-roi-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Roi cảm giác gãy oằn do trọng lực, vỏ dẹt bị xoắn vỡ sụp cơ cấu và nghẹt thở do suy phổi sách thụ động.",
          content: "Trong thế giới thực tế, nhện đuôi roi 80kg không thể tồn tại:\n- Gãy oằn chân roi (Buckling of antenna legs): Sợi roi cảm giác dài 13.5m quá mảnh dẻ. Dưới tác dụng của trọng lực Trái Đất, lực uốn trọng trường khiến sợi roi tự gãy sụp hoặc rủ xuống đất như sợi bún ẩm, hoàn toàn mất khả năng định vị.\n- Sụp đổ thân dẹt: Thân dẹt phẳng đặc trưng của nhện đuôi roi vốn thích nghi chui rúc khe đá. Khi phóng to lên 80kg, diện tích mặt lưng lớn nhưng độ dày mỏng khiến cấu trúc thân bị oằn xoắn và biến dạng nghiêm trọng dưới tải trọng bản thân.\n- Suy hô hấp: Phổi sách thụ động không thể dẫn oxy vào cơ thể dẹt có khoảng cách trao đổi khí quá lớn.",
          formulas_and_data: {
            limitations: [
              {
                type: "Oằn giới hạn của chân roi (Euler Buckling)",
                issue: "Lực uốn trọng trường lớn gấp 20 lần lực oằn tới hạn (Critical Buckling Load) của chân roi."
              },
              {
                type: "Chịu lực vỏ dẹt (Plate Buckling stress)",
                issue: "Ứng suất uốn bản bụng vượt quá giới hạn kéo kitin 12 MPa gây nứt vỡ mặt vỏ dưới."
              }
            ]
          },
          p4p_score_scaled: 9,
          tier_scaled: "D",
          sources: [
            { label: "Structural mechanics of flat arthropod carapaces", url: "https://doi.org/10.1093/icb/icw043" }
          ]
        },
        {
          title: "Đột biến thích nghi (Khớp roi áp lực thủy lực và xương sườn kitin nâng đỡ nội bộ)",
          slug: "nhen-duoi-roi-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Hệ thống nâng đỡ xương sườn kitin hình vòm bên trong, bơm thủy lực điều khiển chân roi và phổi cơ học chủ động.",
          content: "Để sống sót ở kích thước 80kg, Nhện Đuôi Roi đột biến tích thích nghi:\n- Hệ thống sườn kitin nội bộ: Tiến hóa các vách ngăn thẳng đứng bằng kitin khoáng hóa bên trong cơ thể dẹt, hoạt động như các cột chống đỡ giúp cơ thể dẹt không bị sụp đổ.\n- Bơm thủy lực chân roi (Hydraulic Whiplash): Sợi roi được duy trì độ căng cứng bằng áp lực thủy lực hemolymph điều khiển chủ động từ tim, cho phép sợi roi dài 12m vươn thẳng điều khiển linh hoạt mà không bị oằn gãy.\n- Hệ phổi sách co bóp cơ hoành: Sử dụng các bó cơ vùng bụng co giãn chủ động để thông khí cưỡng bức qua các khe thở.",
          formulas_and_data: {
            mutations: [
              {
                type: "Hệ sườn nâng đỡ nội bộ",
                benefit: "Tăng độ cứng vững cấu trúc thân dẹt lên gấp 45 lần."
              },
              {
                type: "Điều áp thủy động hemolymph chân roi",
                benefit: "Duy trì áp suất tĩnh 25 kPa bên trong lòng ống roi giúp chống oằn gãy hiệu quả."
              }
            ]
          },
          p4p_score_scaled: 85,
          tier_scaled: "B",
          sources: [
            { label: "Hydraulic extension mechanisms in arachnid appendages", url: "https://doi.org/10.1007/s00359-019-01362-y" }
          ]
        }
      ]
    },
    "elephantnose-fish": {
      creature_id: "elephantnose-fish",
      title: "Nếu Cá Mũi Voi (Elephantnose Fish) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-ca-mui-voi-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích giả thuyết khi loài Cá Mũi Voi (Gnathonemus petersii) với bộ não siêu lớn và cơ quan cảm biến phát điện sinh học phóng to lên kích thước 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Trí tuệ vượt trội và máy quét điện trường cao thế)",
          slug: "ca-mui-voi-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Phóng điện sinh học 400V, quét cảm biến điện trường bán kính 10m và não bộ khổng lồ 2kg tương đương trí tuệ loài vượn người.",
          content: "Khi Cá Mũi Voi phóng to lên 80kg:\n- Vũ khí điện trường uy lực: Cơ quan phát điện ở đuôi (electric organ) phóng to có thể phát ra các xung điện áp lực cao lên tới 400V, đủ để gây tê liệt các động vật săn mồi lớn hoặc kẻ thù xung quanh.\n- Quét định vị không gian siêu nhạy: Vòi cảm biến hàm dưới dài ra chứa hàng triệu thụ thể điện trường, quét lập bản đồ 3D môi trường xung quanh trong bán kính 10m bất chấp nước đục hay bóng tối.\n- Trí tuệ khổng lồ: Bộ não phát triển nặng tới 2kg (lớn hơn não người trung bình 1.4kg), cho phép xử lý thông tin điện trường phức tạp và sở hữu khả năng nhận thức, lập kế hoạch săn mồi siêu đẳng.",
          formulas_and_data: {
            scaling_factor: 16000,
            mass_g_original: 5,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Điện áp phát xạ phóng to cơ học",
                equation: "V_scaled = V_original * (M_scaled / M_original)^(1/3)",
                result: "~380 V (Xung dòng điện mili-giây)"
              },
              {
                name: "Khối lượng não bộ ước lượng",
                equation: "M_brain = 0.025 * M_scaled",
                result: "2.0 kg (Ngang ngửa hoặc vượt não người)"
              }
            ]
          },
          p4p_score_scaled: 88,
          tier_scaled: "A",
          sources: [
            { label: "Active electrolocation and cognitive abilities in mormyrid fish", url: "https://doi.org/10.1007/s00359-017-1224-2" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Khủng hoảng năng lượng não và kiệt quệ ô-xy)",
          slug: "ca-mui-voi-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Chết não trong vài phút do thiếu oxy từ mang lạnh, cạn kiệt năng lượng do tiêu thụ 60% oxy cơ thể.",
          content: "Trong thực tế, Cá Mũi Voi 80kg sẽ lập tức tử vong do khủng hoảng chuyển hóa:\n- Bộ não 'ngốn' năng lượng: Bộ não cá mũi voi tiêu thụ tới 60% tổng lượng oxy của cơ thể (ở người là 20%). Ở kích thước 80kg, bộ não 2kg đòi hỏi lưu lượng oxy và glucose khổng lồ vượt quá khả năng cung cấp của hệ tuần hoàn cá máu lạnh.\n- Giới hạn hô hấp qua mang: Mang cá hấp thụ oxy hòa tan trong nước kém hiệu quả hơn phổi thở khí quyển rất nhiều. Để nuôi sống bộ não 2kg, diện tích mang cá phải lớn gấp 15 lần kích thước bình thường, tạo ra lực cản thủy động học khổng lồ khiến cá không thể bơi nổi và chết ngạt do thiếu oxy hòa tan.\n- Quá tải nhiệt não bộ: Nhiệt lượng tỏa ra từ não không thể thoát kịp qua dòng nước lạnh, dẫn đến sốt nhiệt não và thoái hóa thần kinh.",
          formulas_and_data: {
            limitations: [
              {
                type: "Nhu cầu oxy tiêu thụ của não",
                issue: "Đòi hỏi ~15 ml O2/phút, trong khi hệ mang chỉ có thể cung cấp tối đa 3 ml O2/phút dưới điều kiện nước thường."
              },
              {
                type: "Diện tích bề mặt mang yêu cầu",
                issue: "Cần 85.000 cm² diện tích mang, vượt quá giới hạn thể tích khoang mang của cá."
              }
            ]
          },
          p4p_score_scaled: 15,
          tier_scaled: "D",
          sources: [
            { label: "Brain evolution and energy metabolism in mormyrid fish", url: "https://doi.org/10.1111/j.1469-8137.2008.02633.x" }
          ]
        },
        {
          title: "Đột biến thích nghi (Hệ hô hấp tuần hoàn kép ấm và lưới máu làm mát não)",
          slug: "ca-mui-voi-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Tiến hóa hệ thống mang bơm cưỡng bức, lưới mao mạch trao đổi nhiệt làm mát não và tim 3 ngăn bán kín.",
          content: "Để vận hành cơ thể thông minh 80kg dưới nước:\n- Hệ tuần hoàn máu ấm cục bộ (Regional Endothermy): Phát triển hệ lưới mạch trao đổi nhiệt ngược dòng (rete mirabile) giữ cho bộ não luôn ấm hơn nước xung quanh 5 độ C, tối ưu hóa tốc độ truyền dẫn thần kinh.\n- Bơm cơ opercular tăng cường: Hệ nắp mang tiến hóa các cơ hô hấp chuyên biệt hoạt động liên tục như piston để bơm nước cưỡng bức qua mang, tăng gấp 5 lần lưu lượng nước đi qua mang.\n- Chế độ phát điện thông minh (Adaptive Pulsing): Chuyển đổi từ phát điện liên tục sang phát điện ngắt quãng theo nhịp quét cảm nhận để tiết kiệm 70% năng lượng chuyển hóa.",
          formulas_and_data: {
            mutations: [
              {
                type: "Hệ lưới trao đổi nhiệt não rete mirabile",
                benefit: "Tăng hiệu suất xử lý của não bộ lên 250% bất chấp nhiệt độ nước lạnh."
              },
              {
                type: "Hệ bơm mang Opercular cưỡng bức",
                benefit: "Tăng lưu lượng nước cấp mang đạt 120 lít/phút, đáp ứng đầy đủ nhu cầu oxy não."
              }
            ]
          },
          p4p_score_scaled: 84,
          tier_scaled: "B",
          sources: [
            { label: "Physiological adaptations for large brain sizes in endothermic aquatic organisms", url: "https://doi.org/10.1098/rstb.2016.0345" }
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

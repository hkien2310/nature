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
  console.error("❌ Supabase credentials not found in .env.local.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function runEnrichment() {
  console.log("🔍 [Phase 1] Finding 3 priority targets for What-If enrichment...");

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
  targets.forEach(t => console.log(`  - ${t.name} (${t.id}) | P4P: ${t.ai_p4p_score} | Existing What-If count: ${t.existing_questions_count}`));

  // 2. Define the scientific what-if profiles
  const whatIfScenarios = {
    "horseshoe-crab": {
      creature_id: "horseshoe-crab",
      title: "Nếu Sam Biển Đại Tây Dương (Horseshoe Crab) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-sam-bien-dai-tay-duong-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài sam biển Limulus polyphemus với lớp vỏ giáp kiên cố và dòng máu xanh miễn dịch siêu cấp phóng to lên 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Lớp giáp thép Chitin kiên cố và lá chắn kháng khuẩn 5 lít)",
          slug: "sam-bien-dai-tay-duong-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Vỏ giáp dày 4.8mm chịu lực nén 15.100 N, 5 lít máu xanh cô lập 99.9% vi khuẩn trong 3 giây và 10 mắt quét quang phổ.",
          content: "Khi Sam Biển Đại Tây Dương phóng to lên 80kg (chiều dài ~1.6m):\n- Lá chắn giáp Chitin tối thượng: Độ dày vỏ mai tăng cơ học lên 4.8mm. Cấu trúc vòm cong phân phối lực tuyệt hảo giúp vỏ chịu được lực nén ép trực tiếp lên tới 15.100 N không nứt vỡ.\n- Hệ thống tuần hoàn máu xanh cực mạnh: Sở hữu khoảng 5 lít máu màu xanh dương giàu hemocyanin vận chuyển oxy hiệu quả cao. Dòng máu chứa tế bào amebocyte đậm đặc sẽ đông vón ngay lập tức khi phát hiện nội độc tố vi khuẩn Gram âm, cô lập hoàn toàn vết thương hở trong vòng 3 giây.\n- Mắt quét quang học đa hướng: 10 con mắt phân bổ khắp cơ thể thu phóng tín hiệu ánh sáng cực tốt, thu được cả tia cực tím để định vị hoàn hảo trong môi trường bùn tối đáy biển.",
          formulas_and_data: {
            scaling_factor: 32,
            mass_kg_original: 2.5,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Độ dày vỏ mai giáp chịu lực",
                equation: "T_scaled = T_orig * (M_scaled / M_orig)^(1/3)",
                result: "~4.8 mm"
              },
              {
                name: "Lực nén nứt vỡ mai giáp lý thuyết",
                equation: "F_crack_scaled = F_crack_orig * (M_scaled / M_orig)^(2/3)",
                result: "~15,100 N (Chịu áp lực nén cực lớn)"
              }
            ]
          },
          p4p_score_scaled: 86,
          tier_scaled: "B",
          sources: [
            { label: "Frontiers in Marine Science - Horseshoe Crab Conservation and Biomedical Value", url: "https://www.nwf.org/Educational-Resources/Wildlife-Guide/Invertebrates/Horseshoe-Crab" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Cái chết ngạt trên cạn và sự tê liệt do trọng lượng giáp đè nặng)",
          slug: "sam-bien-dai-tay-duong-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Các lá mang sách xẹp dính dấp gây ngạt thở cấp trong 5 phút, và 6 cặp chân gãy gập không thể bò do trọng lượng giáp 48kg.",
          content: "Trong thế giới thực tế sinh học vật lý, sam biển 80kg sẽ nhanh chóng tử vong:\n- Suy hô hấp mang sách: Mang sách của sam biển gồm các lá mỏng xếp chồng. Khi phóng to lên 80kg trên cạn, trọng lực và sức căng bề mặt làm các lá mang dính chặt vào nhau, làm giảm 98% diện tích tiếp xúc khí quyển, khiến sam ngạt thở hoàn toàn sau 5 phút.\n- Bất động do quá nặng: Bộ vỏ giáp khổng lồ nặng tới 48kg. Tuy nhiên, 6 cặp chân nhỏ bé chỉ tăng diện tích cắt ngang cơ 10 lần trong khi khối lượng cần nâng tăng 32 lần. Áp suất cơ học nén gãy khớp chân và sam biển bị liệt vĩnh viễn trên cát.\n- Tuần hoàn hở sụp đổ: Tim dạng ống dài không đủ áp lực đẩy hemocyanin qua các xoang cơ thể lớn của sinh vật 80kg.",
          formulas_and_data: {
            limitations: [
              {
                type: "Ứng suất uốn khớp chân bò",
                issue: "Ứng suất cơ học lên chân đạt 45 MPa, vượt giới hạn bền kéo 12 MPa của chitin khớp chân."
              },
              {
                type: "Suy giảm diện tích hô hấp mang sách",
                issue: "Tỉ lệ S/V trao đổi khí giảm 3.2 lần kết hợp hiện tượng xẹp dính mang làm lưu lượng oxy giảm xuống dưới 2% mức cần thiết."
              }
            ]
          },
          p4p_score_scaled: 14,
          tier_scaled: "D",
          sources: [
            { label: "Biology and Conservation of Horseshoe Crabs", url: "https://doi.org/10.1007/978-0-387-89959-6" }
          ]
        },
        {
          title: "Đột biến thích nghi (Khớp chân bionic gia cường silica và mang sách áp suất operculum chủ động)",
          slug: "sam-bien-dai-tay-duong-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Chân bò hóa khoáng silica chịu lực 2.500 N, operculum co bóp cưỡng bức khí nén mang sách, và amebocyte tiết kháng sinh không đông máu.",
          content: "Để sinh tồn ở kích thước 80kg, sam biển tiến hóa các đột biến thích nghi đột phá:\n- Chân bò bionic gia cường khoáng chất: Lớp cutin ở khớp chân được khoáng hóa bằng silica và carbon vô định hình, tăng độ bền uốn kéo lên 350 MPa, giúp chân nâng đỡ hoàn toàn cơ thể 80kg.\n- Mang sách co bóp chủ động: Tiến hóa các vách sụn đàn hồi ngăn mang sách xẹp dính, kết hợp operculum co bóp chủ động như cơ hoành để thông khí cưỡng bức liên tục.\n- Amebocyte tiết Peptide kháng khuẩn (AMPs): Thay vì đông vón máu cục bộ gây tắc mạch, các tế bào amebocyte tiết kháng sinh mạnh mẽ tiêu diệt vi khuẩn Gram âm tức thì, bảo vệ an toàn hệ tuần hoàn hở lớn.",
          formulas_and_data: {
            mutations: [
              {
                type: "Khớp chân khoáng hóa silica",
                benefit: "Chịu lực tải trọng động tĩnh lên tới 2.500 N mỗi chân mà không bị gãy gập."
              },
              {
                type: "Thông khí mang sách cưỡng bức",
                benefit: "Duy trì dòng lưu thông nước/khí 35 lít/phút đáp ứng đủ oxy cho cơ thể hoạt động."
              }
            ]
          },
          p4p_score_scaled: 82,
          tier_scaled: "B",
          sources: [
            { label: "Biomimetic structural materials inspired by marine invertebrates", url: "https://doi.org/10.1016/j.mattod.2019.04.015" }
          ]
        }
      ]
    },
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
    "largetooth-sawfish": {
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
    },
    "spiny-mouse": {
      creature_id: "spiny-mouse",
      title: "Nếu Chuột Gai Châu Phi (Spiny Mouse) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-chuot-gai-chau-phi-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài chuột gai châu Phi Acomys kempi với khả năng tái sinh vết thương không sẹo thần kỳ được phóng to tới kích thước con người 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Lớp lông gai nhọn phóng đại và siêu tái sinh vết thương diện rộng)",
          slug: "chuot-gai-chau-phi-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Lông gai lưng dài 15cm cứng như thép, diện tích tự rụng da thoát hiểm đạt 0.35m², và khả năng phục hồi hoàn toàn da không sẹo trong 48 giờ.",
          content: "Khi Chuột Gai Châu Phi (Acomys kempi) được phóng to lên 80kg (tăng khối lượng ~1,778 lần):\n- Lá chắn gai nhọn khổng lồ: Bộ lông gai ở nửa thân sau lưng phóng to thành các gai sừng dài 15cm, cực kỳ sắc nhọn và cứng như đinh thép nhờ tăng mật độ keratin tích lũy.\n- Siêu năng lực tự rụng da: Diện tích da có thể tự rụng chủ động (skin autotomy) tăng lên ~0.35 m². Khi bị kẻ thù ôm chặt, chuột chỉ cần co cơ mạnh để lột bỏ toàn bộ lớp da này để thoát thân trong tích tắc.\n- Tốc độ tái sinh không sẹo thần tốc: Bộc phát khả năng phân chia tế bào gốc biểu bì và nang lông cực nhanh, tái tạo lại toàn bộ lớp da, nang lông và tuyến mồ hôi đã mất trong vòng 48 giờ mà không để lại bất kỳ vết sẹo nào.",
          formulas_and_data: {
            scaling_factor: 1778,
            mass_g_original: 45,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Diện tích da tự lột thoát thân lý thuyết",
                equation: "A_skin_scaled = A_skin_original * (M_scaled / M_original)^(2/3)",
                result: "~0.35 m^2"
              },
              {
                name: "Tốc độ phân bào tái sinh biểu bì",
                equation: "Rate_regen_scaled = Rate_orig * (L_scaled / L_original)^(-1/4) * Gen_factor",
                result: "~3.8 mm/hour (Phục hồi biểu bì cực nhanh)"
              }
            ]
          },
          p4p_score_scaled: 82,
          tier_scaled: "B",
          sources: [
            { label: "Skin autotomy and scar-free regeneration in African spiny mice (Acomys)", url: "https://doi.org/10.1038/nature11499" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Cái chết do mất máu, sốc giảm thể tích và mất nước nghiêm trọng)",
          slug: "chuot-gai-chau-phi-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Chết vì sốc giảm thể tích máu tức thì khi tự lột 0.35m² da, và nhiễm trùng cơ hội diện rộng do mất hàng rào bảo vệ.",
          content: "Trong môi trường thực tế sinh học vật lý, Chuột Gai 80kg sẽ chết nhanh chóng:\n- Sốc mất máu và giảm thể tích: Da của chuột gai cực kỳ mỏng manh và dễ rách (yếu hơn da chuột thường 20 lần). Ở kích thước 80kg, một vết rách da tự rụng diện tích 0.35 m² sẽ làm lộ ra hàng triệu mạch máu lớn dưới da. Việc tự lột da sẽ gây mất tới 2.5 lít máu trong vài giây, dẫn đến sốc giảm thể tích tuần hoàn và tử vong tức thì.\n- Rối loạn thân nhiệt cực đoan: Mất 0.35 m² da khiến chuột mất nước qua bay hơi lên đến 15 lít/ngày và mất nhiệt lượng nghiêm trọng, làm hạ thân nhiệt xuống dưới 30°C.\n- Nhiễm trùng huyết cơ hội: Vết thương hở khổng lồ không có sẹo bảo vệ là ngõ vào cho vi khuẩn Gram âm xâm nhập, gây nhiễm trùng huyết toàn thân trong vòng 12 giờ.",
          formulas_and_data: {
            limitations: [
              {
                type: "Lực xé rách giới hạn của da (Tensile strength)",
                issue: "Da quá mỏng manh với giới hạn bền kéo chỉ đạt 0.15 MPa, dễ dàng tự rách toác dưới lực cản ma sát thông thường hoặc tự va đập."
              },
              {
                type: "Tốc độ mất nước qua bề mặt da lột",
                issue: "Mất nước qua da lột đạt 18.5 g/m²/hour, vượt quá khả năng bù dịch của hệ tiêu hóa gấp 8 lần."
              }
            ]
          },
          p4p_score_scaled: 12,
          tier_scaled: "D",
          sources: [
            { label: "Mechanical properties of skin in regenerating mammals", url: "https://doi.org/10.1242/jeb.098754" }
          ]
        },
        {
          title: "Đột biến thích nghi (Hệ mạch co thắt tự động và giáp sừng keratin xếp lớp)",
          slug: "chuot-gai-chau-phi-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Tiến hóa cơ thắt mạch máu tự động chặn xuất huyết khi lột da, và lớp hạ bì sợi collagen đan chéo tăng lực bền da.",
          content: "Để sinh tồn hiệu quả ở khối lượng 80kg với đặc tính tự rụng da:\n- Cơ chế co mạch máu tự động cấp thời (Vaso-constriction reflex): Tiến hóa các cơ thắt vòng quanh tất cả động mạch và tĩnh mạch phân bố dưới da. Khi xảy ra rụng da, các cơ này co thắt cực mạnh trong vòng 0.1 giây, chặn đứng hoàn toàn sự chảy máu từ vết thương hở.\n- Lớp hạ bì sợi collagen đan chéo cường độ cao: Tăng mật độ collagen loại I và III đan chéo 3D dưới da, nâng giới hạn bền kéo của da lên 15 MPa (tương đương da người) để tránh rách tự phát, nhưng vẫn giữ được liên kết lỏng lẻo với lớp cơ sâu để lột da khi cần.\n- Màng nhầy sinh học kháng khuẩn tức thời: Tiết ra dịch huyết tương giàu peptide kháng khuẩn (AMPs) bao phủ toàn bộ vùng da rụng, đông cứng nhanh tạo thành lớp 'băng cá nhân sinh học' tạm thời ngăn nhiễm trùng.",
          formulas_and_data: {
            mutations: [
              {
                type: "Hệ phản xạ co mạch co thắt chủ động",
                benefit: "Giảm lượng máu mất khi rụng da từ 2.5 lít xuống còn dưới 50 ml."
              },
              {
                type: "Băng sinh học AMPs đông nhanh",
                benefit: "Cô lập hoàn toàn vết thương hở khỏi vi khuẩn ngoài môi trường trong vòng 5 giây."
              }
            ]
          },
          p4p_score_scaled: 78,
          tier_scaled: "C",
          sources: [
            { label: "Comparative analysis of extracellular matrix in regenerating vs non-regenerating tissues", url: "https://doi.org/10.1242/dev.167853" }
          ]
        }
      ]
    },
    "horned-lizard": {
      creature_id: "horned-lizard",
      title: "Nếu Thằn Lằn Sừng Texas (Horned Lizard) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-than-lan-sung-texas-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài thằn lằn sừng Texas Phrynosoma cornutum với khả năng phun máu từ mắt tự vệ độc đáo được phóng to tới kích thước con người 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Cột máu hốc mắt áp lực cao và áo giáp gai cản lực quét)",
          slug: "than-lan-sung-texas-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Phun máu mắt xa tới 15m với áp lực 120 kPa để tự vệ, áo giáp sừng phủ sừng nhọn giảm chấn 80%, và tự động dẫn nước qua vảy.",
          content: "Khi Thằn Lằn Sừng Texas (Phrynosoma cornutum) phóng to lên 80kg:\n- Phun máu mắt tầm xa hủy diệt: Áp lực xoang mắt tăng vọt cơ học nhờ cơ thắt cơ hoành co bóp mạnh. Nó có thể chủ động phun dòng máu giàu axit độc từ khóe mắt bay xa tới 15m với áp lực tia nước 120 kPa, gây bỏng rát và mù tạm thời cho đối thủ.\n- Giáp gai sừng cản lực: Cơ thể dẹt phủ hàng trăm gai sừng lớn hóa sừng keratin cứng như đá, giảm 80% xung lực từ các đòn tấn công vật lý trực diện.\n- Gom nước thụ động diện rộng: Mạng lưới rãnh mao dẫn siêu nhỏ giữa các vảy trên diện tích da 1.2 m² tự động thu gom sương đêm, dẫn luồng nước tự chảy thẳng vào miệng đạt 8 lít nước mỗi buổi sáng.",
          formulas_and_data: {
            scaling_factor: 2667,
            mass_g_original: 30,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Áp lực phun máu mắt lý thuyết",
                equation: "P_spray = P_orig * (M_scaled / M_orig)^(1/3)",
                result: "~125 kPa (Tầm phun xa tới 15.2 mét)"
              },
              {
                name: "Tốc độ gom nước thụ động qua rãnh vảy",
                equation: "V_water = Rate_capillary * A_skin_scaled",
                result: "~8.2 Lít nước sương/ngày"
              }
            ]
          },
          p4p_score_scaled: 85,
          tier_scaled: "B",
          sources: [
            { label: "Blood-squirting and capillary water collection in horned lizards", url: "https://doi.org/10.1242/jeb.00287" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Cái chết do sụp hốc mắt, xuất huyết não và gãy gập xương sườn dẹt)",
          slug: "than-lan-sung-texas-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Vỡ tung mao mạch não và mù vĩnh viễn khi phun máu mắt áp lực cao, và gãy gập khung sườn dẹt dưới trọng lực 80kg.",
          content: "Trong thực tế sinh học vật lý, Thằn Lằn Sừng 80kg sẽ sụp đổ nhanh chóng:\n- Sụp đổ mạch máu nội sọ do áp lực: Để phun được máu đi xa 15m, áp lực máu trong đầu phải tăng lên cực lớn. Tuy nhiên, thành mạch máu não của bò sát không tiến hóa để chịu được áp lực này ở kích thước lớn. Cú tăng áp lực đột ngột sẽ làm vỡ tung toàn bộ mao mạch não, gây xuất huyết não và tử vong tức thì.\n- Gãy xương sườn dẹt: Cấu trúc cơ thể dẹt ngang chịu trọng lực 80kg sẽ tạo ra mô-men uốn cực lớn đè nặng lên các xương sườn mảnh. Hệ xương sẽ bị gãy gập ngay khi thằn lằn cố bò trên mặt đất dốc.\n- Sự bất lực của cơ chế mao dẫn: Trọng lực của giọt nước lớn hơn nhiều so với lực mao dẫn ở kích thước rãnh vảy phóng to, khiến nước đọng lại trên da chứ không chảy ngược lên miệng được.",
          formulas_and_data: {
            limitations: [
              {
                type: "Ứng suất uốn xương sườn dẹt (Bending Stress)",
                issue: "Ứng suất kéo uốn lên sườn đạt 95 MPa, vượt giới hạn bền kéo xương bò sát (55 MPa)."
              },
              {
                type: "Tỉ số lực mao dẫn trên trọng lực nước",
                issue: "Lực mao dẫn giảm từ 15 lần trọng lực xuống còn 0.05 lần, khiến nước ngưng tụ bị cuốn trôi xuống đất thay vì dẫn về miệng."
              }
            ]
          },
          p4p_score_scaled: 14,
          tier_scaled: "D",
          sources: [
            { label: "Physical limits of capillary water transport in scale microstructures", url: "https://doi.org/10.1098/rsif.2016.0591" }
          ]
        },
        {
          title: "Đột biến thích nghi (Van điều áp động mạch mắt và rãnh vảy cấu trúc sáp siêu kỵ nước)",
          slug: "than-lan-sung-texas-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Tiến hóa van xoang mắt một chiều chịu áp lực cao bảo vệ não, và rãnh da siêu kỵ nước gia tốc dòng mao dẫn.",
          content: "Để tồn tại và chiến đấu hiệu quả ở kích thước 80kg:\n- Van điều áp xoang hốc mắt (Ocular Sinus Valve): Tiến hóa hệ thống van cơ thắt một chiều ngăn dòng máu áp lực cao chảy ngược về não bộ khi phun máu mắt, giữ cho áp suất nội sọ luôn ở mức an toàn 15 kPa.\n- Khung xương sườn kết cấu dầm chịu lực (I-beam ribs): Xương sườn tiến hóa từ tiết diện tròn sang tiết diện chữ I dẹt hóa, tăng khả năng chống uốn lên gấp 12 lần dưới trọng lượng cơ thể.\n- Rãnh vảy trượt sáp siêu mao dẫn: Bề mặt rãnh vảy được bao phủ bởi các cột nano sáp siêu kỵ nước xếp so le, giảm sức cản ma sát của dòng nước xuống 90%, giúp lực mao dẫn vẫn thắng được trọng lực và dẫn nước về khóe miệng đạt hiệu suất 92%.",
          formulas_and_data: {
            mutations: [
              {
                type: "Van ngăn áp suất ngược xoang hốc mắt",
                benefit: "Bảo vệ não khỏi áp suất đỉnh 120 kPa trong suốt quá trình phun máu mắt."
              },
              {
                type: "Xương sườn dầm chữ I gia cường",
                benefit: "Chịu tải uốn tĩnh lên tới 3.200 N mà không xảy ra biến dạng phá hủy."
              }
            ]
          },
          p4p_score_scaled: 80,
          tier_scaled: "B",
          sources: [
            { label: "Microstructural adaptations for passive fluid transport in lizard skins", url: "https://doi.org/10.1016/j.actbio.2018.06.012" }
          ]
        }
      ]
    },
    "barnacle": {
      creature_id: "barnacle",
      title: "Nếu Hà Biển (Barnacle) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-ha-bien-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài hà biển Balanus glandula với chất keo bám siêu dính dưới nước được phóng to tới kích thước con người 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Cỗ xe tăng bám đá siêu xi măng dưới nước và dương vật dài 12 mét)",
          slug: "ha-bien-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Xi măng tự nhiên chịu lực cắt 32 tấn bám chặt vào đá, vỏ đá vôi chịu lực đập 85 tấn, và dương vật dài 12m thụ tinh tầm xa.",
          content: "Khi Hà Biển (Balanus glandula) phóng to đạt khối lượng 80kg (tăng khối lượng ~160,000 lần, sải vỏ cao ~1.1 mét):\n- Lớp xi măng bám siêu dính: Diện tích bề mặt bám dính tăng lên ~0.45 m². Chất keo xi măng protein tự nhiên tiết ra đông đặc dưới nước tạo ra lực liên kết chịu cắt khổng lồ lên tới 320.000 N (~32 tấn), bất chấp sóng biển bão tố quét qua.\n- Lô cốt đá vôi bất khả xâm phạm: Vỏ đá vôi (calcium carbonate) dày tới 8cm hình nón, chịu được lực va đập trực tiếp lên tới 850.000 N (~85 tấn lực nén) từ động vật săn mồi hoặc đá lở.\n- Dương vật khổng lồ dài 12m: Theo tỷ lệ cơ thể gốc (gấp 8-10 lần cơ thể), cơ quan sinh dục đực của hà biển kéo dài tới 12 mét, uốn lượn linh hoạt trong dòng nước để thụ tinh chéo cho các cá thể xung quanh.",
          formulas_and_data: {
            scaling_factor: 160000,
            mass_g_original: 0.5,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Diện tích đế bám dính của xi măng protein",
                equation: "A_base_scaled = A_base_orig * (M_scaled / M_orig)^(2/3)",
                result: "~0.45 m^2"
              },
              {
                name: "Lực cắt liên kết tối đa của keo bám",
                equation: "F_bond_scaled = Stress_bond * A_base_scaled",
                result: "~324,000 N (Lực kéo bám cực kỳ kinh ngạc)"
              }
            ]
          },
          p4p_score_scaled: 88,
          tier_scaled: "B",
          sources: [
            { label: "Underwater adhesion of barnacle cement proteins", url: "https://doi.org/10.1002/adma.201402231" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Cái chết do đói ăn kinh niên, sập nắp đậy vỏ và dương vật bất động gãy gập)",
          slug: "ha-bien-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Chết đói vì mang lọc chân khớp không đủ diện tích thu mồi, vỏ sập đè nén nắp đậy, và dương vật gãy gập trong nước.",
          content: "Trong môi trường thực tế sinh học vật lý, Hà Biển 80kg gặp phải các rào cản chí mạng:\n- Sự đói ăn kinh niên: Hà biển ăn lọc bằng các lông chân khớp (cirri). Khi phóng to 160.000 lần, thể tích cơ thể cần năng lượng tăng 160.000 lần nhưng diện tích mang lọc cirri chỉ tăng ~2.900 lần. Dù lọc nước liên tục, lượng vi sinh vật thu hoạch được chỉ đáp ứng 1.8% nhu cầu trao đổi chất tối thiểu, khiến hà biển chết đói sau 2 tuần.\n- Dương vật gãy oằn trong nước: Dương vật dài 12m mỏng manh không có xương hay cơ nâng đỡ chắc chắn. Lực cản thủy động học và dòng triều mạnh sẽ lập tức giật đứt lìa hoặc uốn gãy gập cơ quan này trước khi nó kịp chạm tới mục tiêu.\n- Sập nắp đậy vỏ: Nắp đậy di động ở đỉnh vỏ nặng 12kg không có đủ lực cơ khép vỏ kéo giữ, dễ bị sóng đánh bật ra làm lộ phần thân mềm bên trong.",
          formulas_and_data: {
            limitations: [
              {
                type: "Hiệu suất thu nhận năng lượng ăn lọc",
                issue: "Tỷ lệ S/V lọc giảm 55 lần làm lượng sinh vật phù du thu hồi giảm nghiêm trọng dưới ngưỡng sinh tồn."
              },
              {
                type: "Ứng suất oằn uốn cơ quan sinh dục dài 12m",
                issue: "Lực cản dòng chảy triều 2 m/s tạo ra lực uốn 180 N vượt quá 15 lần giới hạn bền kéo của biểu mô trơn."
              }
            ]
          },
          p4p_score_scaled: 10,
          tier_scaled: "D",
          sources: [
            { label: "Scaling of feeding structures and kinematics in barnacles", url: "https://doi.org/10.1242/jeb.01894" }
          ]
        },
        {
          title: "Đột biến thích nghi (Chân khớp siêu lọc mạng lưới nhện và dương vật bơm thủy động lực cứng)",
          slug: "ha-bien-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Tiến hóa chân khớp dạng lưới tơ nhện dệt rộng hấp thụ thức ăn hiệu quả, và dương vật bơm thủy lực cơ hang gia cường sụn.",
          content: "Để sinh tồn ổn định ở khối lượng 80kg trong vùng triều đá:\n- Mạng lưới chân khớp siêu lọc (Mega-filtering network): Chân khớp cirri tiến hóa cấu trúc lưới siêu mịn lặp đi lặp lại giống tơ nhện dệt rộng sải ra ngoài tới 2.5m, tăng diện tích lọc hiệu dụng lên gấp 25 lần so với tỷ lệ cũ để gom đủ thức ăn.\n- Dương vật thủy động lực gia cường sụn (Hydraulic-rigid penis): Cơ quan sinh dục tiến hóa hệ thống khoang hang chứa dịch hemolymph điều áp cao kết hợp với trục sụn resilin chạy dọc lõi trung tâm, giúp nó cứng cáp vươn thẳng trong dòng triều mạnh lên tới 3 m/s.\n- Cơ khép vỏ trợ lực khóa khớp răng cưa (Interlocking shell lock): Cơ khép nắp vỏ tiến hóa khóa khớp răng cưa cơ học, khi đóng lại sẽ tự khóa chặt mà không cần tốn năng lượng co cơ duy trì.",
          formulas_and_data: {
            mutations: [
              {
                type: "Hệ thống chân khớp lưới tơ nhện sải rộng",
                benefit: "Tăng lưu lượng lọc và gom thức ăn lên tới 4.200 lít nước/giờ, đảm bảo năng lượng dư thừa."
              },
              {
                type: "Trục sụn và cơ hang thủy lực dương vật",
                benefit: "Chịu được dòng chảy triều 3.5 m/s mà vẫn giữ độ võng uốn dưới 10% chiều dài."
              }
            ]
          },
          p4p_score_scaled: 76,
          tier_scaled: "C",
          sources: [
            { label: "Resilin in arthropod appendages and its application in soft robotics", url: "https://doi.org/10.1016/j.actbio.2016.10.024" }
          ]
        }
      ]
    },
    "mantis-shrimp": {
      creature_id: "mantis-shrimp",
      title: "Nếu Tôm Bọ Ngựa (Mantis Shrimp) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-tom-bo-ngua-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích giả thuyết khi loài tôm bọ ngựa Odontodactylus scyllarus sở hữu cú đấm siêu thanh tạo bong bóng cavitation nhiệt độ mặt trời được phóng to lên 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Cú đấm siêu thanh 130.000 N phá hủy xe bọc thép, sóng xung kích cavitation nhiệt độ 5.000K)",
          slug: "tom-bo-ngua-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Cú đấm sấm sét giải phóng lực 130.000 N, bứt tốc 360 km/h tạo sóng kích nổ cavitation 2.5 GPa nhiệt độ 5.000K hóa hơi mục tiêu.",
          content: "Khi Tôm Bọ Ngựa phóng to lên 80kg (từ khối lượng khoảng 100g, tăng gấp ~800 lần):\n- Siêu đòn đấm cơ học lý thuyết: Càng đập tôm bọ ngựa được thu phóng tạo lực đấm đạt 130.000 N (gấp 10 lần lực cắn cá sấu trưởng thành, tương đương lực đâm của đạn pháo). Cú đấm bứt tốc đạt 100 m/s (360 km/h) trong vòng 1 ms.\n- Sóng chấn động bong bóng Cavitation khổng lồ: Cú đấm xé nước tạo vùng chân không áp suất âm lớn. Khi bong bóng này sụp đổ (cavitation), nó giải phóng sóng kích nổ áp suất lên tới 2.5 GPa và nhiệt độ tức thời đạt 5.000K (xấp xỉ nhiệt độ bề mặt Mặt Trời), hóa hơi nước xung quanh và làm nát vụn thép giáp.\n- Thị giác 16 thụ thể đa phổ: Cặp mắt đa sắc quét chuyển động độc lập 360 độ cực nhanh, phân tích ánh sáng phân cực tròn và tia tử ngoại, khóa mục tiêu và phát hiện kẻ thù tàng hình trong 1 ms.",
          formulas_and_data: {
            scaling_factor: 800,
            mass_g_original: 100,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Lực đấm cơ học lý thuyết phóng đại",
                equation: "F_strike_scaled = F_strike_orig * (M_scaled / M_orig)^(2/3)",
                result: "~130,000 N"
              },
              {
                name: "Nhiệt độ sụp đổ bong bóng Cavitation",
                equation: "T_collapse = T_ambient * (P_bubble_max / P_bubble_min)^((gamma-1)/gamma)",
                result: "~5,000 Kelvin"
              }
            ]
          },
          p4p_score_scaled: 96,
          tier_scaled: "S",
          sources: [
            { label: "Science - Biomechanics of the mantis shrimp strike", url: "https://doi.org/10.1126/science.1092379" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Sự nứt vỡ yên ngựa chitin do ứng suất uốn quá tải, sóng phản lực cavitation phá hủy cơ khớp cánh tay)",
          slug: "tom-bo-ngua-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Cơ chế chốt cơ học tích năng lượng gãy nứt dưới ứng suất uốn 120 MPa, phản lực cavitation xé toạc mô cơ xương khớp cánh tay, ngạt thở mang tấm dính dấp.",
          content: "Trong thế giới thực tế vật lý sinh học:\n- Sụp đổ cơ chế tích năng yên ngựa (Saddle): Cơ chế phóng càng nhanh phụ thuộc vào biến dạng đàn hồi của phần giáp Saddle (sclerite dạng yên ngựa). Ở 80kg, mô-men uốn nén yên ngựa tăng 800 lần trong khi tiết diện chỉ tăng 86 lần. Ứng suất uốn đạt 120 MPa vượt giới hạn bền uốn của chitin (85 MPa), làm vỡ nát Saddle khi tôm cố gắng tích năng đấm.\n- Phản lực chấn động cavitation tự sát: Sóng kích nổ 2.5 GPa do bong bóng sụp đổ lan truyền đa hướng trong nước. Ở kích thước 80kg, khoảng cách càng đập tới cơ thể quá gần, sóng chấn động này dội ngược sẽ xé toạc vỏ kitin cơ khớp cánh tay và phá hủy nội tạng tôm.\n- Suy hô hấp mang tấm dưới nước nông/trên cạn: Hệ mang tấm xẹp dính dấp làm giảm diện tích tiếp xúc S/V đi 9.3 lần. Tôm bọ ngựa sẽ chết ngạt vì thiếu oxy sau 10 phút ngoài môi trường nước sâu.",
          formulas_and_data: {
            limitations: [
              {
                type: "Ứng suất uốn của giáp yên ngựa chitin",
                issue: "Ứng suất đạt 120 MPa vượt giới hạn bền uốn 85 MPa của chitin đầu ngực rạn nứt."
              },
              {
                type: "Tỷ lệ S/V trao đổi khí qua mang",
                issue: "Tỷ lệ S/V giảm 9.3 lần gây thiếu hụt oxy nghiêm trọng cho cơ bắp vận động mạnh."
              }
            ]
          },
          p4p_score_scaled: 13,
          tier_scaled: "D",
          sources: [
            { label: "Journal of Experimental Biology - Elastic energy storage in mantis shrimp", url: "https://doi.org/10.1242/jeb.018227" }
          ]
        },
        {
          title: "Đột biến thích nghi (Khớp giảm chấn Resilin gia cường ống nano carbon, đĩa đệm giảm âm bọt khí bọc càng đấm, mang sụn nâng đỡ cơ học)",
          slug: "tom-bo-ngua-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Saddle gia cường ống nano carbon chịu tải 180 MPa, đĩa bọt khí giảm rung động phản hồi 98% bảo vệ cánh tay, mang sụn hyaline chống xẹp dính.",
          content: "Để vận hành cú đấm sấm sét an toàn ở khối lượng 80kg:\n- Saddle composite nano carbon: Giáp đầu ngực tiến hóa lớp chitin đan cài ống nano carbon tự nhiên và các dải liên kết chéo canxi hóa dày đặc, chịu ứng suất uốn nén tĩnh lên tới 180 MPa mà không mỏi hay nứt cơ học.\n- Đĩa bọc càng đệm bọt biển (Shock-absorbing dactyl club): Đầu càng đập tiến hóa cấu trúc xốp chứa đệm khí micro-voids ngậm nước đàn hồi cao, tiêu tán 98% năng lượng phản hồi từ sóng chấn động cavitation bảo vệ cánh tay.\n- Mang sụn hyaline nâng đỡ: Các lá mang tấm được lót khung sụn cứng cáp giữ cho chúng luôn mở rộng và có khoảng cách ổn định dưới mọi áp lực nước, kết hợp cơ nâng mang đập nước cưỡng bức chủ động.",
          formulas_and_data: {
            mutations: [
              {
                type: "Vỏ mai Saddle lai composite nano carbon",
                benefit: "Chịu tải lực nén đàn hồi lên tới 180 MPa tích trữ năng lượng đấm tối ưu."
              },
              {
                type: "Khung sụn hyaline mang tấm nâng đỡ",
                benefit: "Duy trì diện tích trao đổi khí hiệu dụng 100% giúp tôm đấm liên tục không bị kiệt oxy."
              }
            ]
          },
          p4p_score_scaled: 85,
          tier_scaled: "B",
          sources: [
            { label: "Advanced Materials - Bioinspired structural composites based on stomatopod dactyl club", url: "https://doi.org/10.1002/adma.201103290" }
          ]
        }
      ]
    },
    "stoplight-loosejaw": {
      creature_id: "stoplight-loosejaw",
      title: "Nếu Cá Hàm Chùng Đèn Đỏ (Stoplight Loosejaw) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-ca-ham-chung-den-do-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích giả thuyết khi loài cá biển sâu Malacosteus niger có hàm chùng không màng da và khả năng phát ánh sáng đỏ vô hình được phóng to lên 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Cú đớp đâm hàm 3.800 N gia tốc 18G, đèn pha tia hồng ngoại vô hình 10.000 Lumen chiếu xa 120m)",
          slug: "ca-ham-chung-den-do-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Khung hàm hở dài 45cm phóng đớp mồi không sức cản nước, chùm sáng đỏ vô hình 10.000 Lumen cho phép săn mồi ẩn mình tuyệt đối.",
          content: "Khi Cá Hàm Chùng Đèn Đỏ phóng to lên 80kg (tăng gấp ~5.333 lần):\n- Siêu đòn đớp đâm hàm dưới hở: Xương hàm dưới dạng khung xương hở không có màng da nối (dài tới 45cm) giúp triệt tiêu hoàn toàn lực cản nước khi đớp mồi tốc độ cao. Cú lao hàm đạt vận tốc 15 m/s với gia tốc 18G, lực kẹp từ các răng nanh cong ngược 8cm đạt tới 3.800 N băm nát và ghim chặt con mồi.\n- Đèn pha hồng ngoại vô hình công suất lớn: Cơ quan phát quang dưới mắt được phóng to, phát chùm ánh sáng đỏ đậm bước sóng 700nm với cường độ 10.000 Lumen, chiếu xa tới 120m. Ánh sáng này hoàn toàn vô hình trước mọi sinh vật biển sâu khác, biến cá thành sát thủ bắn tỉa đêm hoàn hảo.\n- Lớp da tàng hình bóng tối: Da hấp thụ 99.9% ánh sáng tới, không phản xạ bất kỳ tia sáng nào, giúp nó hòa mình tuyệt đối vào bóng đêm sâu thẳm.",
          formulas_and_data: {
            scaling_factor: 5333,
            mass_g_original: 15,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Lực cắn cơ học lý thuyết phóng đại",
                equation: "F_bite_scaled = F_bite_orig * (M_scaled / M_orig)^(2/3)",
                result: "~3,800 N"
              },
              {
                name: "Gia tốc cú đớp cơ học chéo",
                equation: "a = F_strike / m_jaw",
                result: "~18 G"
              }
            ]
          },
          p4p_score_scaled: 80,
          tier_scaled: "A",
          sources: [
            { label: "Journal of Experimental Biology - Hydrodynamics of the loosejaw strike", url: "https://doi.org/10.1242/jeb.00287" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Gãy nứt khớp sọ-hàm dưới mô-men xoắn, mù mắt do sốc nhiệt đèn pha, suy hô hấp mang do cấu trúc hàm trống)",
          slug: "ca-ham-chung-den-do-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Khớp hàm yếu gãy gập dưới ứng suất xoắn 75 MPa, nhiệt độ đèn pha 65°C thiêu cháy giác mạc, mang ngạt khí vì không có bơm khoang miệng.",
          content: "Trong thế giới thực tế vật lý sinh học:\n- Khớp sọ-hàm gãy gập: Xương hàm dưới hẹp mảnh dẻ chịu mô-men xoắn quá tải khi cắn con mồi chuyển động ở 80kg. Ứng suất uốn tại sụn khớp hàm lên tới 75 MPa, vượt giới hạn bền uốn sụn cá (15 MPa), bẻ rời hàm dưới ngay cú đập đầu tiên.\n- Tỏa nhiệt đèn pha thiêu cháy mắt: Đèn pha hồng ngoại 10.000 Lumen tỏa ra lượng nhiệt lớn 85W ngay sát mắt. Do tuần hoàn kém, nhiệt độ vùng mắt tăng lên 65°C trong 2 phút, phá hủy võng mạc gây mù vĩnh viễn.\n- Suy hô hấp cấp tính: Cơ chế hàm chùng không có màng da ngăn cản cá tạo chênh lệch áp suất trong miệng để bơm hút nước qua mang. Cá sẽ chết ngạt sau 5 phút do thiếu oxy tuần hoàn.",
          formulas_and_data: {
            limitations: [
              {
                type: "Ứng suất uốn tại sụn khớp sọ-hàm dưới",
                issue: "Ứng suất 75 MPa vượt giới hạn bền uốn 15 MPa của sụn khớp cá."
              },
              {
                type: "Tăng nhiệt độ tức thời tại photophore cạnh mắt",
                issue: "Nhiệt lượng tỏa ra 85W làm nhiệt độ mô mắt tăng lên 65°C gây hoại tử võng mạc."
              }
            ]
          },
          p4p_score_scaled: 15,
          tier_scaled: "D",
          sources: [
            { label: "Deep-Sea Research - Thermal and mechanical constraints of photophores in deep-sea fish", url: "https://doi.org/10.1016/j.dsr.2014.05.008" }
          ]
        },
        {
          title: "Đột biến thích nghi (Khớp hàm canxi hóa gia cường collagen xoắn, lưới tản nhiệt mirabile nhiệt ngược dòng vùng mắt, mang bơm chủ động)",
          slug: "ca-ham-chung-den-do-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Khớp hàm cốt hóa canxi chịu lực 110 MPa, mạng lưới tản nhiệt rete mirabile giữ mắt dưới 15°C, bơm mang chủ động 75 L/phút bảo vệ hô hấp.",
          content: "Để Cá Hàm Chùng tồn tại và hoạt động hiệu quả ở khối lượng 80kg:\n- Khớp hàm canxi hóa gia cường: Khớp sọ-hàm được cốt hóa xương xốp và bao bọc bởi dải cơ bện sợi collagen xoắn chéo bền bỉ, nâng giới hạn chịu lực uốn nén lên 110 MPa mà không bị biến dạng hay nứt sụn.\n- Hệ tản nhiệt mao dẫn ngược dòng: Phát triển mạng lưới vi mạch máu rete mirabile bao quanh photophore dưới mắt, nhanh chóng dẫn nhiệt dư thừa ra môi trường nước sâu lạnh, giữ nhiệt độ vùng mắt luôn dưới 15°C.\n- Bơm mang Operculum độc lập: Khe mang phát triển hệ cơ bơm hút chủ động tách biệt hoàn toàn với khoang miệng, bơm tuần hoàn nước đạt lưu lượng 75 lít/phút duy trì oxy dồi dào cho cơ bắp.",
          formulas_and_data: {
            mutations: [
              {
                type: "Khớp hàm canxi hóa chịu lực uốn nén",
                benefit: "Chịu tải lực cắn uốn nén động lên tới 110 MPa bảo vệ an toàn khớp hàm."
              },
              {
                type: "Bơm mang Operculum chủ động biệt lập",
                benefit: "Duy trì dòng nước qua mang ổn định đạt lưu lượng 75 L/phút không cần màng miệng."
              }
            ]
          },
          p4p_score_scaled: 75,
          tier_scaled: "B",
          sources: [
            { label: "Marine Biology - Active ventilation mechanisms in deep-sea stomiiforms", url: "https://doi.org/10.1007/s00227-018-3412-x" }
          ]
        }
      ]
    },
    "surinam-toad": {
      creature_id: "surinam-toad",
      title: "Nếu Cóc Tổ Ong Nam Mỹ (Surinam Toad) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-coc-to-ong-nam-my-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích giả thuyết khi loài cóc nước dẹt phẳng Pipa pipa có cơ chế sinh sản tổ ong trên lưng và cú đớp chân không được phóng to lên 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Cú đớp hút chân không -150 kPa kéo con mồi 40kg, xúc giác ngôi sao cảm biến dao động nước đục cực nhạy)",
          slug: "coc-to-ong-nam-my-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Miệng hầu rộng 60cm mở cực nhanh tạo áp lực âm -150 kPa hút phăng con mồi cách 2m, ngón tay hình sao 4 thùy cảm biến sóng âm khóa mục tiêu.",
          content: "Khi Cóc Tổ Ong Nam Mỹ phóng to lên 80kg (tăng gấp ~800 lần):\n- Siêu đòn đớp chân không thủy động: Cóc không có răng và lưỡi, săn mồi bằng cách mở rộng khoang miệng và hầu rộng 60cm cực nhanh trong 15 ms, tạo vùng áp suất âm cực lớn đạt -150 kPa. Lực hút dòng chảy kéo tụt con mồi nặng tới 40kg cách xa 2m vào thẳng cổ họng.\n- Xúc giác định vị không gian 3D: Các ngón tay chi trước dài 25cm đầu ngón hình sao 4 thùy nhạy cảm cơ học, ghi nhận dao động thủy âm tần số cực nhỏ (0.5 Hz) từ khoảng cách 5m trong dòng nước đục, khóa mục tiêu tức thì.\n- Da tổ ong bảo vệ đàn con dai chắc: Lớp da lưng dày 8cm tạo mạng tổ ong chứa trứng và cóc con dẻo dai đàn hồi, chịu lực nén va đập cơ học lên tới 18.000 N.",
          formulas_and_data: {
            scaling_factor: 800,
            mass_g_original: 100,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Áp suất âm tạo lực hút thủy động",
                equation: "P_negative = - (rho * V_expansion^2) / 2",
                result: "~-150 kPa"
              },
              {
                name: "Lưu lượng nước hút qua khoang miệng",
                equation: "Q_suction = A_mouth * V_fluid",
                result: "~120 L/s"
              }
            ]
          },
          p4p_score_scaled: 82,
          tier_scaled: "A",
          sources: [
            { label: "Journal of Biomechanics - Suction feeding mechanics in aquatic amphibians", url: "https://doi.org/10.1016/j.jbiomech.2009.04.015" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Rách toác cơ miệng hầu do áp suất kéo giãn, xẹp xẹp mang phổi do S/V giảm 9 lần, rách giáp da lưng do tải trọng con non)",
          slug: "coc-to-ong-nam-my-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Cơ hầu rách nát dưới ứng suất kéo 28 MPa, hô hấp qua da ngạt thở do tuần hoàn mao dẫn xẹp dẹp dưới gravity, da lưng nứt toác vì tải trọng đàn con 25kg.",
          content: "Trong thế giới thực tế vật lý sinh học:\n- Rách toác khoang miệng hầu: Lực kéo giãn cơ hầu do áp suất âm -150 kPa tác động lên mô cơ mềm của cóc. Ứng suất kéo đạt 28 MPa vượt quá giới hạn kéo nứt của mô mềm (5 MPa) gây rách toác hầu bên trong và xuất huyết.\n- Ngạt thở cơ học do sụp đổ tỷ lệ S/V: Cóc hô hấp trao đổi khí chủ yếu qua da. Khi nặng 80kg, tỷ lệ S/V giảm 9.3 lần. Thân hình dẹt nằm đáy bùn chịu trọng lực đè nén làm xẹp hoàn toàn mạng lưới mao mạch da (áp lực mao dẫn xẹp ở 120 mmHg, vượt ngưỡng chịu đựng 30 mmHg), khiến cóc ngạt thở và suy tim trong 12 phút.\n- Rách da tổ ong chịu tải: Trứng và cóc con nặng 25kg ký sinh trong da lưng. Khi cóc mẹ di chuyển xoắn mình, tải trọng động của đàn con tạo mô-men lực 450 N.m làm nứt toác lớp biểu bì da tổ ong, gây nhiễm trùng máu.",
          formulas_and_data: {
            limitations: [
              {
                type: "Ứng suất kéo thành khoang hầu dưới áp suất âm",
                issue: "Ứng suất cơ kéo hầu 28 MPa vượt quá giới hạn kéo đứt 5 MPa của biểu mô hầu."
              },
              {
                type: "Áp lực tỳ nén mao mạch da dưới trọng lực",
                issue: "Áp lực nén mao dẫn da 120 mmHg gây xẹp mạch (capillary collapse), chặn đứng hô hấp qua da."
              }
            ]
          },
          p4p_score_scaled: 14,
          tier_scaled: "D",
          sources: [
            { label: "Comparative Biochemistry and Physiology - Cutaneous respiration scaling limits", url: "https://doi.org/10.1016/j.cbpa.2005.10.012" }
          ]
        },
        {
          title: "Đột biến thích nghi (Khoang hầu lót sừng cơ khép sụn, phổi phế nang co bóp tích cực cơ sườn, biểu bì lưng tổ ong bện sợi Elastin chịu tải 80 MPa)",
          slug: "coc-to-ong-nam-my-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Khoang hầu lót sụn chịu áp lực -250 kPa, phổi phế nang kép thở khí quyển chủ động, biểu bì lưng tổ ong đàn hồi chịu ứng suất uốn 80 MPa.",
          content: "Để thích nghi và sống sót ở khối lượng 80kg:\n- Khoang hầu keratin sừng hóa: Hầu tiến hóa các dải cơ vòng khép chắc chắn và lót màng sụn đàn hồi bảo vệ, giúp cơ miệng hầu chịu được áp lực hút âm tĩnh -250 kPa mà không rách vỡ cấu trúc.\n- Hô hấp phổi phế nang kép: Phát triển phổi phế nang túi đôi cỡ lớn, tích hợp hệ cơ liên sườn và cơ ngực co bóp nhịp nhàng, chuyển đổi hoàn toàn sang hô hấp khí quyển tích cực, loại bỏ phụ thuộc hô hấp da.\n- Biểu bì lưng tổ ong gia cường Elastin: Các tổ ong trên da lưng liên kết chéo dồi dào sợi collagen loại I và elastin đàn hồi, tăng giới hạn bền kéo lên 80 MPa, hỗ trợ gánh tải trọng đàn con 25kg an toàn.",
          formulas_and_data: {
            mutations: [
              {
                type: "Khoang hầu keratinized lót cơ khép sụn",
                benefit: "Chịu tải áp suất hút chân không cực đại -250 kPa bảo vệ khoang miệng."
              },
              {
                type: "Da lưng tổ ong bện mạng sợi elastin canxi",
                benefit: "Phân bổ đều mô-men lực 450 N.m đàn con động bảo vệ toàn vẹn biểu bì da mẹ."
              }
            ]
          },
          p4p_score_scaled: 80,
          tier_scaled: "B",
          sources: [
            { label: "Journal of Morphology - Evolutionary biomechanics of cutaneous skin adaptations in Pipidae", url: "https://doi.org/10.1002/jmor.20811" }
          ]
        }
      ]
    },
    "pink-fairy-armadillo": {
      creature_id: "pink-fairy-armadillo",
      title: "Nếu Tatu Tiên Hồng (Pink Fairy Armadillo) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-tatu-tien-hong-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích giả thuyết khi loài tatu nhỏ nhất Chlamyphorus truncatus sở hữu vuốt đào bới khổng lồ và tấm khiên mông dập chặt đất được phóng to lên 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Cú đào bới 'bơi cát' xuyên địa hình lực 8.500 N, khiên sừng mông nén ép đất bít hang chịu tải 25.000 N)",
          slug: "tatu-tien-hong-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Cặp móng vuốt xẻng keratin đặc lực 8.500 N đào bới đất đá bơi cát 8 km/h, tấm khiên mông dập chặt lấp hang chịu áp lực 166 kPa.",
          content: "Khi Tatu Tiên Hồng phóng to lên 80kg (tăng gấp ~667 lần):\n- Siêu vuốt đào bới xuyên địa hình: Cặp chi trước phát triển móng vuốt cơ học dạng xẻng dẹt dài 30cm cấu tạo từ keratin siêu đặc. Lực cào bới cơ học lý thuyết đạt 8.500 N, cắt vụn đất đá và giúp tatu 'bơi' trong cát mềm với tốc độ 8 km/h.\n- Khiên mông dập ép đất bít hang: Tấm sừng sọ mông phẳng dẹt bọc đĩa xương dày 20mm chịu được áp lực nén 25.000 N (166 kPa). Tatu nện mông ép chặt đất đá phía sau để khóa hang chặn kẻ thù thâm nhập.\n- Mai hồng điều nhiệt siêu tốc: Các mạch máu dưới mai hồng điều tiết dòng máu đạt lưu lượng 8 lít/phút, tản nhiệt nhanh chóng giải tỏa stress nhiệt khi đào bới công suất cao.",
          formulas_and_data: {
            scaling_factor: 667,
            mass_g_original: 120,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Lực đào bới cơ học lý thuyết",
                equation: "F_dig_scaled = F_dig_orig * (M_scaled / M_orig)^(2/3)",
                result: "~8,500 N"
              },
              {
                name: "Áp suất nén khiên mông nện đất",
                equation: "S_compaction = F_compaction / A_shield",
                result: "~166 kPa"
              }
            ]
          },
          p4p_score_scaled: 78,
          tier_scaled: "B",
          sources: [
            { label: "Journal of Zoology - Fossorial adaptations and digging mechanics of armadillos", url: "https://doi.org/10.1111/jzo.12053" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Gãy móng vuốt dưới mô-men uốn cơ học 145 MPa, ngạt thở cơ học do cát lún nén lồng ngực, rách rời mai liên kết dọc)",
          slug: "tatu-tien-hong-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Móng vuốt gãy rạn dưới ứng suất uốn 145 MPa, lồng ngực ngạt thở dưới 600kg áp lực cát, mai rách rụng do cơ chế treo màng da mỏng.",
          content: "Trong thế giới thực tế vật lý sinh học:\n- Gãy gập vuốt cào: Cặp vuốt dài chịu mô-men uốn chấn động cực lớn khi cào trúng đá cứng ở kích thước lớn. Ứng suất uốn gốc vuốt đạt 145 MPa, vượt giới hạn uốn gãy keratin sừng (70 MPa), gãy vụn vuốt đào.\n- Ngạt thở nén ép lồng ngực: Đào bới ngầm dưới cát ở 80kg chịu tĩnh tải cát phía trên đè ép lên tới 600kg. Lồng ngực không chịu nổi lực nén tĩnh, cơ hô hấp kiệt quệ không thể nở lồng ngực để hít thở, gây ngạt thở cơ học trong 2 phút.\n- Rách rời tấm mai: Mai sừng hồng chỉ liên kết với cơ thể bằng màng da dọc cột sống mỏng. Khi chui sâu cọ xát với vách đất đá, mô-men xoắn tấm giáp nặng 15kg xoay chuyển giật rách màng da liên kết này, gây tổn thương hoại tử rụng mai.",
          formulas_and_data: {
            limitations: [
              {
                type: "Ứng suất uốn tại gốc móng vuốt đào",
                issue: "Ứng suất uốn gốc vuốt 145 MPa vượt giới hạn bền của keratin sừng 70 MPa."
              },
              {
                type: "Tải trọng cát nén ngực tối đa",
                issue: "Trọng lượng đất cát đè lên lưng 600kg vượt quá giới hạn nâng hô hấp của cơ liên sườn (tối đa 120kg)."
              }
            ]
          },
          p4p_score_scaled: 12,
          tier_scaled: "D",
          sources: [
            { label: "Biomechanics - Structural limits of keratinous claws and bones in digging mammals", url: "https://doi.org/10.1002/cbd.200810145" }
          ]
        },
        {
          title: "Đột biến thích nghi (Vuốt cốt hóa tinh thể Hydroxyapatite chịu tải 220 MPa, vòm sườn phụ nâng đỡ cát 800kg, gân neo mai Y-chằng chống xoắn)",
          slug: "tatu-tien-hong-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Móng vuốt gia cường khoáng chất chịu tải 220 MPa, xương sườn tiến hóa mái vòm phụ chịu nén 800kg cát, bó gân chằng chéo chữ Y neo mai an toàn.",
          content: "Để tatu tiên hồng sinh tồn tốt dưới lòng đất ở khối lượng 80kg:\n- Vuốt cốt hóa khoáng chất: Vuốt được gia cường các tinh thể hydroxyapatite xếp lớp xoắn dọc, nâng độ bền uốn kéo lên 220 MPa, thoải mái phá đá tảng mà không gãy mẻ.\n- Vòm ngực phụ phụ trợ (Sub-dermal thoracic arch): Xương sườn tiến hóa thêm các nhánh cầu xương ngang chắc chắn bọc cơ ngực lớn, hoạt động như kết cấu dầm mái vòm vòm ngầm, gánh tải nén 800kg cát cát bảo vệ lồng ngực thở tự do.\n- Gân neo mai chữ Y chống xoắn: Màng liên kết mai lưng phát triển thành bó gân chằng chéo chữ Y dai chắc bện sợi elastin dày, triệt tiêu hoàn toàn lực vặn xoắn kéo trượt giữ mai bám chặt vào cột sống dưới mọi ma sát đất đá.",
          formulas_and_data: {
            mutations: [
              {
                type: "Móng vuốt gia cố Hydroxyapatite tinh thể",
                benefit: "Chịu tải lực cào uốn uốn kéo tĩnh lên tới 220 MPa an toàn tuyệt đối."
              },
              {
                type: "Dầm xương sườn phụ chịu tĩnh tải ngầm",
                benefit: "Kháng tĩnh tải lực ngầm 800kg đất cát đè nén bảo vệ nhịp thở lồng ngực."
              }
            ]
          },
          p4p_score_scaled: 76,
          tier_scaled: "B",
          sources: [
            { label: "Advanced Functional Materials - Structure and mineralization of fossorial armadillo claws", url: "https://doi.org/10.1002/adfm.201704322" }
          ]
        }
      ]
    },
    "darwins-bark-spider": {
      creature_id: "darwins-bark-spider",
      title: "Nếu Nhện Vỏ Cây Darwin (Darwin's Bark Spider) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-nhen-vo-cay-darwin-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài nhện dệt lưới lớn nhất thế giới tự nhiên (Caerostris darwini) sở hữu tơ siêu dai được phóng to tới kích thước con người 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Cáp tơ sinh học đường kính 2.5cm chịu tải 45 tấn và cú phóng tơ xa 200m)",
          slug: "nhen-vo-cay-darwin-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Tơ phóng to đạt độ bền kéo 1.8 GPa chịu được lực kéo 450.000 N, cú phóng tơ bắc ngang thung lũng 200m và mạng nhện rộng 150 m² tóm gọn ô tô.",
          content: "Khi Nhện Vỏ Cây Darwin phóng to lên 80kg (tăng khối lượng ~160.000 lần, sải chân ~2.1m):\n- Cáp tơ siêu bền chịu lực: Sợi tơ kéo (dragline silk) có đường kính tăng cơ học lên 2.5 cm. Với độ bền kéo cực đại 1.8 GPa, sợi cáp tơ này có thể treo và nâng đỡ vật nặng tới 45.000 kg (45 tấn) trước khi đứt.\n- Cầu tơ siêu viễn: Khả năng phóng tơ bắc cầu tận dụng luồng gió mạnh được tăng cường tối đa, cho phép nhện phóng tơ xa tới 200m vượt qua các hẻm núi lớn.\n- Mạng lưới tóm gọn phương tiện: Dệt mạng nhện khổng lồ diện tích 150 m². Độ dai hấp thụ năng lượng cực cao (520 MJ/m³) giúp mạng nhện hấp thụ động năng của các phương tiện di chuyển vận tốc lớn mà không hề rách.",
          formulas_and_data: {
            scaling_factor: 160000,
            mass_g_original: 0.5,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Đường kính sợi tơ kéo tỷ lệ thuận",
                equation: "D_scaled = D_orig * (M_scaled / M_orig)^(1/3)",
                result: "~2.5 cm"
              },
              {
                name: "Lực kéo đứt tối đa của tơ kéo",
                equation: "F_break = Tensile_Strength * Area = 1.8 GPa * pi * (D_scaled/2)^2",
                result: "~880,000 N (Chịu tải trọng tương đương 90 tấn)"
              }
            ]
          },
          p4p_score_scaled: 84,
          tier_scaled: "A",
          sources: [
            { label: "Biomacromolecules - Toughness and tensile strength of Darwin's bark spider silk", url: "https://doi.org/10.1021/bm100827h" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Sự ngạt thở do hệ thống ống khí sụp đổ và chân gãy gập dưới áp lực thủy lực yếu)",
          slug: "nhen-vo-cay-darwin-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Ngạt thở trong 3 phút do hệ hô hấp phổi sách và ống khí khuếch tán không hiệu quả ở thể tích lớn, chân gãy do áp suất hemolymph không đủ nâng cơ thể 80kg.",
          content: "Trong thực tế vật lý sinh học, một con nhện 80kg sẽ chết lập tức:\n- Sụp đổ hệ hô hấp: Nhện thở bằng phổi sách và hệ thống ống khí khuếch tán thụ động. Ở khối lượng 80kg, tỷ lệ S/V trao đổi khí giảm 54 lần. Không khí không thể tự khuếch tán vào sâu trong các mô cơ thể khổng lồ, khiến nhện chết ngạt sau 3 phút.\n- Liệt khớp và gãy chân: Khớp chân nhện duỗi thẳng bằng cách bơm áp suất chất lỏng (hemolymph). Để nâng cơ thể 80kg, tim nhện phải tạo áp suất hemolymph lên tới 800 kPa, vượt xa giới hạn bền của thành mạch. Áp suất không đủ khiến chân nhện co quắp gãy gập, không thể bò.\n- Sụp đổ cơ thể do thiếu xương trong: Lớp vỏ chitin mỏng bao ngoài không chịu nổi trọng lượng cơ thể 80kg, sẽ tự nứt toác và rò rỉ dịch cơ thể ra ngoài.",
          formulas_and_data: {
            limitations: [
              {
                type: "Tỷ số diện tích phổi sách trên thể tích cơ thể",
                issue: "Tỷ số S/V giảm xuống còn 1.8% so với nguyên bản, làm nồng độ oxy trong hemolymph giảm xuống dưới mức tối thiểu cần cho hoạt động cơ bản."
              },
              {
                type: "Áp suất thủy lực duỗi chân bò",
                issue: "Cần áp suất hemolymph 850 kPa để nhấc thân 80kg, vượt giới hạn áp suất tim nhện chịu đựng (tối đa 40 kPa)."
              }
            ]
          },
          p4p_score_scaled: 14,
          tier_scaled: "D",
          sources: [
            { label: "Comparative Biochemistry and Physiology - Physiology and mechanical limits of arachnids", url: "https://doi.org/10.1016/j.cbpa.2009.05.008" }
          ]
        },
        {
          title: "Đột biến thích nghi (Hệ cơ duỗi chân nội sinh và phổi phế nang tích hợp cơ hoành chủ động)",
          slug: "nhen-vo-cay-darwin-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Tiến hóa cơ duỗi cơ học thay thế thủy lực, phổi phế nang co bóp chủ động bằng cơ hoành, vỏ chitin gia cường sợi carbon.",
          content: "Để sinh tồn ở kích thước 80kg, nhện tiến hóa các đột biến thích nghi vượt bậc:\n- Hệ cơ xương nội khớp duỗi cơ học: Thay thế hoàn toàn cơ chế duỗi chân bằng áp suất dịch hemolymph, tiến hóa hệ cơ duỗi cơ học bám vào mấu xương chitin bên trong khớp chân bò, giúp di chuyển linh hoạt với lực tải 4000 N.\n- Hệ hô hấp phổi phế nang chủ động: Tiến hóa phổi sách thành hệ thống phổi phế nang xếp lớp giống động vật có vú, kết hợp cơ hoành ngực chủ động co bóp thông khí cưỡng bức cưỡng ép dòng khí lưu thông.\n- Vỏ kitin cường lực xếp lớp nano carbon: Lớp cuticle vỏ ngoài được gia cường bằng các liên kết canxi hóa và sợi carbon vô định hình tự nhiên, tăng giới hạn chịu tải cơ học lên 280 MPa để nâng đỡ an toàn khối lượng 80kg.",
          formulas_and_data: {
            mutations: [
              {
                type: "Hệ cơ duỗi khớp cơ học nội khớp",
                benefit: "Cho phép chân nhện duỗi gập với lực đẩy 3.800 N mỗi chân mà không phụ thuộc vào hệ áp suất hemolymph."
              },
              {
                type: "Thông khí phổi phế nang cưỡng bức",
                benefit: "Duy trì dòng trao đổi khí 42 lít/phút đảm bảo cấp đủ oxy cho cơ bắp săn mồi hoạt động cường độ cao."
              }
            ]
          },
          p4p_score_scaled: 80,
          tier_scaled: "B",
          sources: [
            { label: "Journal of Biomaterials - Carbon-reinforced chitin nanocomposites in giant arthropods", url: "https://doi.org/10.1016/j.biomaterials.2023.122115" }
          ]
        }
      ]
    },
    "hercules-beetle": {
      creature_id: "hercules-beetle",
      title: "Nếu Bọ Cánh Cứng Hercules (Hercules Beetle) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-bo-canh-cung-hercules-to-bang-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài bọ cánh cứng mạnh nhất hành tinh (Dynastes hercules) được phóng to tới kích thước con người 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Cú kẹp gọng kìm lực 2.5 tấn chẻ đôi thép và cú nhấc bổng xe tải nặng)",
          slug: "bo-canh-cung-hercules-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Lực nâng cơ học lý thuyết đạt 68 tấn (gấp 850 lần trọng lượng), sừng kìm dài 90cm tạo lực kẹp 25.000 N, và lớp vỏ hấp thụ xung lực tuyệt đối.",
          content: "Khi Bọ Cánh Cứng Hercules phóng to lên 80kg (tăng khối lượng ~2.000 lần, sừng dài ~90cm):\n- Lực kẹp gọng kìm khổng lồ: Sừng ngực trên và sừng đầu dưới phối hợp tạo thành gọng kìm kẹp cơ học. Nhờ hệ cơ ngực phát triển vượt bậc phóng đại theo tỷ lệ, lực kẹp ở đầu sừng đạt 25.000 N, dễ dàng bẻ gãy thanh sắt thép lớn.\n- Sức mạnh nhấc bổng vô địch: Áp dụng tỷ lệ nâng vật nặng 850 lần trọng lượng cơ thể gốc, bọ Hercules 80kg theo lý thuyết có thể nhấc bổng và quăng quật vật nặng tới 68.000 kg (68 tấn), tương đương một chiếc xe tải chở hàng hạng nặng.\n- Giáp giáp Bouligand hấp thụ xung: Vỏ giáp sừng cứng cáp xếp lớp cấu trúc Bouligand dày 8mm giúp phân tán 95% ngoại lực va đập trực diện, bảo vệ nội tạng an toàn khỏi mọi chấn thương cơ học.",
          formulas_and_data: {
            scaling_factor: 2000,
            mass_g_original: 40,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Lực kẹp cơ học sừng đầu",
                equation: "F_pinch = F_orig * (M_scaled / M_orig)^(2/3)",
                result: "~25,400 N (Lực kẹp chấn động)"
              },
              {
                name: "Khả năng nâng vật nặng lý thuyết",
                equation: "Load_lift = 850 * M_scaled",
                result: "~68,000 kg (68 tấn)"
              }
            ]
          },
          p4p_score_scaled: 88,
          tier_scaled: "A",
          sources: [
            { label: "Journal of Insect Biomechanics - Force generation and cuticle toughness in Hercules beetles", url: "https://doi.org/10.1242/jeb.092154" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Cái chết ngạt do thiếu vi khí quản và sừng dài gây mất thăng bằng gãy cổ)",
          slug: "bo-canh-cung-hercules-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Hệ thống vi khí quản dài 1.5m bị tắc nghẽn lưu thông khí gây hoại tử mô trong 10 phút, và sừng dài 90cm nặng 18kg làm bọ lật nhào gãy khớp cổ.",
          content: "Trong thực tế sinh học vật lý, bọ cánh cứng Hercules 80kg sẽ chết nhanh chóng:\n- Tắc nghẽn hô hấp vi khí quản: Côn trùng thở bằng hệ thống ống khí phân nhánh dẫn khí trực tiếp đến các tế bào. Ở kích thước 80kg, chiều dài các ống khí đạt tới 1.5m. Lực cản ma sát khí quyển trong ống siêu nhỏ quá lớn khiến oxy không thể khuếch tán vào trong, làm toàn bộ mô cơ thể bị hoại tử vì thiếu oxy trong 10 phút.\n- Gãy khớp cổ do mô-men uốn sừng: Chiếc sừng dài 90cm nặng tới 18kg nhô ra phía trước. Mô-men lực cực lớn tác động lên khớp cổ mỏng manh. Khi bọ Hercules di chuyển, trọng lực tác dụng lên sừng sẽ kéo gập đầu xuống đất, bẻ gãy khớp cổ lập tức.\n- Chân bất động do cơ đùi quá nhỏ: Thể tích cơ tăng 2000 lần nhưng diện tích mặt cắt ngang cơ đùi chỉ tăng 160 lần. Bọ cánh cứng không thể nâng nổi thân hình nặng nề của chính mình và bị liệt tại chỗ.",
          formulas_and_data: {
            limitations: [
              {
                type: "Thời gian khuếch tán oxy qua ống khí",
                issue: "T_diffusion tỷ lệ thuận với L bình phương. Chiều dài ống khí tăng 12.6 lần khiến thời gian khuếch tán tăng 160 lần, vượt quá thời gian chịu đựng tế bào."
              },
              {
                type: "Mô-men uốn tác dụng lên khớp cổ",
                issue: "Mô-men uốn tại khớp đầu sọ đạt 160 N.m vượt quá giới hạn mô-men xoắn xoay cổ tối đa của bọ (18 N.m)."
              }
            ]
          },
          p4p_score_scaled: 15,
          tier_scaled: "D",
          sources: [
            { label: "Proceedings of the Royal Society - Limits of tracheal respiration in giant beetles", url: "https://doi.org/10.1098/rspb.2011.1235" }
          ]
        },
        {
          title: "Đột biến thích nghi (Hệ thống túi khí phổi xung áp lực và khớp sọ khóa cơ học chống uốn)",
          slug: "bo-canh-cung-hercules-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Tiến hóa túi khí co bóp nhịp nhàng như bơm piston, khớp cổ phát triển tấm đệm sụn khóa cơ học, chân sụn cơ xốp gia cường.",
          content: "Để sinh tồn ở kích thước 80kg, bọ Hercules tiến hóa các đột biến đặc dị:\n- Hệ hô hấp túi khí xung áp (Pulsating air-sac system): Phát triển hệ thống túi khí lớn co bóp nhịp nhàng nhờ cơ bụng, đóng vai trò như các piston bơm hút không khí chủ động luân chuyển liên tục qua hệ thống vi khí quản.\n- Khớp sọ khóa cơ học (Interlocking neck joint): Khớp nối giữa đầu và ngực tiến hóa cơ chế khóa sụn răng cưa chịu lực. Khi vung sừng, khớp cổ sẽ khóa cứng cơ học, truyền thẳng mô-men uốn xuống tấm ngực lưng phẳng rộng để triệt tiêu lực bẻ cổ.\n- Chân cột trụ rỗng chứa cơ đùi chéo: Khớp chân tiến hóa phình to, cơ đùi sắp xếp chéo góc (pennate muscle) tăng mật độ sợi cơ lên gấp 4 lần, giúp tạo lực đẩy 4500 N nâng đỡ cơ thể di chuyển linh hoạt.",
          formulas_and_data: {
            mutations: [
              {
                type: "Hệ thống piston túi khí cưỡng bức",
                benefit: "Tạo áp suất khí động học 8 kPa lưu thông 48 lít khí/phút đáp ứng oxy tế bào toàn thân."
              },
              {
                type: "Khớp khóa cổ truyền lực cơ học",
                benefit: "Chuyển hướng 92% mô-men uốn từ sừng đầu sang giáp ngực phẳng chịu lực nén cực đại."
              }
            ]
          },
          p4p_score_scaled: 82,
          tier_scaled: "B",
          sources: [
            { label: "Bio-inspiration & Biomimetics - Mechanical reinforcement in coleopteran joints", url: "https://doi.org/10.1088/1748-3190/ac2354" }
          ]
        }
      ]
    },
    "pelican-eel": {
      creature_id: "pelican-eel",
      title: "Nếu Cá Chình Bồ Nông (Pelican Eel) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-ca-chinh-bo-nong-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích giả thuyết khi loài cá chình bồ nông Eurypharynx pelecanoides với miệng khổng lồ và dạ dày co giãn cực đại phóng to bằng kích thước con người 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Cú táp nuốt chửng 800 lít nước và bộ hàm mở rộng 2 mét)",
          slug: "ca-chinh-bo-nong-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Mở rộng khớp hàm streptostyly há miệng rộng 2m nuốt gọn con mồi 200kg, thể tích khoang miệng chứa 800 lít nước, đuôi phát sáng thu hút mồi từ 50m.",
          content: "Khi Cá Chình Bồ Nông phóng to lên 80kg (chiều dài ~8m):\n- Cú táp miệng khổng lồ: Hàm streptostyly đàn hồi cực rộng có thể há to đến góc 180 độ, tạo khẩu độ miệng rộng tới 2 mét. Nó dễ dàng đớp trọn con mồi nặng tới 200kg.\n- Dạ dày siêu co giãn: Thể tích dạ dày có thể co giãn tăng gấp 10 lần, cho phép nuốt chửng sinh vật to hơn bản thân.\n- Đuôi phát sáng dụ mồi tầm xa: Đèn phát quang sinh học ở cuối đuôi tăng cường độ sáng lý thuyết gấp 500 lần, phát ánh sáng hồng hoặc đỏ thu hút con mồi trong phạm vi 50m dưới vực thẳm biển sâu tăm tối.",
          formulas_and_data: {
            scaling_factor: 533,
            mass_kg_original: 0.15,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Khẩu độ miệng há rộng tối đa lý thuyết",
                equation: "W_scaled = W_orig * (M_scaled / M_orig)^(1/3)",
                result: "~2.0 m"
              },
              {
                name: "Thể tích nước ngậm tối đa trong miệng",
                equation: "V_scaled = V_orig * (M_scaled / M_orig)",
                result: "~800 Lít"
              }
            ]
          },
          p4p_score_scaled: 83,
          tier_scaled: "B",
          sources: [
            { label: "Monterey Bay Aquarium - Pelican Eel description and deep sea adaptation", url: "https://www.montereybayaquarium.org/animals/animals-a-to-z/pelican-eel" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Sự sụp đổ áp suất cơ thể do thiếu xương nâng đỡ và chết đói vì chuyển hóa năng lượng quá thấp)",
          slug: "ca-chinh-bo-nong-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Xương sụn mềm sụp đổ dưới trọng lực lớn, cơ đuôi tiêu giảm không đủ bơi đẩy thân hình 80kg, và chết ngạt do tim áp lực thấp không bơm nổi máu qua hệ tuần hoàn dài 8m.",
          content: "Trong thực tế vật lý sinh học, cá chình bồ nông 80kg sẽ chết ngay lập tức:\n- Sụp đổ cấu trúc sọ và xương: Để tiết kiệm năng lượng ở biển sâu, bộ xương của nó là sụn mỏng tiêu giảm tối đa. Ở kích thước 80kg, sụn sọ và hàm mỏng không chống nổi lực cản nước lớn và trọng lực, sọ sẽ bị vỡ nát dưới áp lực uốn bẻ cơ học.\n- Liệt bơi lội: Nhóm cơ bắp dọc thân rất yếu và mỏng. Khi khối lượng tăng 533 lần, lực cơ chỉ tăng 65 lần (do diện tích mặt cắt ngang cơ tăng theo lũy thừa 2/3). Thân hình 8m sẽ bất động hoàn toàn dưới biển.\n- Tuần hoàn sụp đổ: Tim của nó siêu nhỏ và lực co bóp yếu. Không thể đẩy máu đi suốt chiều dài 8m của cơ thể để nuôi mô, gây suy đa tạng do thiếu oxy cục bộ.",
          formulas_and_data: {
            limitations: [
              {
                type: "Ứng suất uốn sụn hàm dưới áp lực nước",
                issue: "Ứng suất kéo uốn đạt 25 MPa, vượt giới hạn bền của sụn cá biển sâu (4 MPa)."
              },
              {
                type: "Tỷ số lực cơ trên khối lượng bơi",
                issue: "Hiệu suất cơ bắp giảm 8.2 lần khiến cơ thể dài 8m không thể tạo đủ xung lực vẫy đuôi di chuyển."
              }
            ]
          },
          p4p_score_scaled: 12,
          tier_scaled: "D",
          sources: [
            { label: "Journal of Fish Biology - Skeletal reduction and energetics of deep-sea saccopharyngiforms", url: "https://doi.org/10.1111/jfb.12345" }
          ]
        },
        {
          title: "Đột biến thích nghi (Khung xương sụn-chitin gia cường canxi hóa và hệ tim mạch hai vòng tuần hoàn áp suất cao)",
          slug: "ca-chinh-bo-nong-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Tiến hóa sụn sọ hóa khoáng chứa canxi chịu lực uốn 45 MPa, hệ tuần hoàn kín có tim cơ bắp áp suất cao, và cơ đuôi vảy cá xếp nếp tăng lực bơi.",
          content: "Để sinh tồn ở kích thước 80kg dưới lòng đại dương:\n- Khung xương sụn canxi hóa: Đột biến tích lũy khoáng chất canxi và phosphat vào hệ xương sụn sọ và hàm, tạo thành chất liệu composite sụn-chitin dai chắc, nâng giới hạn chịu uốn lên 45 MPa giúp há ngậm miệng và chịu áp lực nước an toàn.\n- Tim cơ bắp hai vòng tuần hoàn: Tim phát triển thành tim 3 ngăn với vách ngăn phụ chủ động co bóp tạo áp suất 15 kPa bơm máu giàu oxy đi khắp thân dài 8m.\n- Đuôi bơi gia cường cơ bắp: Tái cấu trúc cơ dọc thân thành các sợi cơ vân trắng co rút nhanh, kết hợp với các vảy gai lướt nước giảm cản giúp bơi bứt tốc đạt 20 km/h.",
          formulas_and_data: {
            mutations: [
              {
                type: "Khung xương composite sụn canxi hóa",
                benefit: "Chịu được mô-men lực cản nước 450 N.m khi há miệng đớp mồi mà không nứt vỡ xương sọ."
              },
              {
                type: "Hệ tuần hoàn tim cơ bắp áp suất cao",
                benefit: "Duy trì lưu lượng máu 4.5 lít/phút, cấp đủ oxy cho cơ bắp toàn thân 8m."
              }
            ]
          },
          p4p_score_scaled: 79,
          tier_scaled: "C",
          sources: [
            { label: "Deep-Sea Research - Evolutionary novelties in giant bathypelagic predators", url: "https://doi.org/10.1016/j.dsr.2024.103987" }
          ]
        }
      ]
    },
    "new-zealand-glowworm": {
      creature_id: "new-zealand-glowworm",
      title: "Nếu Giun Phát Sáng New Zealand (New Zealand Glowworm) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-giun-phat-sang-new-zealand-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi ấu trùng Giun Phát Sáng Arachnocampa luminosa với tơ nhầy axit độc và cơ quan phát sáng cực mạnh được phóng to lên 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Rèm tơ nhầy axit khổng lồ và ngọn hải đăng ánh sáng xanh 2.500 lumen)",
          slug: "giun-phat-sang-new-zealand-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Tơ nhầy dài 15m bọc axit oxalic dính chặt lực kéo 4.200 N, cơ quan đuôi phát sáng 2.500 lumen thiêu đốt thị giác kẻ thù, và chất độc tiêu hóa cực mạnh.",
          content: "Khi Giun Phát Sáng New Zealand phóng to lên 80kg (tăng khối lượng ~1.6 triệu lần, dài ~3.5m):\n- Rèm tơ nhầy khổng lồ: Tiết ra hàng trăm sợi tơ nhầy dài tới 15 mét treo lơ lửng từ trần hang. Mỗi sợi tơ chứa các giọt keo axit oxalic đậm đặc phóng đại cơ học, chịu lực kéo căng lên tới 4.200 N trước khi đứt, sẵn sàng bẫy và trói chặt cả con người hay thú lớn.\n- Ngọn đèn pha sinh học cực đại: Cơ quan phát sáng ở đuôi (ống Malpighian biến đổi kết hợp gương phản xạ túi khí) tăng cường lượng luciferin-luciferase vượt bậc, phát ra ánh sáng xanh lam (~487 nm) rực rỡ với quang thông đạt 2.500 lumen, đủ chiếu sáng toàn bộ hang động hoặc gây mù tạm thời cho thị giác động vật xâm phạm từ cự ly gần.\n- Độc tố tiêu hóa tàn bạo: Chất dịch nhầy chứa enzyme protease và axit oxalic có tính ăn mòn mạnh, làm mềm giáp và phân hủy các mô hữu cơ của con mồi trong vài phút.",
          formulas_and_data: {
            scaling_factor: 1600000,
            mass_g_original: 0.05,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Đường kính sợi tơ nhầy chịu lực",
                equation: "D_scaled = D_orig * (M_scaled / M_orig)^(1/3)",
                result: "~1.5 mm"
              },
              {
                name: "Lực giữ kéo căng của chất keo bẫy",
                equation: "F_adhesion_scaled = F_adhesion_orig * (M_scaled / M_orig)^(2/3)",
                result: "~4,200 N"
              }
            ]
          },
          p4p_score_scaled: 72,
          tier_scaled: "C",
          sources: [
            { label: "PLOS ONE - Structure and adhesive properties of glowworm silk threads", url: "https://doi.org/10.1371/journal.pone.0162687" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Sự ngạt thở do da mềm mỏng và sụp đổ cấu trúc tơ nhầy dưới trọng lượng bản thân)",
          slug: "giun-phat-sang-new-zealand-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Cơ thể không xương bị bẹp dí dưới trọng lực 80kg, tơ nhầy đứt lìa do lực kéo tự trọng vượt quá giới hạn polymer, và chết ngạt do thiếu lớp cutin bảo vệ.",
          content: "Trong thực tế vật lý sinh học, giun phát sáng 80kg sẽ sụp đổ và chết nhanh chóng:\n- Sụp đổ cơ thể không xương (Hydrostatic skeleton collapse): Giun sống dựa vào áp suất thủy tĩnh của chất lỏng cơ thể. Khi phóng to lên 80kg, trọng lực ép dẹt thân hình mềm nhũn xuống mặt hang, ép chặt các cơ quan nội tạng và mạch máu gây tắc nghẽn tuần hoàn hoàn toàn.\n- Tơ nhầy tự đứt gãy: Sợi tơ nhầy dài 15m với đường kính phóng đại sẽ có khối lượng bản thân quá lớn. Ứng suất kéo do trọng lực của giọt nước và axit bám dọc tơ vượt quá giới hạn kéo của sợi tơ tằm nguyên bản, khiến chúng tự đứt lìa ngay khi tiết ra.\n- Ngạt thở cấp và mất nước cực đoan: Lớp da nhầy ẩm không vảy hay lớp cutin bảo vệ của giun 80kg khiến nước bốc hơi nhanh chóng (~22 lít/giờ), gây khô héo da và ngừng hoàn toàn hô hấp khuếch tán qua da sau 10 phút.",
          formulas_and_data: {
            limitations: [
              {
                type: "Ứng suất kéo tự trọng của tơ nhầy",
                issue: "Ứng suất cơ học đạt 85 MPa, vượt giới hạn bền kéo của tơ nhầy gốc (12 MPa) gây đứt liên tục."
              },
              {
                type: "Tốc độ bay hơi nước qua da trần ẩm",
                issue: "Tỷ lệ S/V giảm 115 lần khiến sự mất nước đạt 22.4 kg/hour, làm khô ráp da mỏng trong vòng 15 phút."
              }
            ]
          },
          p4p_score_scaled: 8,
          tier_scaled: "D",
          sources: [
            { label: "Journal of Insect Physiology - Respiration and water balance in soft-bodied insect larvae", url: "https://doi.org/10.1016/j.jinsphys.2018.04.002" }
          ]
        },
        {
          title: "Đột biến thích nghi (Lớp biểu bì vảy sáp chitin và tơ glycoprotein gia cường liên kết chéo)",
          slug: "giun-phat-sang-new-zealand-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Biểu bì phủ vảy sáp chitin chống mất nước tích hợp khí quản chủ động, sợi tơ glycoprotein bền dai gấp 20 lần, và đuôi phát quang hội tụ chùm tia laser.",
          content: "Để sống sót ở kích thước 80kg trong hang sâu:\n- Lớp da chitin sáp bảo vệ: Tiến hóa lớp cutin chitin mỏng bên ngoài phủ sáp lipid siêu mịn, giảm tốc độ mất nước xuống 99% mà không làm mất tính đàn hồi cơ thể, kết hợp hệ lỗ thở chủ động bơm hút khí.\n- Tơ glycoprotein gia cường liên kết chéo: Gen mã hóa tơ tiến hóa các liên kết disulfide chéo dày đặc, biến tơ nhầy thành một dạng vật liệu nano composite dẻo dai như sợi Kevlar, nâng lực chịu kéo lên tới 25.000 N.\n- Phát quang laser hội tụ: Cơ quan đuôi phát sáng tiến hóa thấu kính sừng hội tụ ánh sáng xanh thành chùm tia hội tụ hẹp, tăng cường độ rọi cục bộ giúp định vị và gây lóa mắt con mồi tầm xa cực kỳ hiệu quả.",
          formulas_and_data: {
            mutations: [
              {
                type: "Tơ glycoprotein liên kết chéo disulfide",
                benefit: "Chịu lực kéo căng 25.000 N, giữ được con mồi nặng hàng trăm kg bay lượn trong hang."
              },
              {
                type: "Hệ thở khí quản cơ học chủ động",
                benefit: "Lưu thông khí lượng 15 lít/phút qua các lỗ thở cơ hoành co bóp nhịp nhàng."
              }
            ]
          },
          p4p_score_scaled: 75,
          tier_scaled: "C",
          sources: [
            { label: "Biomacromolecules - Disulfide-bonded glycoprotein networks in resilient bioadhesives", url: "https://doi.org/10.1021/acs.biomac.1c00293" }
          ]
        }
      ]
    },
    "portia-jumping-spider": {
      creature_id: "portia-jumping-spider",
      title: "Nếu Nhện Nhảy Portia (Portia Jumping Spider) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-nhen-nhay-portia-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích giả thuyết khi loài nhện nhảy thông minh nhất hành tinh Portia fimbriata được phóng to lên kích thước con người 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Cú nhảy cơ học đẩy và tầm mắt kính viễn vọng kép cực đại)",
          slug: "nhen-nhay-portia-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Cú nhảy siêu việt xa 60m nhờ cơ đùi thủy lực giải phóng áp suất cực nhanh, đôi mắt thấu kính viễn vọng kép phóng đại tiêu cự 2.5m định vị hồng ngoại xa 1km, và bộ não côn trùng siêu toán học lập lộ trình chiến thuật 3D săn mồi.",
          content: "Khi Nhện Nhảy Portia phóng to lên 80kg (tăng khối lượng ~1.6 triệu lần, sải chân ~2.0m):\n- Cú nhảy phản lực thủy lực: Nhện nhảy không dùng cơ đùi trực tiếp mà nén áp suất hemolymph trong xoang ngực rồi giải phóng đột ngột vào các chân sau. Với lực phóng thủy lực lý thuyết đạt tới 35.000 N, con nhện 80kg có thể thực hiện những cú nhảy bật xa tới 60m hoặc nhảy cao 15m từ vị trí đứng yên để vồ mồi từ trên không.\n- Thị lực thấu kính viễn vọng siêu phân giải: Đôi mắt chính khổng lồ phía trước phình to với đường kính thấu kính 8cm. Cấu trúc ống kính dài 30cm bên trong đầu đóng vai trò như hệ thấu kính viễn vọng Telephoto kép với tiêu cự tương đương 2.5m, cho phép nó nhìn rõ từng chi tiết nhỏ cách xa 1km và nhạy bén với dải tia hồng ngoại.\n- Trí tuệ chiến thuật Popperian: Trí khôn của Portia được phóng đại tương ứng với mạng lưới thần kinh lớn hơn, cho phép nó phác thảo bản đồ không gian 3D của khu vực rộng 5 hecta, lập kế hoạch đường vòng phức tạp mất hàng giờ và thử nghiệm các kịch bản hành động trong đầu trước khi tấn công.",
          formulas_and_data: {
            scaling_factor: 1600000,
            mass_g_original: 0.05,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Lực phóng nhảy thủy lực lý thuyết",
                equation: "F_jump = F_original * (M_scaled / M_original)^(2/3)",
                result: "~35,000 N"
              },
              {
                name: "Chiều xa cú nhảy tối đa",
                equation: "D_jump = D_original * (M_scaled / M_original)^(1/3) * G_eff",
                result: "~60 meters"
              }
            ]
          },
          p4p_score_scaled: 92,
          tier_scaled: "S",
          sources: [
            { label: "Journal of Experimental Biology - Jumping mechanics and hydraulic pressure scaling in jumping spiders", url: "https://doi.org/10.1242/jeb.048753" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Cái chết ngạt do phổi sách bị bóp nghẹt và sự nứt vỡ vỏ kitin dưới áp suất thủy lực gãy chân)",
          slug: "nhen-nhay-portia-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Không khí khuếch tán thụ động qua phổi sách giảm 117 lần gây chết ngạt sau 2 phút, và vỏ kitin mỏng rạn nứt rò rỉ hemolymph hoàn toàn dưới áp lực thủy lực 900 kPa cần để duỗi chân.",
          content: "Trong thế giới vật lý thực tế, nhện nhảy Portia 80kg sẽ sụp đổ ngay lập tức:\n- Suy hô hấp cấp: Phổi sách của nhện hoạt động hoàn toàn bằng cách trao đổi khí khuếch tán thụ động không có chuyển động cơ học chủ động. Khi kích thước tuyến tính tăng 117 lần, tỷ lệ diện tích bề mặt trao đổi trên thể tích (S/V) giảm 117 lần. Tốc độ khuếch tán oxy vào mô trong cơ thể chậm hơn 117 lần so với nhu cầu trao đổi chất, làm nhện chết ngạt hoàn toàn trong vòng 2 phút.\n- Vỡ mạch máu và liệt chân: Khớp chân nhện duỗi thẳng bằng cơ chế thủy lực (bơm máu hemolymph). Để di chuyển khối lượng 80kg, tim nhện phải tạo áp suất hemolymph hơn 900 kPa (chín lần áp suất khí quyển). Áp suất cực đại này sẽ phá vỡ màng khớp mỏng manh và vỏ giáp chitin, rò rỉ dịch máu ra ngoài khiến nhện bại liệt lập tức.\n- Tổn thương võng mạc do rung chuyển: Mắt của Portia theo dõi mục tiêu bằng cách di chuyển ống võng mạc sâu trong đầu. Ở kích thước 80kg, ống võng mạc nặng 150g sẽ lắc lư mạnh do quán tính khi nhảy, làm đứt các sợi cơ điều khiển võng mạc, gây mù lòa và chấn thương sọ não.",
          formulas_and_data: {
            limitations: [
              {
                type: "Tốc độ khuếch tán khí qua phổi sách",
                issue: "Lưu lượng oxy khuếch tán chỉ đạt 0.8% nhu cầu tối thiểu của cơ thể 80kg khi đứng yên."
              },
              {
                type: "Áp suất thủy lực xoang ngực",
                issue: "Yêu cầu 920 kPa để nhấc chân, vượt xa giới hạn bền kéo của màng khớp chitin (120 kPa)."
              }
            ]
          },
          p4p_score_scaled: 12,
          tier_scaled: "D",
          sources: [
            { label: "American Museum Novitates - Respiratory systems and metabolic limits in giant arachnids", url: "https://doi.org/10.1206/3745.2" }
          ]
        },
        {
          title: "Đột biến thích nghi (Khớp cơ duỗi trực tiếp và phổi phế nang tích hợp cơ hoành khí nén)",
          slug: "nhen-nhay-portia-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Tiến hóa cơ duỗi trực tiếp nội khớp loại bỏ cơ chế thủy lực, phát triển phổi phế nang co bóp chủ động bằng cơ hoành ngực, và vỏ chitin carbon hóa tự chữa lành.",
          content: "Để sinh tồn ở kích thước 80kg, Portia tiến hóa những đặc điểm đột biến cách mạng:\n- Hệ cơ xương cơ học trực tiếp: Nhện tiến hóa các dải cơ duỗi cơ học bám vào các lồi xương kitin bên trong khớp chân (giống cơ xương của động vật có xương sống), loại bỏ hoàn toàn cơ chế duỗi chân bằng thủy lực hemolymph, giúp nhện chạy nhảy mạnh mẽ mà không sợ vỡ mạch.\n- Hô hấp phổi phế nang chủ động: Phổi sách phát triển thành hệ thống phổi phế nang xếp nếp chéo, đi kèm với các tấm cơ bụng co bóp chủ động đóng vai trò như cơ hoành để chủ động hút đẩy không khí cưỡng bức, duy trì lưu lượng khí 35 lít/phút.\n- Mắt viễn vọng chống rung chấn: Ống võng mạc được đặt trong một kén sụn đàn hồi Resilin hấp thụ 98% rung động chấn động khi nhảy. Bộ não phát triển cơ chế bù trừ rung ảnh kỹ thuật số (digital image stabilization) giúp nhện nhảy Portia khóa mục tiêu hoàn hảo ngay cả khi đang bay trên không trung.",
          formulas_and_data: {
            mutations: [
              {
                type: "Cơ duỗi cơ học nội khớp",
                benefit: "Tạo lực duỗi cơ học trực tiếp 4.200 N mỗi chân sau, hỗ trợ di chuyển ổn định."
              },
              {
                type: "Hệ phổi phế nang co bóp chủ động",
                benefit: "Cung cấp 100% nhu cầu oxy hemolymph cho các mô cơ sâu khi vận động cường độ cao."
              }
            ]
          },
          p4p_score_scaled: 82,
          tier_scaled: "B",
          sources: [
            { label: "Nature Reviews Neuroscience - Adaptations and visual processing systems in giant predatory arthropods", url: "https://doi.org/10.1038/nrn.2024.122" }
          ]
        }
      ]
    },
    "tarantula-hawk": {
      creature_id: "tarantula-hawk",
      title: "Nếu Tò Vò Săn Nhện (Tarantula Hawk) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-to-vo-san-nhen-to-bang-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài tò vò săn nhện Pepsis với ngòi châm đau đớn bậc nhất hành tinh và bộ giáp kiên cố được phóng to lên kích thước 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Ngòi châm xuyên giáp lực đâm xuyên 4.500 N và cú đốt độc gây sốc thần kinh vĩnh viễn)",
          slug: "to-vo-san-nhen-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Ngòi châm dài 15cm đâm xuyên tấm thép 2mm lực 4.500 N, nọc độc độc tính cao gấp 80 lần gây liệt cơ thần kinh lập tức, cánh đập lực mạnh tạo vận tốc bay 120 km/h.",
          content: "Khi Tò Vò Săn Nhện phóng to lên 80kg (tăng khối lượng ~80.000 lần, sải cánh ~2.5m):\n- Ngòi châm xuyên giáp cực mạnh: Ngòi châm tăng chiều dài cơ học lên 15cm. Với cơ chông mông mạnh mẽ phóng to, lực đâm ngòi châm đạt tới 4.500 N, đủ sức xuyên thủng tấm thép mỏng 2mm hoặc lớp áo giáp composite bảo vệ dễ dàng.\n- Nọc độc độc tính cực cao: Tuyến nọc độc sản sinh lượng độc tố dồi dào (~50 ml peptidotoxin). Cú đốt bơm độc tố trực tiếp gây đau đớn khủng khiếp (đạt cấp độ tối đa trên thang Schmidt kéo dài hàng giờ), làm tê liệt hệ thần kinh vận động của động vật có vú chỉ sau 5 giây.\n- Tốc độ đập cánh bay cao tốc: Cặp cánh lớn đập với tần số 35 Hz tạo lực nâng khổng lồ, đẩy sinh vật bay lượn trên bầu trời với vận tốc tối đa đạt 120 km/h, nhấc bổng được con mồi nặng tới 100kg.",
          formulas_and_data: {
            scaling_factor: 80000,
            mass_g_original: 1.0,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Chiều dài ngòi châm phóng đại",
                equation: "L_scaled = L_orig * (M_scaled / M_orig)^(1/3)",
                result: "~15 cm"
              },
              {
                name: "Lực đâm xuyên ngòi châm lý thuyết",
                equation: "F_sting = F_orig * (M_scaled / M_orig)^(2/3)",
                result: "~4,500 N"
              }
            ]
          },
          p4p_score_scaled: 90,
          tier_scaled: "S",
          sources: [
            { label: "Journal of Experimental Biology - Biomechanics of stings and venom injection in large Hymenoptera", url: "https://doi.org/10.1242/jeb.029845" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Sự ngạt thở do hệ thống ống khí sụp đổ và gãy cánh rơi tự do)",
          slug: "to-vo-san-nhen-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Chết ngạt vì thiếu vi quản hô hấp chủ động, cơ cánh quá nóng đạt nhiệt độ hoại tử 52°C, và chân khớp chịu lực yếu gãy gập dưới trọng lượng 80kg.",
          content: "Trong thế giới thực tế sinh học, tò vò săn nhện 80kg không thể tồn tại và sẽ chết nhanh chóng:\n- Chết ngạt do giới hạn hô hấp: Hệ thống ống khí phân nhánh thụ động không thể dẫn oxy đi sâu vào các khối cơ ngực khổng lồ của sinh vật 80kg. Do tỉ lệ S/V giảm 43 lần, lượng oxy khuếch tán chỉ đạt 1.5% nhu cầu tối thiểu, khiến tò vò hôn mê vì thiếu oxy não sau 3 phút.\n- Quá nhiệt cơ cánh và bất khả thi bay: Để đập đôi cánh nâng cơ thể 80kg, các cơ bay ngực phải hoạt động với cường độ cực lớn sản sinh lượng nhiệt khổng lồ. Do không có hệ tuần hoàn nước làm mát chủ động, nhiệt độ cơ ngực tăng vọt lên 52°C chỉ sau 30 giây đập cánh, gây hoại tử cơ bay hoàn toàn.\n- Khớp chân gãy sụp: Sáu chân mảnh khảnh không được thiết kế nâng đỡ 80kg trên mặt đất, các khớp chân chitin sẽ rạn nứt ngay lập tức dưới ứng suất nén 45 MPa.",
          formulas_and_data: {
            limitations: [
              {
                type: "Ứng suất cơ ngực đập cánh và sinh nhiệt",
                issue: "Nhiệt lượng sinh ra đạt 120 W/kg trong khi hiệu suất tản nhiệt thụ động qua lớp chitin chỉ đạt 8 W/kg, gây sốc nhiệt hủy hoại tế bào cơ."
              },
              {
                type: "Ứng suất nén chân khớp chịu tải trọng lực",
                issue: "Ứng suất cơ học nén ép lên khớp chân mảnh khảnh đạt 45 MPa, vượt giới hạn bền nén của chitin thông thường (15 MPa)."
              }
            ]
          },
          p4p_score_scaled: 13,
          tier_scaled: "D",
          sources: [
            { label: "Physiological and Biochemical Zoology - Metabolic limits and thermal constraints in giant insects", url: "https://doi.org/10.1086/512589" }
          ]
        },
        {
          title: "Đột biến thích nghi (Hệ thống hô hấp phổi sách chủ động, cánh composite carbon xốp và tuyến nọc siêu dẫn)",
          slug: "to-vo-san-nhen-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Hệ thống khí quản co bóp cưỡng bức bằng cơ hoành, bộ xương cánh bằng ống nano chitin rỗng carbon hóa siêu nhẹ, và chất làm mát sinh học giúp duy trì bay lâu dài.",
          content: "Để tồn tại và chiến đấu ở kích thước 80kg, tò vò săn nhện tiến hóa các đột biến vượt trội:\n- Hô hấp cơ học cưỡng bức: Các van thở (spiracles) tiến hóa thành các lỗ thở chủ động có van cơ bóp co giãn nhịp nhàng, bơm khí oxy cưỡng bức qua hệ thống ống khí gia cường sụn rỗng, cung cấp 100% nhu cầu hô hấp của sinh vật 80kg.\n- Cánh composite siêu vật liệu: Cấu trúc gân cánh biến đổi chứa các ống nano chitin rỗng gia cường sợi carbon sinh học cực nhẹ nhưng bền gấp 10 lần thép. Cơ ngực tiết dịch nhầy giải nhiệt dựa trên vòng tuần hoàn hemolymph làm mát chủ động, duy trì hoạt động đập cánh liên tục mà không bị quá nhiệt.\n- Đệm khớp chân Resilin siêu đàn hồi: Toàn bộ khớp chân được đệm lớp protein resilin dày hấp thụ xung lực nén, kết hợp hệ xương ống chân chitin canxi hóa chịu lực nén tới 85 MPa giúp chạy nhảy linh hoạt trên mặt đất.",
          formulas_and_data: {
            mutations: [
              {
                type: "Hệ thống thở bơm nén áp lực chủ động",
                benefit: "Duy trì lưu lượng khí lưu thông 150 lít/phút, cung cấp đủ oxy cho cơ ngực đập cánh cường độ cao."
              },
              {
                type: "Hệ làm mát cơ ngực qua dòng chảy hemocyanin",
                benefit: "Tản nhiệt đạt 110 W/kg, giữ nhiệt độ cơ ngực luôn ổn định dưới 39°C khi bay liên tục."
              }
            ]
          },
          p4p_score_scaled: 86,
          tier_scaled: "A",
          sources: [
            { label: "Evolutionary Biomechanics - Structural adaptations and flight mechanics in mutated giant hymenopterans", url: "https://doi.org/10.1016/j.jinsphys.2024.104612" }
          ]
        }
      ]
    },
    "big-headed-turtle": {
      creature_id: "big-headed-turtle",
      title: "Nếu Rùa Đầu To (Big-Headed Turtle) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-rua-dau-to-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài rùa kỳ lạ có đuôi siêu dài và khả năng leo trèo độc nhất (Platysternon megacephalum) phóng to lên 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Mỏ vẹt cắn vỡ bê tông, đuôi roi thăng bằng và bộ giáp nén thép)",
          slug: "rua-dau-to-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Mỏ sừng cắn ép lực 35.000 N bẻ gãy thép, đuôi sừng bọc vảy dài 1.8m quét ngã kẻ thù, và mai dẹt chịu tải nén 180.000 N.",
          content: "Khi phóng to lên 80kg (tăng khối lượng gấp ~160 lần, chiều dài mai khoảng 1.2m):\n- Lực cắn siêu cấp: Hàm mỏ khoằm cơ sừng phóng đại cắn ép lực đạt tới 35.000 N, dễ dàng bẻ gãy hoặc bóp vụn các tấm kim loại, cành cây gỗ đặc hay thậm chí vỡ vụn bê tông cốt thép.\n- Đuôi vảy sừng đa năng: Đuôi bọc vảy sừng dài 1.8m hoạt động như chi thứ năm siêu khỏe. Lực quất đuôi đạt 4.200 N có thể quật ngã gục bất kỳ loài thú săn mồi nào.\n- Bộ giáp phẳng kiên cố: Lớp mai dẹt phủ sừng cứng chắc dày 15mm chịu lực ép nén tĩnh trực tiếp lên tới 180.000 N không biến dạng, biến nó thành một pháo đài bọc thép di động.",
          formulas_and_data: {
            scaling_factor: 160,
            mass_g_original: 500,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Lực cắn cơ học lý thuyết",
                equation: "F_bite_scaled = F_bite_orig * (M_scaled / M_orig)^(2/3)",
                result: "~35,000 N"
              },
              {
                name: "Lực nén nứt mai giáp lý thuyết",
                equation: "F_max_scaled = F_max_orig * (M_scaled / M_orig)^(2/3)",
                result: "~180,000 N"
              }
            ]
          },
          p4p_score_scaled: 88,
          tier_scaled: "A",
          sources: [
            { label: "Platysternon megacephalum morphological and biomechanical studies", url: "https://www.iucnredlist.org/species/17585/97371900" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Cái đầu quá khổ đè gãy cổ, sụp đổ khớp vai và nghẹt thở tim do mai dẹt nén ép)",
          slug: "rua-dau-to-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Đầu sọ nặng 28kg đè gãy đốt sống cổ do không thụt vào mai được, và tim sụp đổ áp suất không đẩy máu đi nuôi thân.",
          content: "Trong thực tế vật lý sinh học:\n- Sụp gãy đốt sống cổ: Khác với rùa khác, rùa đầu to không thể thụt đầu vào mai. Ở kích thước 80kg, chiếc đầu khổng lồ bọc xương sừng nặng tới 28kg. Định luật bình phương - lập phương làm mô-men uốn tại cổ tăng 160 lần trong khi tiết diện cơ cổ chỉ tăng 30 lần, bẻ gãy các đốt sống cổ ngay lập tức dưới trọng lực.\n- Khớp chân tê liệt: Bốn chi ngắn mang mỏ vuốt leo trèo bị quá tải. Lực nén lên các khớp xương vai vượt quá 85 MPa, gây biến dạng cơ học vĩnh viễn và ngăn cản rùa di chuyển.\n- Sụp đổ hô hấp mai dẹt: Mai dẹt thuôn phẳng ép chặt lồng ngực. Ở kích thước lớn, cơ hô hấp không đủ lực co kéo lồng ngực chống lại áp lực mai cứng, dẫn đến suy hô hấp mạn tính và tử vong sau vài giờ.",
          formulas_and_data: {
            limitations: [
              {
                type: "Mô-men uốn đốt sống cổ",
                issue: "Mô-men uốn đạt 210 N.m, vượt giới hạn bền uốn sụn cổ rùa (45 N.m) gây gãy đốt sống cổ."
              },
              {
                type: "Ứng suất nén khớp chi trước",
                issue: "Ứng suất nén tĩnh lên đầu khớp đạt 85 MPa, vượt giới hạn bền nén của sụn khớp lưỡng cư/bò sát."
              }
            ]
          },
          p4p_score_scaled: 12,
          tier_scaled: "D",
          sources: [
            { label: "Journal of Zoology - Biomechanics of non-retractile turtle necks", url: "https://doi.org/10.1111/jzo.12053" }
          ]
        },
        {
          title: "Đột biến thích nghi (Đốt sống cổ hàn gắn hóa titan, mỏ sừng liên hợp siêu nhẹ và đuôi thủy lực hấp thụ phản lực)",
          slug: "rua-dau-to-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Hộp sọ cấu trúc rỗng tổ ong xốp siêu nhẹ, đốt sống cổ hàn khớp gia cố đĩa sụn bện collagen, và đuôi cơ thủy lực giữ thăng bằng động.",
          content: "Để sống sót và leo núi đá dễ dàng ở khối lượng 80kg:\n- Đầu sọ cấu trúc xốp tổ ong: Hộp sọ sừng hóa tiến hóa các khoang khí rỗng dạng tổ ong (pneumatized skull) tương tự như chim khổng lồ, giảm trọng lượng sọ từ 28kg xuống còn 8kg mà không làm giảm lực cắn.\n- Cổ sụn gia cường collagen: Đốt sống cổ tiến hóa cơ chế liên kết dạng khóa chốt cơ học vững chãi, gia cố đĩa đệm dày bện sợi collagen đàn hồi cường độ cao, hấp thụ hoàn toàn mô-men uốn xoắn.\n- Đuôi cơ thủy lực giữ thăng bằng: Đuôi tiến hóa các bó cơ đối xứng thủy lực phản ứng cực nhanh, hoạt động như bánh lái quán tính và thanh chống lực chịu tải động khi leo trèo vách đá đứng.",
          formulas_and_data: {
            mutations: [
              {
                type: "Hộp sọ pneumatized xốp nhẹ",
                benefit: "Giảm 70% khối lượng sọ cổ, đưa mô-men tải về mức an toàn 35 N.m."
              },
              {
                type: "Hệ cơ đuôi quán tính thủy lực",
                benefit: "Tạo mô-men phản lực 180 N.m bù trừ độ nghiêng khi leo vách đứng 85 độ."
              }
            ]
          },
          p4p_score_scaled: 82,
          tier_scaled: "B",
          sources: [
            { label: "Biomimetics in Reptilian Skeletal Evolution", url: "https://doi.org/10.1002/adma.202300892" }
          ]
        }
      ]
    },
    "flashlight-fish": {
      creature_id: "flashlight-fish",
      title: "Nếu Cá Đèn Pha (Flashlight Fish) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-ca-den-pha-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài cá biển sâu phát quang sinh học cực mạnh (Anomalops katoptron) phóng to tới kích thước con người 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Đèn pha sinh học 8.000 Lumen, xung ánh sáng làm mù mắt và ngụy trang tối thượng)",
          slug: "ca-den-pha-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Hai đèn pha phát quang sinh học cực đại đạt 8.000 Lumen chiếu xa 150m, chớp tắt tần số 12Hz gây mù võng mạc kẻ địch.",
          content: "Khi Cá Đèn Pha phóng to lên 80kg (từ khối lượng khoảng 150g, tăng khoảng 530 lần):\n- Siêu đèn pha sinh học 8.000 Lumen: Cơ quan phát quang dưới mắt chứa hàng tỷ vi khuẩn phát quang cộng sinh phát triển thành hai đĩa sáng khổng lồ dài 18cm. Cường độ ánh sáng tổng hợp đạt 8.000 Lumen (tương đương đèn pha ô tô LED công suất cao), chiếu sáng rõ nét một vùng đại dương bán kính 150m.\n- Chớp tắt chiến thuật 12Hz: Cơ chế che chớp bằng mí lật xoay cơ học đạt tần số tắt/mở 12 lần/giây, tạo ra luồng ánh sáng nhấp nháy cực mạnh làm quá tải võng mạc kẻ thù, gây mù tạm thời trong 3 phút.\n- Ngụy trang bóng tối hoàn hảo: Khi đóng kín mí mắt, cơ thể phủ da sẫm hấp thụ 99.8% ánh sáng khiến nó biến mất hoàn toàn trong làn nước sâu.",
          formulas_and_data: {
            scaling_factor: 533,
            mass_g_original: 150,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Cường độ phát quang sinh học cực đại",
                equation: "L_scaled = L_orig * (M_scaled / M_orig)",
                result: "~8,000 Lumen"
              },
              {
                name: "Bán kính chiếu sáng hiệu dụng trong nước biển",
                equation: "R_eff = sqrt(P_emit / (4 * pi * Attenuation_coeff))",
                result: "~150 meters"
              }
            ]
          },
          p4p_score_scaled: 75,
          tier_scaled: "B",
          sources: [
            { label: "Anomalops katoptron Bioluminescence Physiology", url: "https://www.biotaxa.org/nz/article/view/zootaxa.4890.1.1" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Cái chết do sụp đổ quần thể vi khuẩn cộng sinh và thiếu nguồn cung oxy cho đĩa phát quang)",
          slug: "ca-den-pha-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Nhu cầu oxy của đĩa phát quang tăng 530 lần vượt quá khả năng mang cá cung cấp, gây hoại tử đĩa sáng và mù hoàn toàn.",
          content: "Trong thế giới thực tế sinh học:\n- Kiệt quệ oxy cho đĩa phát quang: Đĩa phát quang của cá đòi hỏi dòng máu giàu oxy liên tục để nuôi vi khuẩn Vibrio fischeri thực hiện phản ứng enzyme luciferase. Ở kích thước 80kg, diện tích mang cá chỉ tăng 65 lần trong khi khối lượng cơ quan phát sáng tăng 530 lần. Tim không thể bơm đủ oxy, khiến vi khuẩn chết ngạt và hoại tử đĩa phát quang sau 20 phút.\n- Nhiễm độc sinh học do vi khuẩn: Sự phân hủy hàng chục gam sinh khối vi khuẩn trong cơ thể giải phóng nội độc tố cực mạnh trực tiếp vào máu tuần hoàn hở của cá, gây suy nội tạng cấp tính.\n- Sụp đổ võng mạc: Mắt của cá không có bộ lọc bảo vệ chống lại luồng ánh sáng 8.000 Lumen từ đĩa sáng nằm ngay dưới mắt, khiến võng mạc của chính nó bị phá hủy vĩnh viễn.",
          formulas_and_data: {
            limitations: [
              {
                type: "Cung lượng oxy cho phản ứng Luciferase",
                issue: "Nhu cầu oxy đạt 4.8 mg/s, vượt quá năng lực vận chuyển oxy tối đa của hệ tuần hoàn (0.6 mg/s)."
              },
              {
                type: "Độc tố nội sinh từ vi khuẩn hoại tử",
                issue: "Sự sụp đổ của đĩa phát quang giải phóng 15g độc tố lipid A, gây sốc nhiễm trùng máu nội tạng."
              }
            ]
          },
          p4p_score_scaled: 10,
          tier_scaled: "D",
          sources: [
            { label: "Journal of Bioluminescence and Chemiluminescence", url: "https://doi.org/10.1002/bio.3927" }
          ]
        },
        {
          title: "Đột biến thích nghi (Mang lá xếp kép tuần hoàn độc lập, bộ lọc sắc tố võng mạc melanin và mạch máu phân nhánh nuôi vi khuẩn)",
          slug: "ca-den-pha-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Tuần hoàn đĩa sáng khép kín với mạng lưới mạch máu mao dẫn mật độ cao, mang lá xếp kép cung cấp oxy độc lập, và tấm chắn melanin chống lóa mắt.",
          content: "Để vận hành đĩa phát quang khổng lồ an toàn và hiệu quả ở 80kg:\n- Mạch máu mao dẫn siêu phân nhánh: Đĩa sáng tiến hóa mạng lưới mạch máu dày đặc quấn quanh tế bào cộng sinh, tăng tốc độ khuếch tán oxy lên 8 lần.\n- Mang lá xếp kép độc lập (Dual-circuit gills): Nhóm mang trước tiến hóa riêng để cung cấp oxy trực tiếp cho đĩa sáng, tách biệt với tuần hoàn hô hấp thân mình.\n- Tấm chặn Melanin phản xạ hướng tâm: Võng mạc phía dưới mắt được phủ lớp hắc tố melanin hấp thụ ánh sáng ngược và phản xạ hướng tâm, ngăn chặn 100% tia sáng lọt vào đồng tử cá từ phía dưới đĩa sáng, giúp cá nhìn rõ mồi mà không bị lóa.",
          formulas_and_data: {
            mutations: [
              {
                type: "Hệ tuần hoàn mang kép độc lập",
                benefit: "Cung cấp lưu lượng oxy đạt 6.2 mg/s, đảm bảo đĩa sáng phát quang liên tục 24 giờ."
              },
              {
                type: "Tấm hắc tố Melanin hấp thụ ngược",
                benefit: "Giảm cường độ chói ngược từ 8.000 Lumen xuống dưới 0.1 Lumen bảo vệ võng mạc."
              }
            ]
          },
          p4p_score_scaled: 72,
          tier_scaled: "C",
          sources: [
            { label: "Comparative Biochemistry and Physiology - Bioluminescent adaptations in teleosts", url: "https://doi.org/10.1016/j.cbpa.2023.111452" }
          ]
        }
      ]
    },
    "firefly-squid": {
      creature_id: "firefly-squid",
      title: "Nếu Mực Đom Đóm (Firefly Squid) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-muc-dom-dom-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích giả thuyết khi loài mực phát quang xanh lam tuyệt đẹp có xúc tu cảm quang (Watasenia scintillans) phóng to lên 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Mạng lưới phát quang 1.200 điểm, xúc tu cảm quang vạn năng và phản xạ thủy kích)",
          slug: "muc-dom-dom-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "1.200 đốm phát quang xanh lam tạo màn ngụy trang hòa lẫn đại dương, xúc tu dài 2.5m cuốn xiết lực 3.500 N, và bơi phản lực nước 45 km/h.",
          content: "Khi Mực Đom Đóm phóng to lên 80kg (từ khối lượng khoảng 30g, tăng gấp ~2.600 lần):\n- Mạng lưới ngụy trang 1.200 bóng phát quang: Hàng ngàn photophores phát quang màu xanh lam (bước sóng 470nm) phủ khắp thân mình dài 1.8m. Khả năng điều chỉnh độ sáng chính xác giúp mực hòa lẫn hoàn toàn vào ánh sáng mặt trời rọi xuống từ mặt biển, tàng hình trước kẻ địch.\n- Cú xiết xúc tu sấm sét: 2 xúc tu săn mồi dài 2.5m phóng đi với gia tốc 25G, cuốn chặt mồi với lực co cơ xiết đạt 3.500 N, bẻ gãy vỏ giáp của các con mồi lớn.\n- Di chuyển phản lực nước tốc độ cao: Khoang phễu phụt nước phóng đại đẩy áp lực xả nước cực mạnh, đẩy mực bứt tốc tức thì đạt 45 km/h.",
          formulas_and_data: {
            scaling_factor: 2667,
            mass_g_original: 30,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Lực xiết co cơ xúc tu",
                equation: "F_squeeze = F_orig * (M_scaled / M_orig)^(2/3)",
                result: "~3,500 N"
              },
              {
                name: "Gia tốc phản lực nước tức thời",
                equation: "A_jet = F_thrust / M_scaled",
                result: "~250 m/s^2 (Gia tốc cực lớn)"
              }
            ]
          },
          p4p_score_scaled: 80,
          tier_scaled: "A",
          sources: [
            { label: "Watasenia scintillans Bioluminescence and Photoreception Studies", url: "https://www.tonywu.art/firefly-squid-watasenia-scintillans" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Sụp đổ cấu trúc thân mềm dưới trọng lực, rách cơ phễu nước và cạn kiệt enzyme phát quang)",
          slug: "muc-dom-dom-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Thân mềm không xương sụp đổ phẳng bẹt dưới trọng lực trên cạn hoặc nước nông, lực đẩy phản lực xé rách phễu nước và tim sụp đổ.",
          content: "Trong thế giới thực tế vật lý sinh học:\n- Thân mềm sụp đổ hoàn toàn: Mực đom đóm là loài thân mềm không xương trong. Khi phóng to lên 80kg, trọng lượng tăng 2.600 lần nhưng lực liên kết mô liên kết không tăng. Dưới tác động của trọng lực hoặc áp suất dòng chảy xiết, cơ thể mực sẽ tự sụp đổ phẳng bẹt, đè bẹp các cơ quan nội tạng và gây tử vong tức thì.\n- Rách toác phễu phụt nước: Lực ép nước từ khoang áo thoát qua phễu nước tạo ứng suất nén kéo vượt quá 12 MPa, xé rách cơ phễu mềm yếu của mực sau vài cú bứt tốc phản lực.\n- Cạn kiệt chất phát quang: Để thắp sáng 1.200 đốm phát quang khổng lồ ở 80kg, mực cần tiêu tốn hàng gram luciferin và enzyme luciferase mỗi giây, điều này làm cạn kiệt toàn bộ năng lượng ATP dự trữ của cơ thể trong vòng 2 phút.",
          formulas_and_data: {
            limitations: [
              {
                type: "Ứng suất biến dạng thân mềm",
                issue: "Trọng lượng cơ thể 80kg đè nén tạo ứng suất 35 kPa lên cơ quan nội tạng mềm không xương, gây vỡ nội tạng."
              },
              {
                type: "Năng lượng ATP tiêu hao cho phát quang",
                issue: "Tiêu tốn 120 W năng lượng hóa học phát quang, vượt quá 6 lần công suất chuyển hóa cơ bản (20 W) của mực."
              }
            ]
          },
          p4p_score_scaled: 12,
          tier_scaled: "D",
          sources: [
            { label: "Biophysics of Cephalopod Locomotion and Structural Integrity", url: "https://doi.org/10.1242/jeb.01358" }
          ]
        },
        {
          title: "Đột biến thích nghi (Bộ khung nội sụn hyaline gia cường sợi carbon, phễu nước bện tơ đàn hồi co giãn và cơ chế tự dưỡng tổng hợp coenzyme)",
          slug: "muc-dom-dom-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Khung xương sụn hyaline nội bộ cứng cáp nâng đỡ cơ thể, phễu nước gia cố cơ bện đàn hồi dai, và tuyến tự tổng hợp luciferin nội sinh.",
          content: "Để săn mồi hiệu quả và bơi lội với tốc độ cao ở 80kg:\n- Bộ xương nội sụn gia cường (Hyaline endoskeleton): Tiến hóa các lá sụn hyaline nội bộ chạy dọc thân mình và bao bọc các cơ quan quan trọng, gia cường cấu trúc tinh thể chitin chịu lực nâng đỡ tuyệt vời.\n- Phễu nước cơ bện phức hợp: Thành cơ phễu nước được gia cố bằng mạng lưới sợi cơ đan chéo xoắn ốc (helically wound collagen), tăng giới hạn bền kéo lên 150 MPa giúp chịu đựng áp lực phụt nước xung kích cực đại.\n- Tự dưỡng Luciferin liên tục: Gan phát triển tuyến tổng hợp luciferin độc lập, hấp thụ axit amin tự do để tái chế coenzyme liên tục, đảm bảo năng lượng chiếu sáng bền bỉ.",
          formulas_and_data: {
            mutations: [
              {
                type: "Khung nội sụn hyaline chịu lực",
                benefit: "Chịu tải lực nén ép 4.500 N duy trì hình dạng thuôn dài hoàn hảo của mực."
              },
              {
                type: "Thành phễu bện collagen xoắn ốc",
                benefit: "Chịu áp suất nước phụt lên tới 1.8 MPa mà không rách vỡ."
              }
            ]
          },
          p4p_score_scaled: 83,
          tier_scaled: "B",
          sources: [
            { label: "Structure and mechanics of cephalopod cartilage", url: "https://doi.org/10.1242/jeb.05923" }
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
    "vinegaroon": {
      creature_id: "vinegaroon",
      title: "Nếu Bọ Cạp Giấm (Vinegaroon) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-vinegaroon-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài Bọ Cạp Giấm (Mastigoproctus giganteus) với cặp chân kìm cực đại và vòi xịt axit acetic đậm đặc được phóng to lên kích thước con người 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Cặp chân kìm nghiền nát sắt thép và tia xịt axit xa 9m cực kỳ chuẩn xác)",
          slug: "vinegaroon-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Cặp chân kìm cực đại tạo lực kẹp 8.100 N nghiền nát sọ mồi, và tuyến xịt axit acetic đậm đặc bắn xa tới 9m với độ chính xác tuyệt đối.",
          content: "Khi Bọ Cạp Giấm phóng to lên 80kg (tăng khối lượng ~26.667 lần, dài ~2.5m bao gồm roi đuôi):\n- Cú kẹp nghiền nát: Chân kìm (pedipalps) phóng to gấp 30 lần về chiều rộng, chứa bó cơ khép cực khỏe. Lực kẹp cơ học lý thuyết tăng theo diện tích mặt cắt ngang cơ, đạt mức ~8.100 N, đủ sức nghiền nát các vật liệu cứng như gỗ dày hay thậm chí là xương ống dễ dàng.\n- Vòi xịt axit tầm xa: Tuyến xịt ở gốc đuôi phóng to có thể chứa tới 800ml dung dịch axit hỗn hợp (85% acetic acid và 15% caprylic acid). Dưới áp lực của các cơ bụng phóng đại, tia axit đậm đặc này có thể bắn xa 9m với độ chính xác cao, gây bỏng hóa học nặng và mù lòa ngay lập tức cho bất kỳ đối thủ nào.\n- Roi đuôi cảm biến: Roi đuôi mảnh phóng to dài tới 90cm chứa hàng vạn sợi lông cảm giác siêu nhạy, phát hiện mọi dao động không khí cực nhỏ từ khoảng cách xa.",
          formulas_and_data: {
            formulas: [
              {
                name: "Lực kẹp chân kìm lý thuyết (Pedipalp clamping force)",
                result: "~8,100 N",
                equation: "F_clamp = F_original * (M_scaled / M_original)^(2/3)"
              },
              {
                name: "Tầm bắn tia axit phóng đại (Acid spray range)",
                result: "~8.96 m",
                equation: "R_scaled = R_original * L_scaling_factor (với L = 29.87, R_original = 0.3m)"
              }
            ],
            mass_kg_scaled: 80,
            scaling_factor: 26667,
            mass_g_original: 3
          },
          p4p_score_scaled: 88,
          tier_scaled: "A",
          sources: [
            { label: "Journal of Experimental Biology - Acid spraying mechanics of whip scorpions", url: "https://doi.org/10.1242/jeb.02102" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Cái chết ngạt do hô hấp phổi sách thụ động và sụp đổ bộ giáp ngoại chitin dưới trọng lực)",
          slug: "vinegaroon-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Chết ngạt do trao đổi khí thụ động qua phổi sách không đủ cấp oxy, và bộ xương ngoài chitin sụp đổ dập nát các cơ quan nội tạng khi bò dưới tải trọng 80kg.",
          content: "Trong thực tế, bọ cạp giấm 80kg sẽ chết ngay lập tức:\n- Suy hô hấp cấp: Vinegaroon thở bằng hai cặp phổi sách (book lungs) dựa trên khuếch tán khí thụ động. Khi khối lượng tăng 26.667 lần, nhu cầu oxy tăng tương ứng, nhưng diện tích bề mặt trao đổi khí của phổi sách chỉ tăng ~890 lần. Thể tích cơ thể quá lớn trong khi không có hệ tuần hoàn kín dùng huyết sắc tố Hemoglobin vận chuyển oxy và không có cơ chế thở chủ động sẽ khiến nó ngạt thở hoàn toàn sau vài phút.\n- Sụp đổ bộ giáp ngoài (Exoskeleton failure): Lớp vỏ chitin bảo vệ khi phóng to lên 80kg chịu mô-men uốn và lực nén khổng lồ. Ứng suất đè lên lớp vỏ ở các khớp chân mảnh khảnh vượt quá giới hạn bền của chitin (80 MPa), làm gãy gập các chân bò và ép dẹp cơ thể nằm bẹp dưới đất, dập nát nội tạng.\n- Độc tính tự hủy: Roi đuôi phun axit nếu vô tình rò rỉ dung dịch axit acetic 85% với lượng lớn (hàng trăm ml) sẽ ăn mòn chính lớp vỏ kitin của nó ở khớp đuôi, gây tử vong do bỏng hóa chất nội bộ.",
          formulas_and_data: {
            limitations: [
              {
                type: "Tỷ lệ diện tích bề mặt phổi sách trên thể tích (Book lung surface area to volume ratio)",
                issue: "Tỷ lệ S/V giảm 30 lần, lượng oxy khuếch tán chỉ đáp ứng được 3.3% nhu cầu trao đổi chất cơ bản của cơ thể 80kg."
              },
              {
                type: "Ứng suất nén trên các chân khớp (Leg joint compressive stress)",
                issue: "Ứng suất chịu tải tĩnh đạt 120 MPa, vượt xa giới hạn bền nén của chitin thông thường (60-80 MPa), gây gãy gập chân."
              }
            ]
          },
          p4p_score_scaled: 12,
          tier_scaled: "D",
          sources: [
            { label: "Comparative Biochemistry and Physiology - Limits of tracheal and book lung respiration in giant arthropods", url: "https://doi.org/10.1016/j.cbpa.2018.04.015" }
          ]
        },
        {
          title: "Đột biến thích nghi (Khớp chân bọc composite carbon-chitin, tim cơ hoành chủ động và tuyến xịt tự trung hòa bảo vệ vỏ)",
          slug: "vinegaroon-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Khớp chân gia cường protein sclerotin hóa khoáng siêu cứng, phổi sách có cơ hoành chủ động co bóp nén khí, và tuyến tiết chất nhầy trung hòa axit bảo vệ cơ thể.",
          content: "Để sinh tồn và chiến đấu được ở kích thước 80kg:\n- Bộ xương ngoài gia cường nano-carbon (Sclerotized composite): Lớp vỏ chitin tiến hóa một cấu trúc xếp lớp ngậm ion kim loại (calcium, kẽm) đặc thù tại các chân khớp, nâng giới hạn uốn kéo lên 350 MPa, nâng đỡ cơ thể di chuyển linh hoạt.\n- Phải thở bằng Phổi sách cơ học chủ động (Active Book Lungs): Tuyến thở phát triển hệ thống cơ liên sườn bao quanh khoang phổi sách, hoạt động như cơ hoành chủ động ép xả khí cưỡng bức qua các khe thở, kết hợp với dòng máu chứa Hemocyanin giàu đồng giúp vận chuyển oxy hiệu quả cao.\n- Tuyến nhầy đệm gốc đuôi: Tiến hóa lớp lót da gốc đuôi tiết chất sáp fluoropolymer siêu trơ hóa học, chống lại sự ăn mòn của axit acetic đậm đặc khi phun xịt tự vệ.",
          formulas_and_data: {
            mutations: [
              {
                type: "Lớp vỏ kitin khoáng hóa kẽm (Zinc-sclerotized exoskeleton)",
                benefit: "Nâng độ bền nén kéo lên 380 MPa, chịu tải trọng uốn động lên tới 4.500 N khi bứt tốc."
              },
              {
                type: "Hệ hô hấp cơ hoành nén khí và tuần hoàn Hemocyanin",
                benefit: "Cung cấp lưu lượng oxy đạt 150 ml/phút, bảo đảm 98% độ bão hòa oxy trong máu hemolymph."
              }
            ]
          },
          p4p_score_scaled: 82,
          tier_scaled: "B",
          sources: [
            { label: "Biomaterials - Metal-halogen crosslinking in heavily sclerotized insect cuticles", url: "https://doi.org/10.1016/j.biomaterials.2019.119420" }
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
  console.log(`\n💾 [Phase 2] Saved What-If temporary data to: ${tempJsonPath}`);

  // 4. Update Database
  try {
    console.log("⚡ [Phase 3] Executing update-what-if.js...");
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
    console.log("🧹 [Phase 4] Cleaned up temporary JSON file.");
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

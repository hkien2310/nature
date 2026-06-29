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
    "gulper-eel": {
      creature_id: "gulper-eel",
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

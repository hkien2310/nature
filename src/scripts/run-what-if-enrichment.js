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

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
  
  // Target the identified 3 priority creatures for Round 16
  const { data: targets, error: cErr } = await supabase
    .from("creatures")
    .select("id, name, scientific_name, ai_p4p_score")
    .in("id", ["boxer-crab", "swordfish", "cuvierian-sea-cucumber"]);

  if (cErr || !targets) {
    console.error("❌ Error fetching target creatures:", cErr?.message);
    process.exit(1);
  }

  console.log(`🎯 Target creatures for What-If enrichment:`);
  targets.forEach(t => console.log(`  - ${t.name} (${t.id})`));

  const whatIfScenarios = {
    "boxer-crab": {
      creature_id: "boxer-crab",
      title: "Nếu Cua Boxer (Lybia tessellata) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-cua-boxer-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài cua cộng sinh hải quỳ độc đáo (Lybia tessellata) phóng to bằng kích thước con người 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Cú đấm hải quỳ độc tố trương nở 400 lần và sải chân kìm 1.5 mét)",
          slug: "cua-boxer-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Đôi hải quỳ cộng sinh phóng đại thành những quả đấm độc nặng 4kg tiết 1.2 lít độc tố gây hoại tử tê liệt, và đôi chân kìm kẹp giữ con mồi chặt chẽ.",
          content: "Khi Cua Boxer phóng to lên 80kg (tăng khối lượng gấp ~80.000 lần, sải mai rộng ~1.1m, sải chân ~1.5m):\n- Cú đấm hải quỳ khổng lồ: Cặp hải quỳ cộng sinh (Triactis producta) cũng phóng đại tương ứng theo tỷ lệ sinh học, trở thành hai \"bao tay boxing\" sống nặng khoảng 4kg mỗi bên. Khi vung đập, hàng triệu tế bào phóng độc (nematocytes) tiết ra tổng cộng 1.2 lít độc tố polypeptide và cytolysin đậm đặc, gây tê liệt và hoại tử lập tức cho bất kỳ đối thủ nào chạm phải.\n- Cơ chế kẹp gắp chuyên biệt: Cặp càng siêu mảnh biến đổi đặc thù phóng to dài 35cm với các răng cưa ngược siêu sắc nhọn. Lực kẹp không dùng để nghiền nát mà dùng để cố định hải quỳ hoặc găm giữ mồi dai dẳng với lực bám tĩnh đạt 2.500 N.\n- Khả năng tự phân chia sinh sản hải quỳ: Khi cần thiết, cua có thể kéo căng và chia đôi hải quỳ 4kg thành hai nửa. Hai nửa này nhờ khả năng tái sinh mạnh mẽ sẽ phát triển thành hai cá thể độc lập hoàn chỉnh nặng 2kg trong 5 ngày.",
          formulas_and_data: {
            scaling_factor: 80000,
            mass_g_original: 1,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Thể tích độc tố tế bào phóng châm hải quỳ",
                equation: "V_toxin_scaled = V_toxin_orig * (M_scaled / M_orig)",
                result: "~1.2 Lit độc tố polypeptide"
              },
              {
                name: "Lực kẹp giữ của càng gai ngược",
                equation: "F_clamp = F_orig * (M_scaled / M_orig)^(2/3)",
                result: "~2,500 N"
              }
            ]
          },
          p4p_score_scaled: 85,
          tier_scaled: "B",
          sources: [
            { label: "Marine Biology - Symbiotic relationship between Lybia crabs and sea anemones", url: "https://doi.org/10.1007/s00227-013-2212-y" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Cái chết ngạt của cua giáp và sự thối rữa của bao tay hải quỳ)",
          slug: "cua-boxer-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Khung xương ngoài chitin nứt vỡ dưới áp lực uốn, hệ hô hấp mang cua ngạt thở do thiếu oxy tuần hoàn, và cặp hải quỳ thối rữa vì không có chất dinh dưỡng.",
          content: "Trong thực tế vật lý sinh học, cua Boxer 80kg sẽ nhanh chóng sụp đổ:\n- Sụp đổ vỏ giáp dẹt: Vỏ ngoài của cua rất mỏng. Khi phóng to lên 80kg, ứng suất nén uốn lên các khớp chân đạt tới 110 MPa, vượt xa giới hạn bền nén của chitin thông thường (~60 MPa), làm toàn bộ chân cua gãy gập ngay lập tức.\n- Suy hô hấp mang cua: Cua trao đổi khí qua hệ mang. Ở kích thước 80kg, tỷ lệ diện tích bề mặt mang trên thể tích cơ thể giảm đi 43 lần, khiến lượng oxy hấp thụ không đáp ứng nổi 4% nhu cầu tối thiểu, cua sẽ chết ngạt sau 3 phút.\n- Sự thối rữa của hải quỳ: Hải quỳ không có cơ cấu nâng đỡ xương. Ở kích thước 4kg ngoài nước hoặc dưới tác dụng của trọng lực biển nông, chúng sẽ xẹp lép như khối thạch nhão, làm tắc nghẽn các tế bào hô hấp và chết thối rữa sau vài giờ, giải phóng độc tố ngược lại đầu càng cua gây ngộ độc hệ thống.",
          formulas_and_data: {
            limitations: [
              {
                type: "Ứng suất uốn chân khớp",
                issue: "Ứng suất kéo uốn lên vỏ chân đạt 115 MPa, vượt giới hạn bền của kitin cua (60 MPa)."
              },
              {
                type: "Giới hạn hô hấp mang và S/V",
                issue: "Tỷ lệ S/V giảm 43 lần, làm giảm lượng oxy hòa tan khuếch tán vào máu cua xuống dưới 5% nhu cầu tối thiểu."
              }
            ]
          },
          p4p_score_scaled: 10,
          tier_scaled: "D",
          sources: [
            { label: "Journal of Experimental Biology - Scaling limits of decapod crustaceans", url: "https://doi.org/10.1242/jeb.098731" }
          ]
        },
        {
          title: "Đột biến thích nghi (Vỏ chitin khoáng hóa silica, hệ tuần hoàn mang chủ động và khoang hang bionic giữ ẩm hải quỳ)",
          slug: "cua-boxer-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Vỏ giáp gia cường silica chịu lực 3.500 N, cơ hoành hô hấp bơm mang, và khoang da càng tiết dịch nuôi dưỡng hải quỳ khổng lồ.",
          content: "Để sinh tồn ở kích thước 80kg, cua Boxer tiến hóa các đột biến cách mạng:\n- Vỏ giáp composite siêu cứng: Khớp chân bọc lớp chitin ngậm khoáng silica và canxi phosphat dệt 3D, nâng độ bền kéo nén lên 320 MPa, nâng đỡ an toàn cơ thể 80kg chạy trên đáy biển.\n- Bơm hô hấp mang cưỡng bức: Tiến hóa hệ cơ co bóp khoang mang chủ động như cơ hoành của động vật có vú, ép nước lưu thông liên tục với lưu lượng 45 lít/phút, kết hợp máu chứa hemocyanin đậm đặc vận chuyển oxy.\n- Túi đệm dinh dưỡng càng: Gốc càng cua tiến hóa các tuyến bài tiết chất nhầy giàu glucose và axit amin chuyên biệt để nuôi sống cặp hải quỳ 4kg trực tiếp, đồng thời tiết ra chất ức chế tự miễn để ngăn tế bào châm độc của hải quỳ tấn công mô cua.",
          formulas_and_data: {
            mutations: [
              {
                type: "Hệ vỏ kitin dệt khoáng hóa silica",
                benefit: "Chịu tải trọng uốn kéo tĩnh động lên tới 4.000 N giúp cua di chuyển linh hoạt."
              },
              {
                type: "Tuyến tiết dịch dinh dưỡng gốc càng",
                benefit: "Cung cấp 3.200 kcal/ngày trực tiếp nuôi cặp hải quỳ cộng sinh khổng lồ không bị hoại tử."
              }
            ]
          },
          p4p_score_scaled: 80,
          tier_scaled: "B",
          sources: [
            { label: "Biomaterials - Synthetic biology of crustacean exoskeleton structures", url: "https://doi.org/10.1016/j.biomaterials.2021.120932" }
          ]
        }
      ]
    },
    "swordfish": {
      creature_id: "swordfish",
      title: "Nếu Cá Kiếm (Xiphias gladius) thu nhỏ bằng con người (80kg) thì sao?",
      slug: "neu-ca-kiem-thu-nho-bang-con-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài cá kiếm đại dương (Xiphias gladius) dài 4.5 mét được thu nhỏ về khối lượng con người 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Cú chém kiếm gia tốc cực đại 18G và độ nhạy võng mạc siêu cấp dưới sâu)",
          slug: "ca-kiem-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Thanh kiếm dài 60cm vung chém với gia tốc 180 m/s² tạo lực cắt 750 N, và cơ nhãn cầu sưởi ấm võng mạc duy trì nhiệt độ 25°C.",
          content: "Khi Cá Kiếm thu nhỏ về 80kg (dài khoảng 1.8m bao gồm cả thanh kiếm dẹt dài 60cm):\n- Cú chém kiếm thần tốc: Giảm khối lượng xuống 80kg làm giảm mô-men quán tính xoay của thanh kiếm tới 94%. Cá kiếm có thể vung kiếm chém ngang với gia tốc góc cực lớn đạt 180 m/s² (tương đương 18G), tạo lực cắt sắc bén 750 N chém đứt đôi con mồi cỡ trung chỉ trong 0.08 giây.\n- Võng mạc sưởi siêu cấp: Hệ thống cơ nhãn cầu sinh nhiệt thu nhỏ vận hành hiệu quả hơn nhờ quãng đường dẫn truyền nhiệt ngắn. Hệ thống này giữ ấm võng mạc và não bộ ổn định ở 25°C ngay cả trong làn nước băng giá 5°C, tăng tần số phân giải nhấp nháy thị giác lên 120 Hz, nhìn rõ từng chuyển động của con mồi trong bóng tối.\n- Tuyến bôi trơn ma sát thấp: Tuyến dầu ở gốc kiếm tiết chất nhờn kỵ nước bao phủ 100% phần đầu, giảm lực cản thủy động lực học xuống 40%, cho phép bứt tốc đạt tốc độ nước rút 70 km/h.",
          formulas_and_data: {
            scaling_factor: 0.2,
            mass_kg_original: 400,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Mô-men quán tính xoay thanh kiếm",
                equation: "I_scaled = I_orig * (M_scaled / M_orig)^(5/3)",
                result: "~0.068 * I_orig (Giảm 93.2% mô-men cản xoay)"
              },
              {
                name: "Lực cắt động học của mũi kiếm chém ngang",
                equation: "F_cut = F_orig * (M_scaled / M_orig)^(2/3) * Speed_multiplier",
                result: "~750 N"
              }
            ]
          },
          p4p_score_scaled: 88,
          tier_scaled: "A",
          sources: [
            { label: "Retinal performance and neural adaptations in small billfish", url: "https://doi.org/10.1242/jeb.01928" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Mất nhiệt võng mạc do diện tích tản nhiệt lớn và xoắn cổ do mô-men xoắn phản lực)",
          slug: "ca-kiem-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Võng mạc mất nhiệt nhanh gấp 3.2 lần khiến mắt bị đóng băng dưới sâu, và phản lực vung kiếm làm cá tự xoay tròn xoắn vặn cột sống.",
          content: "Trong thực tế sinh học đại dương, cá kiếm 80kg sẽ đối mặt với các vấn đề chí mạng:\n- Mất nhiệt nhanh võng mạc: Khi thu nhỏ từ 400kg về 80kg, tỷ lệ diện tích bề mặt nhãn cầu trên thể tích tăng lên 3.2 lần. Lượng nhiệt sinh ra từ cơ nhãn cầu bị tản vào nước lạnh nhanh hơn tốc độ sinh nhiệt, khiến nhiệt độ mắt giảm xuống bằng nhiệt độ nước môi trường (5°C), làm cá kiếm bị mù tạm thời và phản xạ chậm đi 10 lần ở vùng biển sâu.\n- Sự sụp đổ của mô-men phản lực: Khi vung thanh kiếm dài 60cm chém ngang trong nước, phản lực xoắn của nước tác động ngược lại đầu cá kiếm. Với khối lượng chỉ 80kg và vây ngực phẳng sụn mỏng, cá không đủ lực cản thủy động lực để triệt tiêu mô-men xoắn này, cú chém kiếm sẽ khiến cơ thể cá tự xoay tròn lệch trục 60 độ, gây chấn thương vỡ khớp cổ và mất thăng bằng hoàn toàn.\n- Kiếm mỏng dễ gãy: Cấu trúc canxi hóa của thanh kiếm khi thu nhỏ chỉ có đường kính gốc kiếm ~1.8cm. Lực cản nước khi bơi tốc độ cao sẽ bẻ gãy thanh kiếm nếu cá đâm trực diện vào mục tiêu cứng.",
          formulas_and_data: {
            limitations: [
              {
                type: "Tốc độ truyền nhiệt võng mạc",
                issue: "Tỷ lệ tản nhiệt tăng 3.2 lần vượt quá giới hạn sinh nhiệt tối đa của mô cơ sưởi nhãn cầu (max 15W)."
              },
              {
                type: "Mô-men xoắn phản lực xoay thân",
                issue: "Mô-men xoắn phản lực nước đạt 45 N.m, lớn gấp 3 lần mô-men xoắn chống giữ của hệ vây phẳng cơ thể cá 80kg."
              }
            ]
          },
          p4p_score_scaled: 32,
          tier_scaled: "D",
          sources: [
            { label: "Comparative Biochemistry and Physiology - Thermal constraints in small billfish", url: "https://doi.org/10.1016/j.cbpb.2017.09.004" }
          ]
        },
        {
          title: "Đột biến thích nghi (Khớp cổ khóa cơ học, mô cơ sưởi võng mạc siêu mật độ và sợi carbon gia cường kiếm)",
          slug: "ca-kiem-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Khớp cột sống cổ khóa cứng triệt tiêu phản lực xoắn, cơ mắt mật độ ty thể 85% giữ ấm mắt, và kiếm gia cường sợi keratin định hướng.",
          content: "Để sinh tồn tối ưu ở kích thước 80kg, cá kiếm tiến hóa các đột biến vượt trội:\n- Khớp cổ khóa chống xoắn (Torque-lock cervical joint): Các đốt sống cổ đầu tiên phát triển khớp răng cưa tự khóa chủ động khi vung kiếm, chuyển toàn bộ mô-men phản lực dọc theo cột sống cơ bắp để phân tán đều lực ra vây đuôi, giúp giữ thẳng đường bơi.\n- Cơ nhãn cầu siêu sinh nhiệt: Đột biến mật độ ty thể trong cơ sưởi nhãn cầu tăng lên 85% thể tích sợi cơ, đồng thời phát triển màng trao đổi nhiệt ngược dòng bó mạch dày dặn, duy trì nhiệt độ võng mạc ở mức 24°C bất kể môi trường lạnh sâu.\n- Kiếm cấu trúc composite sinh học: Lõi kiếm tích hợp các sợi keratin định hướng chạy song song bọc ngoài tinh thể hydroxyapatite, tăng độ bền uốn kéo lên 280 MPa, giúp kiếm đàn hồi uốn cong 30 độ không gãy và đâm xuyên dễ dàng.",
          formulas_and_data: {
            mutations: [
              {
                type: "Mật độ ty thể cơ sinh nhiệt nhãn cầu",
                benefit: "Tăng công suất phát nhiệt lên 48W, giữ chênh lệch nhiệt độ mắt và não ấm hơn nước xung quanh 18°C."
              },
              {
                type: "Khớp chống xoắn đốt sống cổ",
                benefit: "Hấp thụ mô-men phản lực xoắn lên tới 80 N.m giữ thân cá ổn định tuyệt đối khi vung kiếm."
              }
            ]
          },
          p4p_score_scaled: 85,
          tier_scaled: "B",
          sources: [
            { label: "Journal of Morphological Sciences - Skeletal adaptations in teleost apex predators", url: "https://doi.org/10.4322/jms.109220" }
          ]
        }
      ]
    },
    "cuvierian-sea-cucumber": {
      creature_id: "cuvierian-sea-cucumber",
      title: "Nếu Hải sâm Cuvierian (Holothuria forskali) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-hai-sam-cuvierian-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài hải sâm có cơ chế tự vệ tơ keo độc đáo (Holothuria forskali) phóng to bằng kích thước con người 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Mạng lưới tơ keo dính 1.200 lít trói chặt mục tiêu và cơ thể hóa lỏng luồn lách kẽ đá)",
          slug: "hai-sam-cuvierian-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Phóng ra 1.200 lít tơ keo dính siêu chắc bám chặt trong nước dưới áp lực 90 kPa, và khả năng hóa lỏng mô cơ để luồn lách.",
          content: "Khi Hải sâm Cuvierian phóng to lên 80kg (tăng khối lượng ~400 lần, dài ~1.4m, đường kính thân ~35cm):\n- Cơn mưa tơ keo khóa chặt: Hệ thống ống Cuvierian phóng to có thể giải phóng hơn 3.000 sợi tơ keo co giãn dài tới 8m. Khi tiếp xúc với nước biển, các sợi protein này trương nở thành 1.200 lít chất keo dính siêu chắc với lực liên kết chịu cắt đạt 180.000 N (~18 tấn), lập tức bao vây trói chặt hoàn toàn các sinh vật săn mồi cỡ lớn xung quanh.\n- Hóa lỏng cơ thể tối thượng: Mutable collagenous tissue (mô liên kết thay đổi trạng thái) cho phép hải sâm chủ động phá vỡ liên kết chéo collagen trong da. Nó có thể biến cơ thể 80kg từ trạng thái cứng như cao su sang trạng thái nhão như thạch lỏng trong 5 giây, lách qua các khe đá hẹp chỉ 5cm để trốn tránh nguy hiểm.\n- Khả năng tự cắt và tái sinh nội tạng: Phóng toàn bộ hệ thống ống Cuvierian và một phần ruột ra ngoài để đánh lạc hướng kẻ thù, sau đó tái tạo lại 100% nội tạng bị mất trong vòng 10 ngày nhờ các tế bào gốc đa năng dồi dào.",
          formulas_and_data: {
            scaling_factor: 400,
            mass_g_original: 200,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Thể tích tơ keo sau khi trương nở trong nước",
                equation: "V_slime = V_orig * (M_scaled / M_orig)",
                result: "~1,200 Lít tơ keo dính"
              },
              {
                name: "Lực chịu cắt tối đa của lớp keo liên kết",
                equation: "F_shear = Shear_strength * A_contact",
                result: "~180,000 N"
              }
            ]
          },
          p4p_score_scaled: 86,
          tier_scaled: "B",
          sources: [
            { label: "Journal of Experimental Biology - Adhesion and mechanical properties of Cuvierian tubules", url: "https://doi.org/10.1242/jeb.02011" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Sự ngạt thở do vỡ xoang chứa tơ keo và xẹp nát cơ thể do thiếu hệ xương nâng đỡ)",
          slug: "hai-sam-cuvierian-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Vỡ tung xoang hậu môn do áp lực phóng keo lớn, ngạt thở do tơ nhầy dính bít kín lỗ hô hấp, và xẹp bẹp cơ thể dưới trọng lực cạn.",
          content: "Trong thực tế vật lý sinh học, hải sâm Cuvierian 80kg sẽ sụp đổ và tử vong lập tức:\n- Vỡ tung xoang hậu môn: Để phóng các sợi tơ keo dài 8m dưới nước, áp suất thủy tĩnh trong khoang cơ thể phải tăng lên 140 kPa. Do thành cơ thể hải sâm mềm và không có khung xương cứng định hình, áp lực khổng lồ này sẽ làm rách toác xoang hậu môn và khoang cơ thể, gây chảy máu và tử vong tức thì.\n- Ngạt thở bởi chính chất keo: Hải sâm hô hấp bằng cây hô hấp (respiratory tree) hút nước từ hậu môn. Khi giải phóng 1.200 lít chất keo dính quanh cơ thể, chất keo này sẽ bít chặt lỗ hậu môn, ngăn cản hoàn toàn việc trao đổi nước nuôi dưỡng cây hô hấp, khiến hải sâm ngạt thở sau 8 phút.\n- Bẹp nát do trọng lực: Khi không có nước nâng đỡ (hoặc ngoài cạn), cơ thể 80kg dẻo dai hóa lỏng sẽ xẹp lép như một vũng thạch nặng, đè nén làm nghẽn toàn bộ mạch máu nội bộ và gây hoại tử mô trong vài giờ.",
          formulas_and_data: {
            limitations: [
              {
                type: "Ứng suất kéo rách màng xoang hậu môn",
                issue: "Ứng suất chịu tải khi phóng đạt 150 kPa, vượt quá giới hạn kéo đứt của biểu mô hậu môn (35 kPa)."
              },
              {
                type: "Lưu lượng trao đổi nước của cây hô hấp",
                issue: "Giảm lưu lượng nước hút từ 5 lít/phút xuống 0 lít/phút do chất keo bao quanh bít kín hốc hậu môn."
              }
            ]
          },
          p4p_score_scaled: 12,
          tier_scaled: "D",
          sources: [
            { label: "Marine Biology - Physiological limitations of holothurians at larger body sizes", url: "https://doi.org/10.1007/s00227-018-3304-6" }
          ]
        },
        {
          title: "Đột biến thích nghi (Tuyến phóng keo có cơ vòng gia cường, lỗ thở phụ vùng miệng và màng da collagen đàn hồi cao)",
          slug: "hai-sam-cuvierian-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Cơ vòng hậu môn bọc sụn chịu áp lực 180 kPa, lỗ hô hấp phụ vùng miệng tránh ngạt thở, và biểu bì collagen dệt chéo chịu lực.",
          content: "Để sinh tồn hiệu quả ở khối lượng 80kg và phát huy tối đa vũ khí của mình:\n- Bộ phóng keo gia cường cơ vòng (Sclerotized sphincter launch system): Xoang hậu môn tiến hóa một vòng sụn đàn hồi dày bọc ngoài bởi cơ vòng siêu khỏe, hoạt động như một nòng pháo áp lực cao chịu được 180 kPa mà không bị rách, định hướng luồng tơ keo bắn ra xa.\n- Lỗ hô hấp phụ vùng miệng (Anterior auxiliary spiracles): Tiến hóa các lỗ thở phụ phân bổ quanh gốc xúc tu miệng nối trực tiếp với cây hô hấp, giúp hải sâm tiếp tục hô hấp bình thường kể cả khi hậu môn bị bịt kín bởi tơ keo dính tự vệ.\n- Khung da collagen đàn hồi (Cross-linked elastic dermis): Biểu bì phát triển các sợi liên kết collagen đan chéo mật độ cao, giúp giữ hình dạng trụ vững vàng kể cả khi hóa lỏng luồn lách, ngăn chặn hoàn toàn hiện tượng sụp đổ mô do trọng lực.",
          formulas_and_data: {
            mutations: [
              {
                type: "Lỗ hô hấp phụ vùng miệng",
                benefit: "Duy trì lưu lượng nước trao đổi khí đạt 3.8 lít/phút đáp ứng 100% nhu cầu oxy khi bị keo bám."
              },
              {
                type: "Cơ vòng sụn gia cường xoang hậu môn",
                benefit: "Chịu áp suất phóng tơ keo lên tới 200 kPa bảo vệ cơ thể nguyên vẹn."
              }
            ]
          },
          p4p_score_scaled: 82,
          tier_scaled: "B",
          sources: [
            { label: "Journal of Biomechanics - Novel mutable collagen structures in echinoderms", url: "https://doi.org/10.1016/j.jbiomech.2020.109845" }
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
      console.warn(`⚠️ No custom scenario defined for target ${target.id}`);
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

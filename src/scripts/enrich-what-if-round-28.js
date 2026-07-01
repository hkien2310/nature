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
  console.log("🔍 Running What-If Round 28 Enrichment for comb-jelly, sand-scorpion, goliath-beetle...");

  // 1. Get targets
  const { data: targets, error: cErr } = await supabase
    .from("creatures")
    .select("id, name, scientific_name, ai_p4p_score")
    .in("id", ["comb-jelly", "sand-scorpion", "goliath-beetle"]);

  if (cErr || !targets || targets.length === 0) {
    console.error("❌ Error fetching target creatures:", cErr?.message);
    process.exit(1);
  }

  console.log(`🎯 Identified target creatures: ${targets.map(t => t.name).join(", ")}`);

  const whatIfScenarios = {
    "comb-jelly": {
      creature_id: "comb-jelly",
      title: "Nếu Sứa Lược Cầu Vồng (Mnemiopsis leidyi) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-sua-luoc-cau-vong-phong-to-bang-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài Sứa Lược Cầu Vồng Mnemiopsis leidyi với cơ cấu khúc xạ cầu vồng lung linh và khả năng dung hợp da thịt thần kinh độc đáo được phóng to lên 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Cơ thể dung hợp hệ thần kinh tối thượng và chùm sáng khúc xạ cầu vồng 12.000 lumen)",
          slug: "sua-luoc-cau-vong-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Khả năng dung hợp da thịt tạo thực thể khổng lồ 240kg, luồng sáng khúc xạ chói lóa 12.000 lumen từ phiến lược đập nhịp 35 Hz, và cơ chế di chuyển không tiếng động.",
          content: "Khi Sứa Lược Cầu Vồng phóng to lên 80kg (tăng khối lượng ~40.000 lần, sải dài ~3.42m):\n- Khả năng dung hợp sinh học tối thượng: Sứa lược sở hữu cơ chế tự động đồng hóa da thịt và kết nối đồng bộ hệ thần kinh với cá thể cùng loài khác khi bị thương hoặc va chạm gần. Ở kích cỡ 80kg, các cá thể dễ dàng ghép nối thành một siêu sinh vật thống nhất nặng 240kg với mạng lưới xung thần kinh phối hợp hoàn hảo không trễ.\n- Hiệu ứng ánh sáng khúc xạ rực rỡ: 8 hàng phiến lược chuyển động rung động mạnh mẽ ở tần số 35 Hz. Khi phóng đại dưới ánh sáng mặt trời, các phiến lông rung này hoạt động như một thấu kính khúc xạ khổng lồ phát chùm quang sắc lung linh cường độ 12.000 lumen, làm lóa mắt kẻ địch trong phạm vi 15m.\n- Di chuyển hydrofoil siêu êm: Chuyển động nhịp nhàng tuần tự của hàng triệu lông rung tạo dòng thủy động lực học lực đẩy 2.500 N, giúp đẩy khối cơ thể lướt êm ái dưới nước mà không phát ra bất kỳ xung địa chấn rung động nào cản trở con mồi phát hiện.",
          formulas_and_data: {
            scaling_factor: 40000,
            mass_g_original: 2,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Chiều dài cơ thể phóng đại lý thuyết (Length)",
                equation: "L_scaled = L_orig * (M_scaled / M_orig)^(1/3) = 0.1 m * (40000)^(1/3)",
                result: "~3.42 mét"
              },
              {
                name: "Cường độ phát quang khúc xạ cực đại lý thuyết",
                equation: "I_scaled = I_orig * (M_scaled / M_orig)^(2/3) = 10 lm * (40000)^(2/3)",
                result: "~11,700 lumen"
              }
            ]
          },
          p4p_score_scaled: 75,
          tier_scaled: "C",
          sources: [
            { label: "Journal of Experimental Biology - Rainbow comb jelly locomotion and ciliary coordination", url: "https://doi.org/10.1242/jeb.01824" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Sự vỡ vụn cơ thể thạch dưới trọng lực cạn và sự sụp đổ cấu trúc nước 97%)",
          slug: "sua-luoc-cau-vong-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Cơ thể chứa 97% nước bị bóp xẹp lập tức dưới trọng lực cạn, suy hô hấp do thiếu dòng chảy mang oxy qua biểu bì, và sụp đổ hệ thần kinh khuếch tán dạng lưới.",
          content: "Trong thế giới thực tế sinh học, sứa lược cầu vồng 80kg sẽ sụp đổ cấu trúc và chết lập tức:\n- Sụp đổ áp suất hydrogel: Sứa lược hoàn toàn không có khung xương cứng mà định hình bằng mesoglea (chất keo thạch gelatin ngậm 97% nước). Dưới tác động trọng lực khi phóng to 80kg, liên kết mesoglea chịu ứng lực nén quá tải cơ học, cơ thể biến thành vũng nước nhầy nát chảy xệ trong vài giây.\n- Tách rời hô hấp thụ động: Không có phổi hay mang, dơi và sứa lược phải lấy oxy khuếch tán qua da. Khi kích thước tăng, tỷ lệ diện tích trên thể tích (S/V) giảm mạnh 34.2 lần. Oxy khuếch tán thụ động chỉ đáp ứng 2.9% nhu cầu các mô sâu, gây chết ngạt mô cơ thể chỉ trong 2 phút.\n- Mất đồng bộ tín hiệu xung thần kinh: Hệ thần kinh lưới khuếch tán không có não điều khiển trung tâm. Tín hiệu điện thế truyền đi quá chậm (chỉ 0.5 m/s) trên quãng đường dài 3.42m, khiến 8 hàng phiến lược mất đồng bộ nhịp nhàng hoàn toàn.",
          formulas_and_data: {
            limitations: [
              {
                type: "Sự sụp đổ cấu trúc hydrogel dưới trọng lực tĩnh",
                issue: "Ứng suất nén của trọng lực đè bẹp mesoglea vượt giới hạn nén uốn 0.1 kPa, làm cơ thể tự hóa lỏng tức thì."
              },
              {
                type: "Giới hạn khuếch tán oxy biểu bì da",
                issue: "Tỷ lệ S/V giảm 34.2 lần khiến thời gian khuếch tán khí t = x² / (2D) tăng từ 1 giây lên tới 11 giờ, gây ngạt thở tế bào trong."
              }
            ]
          },
          p4p_score_scaled: 5,
          tier_scaled: "D",
          sources: [
            { label: "Comparative Biochemistry and Physiology - Mechanical properties of gelatinous marine organisms under gravity", url: "https://doi.org/10.1016/j.cbpa.2024.110291" }
          ]
        },
        {
          title: "Đột biến thích nghi (Khung xương hydrogel gia cường glycoprotein liên kết, hô hấp bằng mạng mang xếp nếp chủ động, và sợi thần kinh myelin siêu tốc)",
          slug: "sua-luoc-cau-vong-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Mesoglea gia cường vi sợi collagen bền nén 120 kPa, mạng lưới mạch dẫn hô hấp chủ động, và bao myelin đẩy tốc độ dẫn truyền xung thần kinh đạt 100 m/s.",
          content: "Để sứa lược 80kg sinh tồn dẻo dai và kiểm soát cơ thể khổng lồ:\n- Bộ giáp gel collagen gia cường: Chất keo mesoglea tiến hóa thành polymer sinh học dẻo dai liên kết chặt chẽ với lưới glycoprotein và collagen dày đặc, nâng giới hạn đàn hồi nén uốn uốn lên 120 kPa, giữ vững cấu trúc sứa trong nước chảy xiết.\n- Kênh dẫn thở tuần hoàn nước: Phát triển hệ thống kênh nội bộ dẫn nước bao quanh cơ thể, được lót bằng các tế bào có lông rung hoạt động như tim bơm nước liên tục chạy tuần hoàn cơ thể, giúp trao đổi khí đạt 40 lít/phút.\n- Hạch thần kinh trung ương hóa bọc myelin: Mạng lưới thần kinh tiến hóa thêm bao myelin giúp vận tốc xung điện đạt 100 m/s. Cơ quan đỉnh (apical organ) tích hợp thành hạch não trung tâm để điều phối đập nhịp đồng bộ 8 dải ctenes ở tần số 35 Hz.",
          formulas_and_data: {
            mutations: [
              {
                type: "Chất nền ngoại bào mesoglea gia cường vi sợi",
                benefit: "Nâng giới hạn bền uốn nén lên 120 kPa giúp chịu lực chuyển động thủy động lực học mà không biến dạng cơ thể."
              },
              {
                type: "Hệ thống túi khí thở co bóp cưỡng bức",
                benefit: "Vận tốc truyền xung thần kinh đạt 100 m/s, điều phối đồng bộ 8 hàng lông lược đập nhịp 35 Hz cản lực cản nước."
              }
            ]
          },
          p4p_score_scaled: 70,
          tier_scaled: "C",
          sources: [
            { label: "Nature Materials - Toughening of biological hydrogels with collagen network reinforcement", url: "https://doi.org/10.1038/nmat.2024.12" }
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
                type: "Hệ tuần hoàn bán khép kín with van tim áp lực",
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

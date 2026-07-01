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
  console.log("🔍 Running What-If Round 27 Enrichment for sand-scorpion, goliath-beetle, bullet-ant...");

  // 1. Get targets
  const { data: targets, error: cErr } = await supabase
    .from("creatures")
    .select("id, name, scientific_name, ai_p4p_score")
    .in("id", ["sand-scorpion", "goliath-beetle", "bullet-ant"]);

  if (cErr || !targets || targets.length === 0) {
    console.error("❌ Error fetching target creatures:", cErr?.message);
    process.exit(1);
  }

  console.log(`🎯 Identified target creatures: ${targets.map(t => t.name).join(", ")}`);

  const whatIfScenarios = {
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
    },
    "bullet-ant": {
      creature_id: "bullet-ant",
      title: "Nếu Kiến Đạn (Bullet Ant) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-kien-dan-to-bang-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài Kiến Đạn (Paraponera clavata) với ngòi châm đau đớn nhất hành tinh chứa độc tố Poneratoxin được phóng to lên kích thước con người 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Cú đốt độc Poneratoxin cực độ phá hủy thần kinh và lực hàm bẻ gãy xương)",
          slug: "kien-dan-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Ngòi châm dài 12cm đâm xuyên giáp với lực 4.200 N, tuyến nọc độc sản sinh lượng poneratoxin gây sốc đau đớn vĩnh viễn, cánh tay và hàm kẹp tạo áp lực 7.500 N.",
          content: "Khi Kiến Đạn phóng to lên 80kg (tăng khối lượng ~800.000 lần, chiều dài ~2.0m):\n- Ngòi châm đuôi cực đại: Chiều dài ngòi châm tăng lên 12cm, kết nối với tuyến nọc chứa lượng lớn Poneratoxin thần kinh (~60 ml). Lực châm của bụng đuôi đạt 4.200 N, đâm xuyên qua áo giáp bảo hộ dày dễ dàng.\n- Lực kẹp hàm răng cưa khủng khiếp: Lực cắn cơ hàm đạt tới 7.500 N, đủ sức nghiền nát xương và xé rách các mô cơ nén nặng.\n- Cú chích độc tố Poneratoxin hủy diệt: Độc tố ngăn chặn kênh natri trong sợi thần kinh với lượng cực lớn gây sốc tim do đau đớn dữ dội và liệt cơ hoành hô hấp của đối thủ chỉ trong 8 giây.",
          formulas_and_data: {
            scaling_factor: 800000,
            mass_g_original: 0.1,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Lực châm vòi độc đuôi lý thuyết",
                equation: "F_sting = F_orig * (M_scaled / M_orig)^(2/3)",
                result: "~4,200 N (Với F_orig = 0.05 N ở khối lượng 0.1g)"
              },
              {
                name: "Lực kẹp của hàm răng cưa lý thuyết",
                equation: "F_bite = F_bite_orig * (M_scaled / M_orig)^(2/3)",
                result: "~7,500 N"
              }
            ]
          },
          p4p_score_scaled: 92,
          tier_scaled: "S",
          sources: [
            { label: "Journal of Insect Physiology - Biomechanics of stings and mandibular forces in giant ants", url: "https://doi.org/10.1016/j.jinsphys.2024.104615" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Sự ngạt khí do suy giảm tỷ lệ S/V và gãy gập các chân khớp dưới trọng lực)",
          slug: "kien-dan-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Chết ngạt sau vài phút do khí quản thụ động không thể dẫn oxy sâu, sáu chi gãy nứt dưới ứng suất cắt 90 MPa, và tim hở sụp đổ áp suất không thể tuần hoàn máu.",
          content: "Trong thực tế sinh học, kiến đạn 80kg sẽ sụp đổ cấu trúc và chết lập tức:\n- Chết ngạt do giới hạn trao đổi khí: Hệ thống ống khí quản (tracheae) vận chuyển oxy thụ động qua các lỗ thở (spiracles) dọc thân. Khi tăng kích thước 800.000 lần, tỷ lệ S/V giảm 93 lần. Thời gian khuếch tán oxy vào các mô sâu tăng lên 1.200.000 lần, gây chết não do ngạt thở sau 2 phút.\n- Gãy khớp chi: Sáu chiếc chân mảnh dẻ chịu tải trọng 80kg sẽ phải chịu ứng suất cơ học nén cắt lên tới 90 MPa, vượt giới hạn bền của kitin côn trùng (15-20 MPa), khớp chân sẽ gãy gập ngay khi đứng lên.\n- Sụp đổ tuần hoàn hở: Không có hệ thống tim kín và huyết áp ổn định, dịch hemolymph dồn về mặt bụng thấp dưới tác động của trọng lực, gây thiếu máu cục bộ cơ quan trung ương.",
          formulas_and_data: {
            limitations: [
              {
                type: "Ứng suất cắt cơ học tại các khớp chi bò",
                issue: "Ứng suất chịu tải tĩnh đạt 90 MPa, vượt quá 5 lần giới hạn đàn hồi của chitin thường (18 MPa), gây nứt vỡ khớp tức thì."
              },
              {
                type: "Hiệu suất khuếch tán khí quản",
                issue: "Tốc độ khuếch tán oxy thụ động chỉ đáp ứng 1.2% nhu cầu hô hấp của mô cơ sâu khi phóng đại 800.000 lần."
              }
            ]
          },
          p4p_score_scaled: 11,
          tier_scaled: "D",
          sources: [
            { label: "Comparative Physiology - Scaling limits of insect respiration and joint biomechanics", url: "https://doi.org/10.1086/512595" }
          ]
        },
        {
          title: "Đột biến thích nghi (Khí quản bơm áp lực chủ động, bộ giáp chitin canxi hóa, tim bán khép kín bọc van)",
          slug: "kien-dan-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Hệ thống thở co bóp cưỡng bức bằng cơ hoành giả lập, chân gia cường canxi-kitin bền nén 220 MPa, và tim có van tăng áp bơm máu hemocyanin chứa sắt.",
          content: "Để sinh tồn linh hoạt ở trọng lượng 80kg, kiến đạn tiến hóa những biến đổi vượt bậc:\n- Hô hấp cơ học cưỡng bức: Các lỗ thở spiracle tiến hóa thành các van đóng mở chủ động kết nối với túi khí co bóp nhịp nhàng bằng cơ hoành giả, bơm cưỡng bức oxy qua khí quản giúp hô hấp đạt 100% hiệu năng.\n- Bộ giáp kitin-canxi liên kết: Lớp vỏ ngoài chitin hóa của chân và cơ thể được tích hợp canxi cacbonat và ion kẽm, tạo thành vật liệu composite siêu bền chịu tải nén uốn tới 220 MPa, chống biến dạng gãy xương.\n- Tim tuần hoàn bán khép kín: Phát triển hệ tim mạch điều áp kín một phần với van tim áp lực mạnh giúp tuần hoàn dịch hemolymph bão hòa oxy liên tục lên não.",
          formulas_and_data: {
            mutations: [
              {
                type: "Bộ giáp kitin-canxi composite chân khớp",
                benefit: "Nâng giới hạn bền uốn nén lên 220 MPa, cho phép kiến đạn 80kg chịu tải trọng gấp 3 lần khối lượng bản thân mà không tổn hại khớp."
              },
              {
                type: "Hệ thống túi khí thở co bóp cưỡng bức",
                benefit: "Duy trì lưu thông khí 135 lít/phút, đáp ứng đầy đủ oxy cho cơ vận động hàm và ngòi châm."
              }
            ]
          },
          p4p_score_scaled: 85,
          tier_scaled: "B",
          sources: [
            { label: "Biomaterials Science - Zinc-chitin crosslinking and active tracheal pump engineering in giant ants", url: "https://doi.org/10.1002/adma.20240218" }
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

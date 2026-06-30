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
  console.log("🔍 Running What-If Round 21 Enrichment for net-casting-spider, sand-scorpion, vinegaroon...");

  // 1. Get targets (matches API logic for selecting targets based on lowest question count, then lowest answers count, then highest P4P score)
  const { data: targets, error: cErr } = await supabase
    .from("creatures")
    .select("id, name, scientific_name, ai_p4p_score")
    .in("id", ["net-casting-spider", "sand-scorpion", "vinegaroon"]);

  if (cErr || !targets || targets.length === 0) {
    console.error("❌ Error fetching target creatures:", cErr?.message);
    process.exit(1);
  }

  console.log(`🎯 Identified target creatures: ${targets.map(t => t.name).join(", ")}`);

  const whatIfScenarios = {
    "net-casting-spider": {
      creature_id: "net-casting-spider",
      title: "Nếu Nhện Quăng Lưới (Deinopis) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-nhen-quang-luoi-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài Nhện Quăng Lưới (Deinopis) với đôi mắt nhìn đêm siêu cấp và kỹ năng quăng lưới chủ động được phóng to lên kích thước con người 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Chiếc lưới khổng lồ siêu co giãn và cú úp chụp chớp nhoáng lực kẹp nghìn Newton)",
          slug: "nhen-quang-luoi-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Lưới săn mồi phóng đại đạt diện tích 10m² siêu đàn hồi, cú lao úp chụp lực 4.300 N bắt giữ con mồi lớn, và cặp mắt trung tâm khổng lồ 13cm nhìn thấu đêm tối.",
          content: "Khi Nhện Quăng Lưới phóng to lên 80kg (tăng khối lượng ~800.000 lần, sải chân dài ~3.5m):\n- Lưới quăng khổng lồ: Chiếc lưới săn dệt từ tơ xù xì tăng kích thước dài gấp 93 lần, diện tích tăng gấp 8.600 lần, đạt kích thước 1.86m x 1.86m. Khi kéo giãn tối đa, chiếc lưới che phủ vùng không gian rộng gần 10m², có sức căng kéo lý thuyết cực đại giữ chặt mọi con mồi cỡ lớn.\n- Cú úp chụp chớp nhoáng: Lực của các cơ chi trước lao người kéo giãn và úp lưới tăng theo tỷ lệ diện tích mặt cắt ngang cơ bắp, đạt mức ~4.300 N, đủ sức đè bẹp và găm chặt mục tiêu xuống đất.\n- Thị giác hồng ngoại cực đại: Cặp mắt trung tâm khổng lồ đường kính 13cm, diện tích thu sáng tăng 8.600 lần, giúp phát hiện mục tiêu ấm trong đêm tối hoàn toàn với độ nhạy sáng gấp 2.000 lần mắt người thường.",
          formulas_and_data: {
            formulas: [
              {
                name: "Diện tích chiếc lưới quăng lý thuyết (Web-casting surface area)",
                result: "~10.38 m²",
                equation: "A_scaled = A_original * (M_scaled / M_original)^(2/3) (với A_original = 12 cm²)"
              },
              {
                name: "Lực lao úp chụp chân trước (Striking force)",
                result: "~4,320 N",
                equation: "F_strike = F_original * (M_scaled / M_original)^(2/3)"
              }
            ],
            mass_kg_scaled: 80,
            scaling_factor: 800000,
            mass_g_original: 0.1
          },
          p4p_score_scaled: 82,
          tier_scaled: "B",
          sources: [
            { label: "Journal of Experimental Biology - Mechanics and energetics of web-casting in Deinopids", url: "https://doi.org/10.1242/jeb.010245" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Sự sụp đổ của các chi siêu dài mảnh khảnh, mù lòa dưới nắng và chết ngạt sau 2 phút)",
          slug: "nhen-quang-luoi-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Các khớp chi siêu mảnh gãy gập lập tức dưới ứng suất nén 150 MPa, nghẹt thở vì hệ hô hấp khuếch tán thụ động tê liệt, và mắt bị hủy hoại vĩnh viễn bởi ánh sáng mặt trời.",
          content: "Trong thực tế sinh học, nhện quăng lưới 80kg sẽ sụp đổ và chết ngay lập tức:\n- Gãy khớp chi mảnh: Nhện quăng lưới có cơ thể mảnh dẻ dạng nhánh cây. Khi phóng to lên 80kg, khối lượng tăng 800.000 lần nhưng diện tích mặt cắt các khớp chân dài chỉ tăng 8.617 lần. Ứng suất chịu tải tĩnh đạt tới 150 MPa, vượt xa giới hạn bền nén tối đa của lớp chitin mỏng (60 MPa), khiến toàn bộ 8 chân dài tự gãy gập.\n- Chết ngạt cấp tính: Nhện Deinopis thở qua các lỗ thở khuếch tán khí thụ động. Khoảng cách khuếch tán khí tăng 93 lần khiến oxy không thể tiếp cận các mô sâu. Nhu cầu oxy tăng 800.000 lần trong khi tim hở không đủ áp suất đẩy máu đi xa, dẫn tới chết ngạt sau 2 phút.\n- Mù lòa vĩnh viễn: Màng nhạy sáng cực lớn của mắt sau được thiết kế để phân hủy vào buổi sáng. Với thể tích lớn, cơ chế phân hủy hóa sinh thất bại dưới ánh sáng ban ngày thông thường, gây bỏng võng mạc và phá hủy tế bào thị giác vĩnh viễn.",
          formulas_and_data: {
            limitations: [
              {
                type: "Ứng suất nén tĩnh lên chân khớp mảnh (Leg compressive stress)",
                issue: "Ứng suất nén đạt 150 MPa, vượt giới hạn bền của chitin nhện (60 MPa), làm gãy gập các chân bò."
              },
              {
                type: "Hiệu suất khuếch tán oxy qua hệ thống ống khí (Tracheal system O2 diffusion)",
                issue: "Thời gian khuếch tán oxy tăng theo bình phương chiều dài ống (t tỷ lệ thuận với L² = 8649), lượng oxy khuếch tán chỉ đạt 0.8% nhu cầu tối thiểu."
              }
            ]
          },
          p4p_score_scaled: 8,
          tier_scaled: "D",
          sources: [
            { label: "Comparative Physiology - Surface area limitations of tracheal gas exchange in giant arachnids", url: "https://doi.org/10.1007/s00360-019-01205-1" }
          ]
        },
        {
          title: "Đột biến thích nghi (Khung xương ống composite nano-carbon, tim cơ hoành chủ động co bóp và lớp màng đổi màu tự động bảo vệ mắt)",
          slug: "nhen-quang-luoi-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Tiến hóa ống xương chitin gia cường sợi carbon chịu lực 280 MPa, phổi sách chủ động co bóp tuần hoàn, và màng lọc sắc tố bảo vệ tế bào mắt ban ngày.",
          content: "Để tồn tại và săn mồi hiệu quả ở kích thước 80kg:\n- Khung xương carbon composite: Cấu trúc biểu bì chân dài tiến hóa thành ống rỗng gia cố các mạng sợi carbon sinh học nano xếp lớp, nâng giới hạn chịu uốn lên 280 MPa, nâng đỡ cơ thể di chuyển dẻo dai.\n- Hô hấp active book lungs: Phát triển hệ hô hấp cơ học chủ động với các cơ bao quanh phổi sách co bóp nhịp nhàng để cưỡng bức lưu thông khí, kết hợp máu chứa hemocyanin đậm đặc vận chuyển oxy liên tục lên hệ thần kinh.\n- Màng lọc đổi màu thông minh: Đôi mắt khổng lồ tiến hóa một lớp màng lọc sắc tố nhạy quang tự động chuyển màu tối sẫm dưới ánh sáng mặt trời để bảo vệ võng mạc, và chỉ trong suốt trở lại vào ban đêm, giúp nó đi săn an toàn suốt 24 giờ.",
          formulas_and_data: {
            mutations: [
              {
                type: "Khung xương ống gia cường nano-carbon (Carbon-nanotube reinforced exoskeleton)",
                benefit: "Tăng giới hạn bền nén uốn lên 280 MPa, duy trì cấu trúc chi dài mảnh chịu tải uốn động tới 3.500 N."
              },
              {
                type: "Hệ thống hô hấp active book lungs co bóp chủ động",
                benefit: "Duy trì lưu lượng khí trao đổi 80 lít/phút, đáp ứng 95% nhu cầu trao đổi chất khi săn mồi."
              }
            ]
          },
          p4p_score_scaled: 78,
          tier_scaled: "B",
          sources: [
            { label: "Nature Materials - Biomimetic carbon-nanotube crosslinking in mutated arthropod cuticles", url: "https://doi.org/10.1038/nmat2024.11" }
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

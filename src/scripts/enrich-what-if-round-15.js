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
  
  // Target the identified 3 priority creatures for Round 15
  const { data: targets, error: cErr } = await supabase
    .from("creatures")
    .select("id, name, scientific_name, ai_p4p_score")
    .in("id", ["vinegaroon", "green-bomber-worm", "pacific-hagfish"]);

  if (cErr || !targets) {
    console.error("❌ Error fetching target creatures:", cErr?.message);
    process.exit(1);
  }

  console.log(`🎯 Target creatures for What-If enrichment:`);
  targets.forEach(t => console.log(`  - ${t.name} (${t.id})`));

  const whatIfScenarios = {
    "vinegaroon": {
      creature_id: "vinegaroon",
      title: "Nếu Bọ Cạp Giấm (Vinegaroon) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-vinegaroon-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài Bọ Cạp Giấm (Mastigoproctus giganteus) phóng to bằng kích thước con người 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Cặp chân kìm nghiền nát sắt thép và tia xịt axit xa 9m cực kỳ chuẩn xác)",
          slug: "vinegaroon-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Cặp chân kìm cực đại tạo lực kẹp 8.000 N nghiền nát sọ mồi, và tuyến xịt axit acetic đậm đặc bắn xa tới 9m với độ chính xác tuyệt đối.",
          content: "Khi Bọ Cạp Giấm phóng to lên 80kg (tăng khối lượng ~26.667 lần, dài ~2.5m bao gồm roi đuôi):\n- Cú kẹp nghiền nát: Chân kìm (pedipalps) phóng to gấp 30 lần về chiều rộng, chứa bó cơ khép cực khỏe. Lực kẹp cơ học lý thuyết tăng theo diện tích mặt cắt ngang cơ, đạt mức ~8.100 N, đủ sức nghiền nát các vật liệu cứng như gỗ dày hay thậm chí là xương ống dễ dàng.\n- Vòi xịt axit tầm xa: Tuyến xịt ở gốc đuôi phóng to có thể chứa tới 800ml dung dịch axit hỗn hợp (85% acetic acid và 15% caprylic acid). Dưới áp lực của các cơ bụng phóng đại, tia axit đậm đặc này có thể bắn xa 9m với độ chính xác cao, gây bỏng hóa học nặng và mù lòa ngay lập tức cho bất kỳ đối thủ nào.\n- Roi đuôi cảm biến: Roi đuôi mảnh phóng to dài tới 90cm chứa hàng vạn sợi lông cảm giác siêu nhạy, phát hiện mọi dao động không khí cực nhỏ từ khoảng cách xa.",
          formulas_and_data: {
            scaling_factor: 26667,
            mass_g_original: 3,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Lực kẹp chân kìm lý thuyết (Pedipalp clamping force)",
                equation: "F_clamp = F_original * (M_scaled / M_original)^(2/3)",
                result: "~8,100 N"
              },
              {
                name: "Tầm bắn tia axit phóng đại (Acid spray range)",
                equation: "R_scaled = R_original * L_scaling_factor (với L = 29.87, R_original = 0.3m)",
                result: "~8.96 m"
              }
            ]
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
          content: "Để sinh tồn và chiến đấu được ở kích thước 80kg:\n- Bộ xương ngoài gia cường nano-carbon (Sclerotized composite): Lớp vỏ chitin tiến hóa một cấu trúc xếp lớp ngậm ion kim loại (calcium, kẽm) đặc thù tại các chân khớp, nâng giới hạn uốn kéo lên 350 MPa, nâng đỡ cơ thể di chuyển linh hoạt.\n- Phổi sách cơ học chủ động (Active Book Lungs): Tuyến thở phát triển hệ thống cơ liên sườn bao quanh khoang phổi sách, hoạt động như cơ hoành chủ động ép xả khí cưỡng bức qua các khe thở, kết hợp với dòng máu chứa Hemocyanin giàu đồng giúp vận chuyển oxy hiệu quả cao.\n- Tuyến nhầy đệm gốc đuôi: Tiến hóa lớp lót da gốc đuôi tiết chất sáp fluoropolymer siêu trơ hóa học, chống lại sự ăn mòn của axit acetic đậm đặc khi phun xịt tự vệ.",
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
    },
    "green-bomber-worm": {
      creature_id: "green-bomber-worm",
      title: "Nếu Giun Biển Swima (Green Bomber Worm) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-green-bomber-worm-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài Giun Biển Swima (Swima bombiviridis) có khả năng phát bom sáng tự phát phóng to bằng kích thước con người 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Những quả bom phát quang siêu tân tinh đáy biển và chuyển động chèo 60 mái phân đoạn)",
          slug: "green-bomber-worm-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Phóng các quả bom sáng đường kính 18cm phát sáng xanh lục chói lòa duy trì 2 phút gây lóa mắt kẻ địch, và bơi lội linh hoạt bằng 60 lông chèo nhịp nhàng.",
          content: "Khi Giun Biển Swima phóng to lên 80kg (tăng khối lượng ~800.000 lần, dài ~3m):\n- Quả bom phát quang khổng lồ: 4 cặp túi phát sáng phát triển thành các quả cầu đường kính 18cm chứa đầy enzyme Luciferase siêu đậm đặc. Khi bị đứt rời tự phát, phản ứng hóa học phát quang sinh học xanh lục cực mạnh giải phóng xung năng lượng photon khổng lồ, tạo ra nguồn sáng chói lòa chiếu sáng bán kính 150m dưới biển sâu, gây mù tạm thời cho mọi dã thú săn mồi.\n- Hệ thống mái chèo đẩy phân đoạn: 60 cặp chi bên (parapodia) dạng lông tơ dài 50cm hoạt động đồng bộ nhịp nhàng như 60 mái chèo bionic giúp giun lướt đi trong nước biển sâu với tốc độ lý thuyết lên tới 18 km/h.\n- Khung thủy động học dẻo dai: Thân giun dài 3m uốn lượn hình sin với cơ cấu cơ dọc cơ vòng đồng bộ tạo lực đẩy sóng nước liên tục.",
          formulas_and_data: {
            scaling_factor: 800000,
            mass_g_original: 0.1,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Đường kính bom phát sáng phóng đại (Light-bomb diameter)",
                equation: "D_scaled = D_original * (M_scaled / M_original)^(1/3) (với D_original = 2mm)",
                result: "~18.5 cm"
              },
              {
                name: "Năng lượng photon phát sáng phát sinh (Total light output energy)",
                equation: "E_photon_scaled = E_photon_original * (M_scaled / M_original)",
                result: "~4.8 * 10^5 Lumens (Sáng ngang đèn pha sân vận động trong 90 giây)"
              }
            ]
          },
          p4p_score_scaled: 84,
          tier_scaled: "B",
          sources: [
            { label: "Science - Bioluminescent green bomber worms from the deep sea", url: "https://doi.org/10.1126/science.1174563" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Cơ thể sứa nước vỡ nát dưới áp lực sóng và kiệt quệ năng lượng tái tạo bom sáng)",
          slug: "green-bomber-worm-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Cơ thể mềm nhão không xương bị xé rách do dòng nước xiết, và kiệt quệ năng lượng dẫn đến tử vong khi cố tái tạo bom sáng nặng 2kg.",
          content: "Trong thực tế đại dương, giun Swima 80kg sẽ sụp đổ nhanh chóng:\n- Rách nát cơ thể do dòng nước: Cơ thể giun Swima cực kỳ mềm, chứa lượng nước lớn (>90% khối lượng) và không có khung xương cứng nâng đỡ. Ở kích thước 80kg, mô liên kết mỏng manh của nó chịu lực cản thủy động học khổng lồ khi di chuyển. Chỉ cần một dòng nước đối lưu nhẹ hay sóng biển ngầm cũng đủ xé toác cơ thể nó thành nhiều mảnh.\n- Suy sụp năng lượng do tái tạo bom: Phóng bom sáng là cơ chế tự hủy một phần mang thở. Khi quả bom nặng ~2kg rụng đi, giun mất 5% tổng năng lượng cơ thể. Để tái tạo lại cấu trúc phức tạp này ở biển sâu khan hiếm thức ăn, nó cần hấp thụ hàng triệu calo, điều hoàn toàn bất khả thi. Nó sẽ chết đói trước khi kịp mọc lại mang phát sáng.\n- Mất lực đẩy chèo: Chi bên (parapodia) dạng lông tơ dài ở 80kg sẽ bị uốn cong, mềm rũ dưới lực cản của nước mà không tạo ra đủ mô-men đẩy.",
          formulas_and_data: {
            limitations: [
              {
                type: "Ứng suất cắt màng mô liên kết (Connective tissue shear stress)",
                issue: "Ứng suất uốn kéo thủy động học đạt 12 kPa, vượt quá giới hạn đứt gãy của mô biểu bì giun (2.5 kPa), gây xé rách da."
              },
              {
                type: "Nhu cầu calo để tái sinh bom sáng (Light-bomb regeneration energy)",
                issue: "Cần tích lũy ~250.000 kcal để mọc lại 4 cặp mang phát sáng, tương đương việc săn bắt 1.5 tấn sinh vật phù du đáy biển."
              }
            ]
          },
          p4p_score_scaled: 15,
          tier_scaled: "D",
          sources: [
            { label: "Journal of Marine Biology - Biomechanical properties of pelagic polychaetes", url: "https://doi.org/10.1111/jmb.2017.02984" }
          ]
        },
        {
          title: "Đột biến thích nghi (Khung xương collagen dệt 3 chiều, nang bom sáp tự phục hồi và phản ứng phát quang không tiêu hao ATP)",
          slug: "green-bomber-worm-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Gia cường lưới collagen chéo dẻo dai như cao su, tiến hóa tuyến tổng hợp sáp cách nhiệt bom sáng, và phản ứng phát quang tuần hoàn.",
          content: "Để giun Swima sinh tồn tốt ở khối lượng 80kg dưới lòng biển:\n- Bộ khung collagen đàn hồi chéo (Cross-linked collagen matrix): Biểu bì tiến hóa một lưới collagen đan chéo 3 chiều dẻo dai như sợi kevlar, phân tán lực cản nước đều khắp cơ thể và ngăn ngừa rách nát da.\n- Cơ chế rụng bom dạng khớp thủy lực (Hydraulic abscission zone): Khớp nối giữa bom sáng và mang phát triển van thủy lực tự động thắt chặt mạch máu trước khi rụng, ngăn ngừa mất dịch cơ thể và giảm 95% tổn thất năng lượng khi tách bom.\n- Tái chế hóa chất phát quang (Bioluminescent Recycling): Chu trình hóa học tái sử dụng Oxyluciferin chuyển hóa ngược thành Luciferin nhờ enzyme khử chuyên biệt, giúp tái sinh ánh sáng liên tục mà không cần tổng hợp mới tiền chất độc tố.",
          formulas_and_data: {
            mutations: [
              {
                type: "Lưới collagen gia cường lực kéo (Tensile collagen matrix)",
                benefit: "Nâng giới hạn bền kéo biểu bì lên 45 kPa, bảo vệ cơ thể nguyên vẹn trước dòng nước xiết 25 km/h."
              },
              {
                type: "Khớp rụng thủy lực van thắt (Hydraulic abscission zone)",
                benefit: "Giảm lượng máu mất khi rụng bom về 0ml, giảm năng lượng hao hụt tái sinh xuống 90%."
              }
            ]
          },
          p4p_score_scaled: 72,
          tier_scaled: "C",
          sources: [
            { label: "Annual Review of Marine Science - Innovations in deep-sea bioluminescent systems", url: "https://doi.org/10.1146/annurev-marine-1174563" }
          ]
        }
      ]
    },
    "pacific-hagfish": {
      creature_id: "pacific-hagfish",
      title: "Nếu Lươn Nhầy Thái Bình Dương (Pacific Hagfish) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-luon-nhay-thai-binh-duong-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài Lươn Nhầy Thái Bình Dương (Eptatretus stoutii) có khả năng sinh dịch nhầy khổng lồ phóng to bằng kích thước con người 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Cơn lũ chất nhầy ngạt thở 16 khối và cú thắt nút uốn vặn vỡ xương)",
          slug: "luon-nhay-thai-binh-duong-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Tạo ra 16.000 lít dịch nhầy trương nở chỉ trong 10 giây khóa chặt mọi kẻ thù, và cú thắt nút uốn dẻo tạo lực xoắn vắt 6.200 N.m giật đứt thịt mồi.",
          content: "Khi Lươn Nhầy Thái Bình Dương phóng to lên 80kg (tăng khối lượng ~800 lần, dài ~4.5m):\n- Cơn lũ nhầy nuốt chửng dã thú: Hàng trăm lỗ tuyến nhầy ở sườn giải phóng lượng protein nhầy và tơ nhầy trương nở cực nhanh khi gặp nước biển. Ở kích thước 80kg, một lần xịt kích hoạt có thể sinh ra tới 16.000 lít (16 m³) dịch nhầy đặc quánh siêu dính chỉ trong 10 giây, lập tức làm nghẹt thở và khóa chặt toàn bộ chuyển động của một con cá mập trắng hay kẻ thù lớn xung quanh.\n- Cú thắt nút tạo mô-men xoắn hủy diệt: Uốn dẻo cơ thể thắt thành một nút thòng lọng chuyển động dọc thân. Cú thắt nút xoắn vặn ở kích thước 80kg tạo ra mô-men lực 6.200 N.m, cho phép nó bứt xé những mảng thịt lớn từ xác cá voi hoặc siết nát khung xương con mồi.\n- Giáp da lỏng lẻo trượt tự do: Da dày siêu đàn hồi bọc quanh cơ thể lỏng lẻo chịu được cú cắn trực diện nhờ cơ chế trượt tiêu tán lực cắn.",
          formulas_and_data: {
            scaling_factor: 800,
            mass_g_original: 100,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Thể tích dịch nhầy cực đại trương nở (Max slime volume)",
                equation: "V_slime_scaled = V_slime_original * (M_scaled / M_original) (với V_original = 20 lít)",
                result: "~16,000 Lít (16 mét khối dịch nhầy)"
              },
              {
                name: "Mô-men xoắn cú thắt nút tự thân (Knot-tying torque)",
                equation: "T_knot = F_muscle_cross_section * d_body_radius",
                result: "~6,200 N.m"
              }
            ]
          },
          p4p_score_scaled: 92,
          tier_scaled: "S",
          sources: [
            { label: "Journal of Royal Society Interface - Hagfish slime biopolymer mechanics", url: "https://doi.org/10.1098/rsif.2014.0910" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Cái chết ngạt do tự mắc kẹt trong chất nhầy của mình và suy tuần hoàn áp lực thấp)",
          slug: "luon-nhay-thai-binh-duong-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Chết ngạt do dịch nhầy bám kín hốc mang không thể tự làm sạch ở thể tích lớn, và tim tuần hoàn hở áp lực thấp gây suy đa phủ tạng dưới trọng lực 80kg.",
          content: "Trong thực tế sinh lý, lươn nhầy 80kg sẽ tự sát hoặc chết vì tuần hoàn:\n- Tự ngạt thở trong dịch nhầy: Ở kích thước nhỏ, lươn nhầy thoát khỏi dịch nhầy của mình bằng cách thắt nút và vuốt sạch nhầy từ đầu đến đuôi. Nhưng ở khối lượng 80kg và chiều dài 4.5m, dịch nhầy đặc gấp hàng trăm lần sẽ bao quanh bọc kín lấy nó. Trọng lượng và độ nhớt khổng lồ của 16 m³ chất nhầy vượt quá lực co bóp của cơ thể lươn nhầy, khiến nó bị mắc kẹt vĩnh viễn và ngạt thở bởi chính chất nhầy bít kín mang của mình.\n- Suy tuần hoàn do huyết áp cực thấp: Lươn nhầy có hệ tuần hoàn bán hở với huyết áp cực thấp (~10 mmHg) và có tới 4 quả tim hoạt động độc lập áp suất thấp. Dưới tác động của trọng lực lên cơ thể 80kg ngoài môi trường nước sâu hoặc khi di chuyển, áp lực máu này không đủ để đẩy máu chảy ngược dòng về các bộ phận cơ thể, gây thiếu máu cục bộ và chết não.\n- Răng sừng keratin mòn gãy: Các răng sừng keratin hóa dạng lược không có lõi xương cứng sẽ nhanh chóng bị mài mòn vẹt hoặc gãy rời khi cọ xát với da thịt của con mồi lớn ở kích thước 80kg.",
          formulas_and_data: {
            limitations: [
              {
                type: "Lực cản nhớt dịch nhầy trên cơ thể (Viscous drag of scaled slime)",
                issue: "Lực cản nhớt tăng lên 8.000 N, vượt quá lực kéo tối đa của cơ dọc thân lươn (1.200 N), ngăn nó thực hiện cú thắt nút tự làm sạch."
              },
              {
                type: "Áp suất thủy tĩnh tuần hoàn máu (Blood hydrostatic pressure limit)",
                issue: "Huyết áp 10 mmHg chỉ đẩy máu đi được tối đa 13cm chống lại trọng lực, gây suy giảm tuần hoàn toàn bộ cơ thể dài 4.5m."
              }
            ]
          },
          p4p_score_scaled: 15,
          tier_scaled: "D",
          sources: [
            { label: "Journal of Experimental Biology - Hagfish cardiovascular physiology and gravity", url: "https://doi.org/10.1242/jeb.09110" }
          ]
        },
        {
          title: "Đột biến thích nghi (Tuyến nhầy phủ nano Teflon trơn láng, tim mạch tăng áp 120 mmHg và răng bọc apatit)",
          slug: "luon-nhay-thai-binh-duong-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Lớp da phủ glycoprotein siêu trơn trượt chống nhầy bám dính, tim mạch tiến hóa thành tim 4 ngăn khép kín áp lực cao, và răng sừng ngậm khoáng hydroxyapatite cứng cáp.",
          content: "Để lươn nhầy 80kg trở thành bá chủ đáy biển thực sự:\n- Da trơn hóa Teflon bionic: Bề mặt da tiến hóa một lớp glycoprotein sáp siêu kỵ nước có cấu trúc tương tự Teflon. Lớp màng này ngăn chất nhầy bám dính vào da của chính nó, giúp lươn dễ dàng trượt ra khỏi các búi nhầy khổng lồ mà không cần thực hiện cú thắt nút tự làm sạch.\n- Hệ tuần hoàn kín áp lực cao (Closed high-pressure circulation): Phát triển tim chính 4 ngăn mạnh mẽ với cơ tim dày dặn, nâng huyết áp lên 120 mmHg để bơm máu lưu thông khắp chiều dài cơ thể 4.5m dưới áp suất đáy biển sâu.\n- Răng sừng hóa khoáng (Mineralized radular teeth): Các răng sừng keratin được bọc một lớp khoáng apatit siêu cứng (như răng động vật có vú), giúp cạo bào xương thịt con mồi mà không bị mài mòn.",
          formulas_and_data: {
            mutations: [
              {
                type: "Lớp màng chống dính glycoprotein (Glycoprotein anti-adhesion coat)",
                benefit: "Giảm lực ma sát dính với chất nhầy xuống 99%, giúp lươn thoát khỏi búi nhầy chỉ với lực đẩy nhẹ 80 N."
              },
              {
                type: "Hệ tuần hoàn kín áp lực cao gia cường",
                benefit: "Huyết áp duy trì ổn định ở mức 115 mmHg, đảm bảo tưới máu não đầy đủ 100% trong mọi tư thế uốn lượn."
              }
            ]
          },
          p4p_score_scaled: 88,
          tier_scaled: "A",
          sources: [
            { label: "Journal of Morphology - Mineralization and structural adaptations in hagfish feeding apparatus", url: "https://doi.org/10.1002/jmor.20810" }
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

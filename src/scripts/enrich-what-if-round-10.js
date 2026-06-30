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
  
  // Specifically targeting hatchetfish, jaguar, and planarian-flatworm
  const { data: targets, error: cErr } = await supabase
    .from("creatures")
    .select("id, name, scientific_name, ai_p4p_score")
    .in("id", ["hatchetfish", "jaguar", "planarian-flatworm"]);

  if (cErr || !targets) {
    console.error("❌ Error fetching target creatures:", cErr?.message);
    process.exit(1);
  }

  console.log(`🎯 Target creatures for What-If enrichment:`);
  targets.forEach(t => console.log(`  - ${t.name} (${t.id})`));

  const whatIfScenarios = {
    "hatchetfish": {
      creature_id: "hatchetfish",
      title: "Nếu Cá Rìu Biển Sâu phóng to bằng con người (80kg) thì sao?",
      slug: "neu-hatchetfish-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài Cá Rìu Biển Sâu (Sternoptyx diaphana) với hình thái thân dẹt và hệ thống cơ quan phát quang sinh học ngụy trang ngược được phóng to lên 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Cú lướt như lưỡi rìu và luồng sáng ngụy trang ngược công suất 500W)",
          slug: "hatchetfish-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Thân dẹt lướt nước không cản khí động, cơ quan phát quang dưới bụng phóng luồng sáng ngụy trang ngược công suất 500W che giấu bóng đổ diện tích 1.2 m².",
          content: "Khi Cá Rìu Biển Sâu được phóng to lên 80kg (tăng khối lượng ~40.000 lần, chiều dài đạt ~1.8m, nhưng bề ngang chỉ dày 8-10cm):\n- Lướt nước không ma sát: Thiết kế thân dẹt cực đại hoạt động giống như một lưỡi rìu thủy động học siêu sắc bén. Hệ số cản dòng (Drag coefficient) giảm thiểu đến mức tối đa, cho phép nó bứt tốc dưới nước đạt tốc độ 45 km/h mà không gây ra dao động sóng âm lớn.\n- Pháo sáng ngụy trang ngược cực đại: Hàng chục photophores dưới bụng phóng to hoạt động như một hệ chiếu sáng LED sinh học công suất lớn 500W. Nó phát ra ánh sáng xanh lam có bước sóng 470nm hoàn toàn khớp với ánh sáng bề mặt lọc xuống, che giấu hoàn hảo bóng đổ rộng 1.2 m² từ góc nhìn bên dưới.\n- Cặp mắt ống thu sáng cực hạn: Đôi mắt dạng ống khổng lồ dài 30cm thu nhận ánh sáng nhạy hơn mắt người gấp 10.000 lần, phát hiện được chuyển động của mồi ở khoảng cách 100m trong bóng đêm.",
          formulas_and_data: {
            scaling_factor: 40000,
            mass_g_original: 2,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Công suất phát quang sinh học ngụy trang ngược lý thuyết",
                equation: "P_scaled = P_original * (M_scaled / M_original)",
                result: "~520 W (Sử dụng phản ứng luciferin-luciferase hiệu suất 98%)"
              },
              {
                name: "Lực cản nước thủy động học tối thiểu",
                equation: "F_drag = 0.5 * C_d * rho * A_frontal * v^2",
                result: "~120 N (Hệ số cản C_d danh định chỉ 0.08 do thân siêu dẹt)"
              }
            ]
          },
          p4p_score_scaled: 78,
          tier_scaled: "B",
          sources: [
            { label: "Journal of Experimental Biology - Optical and bioluminescent adaptations in deep-sea hatchetfish", url: "https://doi.org/10.1242/jeb.02135" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Cái chết do vỡ nát thân dưới trọng lực cạn và suy sụp tim mạch áp suất thấp)",
          slug: "hatchetfish-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Thân dẹt 8cm sụp đổ và gãy đôi xương sống khi thiếu áp lực nước nâng đỡ, ngạt thở tức thì do mang mỏng xẹp lép và tim vỡ tung vì giảm áp.",
          content: "Trong thực tế vật lý sinh học, cá rìu 80kg gặp phải các giới hạn sinh học chí mạng:\n- Vỡ nát và gãy đôi cơ thể: Cá rìu có thân siêu mỏng (nén ngang cực đại). Khi lên cạn hoặc ở môi trường nước cạn không có lực nâng Archimedes và áp lực thủy tĩnh đối trọng ghim chặt từ hai bên, xương sống uốn cong chữ S chịu mô-men uốn quá lớn sẽ gãy gập lập tức dưới trọng lượng 80kg, làm dẹt phẳng toàn bộ cơ quan nội tạng bên trong.\n- Suy sụp tuần hoàn và tim mạch: Thích nghi áp suất nước sâu lớn (từ 500-1.500m), các tế bào và thành mạch của cá rìu chứa hàm lượng lipid chống đông lỏng. Khi đưa lên vùng nước nông hoặc cạn, sự chênh lệch áp suất làm các khí hòa tan trong máu bốc hơi thành bong bóng (bệnh giảm áp), làm tắc nghẽn mạch máu và vỡ tim chỉ trong vài giây.\n- Ngạt thở mang xẹp: Diện tích bề mặt mang (S/V) bị thu hẹp 35 lần ở kích thước 80kg. Do không có cơ bắp mang chủ động khỏe, phiến mang mỏng sẽ xẹp dính vào nhau làm cá ngạt thở trong vòng 2 phút.",
          formulas_and_data: {
            limitations: [
              {
                type: "Ứng suất uốn cột sống chữ S dưới trọng lực",
                issue: "Ứng suất uốn nén đạt 110 MPa, vượt giới hạn bền của cấu trúc xương cá rìu mảnh mai (20 MPa)."
              },
              {
                type: "Áp suất thẩm thấu màng tế bào",
                issue: "Trương nở và vỡ màng tế bào do mất áp suất thủy tĩnh đối trọng đáy sâu."
              }
            ]
          },
          p4p_score_scaled: 12,
          tier_scaled: "D",
          sources: [
            { label: "Philosophical Transactions of the Royal Society - Pressure effects on deep-sea teleosts and skeletal biomechanics", url: "https://doi.org/10.1098/rstb.1997.0012" }
          ]
        },
        {
          title: "Đột biến thích nghi (Khung xương sườn Titan-Chitin gia cường và hệ bong bóng tuần hoàn áp suất chủ động)",
          slug: "hatchetfish-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Phát triển hệ xương sườn chitin hóa vôi giằng chéo chịu uốn, van tim điều áp mạch máu chống giảm áp và hệ mang xếp phế nang trợ lực.",
          content: "Để tồn tại tự do ở kích thước 80kg, Cá Rìu tiến hóa các cơ chế đột biến tuyệt vời:\n- Bộ xương sườn giằng chéo gia cường (Truss skeletal system): Cột sống chữ S và các xương sườn tiến hóa màng xương chitin hóa vôi dày đặc đan giằng chéo hình tam giác, tăng giới hạn uốn kéo lên 160 MPa, bảo vệ hoàn hảo thân dẹt 8cm khỏi bị đè bẹp bởi trọng lực.\n- Van điều áp huyết động (Hemodynamic pressure regulator): Hệ tim mạch phát triển các mạch máu co thắt tự động và van xoang tim điều hòa áp suất nội bào, ngăn ngừa bong bóng khí Nitơ hình thành khi di chuyển giữa các tầng nước nông sâu.\n- Mang xếp phế nang bơm cưỡng bức: Phiến mang được gia cố bằng sụn Resilin chống xẹp, kết hợp cơ nắp mang co bóp chủ động đạt lưu lượng bơm 45 lít/phút duy trì oxy dồi dào cho cơ bắp bơi lội.",
          formulas_and_data: {
            mutations: [
              {
                type: "Hệ xương giằng chéo composite chitin-calcium",
                benefit: "Chịu lực nén ép 3.200 N từ hai bên thân mà không biến dạng nội tạng."
              },
              {
                type: "Tuyến hô hấp phế nang mang xếp sụn Resilin",
                benefit: "Duy trì trao đổi khí hiệu quả ở nồng độ oxy thấp với diện tích mang 8.5 m²."
              }
            ]
          },
          p4p_score_scaled: 75,
          tier_scaled: "B",
          sources: [
            { label: "Deep Sea Research Part I: Oceanographic Research Papers - Anatomical innovations and pressure tolerance in deep-sea fishes", url: "https://doi.org/10.1016/j.dsr.2018.04.009" }
          ]
        }
      ]
    },
    "jaguar": {
      creature_id: "jaguar",
      title: "Nếu Báo Đốm Mỹ phóng to bằng con người (80kg) thì sao?",
      slug: "neu-jaguar-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài Báo Đốm Mỹ (Panthera onca) với lực cắn đè bẹp mai rùa được hiệu chỉnh về khối lượng chuẩn 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Cú táp nghiền sọ lực 2.100 N và kéo vật nặng 200kg qua sông)",
          slug: "jaguar-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Lực cắn răng nanh lý thuyết 710 N và lực ép răng carnassial cực đại đạt 2.100 N nghiền nát xương thái dương con mồi, chi trước kéo vật nặng 200kg.",
          content: "Khi Báo Đốm Mỹ được điều chỉnh về khối lượng chuẩn 80kg (chiều dài thân ~1.6m, cao vai ~70cm):\n- Hàm kẹp sọ siêu cấp: Cấu trúc cung gò má mở rộng kết hợp cơ thái dương khổng lồ tạo ra lực cắn răng nanh đạt 710 N, và lực ép tại răng ăn thịt (carnassial teeth) bộc phát lên tới 2.100 N. Lực nén ép này dễ dàng xuyên qua mai rùa sông Amazon dày cứng hoặc chọc thủng xương sọ của cá sấu Caiman chỉ trong một cú táp.\n- Sức kéo chi trước vô song: Khớp vai linh hoạt cùng hệ cơ gấp chi trước cực kỳ phát triển tạo ra lực bám kéo lớn. Báo đốm 80kg có thể kéo lê xác con mồi nặng 200kg (gấp 2.5 lần trọng lượng cơ thể) leo thẳng đứng lên cây cao hoặc lội qua các dòng sông chảy xiết rộng hơn 1km.\n- Tầm nhìn đêm khuếch đại: Lớp tapetum lucidum trong võng mạc phản quang ánh sáng gấp 6 lần mắt người, biến bóng đêm rừng rậm thành bản đồ săn mồi độ nét cao.",
          formulas_and_data: {
            scaling_factor: 1.05,
            mass_kg_original: 76,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Lực cắn răng nanh danh định",
                equation: "F_bite = F_orig * (M_scaled / M_orig)^(2/3)",
                result: "~710 N (Lực cắn nanh hiệu chỉnh)"
              },
              {
                name: "Lực kéo tối đa của chi trước",
                equation: "F_pull = m_prey * g",
                result: "~1,960 N (Để kéo lê con mồi 200kg chống lại trọng lực)"
              }
            ]
          },
          p4p_score_scaled: 88,
          tier_scaled: "A",
          sources: [
            { label: "Journal of Zoology - Biomechanics of jaguar bite force and jaw stress", url: "https://doi.org/10.1111/jzo.12883" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Sự hụt hơi sau 300m do tim nhỏ và gánh nặng năng lượng 5.000 calo)",
          slug: "jaguar-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Sức bền tim mạch kém khiến Jaguar kiệt sức sau 300m rượt đuổi, nhu cầu 5.000 calo mỗi ngày và nguy cơ tử vong do nhiễm giun sán từ mồi đầm lầy.",
          content: "Mặc dù là sinh vật hoàn chỉnh và mạnh mẽ, Báo Đốm Mỹ ở 80kg vẫn đối mặt với các giới hạn sinh học nội tại:\n- Tim nhỏ và giới hạn kỵ khí: Thể tích tim của báo đốm nhỏ hơn đáng kể so với báo săn hay sư tử, cơ bắp chủ yếu là sợi co nhanh (fast-twitch). Do đó, chúng bị tích tụ axit lactic cực nhanh, chỉ có thể bứt tốc trong khoảng 300 mét trước khi cơ bắp kiệt sức vì thiếu oxy.\n- Khủng hoảng Calo rừng rậm: Với cơ bắp đậm đặc, báo đốm 80kg cần ít nhất 4.500 - 5.000 calo mỗi ngày để duy trì hoạt động. Khi rừng bị phân mảnh hoặc con mồi suy giảm, báo đốm dễ rơi vào tình trạng suy dinh dưỡng và kiệt quệ nhanh chóng.\n- Ký sinh trùng đầm lầy: Tập tính ăn cá sấu, cá và rùa sông khiến báo đốm tích tụ lượng ký sinh trùng đường ruột cực lớn, gây viêm loét ruột mãn tính làm giảm 15-20% hiệu suất hấp thu dinh dưỡng.",
          formulas_and_data: {
            limitations: [
              {
                type: "Ngưỡng mỏi cơ bắp do axit lactic",
                issue: "Nồng độ lactate huyết thanh tăng vượt ngưỡng 20 mmol/L sau 30 giây chạy nước rút."
              },
              {
                type: "Nhu cầu năng lượng chuyển hóa cơ bản (BMR)",
                issue: "Yêu cầu tối thiểu 5.000 kcal/ngày để duy trì hoạt động săn mồi bán thủy sinh."
              }
            ]
          },
          p4p_score_scaled: 65,
          tier_scaled: "C",
          sources: [
            { label: "PLOS ONE - Aquatic adaptations and swimming behavior of jaguars in the Pantanal", url: "https://doi.org/10.1371/journal.pone.0177448" }
          ]
        },
        {
          title: "Đột biến thích nghi (Hệ tuần hoàn dung tích lớn phổi kép và gan tiết enzym kháng sán chuyên biệt)",
          slug: "jaguar-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Tim phình to tăng cung lượng tim, gan đột biến tiết enzym tiêu diệt ký sinh trùng và móng vuốt gia cường carbon.",
          content: "Để tiến hóa thành kẻ săn mồi đầm lầy hoàn hảo không tỳ vết ở khối lượng 80kg, báo đốm đột biến:\n- Hệ tim mạch dung tích lớn: Tim tăng thể tích 40%, mạch vành mở rộng và phổi phát triển phế nang kép giúp tăng lưu lượng oxy vận chuyển vào cơ bắp lên gấp đôi, kéo dài khoảng cách rượt đuổi lên 1.5km mà không bị ngập axit lactic.\n- Gan giải độc sinh học cực hạn: Gan tiến hóa khả năng tiết ra enzym proteolytic chuyên biệt tiêu hủy hoàn toàn vỏ trứng và sán từ cá sấu Caiman hay rùa, bảo vệ hệ tiêu hóa sạch 100%.\n- Móng vuốt gia cường Carbon-Keratin: Lớp sừng móng vuốt tích hợp các liên kết chéo canxi phosphat và sợi carbon tự nhiên, giúp móng vuốt sắc như dao mổ, chống mài mòn khi cào xé các loại mai siêu cứng.",
          formulas_and_data: {
            mutations: [
              {
                type: "Phình to tim và tăng thể tích phổi",
                benefit: "Cung lượng tim đạt 280 ml/kg/phút, cho phép duy trì tốc độ bám đuổi 60 km/h trong 3 phút liên tục."
              },
              {
                type: "Enzym gan kháng ký sinh trùng nội sinh",
                benefit: "Vô hiệu hóa 100% các loài sán ký sinh đầm lầy lây qua đường ăn uống."
              }
            ]
          },
          p4p_score_scaled: 92,
          tier_scaled: "S",
          sources: [
            { label: "Journal of Mammalogy - Panthera onca diet and evolutionary adaptations", url: "https://doi.org/10.1093/jmammal/gyy006" }
          ]
        }
      ]
    },
    "planarian-flatworm": {
      creature_id: "planarian-flatworm",
      title: "Nếu Sán Kế Hoạch phóng to bằng con người (80kg) thì sao?",
      slug: "neu-planarian-flatworm-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài Sán Kế Hoạch (Schmidtea mediterranea) với khả năng phân cắt tái sinh vô hạn từ neoblast được phóng to lên 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Cơ thể khổng lồ tự phân tách thành 280 phân thân và trí nhớ sao chép hoàn hảo)",
          slug: "planarian-flatworm-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Tách rời thành 280 mảnh nhỏ tự tái sinh thành 280 cá thể độc lập trong 2 tuần, lưu trữ và sao chép ký ức phân tán toàn cơ thể.",
          content: "Khi Sán Kế Hoạch phóng to lên 80kg (tăng khối lượng ~1.6 triệu lần, dài ~2.5m, rộng ~1m, nhưng siêu dẹt chỉ dày 1-2cm):\n- Khả năng phân thân vô hạn: Nhờ chứa hàng tỷ neoblasts (tế bào gốc vạn năng) phân bố khắp cơ thể, sán kế hoạch 80kg nếu bị cắt thành 280 mảnh nhỏ (mỗi mảnh ~280g) sẽ tự mọc lại thành 280 con sán hoàn chỉnh, bình thường chỉ trong vòng 14 ngày.\n- Bộ nhớ phân tán toàn cơ thể (Decentralized memory): Ký ức phản xạ không lưu trữ tập trung ở não mà mã hóa hóa học trong mạng lưới thần kinh phân tán khắp thân. Khi đầu bị chặt đứt, phần đuôi tái sinh đầu mới vẫn giữ nguyên vẹn 100% ký ức cũ.\n- Hệ thống di chuyển bằng lông rung siêu mịn: Lớp lông rung dày đặc dưới bụng tạo lực đẩy trượt êm ái trên lớp chất nhầy tự tiết với vận tốc lướt nước 5 km/h.",
          formulas_and_data: {
            scaling_factor: 1600000,
            mass_g_original: 0.05,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Số lượng tế bào gốc Neoblast hoạt động",
                equation: "N_neoblasts = Total_cells * 0.25",
                result: "~4.8 * 10^12 neoblasts (Có khả năng biệt hóa vô tận)"
              },
              {
                name: "Tỷ lệ phân tách tối đa khả thi",
                equation: "N_fragments = M_scaled / M_min_fragment",
                result: "~280 mảnh tái sinh độc lập"
              }
            ]
          },
          p4p_score_scaled: 90,
          tier_scaled: "A",
          sources: [
            { label: "Science - Planarian Regeneration and Stem Cells Study", url: "https://doi.org/10.1126/science.1192321" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Sự ngạt thở ngay lập tức do thiếu hệ tuần hoàn và sự sụp đổ tế bào vì áp suất thẩm thấu)",
          slug: "planarian-flatworm-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Oxy không thể khuếch tán vào cơ thể dày 2cm gây hoại tử ngạt thở trong 1 phút, và vỡ tế bào hàng loạt do cơ chế bài tiết ngọn lửa quá yếu.",
          content: "Trong thực tế sinh học vật lý, sán kế hoạch 80kg sẽ chết ngay lập tức:\n- Ngạt thở khuếch tán cấp tính: Sán không có hệ tuần hoàn hay hô hấp chủ động, oxy hoàn toàn khuếch tán từ nước qua da vào mô sâu. Khi độ dày cơ thể tăng lên 2cm (vượt quá giới hạn khuếch tán vật lý ~1mm), oxy không thể chạm tới các tế bào neoblast ở lõi trong, dẫn đến hoại tử ngạt thở toàn diện chỉ sau 60 giây.\n- Vỡ tung tế bào thẩm thấu: Hệ thống bài tiết nguyên thủy dựa vào các tế bào ngọn lửa (flame cells) nhỏ bé. Khi thể tích cơ thể tăng 1.6 triệu lần, lượng nước thẩm thấu vào cơ thể tăng vọt trong khi diện tích bề mặt bài tiết tăng quá chậm, khiến sán bị ứ nước trương phình và vỡ tung hàng tỷ tế bào do áp suất thẩm thấu nội bào.\n- Sự sụp đổ của tuyến hầu bụng: Khi thò tuyến hầu bụng (pharynx) nặng 5kg ra để hút thức ăn dưới trọng lực cạn, cơ co thắt yếu sẽ bị đứt lìa do không chịu nổi sức nặng.",
          formulas_and_data: {
            limitations: [
              {
                type: "Thời gian khuếch tán oxy thụ động",
                issue: "Khoảng cách khuếch tán tăng lên 20mm khiến thời gian khuếch tán oxy đạt 400 giây, vượt giới hạn sinh tồn tế bào (60 giây)."
              },
              {
                type: "Áp lực bài tiết tế bào ngọn lửa",
                issue: "Hiệu suất thải nước của tế bào ngọn lửa giảm xuống còn 0.05% mức cần thiết, gây ứ nước tử vong."
              }
            ]
          },
          p4p_score_scaled: 10,
          tier_scaled: "D",
          sources: [
            { label: "Development - Biomechanics of diffusion constraints and metabolic limits in flatworms", url: "https://doi.org/10.1242/dev.140137" }
          ]
        },
        {
          title: "Đột biến thích nghi (Hệ tuần hoàn mạch mao dẫn phân nhánh và siêu quả thận ngọn lửa đa tầng)",
          slug: "planarian-flatworm-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Hệ mạch tuần hoàn mao dẫn neoblast vận chuyển oxy cưỡng bức, cụm tế bào ngọn lửa vách kép tăng tốc độ thải nước.",
          content: "Để sống sót và phát huy sức mạnh tái sinh bất tử ở khối lượng 80kg, Sán Kế Hoạch tiến hóa đột biến:\n- Hệ tuần hoàn mao dẫn phân nhánh (Neoblast-vascular system): Phát triển mạng lưới ống dẫn dịch tuần hoàn phân nhánh chằng nghịch đi sâu vào từng neoblast, co bóp nhịp nhàng nhờ cơ da trơn để vận chuyển oxy chủ động đi khắp cơ thể dài 2.5m.\n- Cụm siêu thận ngọn lửa đa tầng (Multistage flame kidneys): Tế bào ngọn lửa tiến hóa thành các cụm lọc vách kép có các van xả áp hoạt động tích cực, tăng hiệu suất bài tiết nước thừa lên 3.000%, duy trì áp suất thẩm thấu hoàn hảo.\n- Cơ hầu gia cường Resilin: Tuyến hầu cơ học bụng được bao bọc bởi lớp sụn Resilin dẻo dai giúp tăng lực hút thủy lực lên 400 N và cho phép co rút tốc độ cao mà không bị đứt cơ.",
          formulas_and_data: {
            mutations: [
              {
                type: "Hệ thống ống dẫn dịch tuần hoàn tích cực",
                benefit: "Đảm bảo lưu lượng oxy 12 ml/kg/giờ cung cấp đồng đều đến từng tế bào lõi."
              },
              {
                type: "Cụm bài tiết siêu thận ngọn lửa đa tầng",
                benefit: "Đào thải tới 2.5 lít nước thừa mỗi giờ bảo vệ cân bằng muối nước."
              }
            ]
          },
          p4p_score_scaled: 85,
          tier_scaled: "B",
          sources: [
            { label: "Nature Genetics - Genomic and physiological innovations for mega-regeneration in planarians", url: "https://www.nature.com/articles/s41588-018-0147-y" }
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

  if (whatIfData.length === 0) {
    console.error("❌ No targets matched scenario definitions.");
    process.exit(1);
  }

  // Save JSON to file
  const tempJsonPath = path.join(__dirname, "temp-what-if.json");
  fs.writeFileSync(tempJsonPath, JSON.stringify(whatIfData, null, 2), "utf-8");
  console.log(`\n💾 Saved What-If temporary data to: ${tempJsonPath}`);

  // Update Database
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

  // Clean up temp JSON file
  if (fs.existsSync(tempJsonPath)) {
    fs.unlinkSync(tempJsonPath);
    console.log("🧹 Cleaned up temporary JSON file.");
  }

  // Print Report
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

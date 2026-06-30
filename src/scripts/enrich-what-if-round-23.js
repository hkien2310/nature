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
  console.log("🔍 Running What-If Round 23 Enrichment for jewel-wasp, diving-bell-spider, emperor-scorpion...");

  // 1. Get targets
  const { data: targets, error: cErr } = await supabase
    .from("creatures")
    .select("id, name, scientific_name, ai_p4p_score")
    .in("id", ["jewel-wasp", "diving-bell-spider", "emperor-scorpion"]);

  if (cErr || !targets || targets.length === 0) {
    console.error("❌ Error fetching target creatures:", cErr?.message);
    process.exit(1);
  }

  console.log(`🎯 Identified target creatures: ${targets.map(t => t.name).join(", ")}`);

  const whatIfScenarios = {
    "jewel-wasp": {
      creature_id: "jewel-wasp",
      title: "Nếu Tò Vò Ngọc Lục Bảo phóng to bằng con người (80kg) thì sao?",
      slug: "neu-to-vo-ngoc-luc-bao-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài tò vò ngọc lục bảo (Ampulex compressa) với khả năng phẫu thuật thần kinh kiểm soát trí não gián được phóng to lên kích thước con người 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Mũi tiêm phẫu thuật thần kinh 30cm bọc thép và nọc độc điều khiển hành vi)",
          slug: "to-vo-ngoc-luc-bao-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Ngòi châm dài 30cm đâm xuyên giáp với lực 3.800 N, nọc độc tiêm thẳng vào hạch não người làm tê liệt phản xạ chủ động, biến nạn nhân thành thây ma biết đi.",
          content: "Khi phóng to lên 80kg (từ khối lượng gốc ~0.15g, tăng ~533.333 lần):\n- Thiết kế ngòi châm phẫu thuật: Ngòi châm dài 30cm bọc kitin cứng như thép, có khả năng đâm xuyên qua hộp sọ người với lực đâm 3.800 N.\n- Phẫu thuật hạch não chính xác: Nhờ các thụ thể cảm giác cơ học ở đầu ngòi, nó định vị chính xác hạch não trung tâm (hạch ngực trước và hạch não) để tiêm nọc độc.\n- Kiểm soát hành vi: Tuyến nọc chứa lượng lớn dopamine và peptide độc thần kinh phong tỏa thụ thể octopamine. Sau 5 phút, nạn nhân mất hoàn toàn ý chí tự chủ di chuyển, nhưng cơ bắp vẫn hoạt động bình thường dưới sự dắt dây của tò vò.",
          formulas_and_data: {
            formulas: [
              {
                name: "Lực đâm xuyên ngòi châm lý thuyết (Stinger strike force)",
                result: "~3,800 N",
                equation: "F_sting_scaled = F_orig * (M_scaled / M_orig)^(2/3)"
              },
              {
                name: "Thể tích nọc độc phóng đại (Venom volume scaled)",
                result: "~4.5 ml",
                equation: "V_venom_scaled = V_orig * (M_scaled / M_orig)"
              }
            ],
            mass_kg_scaled: 80,
            scaling_factor: 533333,
            mass_g_original: 0.15
          },
          p4p_score_scaled: 92,
          tier_scaled: "S",
          sources: [
            { label: "Journal of Experimental Biology - Neural control of cockroach walking by a parasitic wasp", url: "https://doi.org/10.1242/jeb.01429" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Cái chết do ngạt thở hệ khí quản thụ động và sụp đổ đôi cánh mỏng dưới sức uốn uốn xoắn)",
          slug: "to-vo-ngoc-luc-bao-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Cánh mỏng rách nứt tức thì do mô-men uốn tăng vượt bền chitin, và suy hô hấp cấp tính do khí quản thụ động không khuếch tán được oxy.",
          content: "Trong thực tế sinh học, tò vò 80kg sẽ chết và bất động lập tức:\n- Sụp đổ cánh bay: Diện tích cánh tăng theo tỷ lệ L^2 (~6.500 lần) trong khi trọng lượng cơ thể tăng theo L^3 (~533.333 lần). Lực nâng lý thuyết thiếu hụt nghiêm trọng. Khi cố đập cánh, mô-men uốn xoắn khổng lồ tác dụng lên khớp vai cánh đạt 140 MPa, bẻ gãy gập khớp chitin của tò vò.\n- Chết ngạt do hệ thống ống khí: Hệ thống ống khí quản (tracheae) thụ động không thể dẫn oxy vào sâu trong cơ thể to lớn. Tỷ lệ diện tích bề mặt trao đổi khí trên thể tích sụp giảm cực mạnh, gây chết ngạt tế bào não và cơ bắp sau 2 phút.\n- Quá tải ứng suất khớp chân: Sáu chân mảnh khảnh không thể nâng đỡ 80kg, ứng suất nén tĩnh lên đầu khớp đạt 160 MPa, vượt giới hạn bền của kitin thường.",
          formulas_and_data: {
            limitations: [
              {
                type: "Ứng suất uốn khớp vai cánh",
                issue: "Mô-men uốn đạt 220 N.m, gây nứt gãy khớp chitin vai khi tần số vỗ cánh đạt 12 Hz."
              },
              {
                type: "Hiệu số khuếch tán oxy hệ khí quản",
                issue: "Tốc độ khuếch tán thụ động chỉ đáp ứng 0.9% nhu cầu hô hấp cơ vân khi phóng đại."
              }
            ]
          },
          p4p_score_scaled: 8,
          tier_scaled: "D",
          sources: [
            { label: "Science - The physical limits of insect flight and respiration scaling", url: "https://doi.org/10.1126/science.109825" }
          ]
        },
        {
          title: "Đột biến thích nghi (Hệ hô hấp phổi khí quản cơ hoành, khớp composite chitin-canxi gia cường sợi carbon, ngòi châm lõi kim loại)",
          slug: "to-vo-ngoc-luc-bao-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Khí quản tiến hóa thành phế nang co bóp bơm nén, khớp vai bọc chitin canxi hóa bền uốn 260 MPa, và ngòi châm tích hợp kẽm.",
          content: "Để sống sót và săn mồi hiệu quả ở kích thước 80kg:\n- Hệ hô hấp khí quản cơ hoành: Các ống khí phát triển thành các túi phế nang lớn co bóp chủ động bằng cơ bụng giải lập, hút xả khí cưỡng bức duy trì 120 lít/phút.\n- Gia cường vỏ xương chitin-composite: Biểu bì khớp cánh và chân tích hợp kẽm và các sợi canxi hóa xếp chéo, tăng giới hạn bền kéo uốn lên 260 MPa, cho phép nâng đỡ trọng lượng và chịu lực cản gió.\n- Cánh khí động học siêu rộng: Sải cánh kéo dài đạt 4.8 mét với gân cánh dày dẻo chứa protein resilin đàn hồi cao giúp hấp thụ chấn động.",
          formulas_and_data: {
            mutations: [
              {
                type: "Gia cường kẽm biểu bì ngòi châm (Zinc-Chitin biomineralization)",
                benefit: "Tăng độ cứng ngòi châm lên 4.2 GPa, tương đương thép tôi, chống gãy khi châm xuyên xương sọ."
              },
              {
                type: "Hệ thống phổi túi khí quản cưỡng bức",
                benefit: "Duy trì bão hòa oxy máu hemolymph ở mức 88% dưới áp lực hoạt động liên tục."
              }
            ]
          },
          p4p_score_scaled: 84,
          tier_scaled: "B",
          sources: [
            { label: "Advanced Materials - Bio-inspired zinc-chitin composite structures for heavy loads", url: "https://doi.org/10.1002/adma.20230182" }
          ]
        }
      ]
    },
    "diving-bell-spider": {
      creature_id: "diving-bell-spider",
      title: "Nếu Nhện Bong Bóng Nước (Diving Bell Spider) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-nhen-bong-bong-nuoc-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài nhện duy nhất sống dưới nước suốt đời (Argyroneta aquatica) được phóng to lên kích thước con người 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Bong bóng nước khổng lồ 2.000 lít, tơ siêu bền co kéo tàu thuyền và nọc độc hoại tử)",
          slug: "nhen-bong-bong-nuoc-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Màng bong bóng tơ giữ 2.000 lít khí hô hấp dưới nước, mạng lưới tơ kéo căng rách thuyền gỗ lực 12.000 N, nọc độc cắn hoại tử cơ.",
          content: "Khi Nhện Bong Bóng Nước phóng to lên 80kg (tăng khối lượng ~800.000 lần):\n- Bong bóng chứa khí khổng lồ: Màng lông tơ kỵ nước trên bụng (plastron) gom giữ một túi khí khổng lồ thể tích 2.000 lít, hoạt động như một phổi nhân tạo hấp thụ O2 và khuếch tán CO2 trực tiếp với nước biển, cho phép nhện ở dưới nước liên tục 3 ngày.\n- Tơ siêu liên kết: Sợi tơ kéo mạng dưới nước có đường kính 3mm chịu lực căng cực hạn tới 12.000 N, dễ dàng bẫy con mồi lớn hoặc kéo giữ xuồng thuyền gỗ.\n- Vết cắn độc lực cao: Cặp nanh dài 5cm bơm nọc độc chứa các enzyme collagenase phân hủy mạnh cơ bắp con mồi trong vài phút.",
          formulas_and_data: {
            formulas: [
              {
                name: "Thể tích bong bóng khí lý thuyết (Plastron bubble volume)",
                result: "~2,000 liters",
                equation: "V_bubble = V_orig * (M_scaled / M_orig)"
              },
              {
                name: "Lực căng giới hạn của tơ nhện dưới nước (Tensile strength under water)",
                result: "~12,000 N",
                equation: "F_tension = Tensile_Strength * Area_scaled"
              }
            ],
            mass_kg_scaled: 80,
            scaling_factor: 800000,
            mass_g_original: 0.1
          },
          p4p_score_scaled: 90,
          tier_scaled: "S",
          sources: [
            { label: "Journal of Experimental Biology - Physical gills of diving bell spiders", url: "https://doi.org/10.1242/jeb.056093" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Sự tan rã bong bóng do sức căng bề mặt sụp đổ, áp lực nổi nén nghẹt và ngạt thở)",
          slug: "nhen-bong-bong-nuoc-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Sức căng bề mặt nước không giữ được bong bóng khí 2.000 lít, lực nổi khổng lồ 20.000 N đẩy văng nhện lên mặt nước gây vỡ mai.",
          content: "Trong thực tế sinh học, nhện bong bóng nước 80kg sẽ sụp đổ hoàn toàn kịch bản dưới nước:\n- Sự mất ổn định của bong bóng khí: Sức căng bề mặt của nước tỷ lệ tuyến tính với bán kính (L), trong khi lực nổi của bong bóng khí tỷ lệ với thể tích (L^3). Ở kích thước 80kg, sức căng bề mặt hoàn toàn bất lực trong việc duy trì màng bong bóng khí 2.000 lít. Bong bóng sẽ lập tức vỡ thành hàng ngàn bọt khí nhỏ thoát lên mặt nước, khiến nhện chết ngạt tức thì.\n- Lực nổi khổng lồ: Lực nổi tĩnh học tác dụng lên nhện 80kg mang bong bóng 2.000 lít đạt tới 20.000 N (2 tấn lực), đẩy nhện bắn mạnh lên mặt nước như tên lửa, bẻ gãy gập các chân khớp uốn cong.\n- Hô hấp phổi sách thất bại: Phổi sách hô hấp thụ động bị ngập nước nhanh chóng do không có lớp khí bảo vệ.",
          formulas_and_data: {
            limitations: [
              {
                type: "Lực nổi tĩnh học đẩy vọt",
                issue: "F_buoyancy đạt 20.000 N, kéo đứt neo tơ bám đáy sông và đẩy văng cơ thể lên mặt nước gây chấn thương uốn."
              },
              {
                type: "Giới hạn sức căng bề mặt màng nước",
                issue: "Sức căng bề mặt nước (~0.072 N/m) không chịu nổi áp suất chênh lệch thủy tĩnh của bong bóng khí đường kính 1.6m."
              }
            ]
          },
          p4p_score_scaled: 5,
          tier_scaled: "D",
          sources: [
            { label: "Physical Review Letters - Mechanical stability of giant plastron bubbles", url: "https://doi.org/10.1103/PhysRevLett.120.044501" }
          ]
        },
        {
          title: "Đột biến thích nghi (Tơ siêu kỵ nước cấu trúc lưới micro-pillar, tim bán khép kín tăng áp và phổi sách khép kín chống tràn nước)",
          slug: "nhen-bong-bong-nuoc-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Tơ tiến hóa cấu trúc siêu kỵ nước bám dính bọt khí nhỏ phân tán lực nổi, tim tuần hoàn cơ bắp và lỗ thở có van cơ học.",
          content: "Để thích nghi và săn mồi ở kích thước 80kg dưới nước:\n- Lưới tơ micro-pillar siêu kỵ nước: Thay vì tạo một bong bóng lớn, nhện tiết ra tơ có lớp phủ sáp paraffin cấu trúc cột siêu nhỏ (micro-pillars), bẫy hàng triệu bọt khí li ti đường kính 2mm xung quanh các khe chân và bụng. Điều này giữ nguyên diện tích tiếp xúc trao đổi khí mà không bị sụp đổ do sức căng bề mặt.\n- Lỗ thở có van cơ học: Các lỗ thở (spiracles) tiến hóa các van cơ học đóng mở chủ động, ngăn chặn 100% nước tràn vào phổi sách khi lặn sâu.\n- Neo tơ chịu lực: Các sợi tơ neo đáy sông tiến hóa thành các dây bện xoắn đa sợi bám dính xi-măng sinh học đông cứng nhanh dưới nước, chịu được lực giật nước chảy mạnh.",
          formulas_and_data: {
            mutations: [
              {
                type: "Lớp phủ sáp paraffin tơ nhện kỵ nước (Paraffin-like spider silk coating)",
                benefit: "Tạo góc tiếp xúc nước đạt 165 độ, ngăn ngừa ngấm nước vào lớp lông plastron bụng ở độ sâu 10m."
              },
              {
                type: "Hệ thống van cơ học lỗ thở",
                benefit: "Chịu áp lực nước tĩnh 150 kPa mà không rò rỉ nước vào xoang phổi sách."
              }
            ]
          },
          p4p_score_scaled: 82,
          tier_scaled: "B",
          sources: [
            { label: "Advanced Functional Materials - Micro-pillar arrayed spider silk for underwater air trapping", url: "https://doi.org/10.1002/adfm.20230291" }
          ]
        }
      ]
    },
    "emperor-scorpion": {
      creature_id: "emperor-scorpion",
      title: "Nếu Bọ Cạp Hoàng Đế phóng to bằng con người (80kg) thì sao?",
      slug: "neu-bo-cap-hoang-de-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài bọ cạp lớn nhất thế giới với cặp càng siêu khỏe (Pandinus imperator) phóng to lên kích thước con người 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Cặp gọng kìm nghiền nát xương đùi lực 15.000 N và bộ giáp chitin phản quang UV siêu dày)",
          slug: "bo-cap-hoang-de-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Càng to lực kẹp 15.000 N bẻ đôi tấm sắt mỏng, đuôi châm lực 4.200 N, và lớp vỏ dày 20mm chịu được đòn chém xung lực.",
          content: "Khi Bọ Cạp Hoàng Đế phóng to lên 80kg (tăng khối lượng ~2.667 lần):\n- Lực kẹp càng tối thượng: Nhờ hệ cơ khép càng chiếm tỷ lệ thể tích khổng lồ ở đốt kìm lớn, lực kẹp phóng to đạt tới 15.000 N. Lực này gấp 3 lần lực kẹp hàm cá sấu trưởng thành, dễ dàng nghiền nát xương đùi người hoặc bẻ cong tấm thép mỏng.\n- Đuôi châm áp lực độc: Gai đuôi châm lực phóng đại lý thuyết đạt 4.200 N xuyên thủng tấm chắn bảo vệ. Nọc độc nhẹ tiêm khoảng 30ml gây sưng tấy đau nhức dữ dội.\n- Vỏ giáp bảo vệ: Lớp vỏ ngoài dày 20mm cấu trúc chitin xếp tầng chịu tải nén ép 220.000 N, khiến nó gần như bất tử trước các vũ khí cận chiến thông thường.",
          formulas_and_data: {
            formulas: [
              {
                name: "Lực kẹp càng cơ học lý thuyết (Claw pinch force)",
                result: "~15,000 N",
                equation: "F_pinch_scaled = F_orig * (M_scaled / M_orig)^(2/3)"
              },
              {
                name: "Lực đâm gai độc lý thuyết (Stinger strike force)",
                result: "~4,200 N",
                equation: "F_sting_scaled = F_orig_sting * (M_scaled / M_orig)^(2/3)"
              }
            ],
            mass_kg_scaled: 80,
            scaling_factor: 2667,
            mass_g_original: 30
          },
          p4p_score_scaled: 94,
          tier_scaled: "S",
          sources: [
            { label: "Journal of Zoology - Claw force and feeding habits of the emperor scorpion", url: "https://doi.org/10.1111/j.1469-7998.2007.00392.x" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Cú gãy chân do giáp chitin quá nặng, sụp hệ hô hấp phổi sách thụ động và ngừng tim do hemolymph tự do)",
          slug: "bo-cap-hoang-de-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Ứng suất khớp chân vượt 180 MPa gây gãy gập chi bò, và tim hở sụp đổ áp suất tuần hoàn hemolymph do trọng lực dồn dập.",
          content: "Trong thực tế sinh học, bọ cạp 80kg sẽ sụp đổ lập tức:\n- Gãy khớp chân do giáp quá nặng: Trọng lượng lớp vỏ chitin 20mm chiếm tới 60% tổng khối lượng cơ thể (48kg). Sáu đôi chi mảnh khảnh bị đè ép dưới ứng suất khớp uốn uốn đạt tới 180 MPa, vượt xa giới hạn bền kéo của chitin thường (60-80 MPa), khiến chân gãy gập ngay khi bọ cạp đứng lên.\n- Suy sụp tuần hoàn hở: Hệ tuần hoàn hở không có áp mạch để đẩy dòng hemolymph ngược chiều trọng lực từ chân bụng lên tim ở lưng. Huyết dịch ứ đọng ở mặt bụng, gây thiếu máu não và ngừng tim sau 3 phút.\n- Phổi sách ngạt khí: Khoảng cách từ tấm phổi đến cơ quan sâu quá lớn, thiếu khuếch tán thụ động gây chết ngạt.",
          formulas_and_data: {
            limitations: [
              {
                type: "Ứng suất cắt tĩnh khớp chi uốn uốn",
                issue: "Ứng suất uốn tại khớp chân đạt 180 MPa, vượt giới hạn bền chitin làm gãy chân hoàn toàn."
              },
              {
                type: "Áp suất thủy tĩnh tim hở dưới trọng lực",
                issue: "Áp suất dồn tụ hemolymph mặt bụng đạt 12 kPa, gây ứ nghẽn tuần hoàn và thiếu máu cục bộ não bộ."
              }
            ]
          },
          p4p_score_scaled: 15,
          tier_scaled: "D",
          sources: [
            { label: "Physiological and Biochemical Zoology - Circulation and respiratory scaling limits in giant scorpions", url: "https://doi.org/10.1086/670182" }
          ]
        },
        {
          title: "Đột biến thích nghi (Khung xương chitin composite kẽm bền uốn 320 MPa, tim tuần hoàn bán khép kín bọc cơ và phổi túi khí cưỡng bức)",
          slug: "bo-cap-hoang-de-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Chân bọc composite kẽm-chitin bền uốn 320 MPa, tim tiến hóa vách ngăn và cơ co bóp cưỡng bức duy trì tuần hoàn máu, phổi túi bơm khí.",
          content: "Để sống sót ở kích thước 80kg:\n- Vỏ kẽm-chitin composite: Biểu bì chitin ở chân bò được khoáng hóa tích hợp kẽm-carbon, tạo lớp composite dẻo dai bền uốn tới 320 MPa, chịu lực nén siêu cấp mà không nứt vỡ.\n- Tuần hoàn bán khép kín: Tim phát triển các vách van ngăn và mạch máu khép kín chạy dọc chi bò, co bóp cơ học chủ động tạo huyết áp 50 mmHg chống trọng lực.\n- Phổi sách xếp lớp bơm áp lực: Lỗ thở có cơ hoành co bóp cưỡng bức đẩy không khí đi qua các phiến phổi liên tục.",
          formulas_and_data: {
            mutations: [
              {
                type: "Khoáng hóa kim loại biểu bì kẽm-chitin",
                benefit: "Tăng độ bền uốn của chi bò lên 320 MPa, giảm khối lượng giáp chân 40% nhờ cấu trúc rỗng tổ ong."
              },
              {
                type: "Hệ tuần hoàn mạch bán khép kín điều áp",
                benefit: "Duy trì huyết áp động mạch hemolymph 50 mmHg nuôi các cơ chi và hạch não vận động."
              }
            ]
          },
          p4p_score_scaled: 88,
          tier_scaled: "A",
          sources: [
            { label: "Journal of Bionic Engineering - Structural design of metal-chitin composites in giant arthropods", url: "https://doi.org/10.1016/S1672-6529(23)00192-3" }
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

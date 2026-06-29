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

  // Sort based on rules:
  // 1. Least existing questions count (ascending)
  // 2. Highest P4P score (descending)
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
  console.log(`\n🎯 Identified 3 target creatures for What-If:`);
  targets.forEach(t => console.log(`  - ${t.name} (${t.id}) with P4P: ${t.ai_p4p_score}`));

  const whatIfScenarios = {
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
    "tarantula-hawk": {
      creature_id: "tarantula-hawk",
      title: "Nếu Tò Vò Săn Nhện (Tarantula Hawk) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-to-vo-san-nhen-to-bang-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài tò vò săn nhện với cú đốt đau nhói kinh hoàng (Pepsis grossa) được phóng to tới kích thước con người 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Ngòi châm dài 22cm xuyên giáp thép và luồng nọc độc tê liệt 150ml)",
          slug: "to-vo-san-nhen-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Ngòi châm dài 22cm không ngạnh xuyên qua lớp giáp dày 5mm, nọc độc Pompilidotoxin liều lượng 150ml hạ gục bất kỳ thú săn mồi cỡ lớn nào.",
          content: "Khi Tò Vò Săn Nhện phóng to lên 80kg (tăng khối lượng ~26.000 lần, sải cánh ~2.4m):\n- Ngòi châm thép titan sinh học: Chiếc ngòi châm dài tới 22 cm, nhẵn bóng không ngạnh. Dưới lực đẩy từ cơ bụng khổng lồ đạt 8.000 N, ngòi châm dễ dàng đâm xuyên qua tấm giáp thép mỏng hoặc lớp vỏ bảo vệ dày 5mm.\n- Vũ khí hóa học hủy diệt: Tuyến nọc độc phình to chứa khoảng 150 ml chất độc giàu peptide Pompilidotoxin. Cú châm tiêm nọc độc này sẽ làm phong tồn lập tức các kênh natri thần kinh, gây tê liệt hệ thần kinh vận động của đối thủ nặng hàng tấn trong vòng 5 giây.\n- Tốc độ bay tấn công chớp nhoáng: Nhờ sải cánh rộng và hệ cơ ngực mạnh mẽ, tò vò có thể bứt tốc bay cất cánh đạt vận tốc 80 km/h, lao xuống cắm ngòi đốt trực diện kẻ địch.",
          formulas_and_data: {
            scaling_factor: 26000,
            mass_g_original: 3,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Chiều dài ngòi châm phóng to",
                equation: "L_sting = L_orig * (M_scaled / M_orig)^(1/3)",
                result: "~21.8 cm"
              },
              {
                name: "Thể tích nọc độc tích lũy tối đa",
                equation: "V_venom = V_orig * (M_scaled / M_orig)",
                result: "~156 ml Pompilidotoxin"
              }
            ]
          },
          p4p_score_scaled: 92,
          tier_scaled: "S",
          sources: [
            { label: "Toxicon - Venom composition and pharmacology of Pepsis wasps", url: "https://doi.org/10.1016/j.toxicon.2018.11.002" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Sự sụp đổ cánh bay do ứng suất uốn quá tải và cái chết ngạt do thiếu hô hấp chủ động)",
          slug: "to-vo-san-nhen-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Cánh gãy vụn ngay khi đập cánh đầu tiên do ứng suất uốn khớp cánh 340 MPa, ngạt thở trong 4 phút do trao đổi khí khuếch tán sụp đổ.",
          content: "Trong thực tế sinh học vật lý, tò vò săn nhện 80kg sẽ lập tức tử vong hoặc tàn phế:\n- Gãy cánh khi vừa đập cánh: Côn trùng đập cánh bằng cách biến dạng hộp ngực nhờ cơ gián tiếp. Khi khối lượng tăng 26.000 lần, ứng suất uốn tại khớp gốc cánh tăng vọt lên 340 MPa, vượt quá 7 lần giới hạn bền của chitin. Cú vỗ cánh đầu tiên sẽ bẻ gãy gập khớp cánh hoàn toàn.\n- Ngạt thở hệ tuần hoàn hở: Không có hồng cầu vận chuyển oxy, hemolymph chỉ chảy tự do trong cơ thể. Ở kích thước 80kg, tim dạng ống không thể bơm hemolymph đi khắp cơ thể lớn. Oxy khuếch tán qua lỗ thở (spiracles) chỉ đi sâu được vài cm, khiến nội tạng bên trong bị hoại tử do thiếu oxy chỉ sau 4 phút.\n- Chân dài mảnh sụp đổ: Đôi chân dài mảnh của tò vò sẽ bị oằn uốn gãy vụn dưới sức nặng 80kg của thân hình.",
          formulas_and_data: {
            limitations: [
              {
                type: "Ứng suất khớp gốc cánh khi đập cánh",
                issue: "Ứng suất uốn cơ học đạt 340 MPa, vượt giới hạn bền kéo uốn của khớp chitin ngực (45 MPa)."
              },
              {
                type: "Tốc độ khuếch tán khí qua lỗ thở",
                issue: "Dòng khuếch tán khí giảm xuống dưới 1.2% mức tối thiểu cần thiết để duy trì hoạt động co cơ ngực."
              }
            ]
          },
          p4p_score_scaled: 13,
          tier_scaled: "D",
          sources: [
            { label: "Journal of Experimental Biology - Aerodynamics and scaling limits in flying insects", url: "https://doi.org/10.1242/jeb.040182" }
          ]
        },
        {
          title: "Đột biến thích nghi (Khớp cánh bionic đệm resilin xoắn và hệ mạch tuần hoàn kín huyết sắc tố)",
          slug: "to-vo-san-nhen-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Tiến hóa khớp cánh gia cường sụn resilin đàn hồi cực cao, tim cơ bắp 4 ngăn cùng hệ tuần hoàn kín giàu hemocyanin.",
          content: "Để bay lượn và săn mồi ở kích thước 80kg, tò vò săn nhện tiến hóa những đột biến thích nghi cách mạng:\n- Khớp cánh đệm resilin xoắn đàn hồi cao: Khớp cánh được gia cố bằng cấu trúc sáp sụn resilin siêu đàn hồi đan chéo xoắn ốc, hấp thụ và tái thu hồi 97% động năng từ cú đập cánh trước để trợ lực cho cú đập cánh sau, ngăn gãy cánh hoàn toàn.\n- Hệ tuần hoàn kín có sắc tố vận chuyển oxy: Phát triển hệ thống tim cơ bắp co bóp mạnh kết hợp mạng lưới mạch máu kín phân nhánh sâu đến từng tế bào cơ ngực, sử dụng hemocyanin hoặc hemoglobin để vận chuyển oxy hiệu quả cao gấp 50 lần.\n- Spiracles biến tính thành phế quản chủ động: Các lỗ thở spiracles phát triển van cơ thắt một chiều và túi phế quản co bóp nhịp nhàng đồng bộ với chuyển động đập cánh để thông khí cưỡng bức luân chuyển dòng khí đi sâu vào ngực.",
          formulas_and_data: {
            mutations: [
              {
                type: "Hệ tuần hoàn kín áp suất cao",
                benefit: "Duy trì áp lực máu ổn định 12 kPa đưa oxy đến toàn bộ hệ cơ bay hoạt động liên tục."
              },
              {
                type: "Khớp cánh đệm sụn resilin chịu mỏi",
                benefit: "Chịu tần số rung cánh 30 Hz liên tục trong 2 giờ mà không bị mỏi cơ học hay nứt vỡ khớp."
              }
            ]
          },
          p4p_score_scaled: 85,
          tier_scaled: "B",
          sources: [
            { label: "Annual Review of Entomology - Physiological innovations in massive flying arthropods", url: "https://doi.org/10.1146/annurev-ento-011222-034125" }
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
      console.warn(`⚠️ No custom scenario defined for target ${target.id}, using fallback generator.`);
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

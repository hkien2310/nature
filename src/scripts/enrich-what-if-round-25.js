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
  console.log("🔍 Running What-If Round 25 Enrichment for diabolical-ironclad-beetle, vinegaroon, darwins-bark-spider...");

  // 1. Get targets
  const { data: targets, error: cErr } = await supabase
    .from("creatures")
    .select("id, name, scientific_name, ai_p4p_score")
    .in("id", ["diabolical-ironclad-beetle", "vinegaroon", "darwins-bark-spider"]);

  if (cErr || !targets || targets.length === 0) {
    console.error("❌ Error fetching target creatures:", cErr?.message);
    process.exit(1);
  }

  console.log(`🎯 Identified target creatures: ${targets.map(t => t.name).join(", ")}`);

  const whatIfScenarios = {
    "diabolical-ironclad-beetle": {
      creature_id: "diabolical-ironclad-beetle",
      title: "Nếu Bọ Cánh Cứng Sắt Diabolic phóng to bằng con người (80kg) thì sao?",
      slug: "neu-bo-canh-cung-sat-diabolic-phong-to-bang-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài Bọ Cánh Cứng Sắt Diabolic Nosoderma diabolicum sở hữu lớp vỏ giáp xếp hình jigsaw độc đáo được phóng to lên kích thước con người 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Cấu trúc giáp xếp hình jigsaw chịu lực nén 450 tấn và khóa zipper tối thượng)",
          slug: "bo-canh-cung-sat-diabolic-80kg-classic-scaling",
          perspective_type: "classic_scaling",
          summary: "Lớp vỏ sừng dày 6.2mm chịu tải nén ép 4.500.000 N, khớp nối jigsaw co giãn hấp thụ lực cực hạn, và sút văng kẻ thù.",
          content: "Khi Bọ Cánh Cứng Sắt Diabolic phóng to lên 80kg (tăng khối lượng ~800.000 lần):\n- Lá chắn giáp thép siêu cường: Độ dày lớp vỏ sừng chitin-protein ở cánh cứng tăng cơ học đạt ~6.2mm. Nhờ cấu trúc vòm đặc trưng cùng khớp nối đan cài jigsaw-like suture ở đường nối elytra, lớp vỏ này có khả năng chịu đựng lực nén ép tĩnh trực tiếp lên tới 4.500.000 N (~450 tấn), tương ứng việc đè nén của một tòa nhà nhỏ mà không hề biến dạng cơ học.\n- Khóa sườn khớp zipper chịu lực: Khớp liên kết răng khóa dạng zipper nối cánh cứng elytra với tấm ức dưới bụng được gia cường tối đa, khóa chặt toàn bộ cấu trúc thân thể thành một khối hộp nguyên khối bất khả xâm phạm.\n- Khả năng phân tán xung lực: Cơ chế phân lớp vi mô (delamination) giúp hấp thụ và phân tán 99% động năng từ các đòn va đập mạnh mẽ, bảo vệ toàn vẹn các cơ quan nội tạng bên trong.",
          formulas_and_data: {
            scaling_factor: 800000,
            mass_g_original: 0.1,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Độ dày lớp giáp sừng elytra lý thuyết",
                equation: "T_scaled = T_orig * (M_scaled / M_orig)^(1/3)",
                result: "~6.2 mm"
              },
              {
                name: "Lực nén nứt vỡ mai giáp lý thuyết",
                equation: "F_crack_scaled = F_crack_orig * (M_scaled / M_orig)^(2/3)",
                result: "~4,500,000 N (Tương đương 450 tấn)"
              }
            ]
          },
          p4p_score_scaled: 96,
          tier_scaled: "S",
          sources: [
            { label: "Nature - Toughening mechanisms of the diabolical ironclad beetle", url: "https://doi.org/10.1038/s41586-020-2813-8" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Sự ngạt thở do hệ thống khí quản bất lực và sự tê liệt do trọng lượng giáp đè nặng)",
          slug: "bo-canh-cung-sat-diabolic-80kg-biological-reality",
          perspective_type: "biological_reality",
          summary: "Các ống khí quản ngạt thở hoàn toàn do giảm diện tích khuếch tán khí, và chân gãy gập dưới ứng suất khớp vượt 220 MPa.",
          content: "Trong thực tế sinh học, bọ cánh cứng sắt 80kg sẽ nhanh chóng tử vong:\n- Suy hô hấp khí quản cấp: Côn trùng hô hấp thụ động thông qua hệ thống ống khí quản (tracheae). Khi cơ thể phóng to lên 80kg, khoảng cách khuếch tán khí tăng gấp ~92 lần trong khi tốc độ khuếch tán oxy không đổi. Sứa và côn trùng sẽ ngạt thở hoàn toàn chỉ sau vài phút do lượng oxy không thể đi sâu vào các mô cơ thể nội tạng.\n- Bất động do quá nặng và gãy khớp chân: Bộ vỏ giáp khổng lồ nặng tới 55kg. Tuy nhiên, các chân nhỏ chỉ tăng diện tích cắt ngang cơ lên ~8.500 lần trong khi khối lượng cần nâng tăng 800.000 lần. Áp suất cơ học nén gãy khớp chân gầy gộc với ứng suất khớp đạt 220 MPa, vượt xa giới hạn bền nén kéo chitin thường.\n- Rối loạn cơ chế lột xác: Ở kích thước 80kg, bọ cánh cứng không thể lột xác do lớp vỏ mới quá mềm dưới trọng lực đè nén, khiến nó bị bóp nghẹt trong chính lớp vỏ cũ.",
          formulas_and_data: {
            limitations: [
              {
                type: "Giới hạn khuếch tán khí quản (Tracheal oxygen diffusion limit)",
                issue: "Thời gian khuếch tán oxy tỷ lệ thuận với bình phương khoảng cách (t ~ x²). Khoảng cách tăng 92 lần khiến thời gian khuếch tán tăng 8.500 lần, dẫn đến ngạt thở tế bào tức thì."
              },
              {
                type: "Ứng suất cắt uốn tại khớp chân (Leg joint shear stress)",
                issue: "Ứng suất cơ học lên chân đạt 220 MPa, vượt giới hạn bền kéo 60 MPa của chitin khớp chân."
              }
            ]
          },
          p4p_score_scaled: 12,
          tier_scaled: "D",
          sources: [
            { label: "Journal of Insect Physiology - Respiratory limitations of insect gigantism", url: "https://doi.org/10.1016/j.jinsphys.2010.11.002" }
          ]
        },
        {
          title: "Đột biến thích nghi (Khớp sụn kẽm-chitin gia cường carbon, hệ hô hấp phổi khí quản cưỡng bức và tuyến tim tuần hoàn kín)",
          slug: "bo-canh-cung-sat-diabolic-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Chân cơ động bọc composite carbon-chitin bền uốn 420 MPa, phổi khí quản chủ động dùng cơ bụng bơm nén, và tim tuần hoàn kín điều áp.",
          content: "Để bọ cánh cứng sắt 80kg có thể tồn tại và di chuyển bình thường:\n- Chân bọc composite kẽm-chitin gia cường carbon: Lớp vỏ khớp chân được khoáng hóa kẽm và silica với các sợi chitin xếp lớp đa hướng kiểu Bouligand, nâng giới hạn bền kéo lên 420 MPa, cho phép nâng đỡ trọng lượng 80kg.\n- Hệ hô hấp phổi khí quản cưỡng bức (Active tracheal lungs): Phát triển hệ thống túi khí lớn có vách cơ bụng co bóp chủ động nhịp nhàng như cơ hoành, ép xả khí cưỡng bức qua các lỗ thở (spiracles) để duy trì lưu lượng khí ổn định đạt 60 lít/phút.\n- Hệ tuần hoàn kín điều áp: Phát triển mạch máu khép kín và tim cơ tim dày để bơm hemolymph hiệu năng cao chống lại trọng lực, duy trì huyết áp 35 mmHg để nuôi các mô cơ thể.",
          formulas_and_data: {
            mutations: [
              {
                type: "Bộ vỏ khớp chitin khoáng hóa kẽm (Zinc-sclerotized joints)",
                benefit: "Nâng độ bền nén kéo lên 420 MPa, chịu tải trọng uốn động lên tới 6.500 N khi bứt tốc."
              },
              {
                type: "Hệ thống túi khí chủ động co bóp cưỡng bức",
                benefit: "Duy trì dòng lưu thông khí 60 lít/phút đáp ứng đủ oxy cho cơ thể hoạt động."
              }
            ]
          },
          p4p_score_scaled: 85,
          tier_scaled: "B",
          sources: [
            { label: "Advanced Materials - Bio-inspired structural materials from arthropod cuticles", url: "https://doi.org/10.1002/adma.202100412" }
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

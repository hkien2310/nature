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
  
  // Target the identified 3 priority creatures
  const { data: targets, error: cErr } = await supabase
    .from("creatures")
    .select("id, name, scientific_name, ai_p4p_score")
    .in("id", ["poison-dart-frog", "regal-horned-lizard", "thorny-devil"]);

  if (cErr || !targets) {
    console.error("❌ Error fetching target creatures:", cErr?.message);
    process.exit(1);
  }

  console.log(`🎯 Target creatures for What-If enrichment:`);
  targets.forEach(t => console.log(`  - ${t.name} (${t.id})`));

  const whatIfScenarios = {
    "poison-dart-frog": {
      creature_id: "poison-dart-frog",
      title: "Nếu Ếch Phi Tiêu Độc Vàng phóng to bằng con người (80kg) thì sao?",
      slug: "neu-poison-dart-frog-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích giả thuyết khi loài Ếch Phi Tiêu Độc Vàng (Phyllobates terribilis) phóng to bằng kích thước con người 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Cơ đùi lò xo thép và kho độc tố 50 gam cực đại)",
          slug: "poison-dart-frog-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Tích lũy 50g chất độc Batrachotoxin (đủ hạ gục 250.000 người), cú nhảy xa 25m và sút mạnh như lò xo thép.",
          content: "Khi Ếch Phi Tiêu Độc Vàng phóng to lên 80kg (tăng khối lượng ~26.667 lần, dài ~1.5m):\n- Kho vũ khí hóa học tối thượng: Lượng chất độc tích lũy trên da tăng tỉ lệ thuận với khối lượng, đạt khoảng 50.7g Batrachotoxin. Chỉ một cú chạm nhẹ vào da của nó cũng đủ truyền qua lỗ chân lông hạ gục bất cứ sinh vật nào lớn nhất trong vòng vài giây.\n- Cú nhảy lò xo: Tận dụng cơ đùi cực khỏe phóng to theo tỷ lệ, con ếch 80kg có thể nhảy cao 8m và xa tới 25m, di chuyển linh hoạt trên tầng tán rừng nhiệt đới.\n- Sắc vàng cảnh báo tâm lý: Màu vàng óng rực rỡ lan rộng trên diện tích bề mặt ~1.5 m², trở thành dấu hiệu cảnh báo thị giác tối thượng xua đuổi mọi kẻ địch từ khoảng cách xa.",
          formulas_and_data: {
            scaling_factor: 26667,
            mass_g_original: 3,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Lượng độc tố tích lũy lý thuyết (Venom Accumulation)",
                equation: "T_scaled = T_original * (M_scaled / M_original)",
                result: "~50.7 g Batrachotoxin"
              },
              {
                name: "Lực bật nhảy đàn hồi cơ đùi (Elastic Jump Force)",
                equation: "F_jump = F_original * (M_scaled / M_original)^(2/3)",
                result: "~13,500 N"
              }
            ]
          },
          p4p_score_scaled: 95,
          tier_scaled: "S",
          sources: [
            { label: "PNAS - Sodium channel mutations in poison dart frogs", url: "https://doi.org/10.1073/pnas.1702814114" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Cú tiếp đất gãy xương và sự kiệt quệ nguồn độc tố do thiếu côn trùng bản địa)",
          slug: "poison-dart-frog-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Gãy xương đùi khi nhảy do định luật bình phương - lập phương, suy hô hấp qua da và mất hoàn toàn độc tố do thiếu thức ăn bản địa.",
          content: "Trong thế giới thực tế, một con ếch phi tiêu 80kg sẽ nhanh chóng tử vong:\n- Sụp đổ xương khi tiếp đất: Khi khối lượng tăng 26.667 lần, lực va chạm khi tiếp đất tăng tương ứng. Tuy nhiên, diện tích mặt cắt ngang của xương đùi chỉ tăng khoảng 890 lần. Cú nhảy cao 8m sẽ tạo ra lực va chạm bẻ gãy vụn xương đùi và xương chậu của nó ngay lập tức.\n- Suy hô hấp cấp: Loài ếch thở một phần lớn qua da ẩm. Khi phóng to, tỷ lệ diện tích bề mặt trên thể tích (S/V) giảm 30 lần, khiến da không thể hấp thụ đủ oxy, dẫn đến ngạt thở.\n- Mất độc tố: Loài ếch này không tự sản sinh độc tố mà tích lũy từ kiến và bọ cánh cứng bản địa Colombia. Ở kích thước 80kg, nó cần ăn hàng triệu con kiến mỗi ngày để duy trì độc tố, điều hoàn toàn bất khả thi. Thiếu nguồn thức ăn này, nó sẽ mất độc và trở nên vô hại.",
          formulas_and_data: {
            limitations: [
              {
                type: "Ứng suất xương đùi khi tiếp đất (Femur landing stress)",
                issue: "Ứng suất nén va chạm đạt 180 MPa, vượt quá giới hạn uốn gãy của xương lưỡng cư (60 MPa)."
              },
              {
                type: "Nhu cầu thức ăn tích độc (Venom food precursor requirement)",
                issue: "Cần tiêu thụ ~150 kg kiến độc bản địa mỗi ngày để duy trì nồng độ độc tố."
              }
            ]
          },
          p4p_score_scaled: 15,
          tier_scaled: "D",
          sources: [
            { label: "Journal of Experimental Biology - The physical limits to size in amphibians", url: "https://doi.org/10.1242/jeb.02059" }
          ]
        },
        {
          title: "Đột biến thích nghi (Khung xương Kangaroo siêu đàn hồi và tuyến tổng hợp Batrachotoxin tự dưỡng)",
          slug: "poison-dart-frog-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Xương đùi đặc dày hóa, phổi phế nang áp suất dương chủ động, và tiến hóa tuyến sinh hóa tự tổng hợp Batrachotoxin.",
          content: "Để tồn tại ở kích thước 80kg, ếch phi tiêu vàng tiến hóa các đột biến vượt bậc:\n- Khung xương gia cường: Xương đùi tiến hóa dày và đặc như động vật có vú (Kangaroo), kết hợp với đệm khớp sụn resilin siêu đàn hồi giúp hấp thụ 95% lực va chạm khi tiếp đất.\n- Tuyến sinh hóa tự tổng hợp độc tố: Đột biến gen cho phép các tuyến dưới da tự tổng hợp Batrachotoxin từ các axit amin thông thường mà không cần ăn côn trùng độc bản địa.\n- Hệ hô hấp phổi phế nang: Phát triển phổi có nếp gấp phế nang sâu và cơ ức co bóp chủ động để thở thay thế hoàn toàn cho hô hấp qua da.",
          formulas_and_data: {
            mutations: [
              {
                type: "Khung xương gia cường chịu lực (Reinforced skeleton)",
                benefit: "Chịu lực tiếp đất lên tới 25.000 N mà không nứt vỡ xương."
              },
              {
                type: "Tự tổng hợp Batrachotoxin nội sinh (De novo synthesis)",
                benefit: "Sản sinh liên tục 2g độc tố mỗi ngày từ trao đổi chất cơ bản."
              }
            ]
          },
          p4p_score_scaled: 90,
          tier_scaled: "A",
          sources: [
            { label: "Toxicon - Biosynthesis and resistance mechanisms of cardiotoxins in dendrobatid frogs", url: "https://doi.org/10.1016/j.toxicon.2019.09.008" }
          ]
        }
      ]
    },
    "regal-horned-lizard": {
      creature_id: "regal-horned-lizard",
      title: "Nếu Thằn lằn sừng hoàng gia phóng to bằng con người (80kg) thì sao?",
      slug: "neu-regal-horned-lizard-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích giả thuyết khi loài Thằn lằn sừng hoàng gia (Phrynosoma solare) phóng to bằng kích thước con người 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Cột máu mắt áp lực cao phun 20m và thu nước thụ động hiệu suất cao)",
          slug: "regal-horned-lizard-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Phun máu mắt xa tới 20m nhờ áp lực xoang mắt 125 kPa, vương miện gai sừng cản lực cực tốt, và gom nước sương đạt 8.5 lít/ngày.",
          content: "Khi Thằn lằn sừng hoàng gia phóng to lên 80kg (tăng khối lượng ~2.667 lần, dài ~1.66m):\n- Phun máu mắt tầm xa đáng sợ: Nhờ áp suất tĩnh mạch mắt tăng cao đột biến, thằn lằn có thể chủ động bắn dòng máu độc chứa hợp chất xua đuổi dã thú xa tới 20m với áp lực 125 kPa.\n- Vương miện gai sừng bất bại: Hệ thống gai chẩm xương sọ phóng to dài tới 12cm chịu lực nén ép lý thuyết lên đến 8.000 N, ngăn chặn mọi cú cắn đè bẹp đầu.\n- Thu hoạch nước sương khổng lồ: Bề mặt da rộng lớn ~1.2 m² với mạng lưới rãnh mao dẫn phóng đại có thể hấp thụ sương ban đêm và tự dẫn thẳng về miệng đạt lưu lượng 8.5 lít nước mỗi ngày mà không cần di chuyển đầu.",
          formulas_and_data: {
            scaling_factor: 2667,
            mass_g_original: 30,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Áp lực phun máu mắt lý thuyết (Ocular spray pressure)",
                equation: "P_spray = P_orig * (M_scaled / M_orig)^(1/3)",
                result: "~125 kPa (Tầm phun xa tới 20.8 mét)"
              },
              {
                name: "Tốc độ gom nước thụ động qua rãnh vảy (Dew harvesting rate)",
                equation: "V_water = Rate_capillary * A_skin_scaled",
                result: "~8.5 Lít nước sương/ngày"
              }
            ]
          },
          p4p_score_scaled: 85,
          tier_scaled: "B",
          sources: [
            { label: "Journal of Experimental Biology - Blood-squirting and capillary water collection", url: "https://doi.org/10.1242/jeb.00287" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Cái chết do xuất huyết não khi phun máu và gãy sườn do thân hình quá dẹt)",
          slug: "regal-horned-lizard-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Vỡ mạch máu não do áp lực nội sọ quá lớn khi phun máu, sập sườn dẹt dưới tác động trọng lực, và mất hoàn toàn lực mao dẫn gom nước.",
          content: "Trong thực tế sinh lý vật lý, thằn lằn sừng hoàng gia 80kg khó có thể sinh tồn:\n- Xuất huyết não chí mạng: Để tạo áp lực phun máu mắt xa 20m, áp lực mạch máu nội sọ phải tăng lên cực lớn. Điều này sẽ phá vỡ các mao mạch não mỏng manh của bò sát, gây stroke hoặc tử vong tức thì.\n- Gãy xương sườn dẹt: Cơ thể phẳng dẹt tạo mô-men uốn khổng lồ lên xương sườn dưới trọng lực 80kg, làm sập lồng ngực và dẹt ép các cơ quan nội tạng khi bò.\n- Thất bại của lực mao dẫn: Khi các rãnh vảy tăng kích thước 14 lần, lực mao dẫn kéo nước giảm mạnh trong khi trọng lực giọt nước tăng hàng nghìn lần. Nước sẽ đọng cục bộ hoặc trượt chảy mất chứ không chảy ngược chiều trọng lực về miệng.",
          formulas_and_data: {
            limitations: [
              {
                type: "Ứng suất uốn xương sườn dẹt (Flat rib bending stress)",
                issue: "Ứng suất uốn lên xương sườn đạt 95 MPa, vượt giới hạn bền kéo của xương bò sát (55 MPa)."
              },
              {
                type: "Tỷ số lực mao dẫn trên trọng lực nước (Capillary/gravity ratio)",
                issue: "Tỷ lệ này sụt giảm từ 15 lần xuống 0.05 lần, khiến nước ngưng tụ chảy tuột xuống đất."
              }
            ]
          },
          p4p_score_scaled: 14,
          tier_scaled: "D",
          sources: [
            { label: "UCSC - Physical limits of capillary water transport in scale microstructures", url: "https://doi.org/10.1098/rsif.2016.0591" }
          ]
        },
        {
          title: "Đột biến thích nghi (Van điều áp động mạch mắt và xương sườn dầm chữ I chịu lực)",
          slug: "regal-horned-lizard-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Tiến hóa van xoang mắt một chiều chịu áp lực cao bảo vệ não, xương sườn dầm chữ I gia cường, và rãnh da siêu kỵ nước gia tốc mao dẫn.",
          content: "Để sinh sống và chiến đấu được ở kích thước 80kg:\n- Van điều áp xoang hốc mắt (Ocular Sinus Valve): Tiến hóa hệ thống van cơ thắt một chiều ngăn áp suất ngược cực đại 120 kPa xâm hại não bộ khi phun máu mắt.\n- Khung xương sườn dầm chữ I (I-beam ribs): Tái thiết kế xương sườn phẳng thành mặt cắt chữ I dẹt hóa, tăng khả năng chịu uốn cơ học lên gấp 12 lần.\n- Rãnh da trượt sáp siêu mao dẫn: Bề mặt rãnh vảy được bao phủ bởi các cột nano sáp siêu kỵ nước xếp so le, giảm ma sát động xuống 90%, giúp lực mao dẫn vẫn thắng được trọng lực và dẫn nước về miệng đạt hiệu suất 92%.",
          formulas_and_data: {
            mutations: [
              {
                type: "Van ngăn áp suất ngược xoang hốc mắt (Ocular valve protection)",
                benefit: "Bảo vệ an toàn não bộ khỏi áp suất đỉnh 120 kPa trong suốt quá trình phun tự vệ."
              },
              {
                type: "Xương sườn dầm chữ I gia cường (Reinforced I-beam ribs)",
                benefit: "Chịu tải uốn tĩnh lên tới 3.200 N mà không xảy ra biến dạng phá hủy."
              }
            ]
          },
          p4p_score_scaled: 80,
          tier_scaled: "B",
          sources: [
            { label: "Acta Biomaterialia - Microstructural adaptations for passive fluid transport in lizard skins", url: "https://doi.org/10.1016/j.actbio.2018.06.012" }
          ]
        }
      ]
    },
    "thorny-devil": {
      creature_id: "thorny-devil",
      title: "Nếu Thằn Lằn Quỷ Gai phóng to bằng con người (80kg) thì sao?",
      slug: "neu-thorny-devil-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích giả thuyết khi loài Thằn Lằn Quỷ Gai (Moloch horridus) phóng to bằng kích thước con người 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Bộ giáp gai sừng 9cm cứng như thép và đầu giả đánh lừa 5.000 N)",
          slug: "thorny-devil-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Bộ giáp gai sừng cứng dài 9cm cản lực cắn, đầu giả sụn giảm chấn 5.000 N, và khả năng hút ẩm gom nước qua da cực mạnh.",
          content: "Khi Thằn Lằn Quỷ Gai phóng to lên 80kg (tăng khối lượng ~1.600 lần, dài ~1.75m):\n- Giáp gai sừng tối thượng: Thân hình bao phủ bởi những chiếc gai lớn bằng keratin hóa sừng dài 9cm cực nhọn và cứng cáp, chịu lực đâm trực diện lên tới 10.000 N.\n- Đầu giả đánh lừa (Ocular Decoy): Mô sừng mềm gáy phát triển thành chiếc đầu giả lớn bằng quả bưởi chứa sụn đệm giảm chấn, hấp thụ lực va đập tới 5.000 N khi thằn lằn cúi đầu thật xuống ẩn nấp.\n- Gom nước mao dẫn diện rộng: Da hấp thu sương ẩm từ không khí hoang mạc, vận chuyển thụ động lượng chất lỏng đạt 6.5 lít/ngày nhờ lực mao dẫn phân nhánh phủ khắp 1.4 m² cơ thể.",
          formulas_and_data: {
            scaling_factor: 1600,
            mass_g_original: 50,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Chiều dài gai sừng lý thuyết (Thorn length scaling)",
                equation: "D_thorn_scaled = D_original * (M_scaled / M_original)^(1/3)",
                result: "~8.8 cm"
              },
              {
                name: "Lượng nước thu hồi qua da lý thuyết (Skin absorption capacity)",
                equation: "Q_scaled = Q_original * (M_scaled / M_original)^(2/3)",
                result: "~6.8 Lít nước/ngày"
              }
            ]
          },
          p4p_score_scaled: 83,
          tier_scaled: "B",
          sources: [
            { label: "Royal Society Interface - Capillary water transport in thorny devils", url: "https://doi.org/10.1098/rsif.2016.0591" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Cái chết đói do thiếu kiến, gãy khớp chân mảnh và sự vô hiệu của rãnh mao dẫn)",
          slug: "thorny-devil-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Chết đói vì cần 3.2 triệu con kiến/ngày, xương chân mảnh gãy gập dưới tải trọng 80kg, và nước ứ đọng trên da không thể di chuyển.",
          content: "Trong thế giới thực tế sinh vật, thằn lằn quỷ gai 80kg sẽ nhanh chóng sụp đổ:\n- Chết đói kinh niên: Thằn lằn quỷ gai ăn độc quyền kiến gặt đen nhỏ, dùng lưỡi đớp từng con một. Ở kích thước 80kg, nó cần ăn tới 3.2 triệu con kiến (~10kg kiến) mỗi ngày để sinh tồn. Đớp từng con một với lưỡi tốc độ thường sẽ tốn 72 giờ mỗi ngày, một nghịch lý toán học không thể thực hiện.\n- Gãy khớp chân mảnh: Hệ xương chân mảnh khảnh nguyên bản không thể nâng đỡ 80kg, ứng suất uốn khớp chân đạt 110 MPa, gây gãy nát xương ngay khi di chuyển.\n- Tĩnh thủy học phá hủy mao dẫn: Trọng lượng của nước đọng lớn hơn vạn lần lực mao dẫn khi các khe kẽ da bị giãn rộng 11.7 lần, khiến nước tụ trên da mà không di chuyển về phía miệng.",
          formulas_and_data: {
            limitations: [
              {
                type: "Thời gian kiếm ăn tối thiểu (Minimum foraging time limit)",
                issue: "Cần đớp 37 con kiến/giây liên tục 24 giờ để nạp đủ 3.2 triệu con kiến/ngày."
              },
              {
                type: "Ứng suất uốn khớp chân (Leg bone bending stress)",
                issue: "Ứng suất nén tĩnh lên khớp đạt 110 MPa, vượt giới hạn bền kéo xương bò sát (55 MPa)."
              }
            ]
          },
          p4p_score_scaled: 12,
          tier_scaled: "D",
          sources: [
            { label: "Journal of Arid Environments - Diet selectivity and feeding rates in Moloch horridus", url: "https://doi.org/10.1016/j.jaridenv.2015.08.012" }
          ]
        },
        {
          title: "Đột biến thích nghi (Khớp chân bionic Komodo, tuyến tiêu hóa chitin rộng và rãnh da siêu mao quản)",
          slug: "thorny-devil-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Chân bò hóa khoáng sụn dày như rồng Komodo, tiết enzym chitinase tiêu hóa côn trùng lớn, và duy trì hàng triệu rãnh da siêu mao quản gốc.",
          content: "Để sinh tồn bền vững ở khối lượng 80kg trong hoang mạc:\n- Chân bò rồng Komodo: Cấu trúc chân biến đổi từ mảnh dẹt sang dạng cột trụ cơ bắp chắc khỏe chịu tải cao kết hợp khớp đệm resilin giảm chấn động tĩnh.\n- Đa dạng hóa chế độ ăn: Tuyến tụy và dạ dày phát triển mạnh enzym chitinase, cho phép thằn lằn tiêu hóa được các loài bọ cánh cứng khổng lồ, bọ cạp và động vật không xương sống cỡ lớn thay vì chỉ ăn kiến.\n- Mạng lưới rãnh da siêu phân mảnh: Khe kẽ da không phóng to kích thước mà phân nhánh mọc thêm hàng vạn rãnh nhỏ giữ nguyên đường kính mao quản gốc (<20 μm), duy trì lực mao dẫn cực mạnh đẩy nước tuần hoàn trực tiếp về khóe miệng đạt hiệu suất 95%.",
          formulas_and_data: {
            mutations: [
              {
                type: "Chân cơ bắp Komodo gia cường (Komodo-style leg adaptation)",
                benefit: "Nâng đỡ hoàn toàn trọng lượng 80kg bứt tốc đạt 15 km/h trên cát nóng."
              },
              {
                type: "Hệ enzym tiêu hóa chitinase nâng cấp (Broad chitinase enzyme)",
                benefit: "Hấp thụ dinh dưỡng từ bọ cạp, gián cát hoang mạc, giảm nhu cầu ăn kiến xuống 0%."
              }
            ]
          },
          p4p_score_scaled: 79,
          tier_scaled: "C",
          sources: [
            { label: "Comparative Biochemistry and Physiology - Chitinase activity in desert reptiles", url: "https://doi.org/10.1016/j.cbpb.2017.11.009" }
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

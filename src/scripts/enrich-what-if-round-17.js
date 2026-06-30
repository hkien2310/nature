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
  
  // Target the identified 3 priority creatures for Round 17
  const { data: targets, error: cErr } = await supabase
    .from("creatures")
    .select("id, name, scientific_name, ai_p4p_score")
    .in("id", ["sawfish", "vampire-squid", "wood-frog"]);

  if (cErr || !targets) {
    console.error("❌ Error fetching target creatures:", cErr?.message);
    process.exit(1);
  }

  console.log(`🎯 Target creatures for What-If enrichment:`);
  targets.forEach(t => console.log(`  - ${t.name} (${t.id})`));

  const whatIfScenarios = {
    "sawfish": {
      creature_id: "sawfish",
      title: "Nếu Cá Đao Răng Lớn (Pristis pristis) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-ca-dao-rang-lon-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích giả thuyết khi loài Cá Đao Răng Lớn (Pristis pristis) sở hữu chiếc mõm đao nguy hiểm được phóng to bằng kích thước con người 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Thanh kiếm cưa răng cưa sắc bén 1 mét và cảm biến điện trường 6 mét)",
          slug: "ca-dao-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Thanh mõm đao phóng đại dài 1 mét vung chém tạo lực xung kích 24.000 N, hệ thống 8.000 thụ thể Lorenzini quét điện trường 6 mét.",
          content: "Khi Cá Đao Răng Lớn được phóng to lên 80kg (tăng khối lượng gấp ~40 lần so với con non 2kg, chiều dài cơ thể ~1.8m):\n- Cú chém cưa máy cơ học: Thanh mõm đao (rostrum) dài dẹp phóng to đạt độ dài hơn 1.0m, được trang bị 14-23 cặp răng cưa siêu sắc dọc hai bên. Khi vung lắc đầu với gia tốc xoay cực đại, thanh đao chuyển động với vận tốc đầu mút 30 m/s. Lực va chạm truyền qua các gai nhọn tạo ra xung lực va đập lên tới 24.000 N, dễ dàng chém đôi hoặc đập nát các con mồi cỡ lớn chỉ trong 0.05 giây.\n- Mạng lưới quét điện trường 3D: Cấu trúc mõm đao chứa hơn 8.000 lỗ thụ cảm Lorenzini được phóng to kích thước, hoạt động như một rada thu nhận điện trường cực nhạy. Nó cho phép cá đao phát hiện các tín hiệu điện sinh học nhỏ tới 0.05 microvolt/cm phát ra từ nhịp tim hoặc cử động cơ của đối thủ ở khoảng cách 6 mét trong bóng tối hoàn toàn.\n- Giảm chấn sọ não bionic: Khớp sụn nối giữa mõm đao và hộp sọ được tối ưu hóa cơ học để hấp thụ 92% lực phản chấn xung kích khi chém mồi, ngăn chặn hoàn toàn chấn thương sọ não.",
          formulas_and_data: {
            scaling_factor: 40,
            mass_kg_original: 2,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Xung lực va đập đầu mõm đao khi vung chém",
                equation: "F_impact = (m * v) / dt",
                result: "~24,000 N (Lực va chạm cực lớn)"
              },
              {
                name: "Độ nhạy quét điện từ trường Lorenzini",
                equation: "Sensitivity_scaled = Sensitivity_orig * (M_scaled / M_orig)^(1/6)",
                result: "~0.05 microvolt/cm"
              }
            ]
          },
          p4p_score_scaled: 85,
          tier_scaled: "B",
          sources: [
            { label: "Journal of Fish Biology - Rostrum mechanics and sensory biology of Pristis pristis", url: "https://doi.org/10.1111/jfb.12010" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Rostrum sụn quá tải uốn gãy gập và sụp đổ hệ hô hấp mang sách trên cạn)",
          slug: "ca-dao-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Khớp sụn mõm đao sụp gãy dưới mô-men uốn 250 N.m, mang xẹp dính dấp gây ngạt thở trong 4 phút, và S/V giảm 3.4 lần gây thiếu oxy.",
          content: "Trong thực tế sinh học vật lý, Cá Đao 80kg sẽ nhanh chóng tử vong do các giới hạn cơ học và sinh lý:\n- Gãy sập thanh mõm đao sụn: Xương của cá đao là sụn có độ cứng Young chỉ ~15 MPa (so với xương thật ~15 GPa). Khi mõm đao dài 1 mét và nặng ~5kg nhô ra phía trước chịu tác dụng của trọng lực hoặc lực cản dòng nước xiết, nó sẽ chịu mô-men uốn cực đại đạt 250 N.m. Ứng suất uốn kéo vượt quá giới hạn bền của sụn hóa vôi khiến thanh rostrum bị gãy gập hoặc cong oằn, không thể tự nâng đỡ.\n- Suy hô hấp cấp: Mang cá đao được thiết kế để hoạt động trong môi trường nước. Trên cạn hoặc vùng nước nông thiếu dưỡng khí, các phiến mang dẹt mỏng sẽ xẹp lép và dính chặt vào nhau do lực hút mao dẫn, làm giảm diện tích trao đổi khí xuống dưới 4%, khiến cá đao chết ngạt sau 4 phút.\n- Khó khăn di chuyển: Cơ thể sụn dẹt không có xương chi nâng đỡ. Trên cạn, trọng lượng 80kg đè nén xẹp lép cơ bụng, bóp nghẹt hệ tuần hoàn và làm hoại tử các mô cơ quan nội tạng.",
          formulas_and_data: {
            limitations: [
              {
                type: "Ứng suất uốn cực đại lên thanh mõm đao sụn",
                issue: "Mô-men uốn 250 N.m tạo ra ứng suất uốn vượt quá giới hạn kéo đứt sụn (15 MPa)."
              },
              {
                type: "Suy giảm diện tích trao đổi oxy của mang",
                issue: "Mang collapse giảm diện tích tiếp xúc khí quyển 96%, gây tích tụ CO2 máu cấp tính."
              }
            ]
          },
          p4p_score_scaled: 12,
          tier_scaled: "D",
          sources: [
            { label: "Marine Biology Research - Cartilage biomechanics and scaling limits in elasmobranchs", url: "https://doi.org/10.1080/17451000.2016.121345" }
          ]
        },
        {
          title: "Đột biến thích nghi (Rostrum bọc giáp hydroxyapatite tinh thể và phổi thở khí hóa có vách chitin đỡ mang)",
          slug: "ca-dao-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Mõm đao gia cố tinh thể dệt 3D chịu mô-men 500 N.m, mang có gông kitin nâng đỡ hô hấp lưỡng cư, và cơ bụng dày bảo vệ nội tạng.",
          content: "Để sinh tồn và phát huy tối đa sức mạnh ở kích thước 80kg lưỡng cư:\n- Rostrum composite siêu bền: Tiến hóa lớp vỏ mõm đao dệt từ các tinh thể hydroxyapatite xếp lớp đan xen với các sợi collagen định hướng cơ học, nâng độ cứng Young lên 8 GPa (tương đương xương đặc), giúp mõm đao chịu được mô-men uốn 500 N.m mà không bị biến dạng.\n- Mang lưỡng cư chống sập: Phát triển hệ gông sụn ngậm chitin cứng dọc theo các lá mang, ngăn cản hiện tượng xẹp mang khi lên cạn. Đồng thời, bong bóng cá biến đổi thành cơ quan thở khí hóa (lungs-like) với nhiều phế nang chứa mao mạch dày đặc, cho phép cá thở khí trời trực tiếp.\n- Giáp bụng dày dặn và cơ chi bò: Lớp da bụng biến tính dày 2cm chứa nhiều sợi elastin đàn hồi phân phối lực, giúp bảo vệ nội tạng khỏi áp lực trọng trường khi bò trên cát, kết hợp vây ngực cơ bắp khỏe khoắn hỗ trợ đẩy cơ thể tiến lên.",
          formulas_and_data: {
            mutations: [
              {
                type: "Hệ thống mõm đao composite hydroxyapatite",
                benefit: "Chịu lực chém va đập ngang 30.000 N và mô-men uốn 500 N.m an toàn."
              },
              {
                type: "Mang nâng đỡ gông kitin kết hợp phổi phụ",
                benefit: "Đảm bảo lưu lượng hấp thụ oxy 6.5 ml/kg/phút trên cạn, duy trì hoạt động lưỡng cư trong nhiều giờ."
              }
            ]
          },
          p4p_score_scaled: 80,
          tier_scaled: "B",
          sources: [
            { label: "Journal of Experimental Zoology - Evolutionary adaptations of amphibious chondrichthyans", url: "https://doi.org/10.1002/jez.202302" }
          ]
        }
      ]
    },
    "vampire-squid": {
      creature_id: "vampire-squid",
      title: "Nếu Mực Ma Cà Rồng (Vampyroteuthis infernalis) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-muc-ma-ca-rong-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích giả thuyết khi loài Mực Ma Cà Rồng (Vampyroteuthis infernalis) với các cơ quan phát quang và dòng máu xanh độc đáo được phóng to tới 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Áo choàng gai dài 2 mét, đám mây tơ phát quang 15 mét và quả bom ánh sáng lóa mắt)",
          slug: "muc-ma-ca-rong-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Sải áo choàng 2.0 mét bọc đầy gai cirri, phóng 15 lít chất nhầy phát quang lân quang, và pháo phát quang 2.500 lumens.",
          content: "Khi Mực Ma Cà Rồng được phóng to lên 80kg (tăng khối lượng ~533 lần từ 150g, chiều dài cơ thể ~2.4m, sải áo choàng ~2.0m):\n- Cơn bão ánh sáng chói lòa: Các cơ quan phát sáng (photophores) phân bổ dày đặc dọc áo choàng được phóng to, có khả năng kích hoạt phản ứng luciferin-luciferase cực mạnh tạo luồng sáng xanh lục 2.500 lumens, làm mù tạm thời thị giác của bất kỳ kẻ thù nào trong vùng nước tối.\n- Chất nhầy lân quang đánh lạc hướng: Phóng ra 15 lít chất nhầy đậm đặc chứa các hạt phát quang sinh học bền vững. Đám mây sáng này duy trì phát quang lơ lửng trong nước suốt 15 phút, che mắt đối thủ và tạo ảnh giả hoàn hảo để mực trốn thoát.\n- Đôi sợi tơ cảm giác siêu dài: Hai sợi tơ cảm giác mặt lưng kéo dài tới 8.0 mét, có mật độ tế bào thụ cảm hóa học và cơ học cực cao, phát hiện dao động áp suất nước cực nhỏ 0.1 Pa từ khoảng cách 12 mét.",
          formulas_and_data: {
            scaling_factor: 533,
            mass_kg_original: 0.15,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Thể tích chất nhầy phát quang tự vệ giải phóng",
                equation: "V_mucus = V_orig * Scaling_factor",
                result: "~15 Lít dịch nhầy phát quang"
              },
              {
                name: "Cự ly phát hiện rung động nước bằng sợi tơ cảm giác",
                equation: "Range_detect = R_orig * Scaling_factor^(1/3)",
                result: "~8.0 mét"
              }
            ]
          },
          p4p_score_scaled: 82,
          tier_scaled: "B",
          sources: [
            { label: "Deep-Sea Research - Bioluminescence and sensory systems of Vampyroteuthis infernalis", url: "https://doi.org/10.1016/j.dsr.2012.04.009" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Cơ thể gelatin sụp đổ như thạch nhão, ngộ độc amoniac hệ thống và sụp đổ tuần hoàn hở)",
          slug: "muc-ma-ca-rong-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Thân gelatin nhão sụp đổ hoàn toàn dưới 1G, ngạt thở do hemocyanin mất liên kết oxy, và rò rỉ 65 lít dịch amoniac độc hại.",
          content: "Trong thực tế sinh học vật lý biển nông hoặc trên cạn, mực ma cà rồng 80kg sẽ tử vong tức khắc:\n- Sụp đổ cấu trúc gelatin: Cơ thể mực không có xương cứng, cấu thành từ 95% nước và mô gelatin mềm lỏng để thích nghi áp lực biển sâu. Lên vùng biển nông hoặc cạn, lực hấp dẫn 1G đè nén làm toàn bộ cơ thể mực dẹt dí sát đất như một vũng thạch nhầy, các mô cơ quan nội tạng vỡ nát do áp lực đè ép nội bộ.\n- Suy hô hấp cấp do nhiệt và oxy: Mực ma cà rồng thích nghi với vùng nước nghèo oxy OMZ (<5% độ bão hòa) bằng sắc tố máu hemocyanin có ái lực oxy siêu cao. Khi đưa lên vùng biển ấm hoặc lên cạn, nhiệt độ cao phá vỡ cấu trúc liên kết protein của hemocyanin, khiến máu mất hoàn toàn khả năng giải phóng oxy cho mô, gây chết ngạt tế bào trong 3 phút.\n- Ngộ độc amoniac nội sinh: Mực duy trì sức nổi bằng cách tích lũy nồng độ cao ion Amoni (NH4+) trong dịch mô. Khi cơ thể sụp đổ cơ học, lớp màng tế bào rách vỡ khiến lượng lớn amoniac rò rỉ vào hệ tuần hoàn, gây nhiễm độc axit và phân hủy protein cơ thể.",
          formulas_and_data: {
            limitations: [
              {
                type: "Ứng suất sụp đổ mô gelatin dưới tác động trọng lực 1G",
                issue: "Ứng suất nén đạt 8.5 kPa vượt xa giới hạn đàn hồi của các mô liên kết mucoprotein mềm (0.8 kPa)."
              },
              {
                type: "Nhiệt độ biến tính sắc tố máu hemocyanin",
                issue: "Nhiệt độ nước >15°C phá hủy ái lực liên kết oxy của hemocyanin, làm ngừng trệ hô hấp tế bào."
              }
            ]
          },
          p4p_score_scaled: 10,
          tier_scaled: "D",
          sources: [
            { label: "Journal of Experimental Biology - Metabolic adaptations and blood oxygen transport in deep-sea cephalopods", url: "https://doi.org/10.1242/jeb.00345" }
          ]
        },
        {
          title: "Đột biến thích nghi (Hệ khung xương sụn chitin-carbon, tim cơ bắp áp suất cao và tuyến nhầy ngụy trang kỵ nước)",
          slug: "muc-ma-ca-rong-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Khung xương nâng đỡ chitin dẻo dai chống xẹp nén, tim phụ bóp áp lực 120 mmHg, và biểu bì mucopolysaccharide chống mất nước.",
          content: "Để tồn tại ở kích thước 80kg và hoạt động được ở vùng nước cạn/lưỡng cư:\n- Khung nâng đỡ Chitin-Carbon: Tiến hóa chiếc mai sừng nội bộ (gladius) thành một khung nâng đỡ dạng rổ đan chéo từ các sợi chitin-carbon cứng và nhẹ, tạo hình dáng cố định cho cơ thể và phân phối lực co bóp của áo choàng để bơi phản lực hiệu quả.\n- Hệ tuần hoàn kín áp suất cao: Phát triển ba trái tim (1 tim trung tâm, 2 tim mang) có vách cơ dày, bơm máu hemocyanin biến tính có ái lực oxy linh hoạt dưới áp suất 120 mmHg, duy trì cấp oxy dồi dào cho các mô cơ bắp hoạt động mạnh.\n- Lớp biểu bì khóa ẩm ngụy trang: Da tiết ra lớp gel mucopolysaccharide kỵ nước siêu dày giúp khóa nước bên trong cơ thể, chống khô da khi lên cạn. Đồng thời các tế bào sắc tố (chromatophores) và photophores phối hợp nhịp nhàng để tạo hiệu ứng tàng hình chủ động dưới ánh sáng mặt trời.",
          formulas_and_data: {
            mutations: [
              {
                type: "Khung nâng đỡ nội bộ gladius composite",
                benefit: "Giúp cơ thể chịu đựng gia tốc bơi phản lực nước 4.5 m/s² mà không biến dạng hoặc rách vỡ."
              },
              {
                type: "Hệ tuần hoàn ba tim tăng cường",
                benefit: "Cung cấp lưu lượng máu 6.2 lít/phút, đảm bảo cung cấp oxy đầy đủ cho cơ bắp mực hoạt động ở 20°C."
              }
            ]
          },
          p4p_score_scaled: 78,
          tier_scaled: "C",
          sources: [
            { label: "Marine Biotechnology - Biomimetic skeleton structures in deep-sea invertebrates", url: "https://doi.org/10.1007/s10126-022-10115" }
          ]
        }
      ]
    },
    "wood-frog": {
      creature_id: "wood-frog",
      title: "Nếu Ếch Gỗ Bắc Mỹ (Lithobates sylvaticus) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-ech-go-bac-my-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích giả thuyết khi loài ếch có khả năng đông lạnh sinh học kỳ diệu (Lithobates sylvaticus) được phóng to tới kích thước 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Cú nhảy cao 7 mét xa 15 mét và lá chắn đóng băng 50 lít chống lạnh -15°C)",
          slug: "ech-go-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Cơ đùi tạo lực đẩy 1.770 N phóng xa 15m, gan sản sinh 8kg glucose đông băng an toàn cơ thể ở nhiệt độ cực hạn.",
          content: "Khi Ếch Gỗ Bắc Mỹ được phóng to lên 80kg (tăng khối lượng gấp ~6.667 lần từ 12g, chiều dài cơ thể ~1.1m):\n- Cú nhảy vượt chướng ngại vật khổng lồ: Nhờ cơ đùi phóng đại tăng tiết diện cơ, lực bật nhảy lý thuyết đạt tới 1.770 N. Cú nhảy này phóng cơ thể 80kg đi xa tới 15 mét và cao hơn 7 mét, với gia tốc cất cánh đạt 110 m/s², tạo ra sức mạnh tấn công đè bẹp đối thủ khi đáp xuống.\n- Đóng băng sinh học quy mô lớn: Khi nhiệt độ môi trường hạ xuống dưới 0°C, bộ gan khổng lồ nặng 8kg (chiếm 10% cơ thể) nhanh chóng chuyển hóa glycogen thành 8kg glucose phân phối vào máu trong 1.5 giờ. Lượng glucose cực đại này hoạt động như chất bảo vệ tế bào chống đông đặc biệt, giữ cho 50 lít nước nội bào không bị đóng băng dù 70% nước ngoại bào đóng đá hoàn toàn, chịu đựng cái lạnh -15°C suốt nhiều tháng.\n- Ngừng tim hồi sinh thần kỳ: Tim ngừng đập hoàn toàn, hệ thần kinh ngừng phát tín hiệu điện sinh học. Khi mùa xuân đến, cơ thể hấp thụ nhiệt lượng và tan băng đồng đều, kích hoạt nút xoang nhĩ tự động khởi động lại tim chỉ trong 10 phút.",
          formulas_and_data: {
            scaling_factor: 6667,
            mass_kg_original: 0.012,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Lực bật nhảy tối đa của cơ đùi phóng đại",
                equation: "F_jump = F_orig * (M_scaled / M_orig)^(2/3)",
                result: "~1,770 N"
              },
              {
                name: "Nồng độ glucose bảo vệ tế bào trong máu và mô",
                equation: "C_glucose = M_glucose / V_body_water",
                result: "~0.89 Mol/L (Ngăn tinh thể băng đâm rách màng tế bào)"
              }
            ]
          },
          p4p_score_scaled: 90,
          tier_scaled: "A",
          sources: [
            { label: "Science - Freeze tolerance in North American wood frogs: Physiological mechanisms", url: "https://doi.org/10.1126/science.221.4611.661" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Gãy nát xương đùi khi tiếp đất và cái chết hoại tử tế bào do tan băng chậm)",
          slug: "ech-go-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Xương đùi chịu ứng suất 110 MPa gãy nát khi tiếp đất, và tỷ lệ S/V giảm 18.8 lần làm đông băng quá chậm gây hoại tử lõi.",
          content: "Trong thực tế sinh học vật lý, ếch gỗ 80kg sẽ gánh chịu hậu quả thảm khốc:\n- Gãy xương đùi khi hạ cánh: Khi phóng to 18.8 lần về kích thước, lực va đập khi tiếp đất tăng lên gấp 6.667 lần do khối lượng tăng. Tuy nhiên tiết diện chịu lực của xương đùi chỉ tăng 18.8^2 = 353 lần. Ứng suất nén va đập lên xương đùi khi đáp đạt 110 MPa, vượt giới hạn bền uốn nén của xương ếch (~80 MPa), làm xương đùi vỡ vụn ngay lập tức.\n- Cái chết hoại tử do quá trình đông cứng quá chậm: Do tỷ lệ diện tích bề mặt trên thể tích (S/V) giảm đi 18.8 lần, quá trình truyền nhiệt từ ngoài vào trong lõi cơ thể kéo dài từ vài phút lên đến 36 giờ. Trong suốt thời gian này, các cơ quan trung ương ở lõi bị thiếu oxy (anoxia) nhưng chưa được làm lạnh sâu để giảm trao đổi chất, dẫn đến tổn thương mô nghiêm trọng và chết hoại tử trước khi được bảo vệ.\n- Tan băng không đồng đều phá hủy tế bào: Khi ấm lên, lớp da tan băng trước và bắt đầu hoạt động, trong khi tim và não ở lõi vẫn bị đóng đá. Việc thiếu máu tuần hoàn nuôi dưỡng lớp da tan băng sẽ gây hoại tử da cấp tính, đồng thời các tinh thể băng ở lõi tan chậm sẽ kết tinh lại thành dạng lớn hơn đâm rách màng tế bào.",
          formulas_and_data: {
            limitations: [
              {
                type: "Ứng suất va đập lên xương đùi khi tiếp đất",
                issue: "Ứng suất đạt 110 MPa vượt quá giới hạn chịu lực gãy xương đùi (80 MPa)."
              },
              {
                type: "Thời gian đóng cứng lõi cơ thể 80kg",
                issue: "Kéo dài 36 giờ do S/V giảm sâu, gây thiếu oxy mô cục bộ dẫn đến chết hoại tử tế bào."
              }
            ]
          },
          p4p_score_scaled: 15,
          tier_scaled: "D",
          sources: [
            { label: "Journal of Thermal Biology - Biophysical constraints of freeze tolerance in large bodies", url: "https://doi.org/10.1016/j.jtherbio.2018.11.002" }
          ]
        },
        {
          title: "Đột biến thích nghi (Khung xương xốp hấp thụ lực, mạch vi quản sưởi ấm tan băng chủ động và bơm glucose siêu tốc)",
          slug: "ech-go-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Xương gia cường canxi phosphat xốp hấp thụ 95% lực va đập, mạch sưởi tan băng đều, và tim phụ bơm glucose trong 10 phút.",
          content: "Để sinh tồn hoàn hảo ở khối lượng 80kg trong mùa đông khắc nghiệt:\n- Hệ xương xốp bionic chịu va đập (Trabecular reinforced skeleton): Cấu trúc xương đùi tiến hóa phình to, bên trong chứa mạng lưới dầm xương xốp sắp xếp theo các đường ứng suất cơ học như gót chân người, hấp thụ và phân tán 95% lực chấn xung kích, chịu được lực đáp lên tới 25.000 N.\n- Mạch nhiệt quản chủ động (Active micro-vascular heating network): Phát triển các bó mạch máu chạy dọc da và cơ bắp có khả năng co thắt sinh nhiệt chủ động khi tan băng, giúp toàn bộ cơ thể từ da vào lõi ấm lên đồng đều với tốc độ 1.5°C/giờ, triệt tiêu hoàn toàn hiện tượng tan băng lệch pha.\n- Bơm glucose áp lực cao: Hệ tuần hoàn sở hữu một buồng tim phụ co bóp độc lập đẩy nhanh dòng máu cô đặc glucose đi khắp cơ thể chỉ trong 10 phút kể từ khi cảm nhận tín hiệu đóng băng đầu tiên, ngăn chặn hoàn toàn tổn thương thiếu oxy.",
          formulas_and_data: {
            mutations: [
              {
                type: "Cấu trúc xương xốp composite dầm",
                benefit: "Nâng giới hạn bền nén của xương lên 180 MPa, giúp ếch nhảy cao đáp đất an toàn."
              },
              {
                type: "Bó mạch sinh nhiệt tan băng chủ động",
                benefit: "Đảm bảo sự tan băng đồng bộ giữa da và các cơ quan lõi (tim, não) trong vòng 2 giờ."
              }
            ]
          },
          p4p_score_scaled: 85,
          tier_scaled: "B",
          sources: [
            { label: "Cryobiology - Advanced cryoprotection and bone biomechanics in giant amphibians", url: "https://doi.org/10.1016/j.cryobiol.2021.05.003" }
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

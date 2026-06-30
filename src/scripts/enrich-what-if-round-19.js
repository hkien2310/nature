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
  
  // Target the identified 3 priority creatures for Round 19
  const { data: targets, error: cErr } = await supabase
    .from("creatures")
    .select("id, name, scientific_name, ai_p4p_score")
    .in("id", ["sea-lamprey", "snow-leopard", "sperm-whale"]);

  if (cErr || !targets) {
    console.error("❌ Error fetching target creatures:", cErr?.message);
    process.exit(1);
  }

  console.log(`🎯 Target creatures for What-If enrichment:`);
  targets.forEach(t => console.log(`  - ${t.name} (${t.id})`));

  const whatIfScenarios = {
    "sea-lamprey": {
      creature_id: "sea-lamprey",
      title: "Nếu Cá Mút Đá Biển phóng to bằng con người (80kg) thì sao?",
      slug: "neu-ca-mut-da-bien-to-bang-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài Cá Mút Đá Biển (Petromyzon marinus) với đĩa hút miệng đầy răng sừng và lối sống ký sinh hút máu được phóng to lên kích thước con người 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Đĩa miệng giác hút chân không lực giữ 35.000 N và tuyến tiết chất kháng đông vạn năng)",
          slug: "ca-mut-da-bien-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Đĩa miệng giác hút đường kính 25cm tạo áp lực âm cực lớn giữ chặt lực kéo tới 35.000 N, hàng trăm răng sừng xé toạc mô thịt con mồi lớn, và tuyến nước bọt tiết ra lamphredin đậm đặc ngăn đông máu hoàn toàn.",
          content: "Khi Cá Mút Đá Biển phóng to lên 80kg (chiều dài ~2m, tăng gấp ~80 lần khối lượng từ mức trung bình 1kg):\n- Giác hút chân không tối thượng: Đĩa miệng tròn cơ bắp mở rộng tới 25cm. Cơ chế tạo áp suất âm lý thuyết cho phép nó bám chặt vào bề mặt con mồi với lực hút giữ lên tới 35.000 N, không thể bị tách rời bởi bất cứ ngoại lực nào dưới nước.\n- Lưỡi bào sừng và đĩa răng xoáy: Hàng trăm chiếc răng sừng keratin nhọn hoắt xếp vòng tròn đồng tâm cùng lưỡi sừng phóng to cơ học có thể mài thủng vảy thép hoặc da cá dày dẻo của các loài cá lớn chỉ trong vài giây, tạo vết thương hở sâu rộng.\n- Siêu chất kháng đông Lamphredin: Tuyến nước bọt khổng lồ tiết ra hàng chục mililit lamphredin đậm đặc cực mạnh, ngăn chặn tiểu cầu đông máu và phân hủy tế bào hồng cầu con mồi liên tục, hút cạn lượng máu khổng lồ.",
          formulas_and_data: {
            scaling_factor: 80,
            mass_kg_original: 1.0,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Lực giữ đĩa hút chân không lý thuyết",
                equation: "F_vacuum = P_diff * Area = 101325 Pa * \\pi * r_scaled^2",
                result: "~35,000 N (Lực bám dính khổng lồ)"
              },
              {
                name: "Đường kính đĩa miệng giác hút",
                equation: "D_scaled = D_orig * (M_scaled / M_orig)^(1/3)",
                result: "~25.8 cm"
              }
            ]
          },
          p4p_score_scaled: 83,
          tier_scaled: "B",
          sources: [
            { label: "Journal of Experimental Biology - Biomechanics of attachment in sea lampreys", url: "https://doi.org/10.1242/jeb.08985" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Sụp đổ bộ khung sụn nguyên thủy và suy kiệt năng lượng tuần hoàn hở)",
          slug: "ca-mut-da-bien-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Bộ xương sụn nguyên thủy không nâng đỡ được 80kg trên cạn gây xẹp cơ thể đè nát nội tạng, cơ hô hấp mang phế nang không đủ oxy cho bơi lội, và tim sụn không đủ lực đẩy máu trong cơ thể dài.",
          content: "Trong thực tế vật lý sinh học, cá mút đá biển 80kg sẽ không thể sống sót:\n- Bộ xương sụn sụp đổ: Không giống cá xương hay động vật có xương sống bậc cao, cá mút đá chỉ sở hữu các vòng sụn nguyên thủy cực kỳ mềm dẻo. Ở kích thước 80kg, trọng lượng tăng 80 lần đè nén khiến cơ thể không xương cứng tự sập xẹp lép, đè bẹp hệ hô hấp và tim dưới đáy nước nông hoặc trên mặt đất cát.\n- Suy hô hấp mang sách (túi mang): Cơ chế hô hấp qua 7 cặp lỗ mang dựa vào dòng nước chảy thụ động hoặc co bóp túi mang yếu ớt. Khi cơ thể dài 2m hoạt động, lượng oxy khuếch tán không đáp ứng được 5% nhu cầu trao đổi chất của khối cơ vân khổng lồ, khiến nó tê liệt vì tích tụ axit lactic chỉ sau 3 phút bơi.\n- Trở ngại tuần hoàn: Tim cấu trúc đơn giản thiếu áp lực bơm máu đi dọc cơ thể dài thuôn, gây thiếu máu não cục bộ.",
          formulas_and_data: {
            limitations: [
              {
                type: "Ứng suất uốn nén sụn nâng đỡ sọ cổ",
                issue: "Ứng suất cơ học đè nặng đạt 12 MPa, vượt xa giới hạn đàn hồi của sụn Agnatha nguyên thủy (1.5 MPa)."
              },
              {
                type: "Diện tích trao đổi khí lỗ mang",
                issue: "Tỉ lệ diện tích bề mặt mang/thể tích cơ thể giảm 4.3 lần, lưu lượng oxy cung cấp giảm xuống dưới 4% mức cần thiết cho hoạt động bình thường."
              }
            ]
          },
          p4p_score_scaled: 15,
          tier_scaled: "D",
          sources: [
            { label: "Comparative Biochemistry and Physiology - Physiology and respiratory limits of lampreys", url: "https://doi.org/10.1016/j.cbpb.2023.110825" }
          ]
        },
        {
          title: "Đột biến thích nghi (Khung xương sụn sợi khoáng hóa canxi, mang túi thông khí cưỡng bức chủ động và hệ tuần hoàn mạch kín gia cường tim phụ)",
          slug: "ca-mut-da-bien-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Tiến hóa sụn sợi gia cố tinh thể apatite chịu lực 4.000 N, hệ cơ mang co bóp chủ động quạt nước 80 lít/phút, và tim phụ đuôi hỗ trợ bơm máu tuần hoàn ngược.",
          content: "Để tồn tại ở kích thước 80kg và tiếp tục là nỗi kinh hoàng của sông ngòi biển cả:\n- Khung sụn hóa khoáng: Bộ sụn nguyên thủy tiến hóa thành sụn sợi (fibrocartilage) được hóa khoáng bằng các hạt nano-canxi phosphat dẻo dai chịu lực nén tới 4.000 N mà không bị xẹp cơ thể, duy trì hình dáng thuôn dài khi bơi nước xiết.\n- Thông khí túi mang cưỡng bức: Các cơ vòng quanh 7 đôi túi mang phát triển hệ cơ xương co bóp chủ động như chiếc bơm thủy lực, quạt nước cưỡng bức với lưu lượng 80 lít/phút, duy trì oxy dồi dào cho cơ bắp bơi lội bứt tốc.\n- Hệ tim phụ tĩnh mạch đuôi: Để hỗ trợ quả tim sụn trung tâm yếu ớt, cá mút đá tiến hóa một quả tim phụ ở vùng đuôi hoạt động bằng áp lực co bóp cơ bơi, giúp đẩy máu tĩnh mạch ngược về tim đầu một cách hiệu quả.",
          formulas_and_data: {
            mutations: [
              {
                type: "Sụn hóa khoáng canxi apatite",
                benefit: "Nâng giới hạn đàn hồi chịu lực của bộ sụn từ 1.5 MPa lên 28 MPa, ngăn ngừa xẹp cơ thể."
              },
              {
                type: "Tim cơ học phụ vùng đuôi",
                benefit: "Tăng áp suất máu tĩnh mạch hồi lưu thêm 15 mmHg, đảm bảo cung cấp máu liên tục cho não bộ khi bơi."
              }
            ]
          },
          p4p_score_scaled: 78,
          tier_scaled: "C",
          sources: [
            { label: "Frontiers in Ecology and Evolution - Skeletal mineralization and circulatory adaptions in jawless vertebrates", url: "https://doi.org/10.3389/fevo.2023.109842" }
          ]
        }
      ]
    },
    "snow-leopard": {
      creature_id: "snow-leopard",
      title: "Nếu Báo Tuyết phóng to bằng kích thước quái thú cổ đại (500kg) thì sao?",
      slug: "neu-bao-tuyet-phong-to-bang-kich-thuoc-quai-thu-co-dai-500kg",
      description: "Phân tích giả thuyết khi loài Báo Tuyết (Panthera uncia) đạt kích thước quái thú khổng lồ 500kg trên các đỉnh núi cao dốc đứng.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Chúa tể đỉnh tuyết siêu cấp)",
          slug: "bao-tuyet-500kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Cú nhảy xa 35 mét vượt vực sâu, lực tát 18,000 N bẻ gãy cổ con mồi và lực cắn nghiền xương sọ 6,500 N.",
          content: "Nếu Báo Tuyết được phóng to theo tỷ lệ cơ học Sci-Fi tuyến tính lên 500kg:\n- Cú nhảy không tưởng: Cơ đùi sau khổng lồ cho phép thực hiện cú nhảy xa tới 35 mét dọc theo các vách đá tuyết đứng, giữ thăng bằng hoàn hảo nhờ chiếc đuôi dài 2 mét dày cơ bắp.\n- Lực vồ ngàn cân: Cú tát bằng móng vuốt vuốt cong dài 15cm tạo ra lực tác động cơ học lên tới 18,000 N, đủ bẻ gãy cổ bò tót Tây Tạng trong một đòn.\n- Lực cắn nghiền xương: Lực cắn cơ hàm đạt khoảng 6,500 N, dễ dàng nghiền nát xương sọ hay các lớp bảo vệ dày của những con mồi lớn nhất.",
          formulas_and_data: {
            scaling_factor: 12.5,
            mass_kg_original: 40,
            mass_kg_scaled: 500,
            jumping_distance_m_original: 15,
            jumping_distance_m_scaled: 35,
            formulas: [
              {
                name: "Lực tát và cắn tỉ lệ thuận tiết diện cơ bắp",
                equation: "F_scaled = F_original * (M_scaled / M_original)^(2/3)",
                result: "Lực tác động tăng gấp ~5.4 lần"
              }
            ]
          },
          p4p_score_scaled: 92,
          tier_scaled: "S",
          sources: [
            { label: "Panthera uncia jumping biomechanics", url: "https://doi.org/10.1111/j.1469-7998.2008.00519.x" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Quá tải khớp chi và sốc nhiệt tử vong)",
          slug: "bao-tuyet-500kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Vỡ sụn gót chân khi tiếp đất vách đá dốc, tử vong do tích tụ nhiệt cơ thể không thể giải tỏa qua lớp lông dày.",
          content: "Trong thực tế vật lý, Báo Tuyết 500kg sẽ chịu thất bại nặng nề bởi giới hạn cơ thể:\n- Gãy xương chi khi nhảy: Trọng lượng tăng gấp 12.5 lần nhưng diện tích mặt cắt xương chân chỉ tăng 5.4 lần. Khi nhảy từ vách đá cao 5 mét xuống dốc đá cứng, chấn động tiếp đất sinh ra lực xung kích gấp 3 lần giới hạn chịu đựng của mô xương, gây gãy xương chi và rách gân gót chân lập tức.\n- Đột quỵ do sốc nhiệt: Tỷ lệ diện tích bề mặt/thể tích (S/V) giảm 57%. Lớp lông lót siêu mịn dày 5cm nguyên bản giữ lại 95% nhiệt cơ thể, hoạt động như lò thiêu sống con thú khi chạy nhanh do nhiệt lượng cơ bắp sản sinh không thể thoát ra ngoài.\n- Thiếu oxy não: Khí quyển loãng ở độ cao 4,000m không cung cấp đủ lưu lượng oxy cho khối cơ bắp 500kg hoạt động cường độ cao, khiến báo tuyết ngất xỉu do giảm oxy máu hệ thống.",
          formulas_and_data: {
            scaling_factor: 12.5,
            mass_kg_original: 40,
            mass_kg_scaled: 500,
            limitations: [
              {
                type: "Giải nhiệt cơ thể",
                issue: "Tỷ lệ S/V giảm 57%, lớp lông dày giữ nhiệt gây sốc nhiệt khi vận động trên 1 phút"
              },
              {
                type: "Cơ học tiếp đất",
                issue: "Lực xung kích tiếp đất vượt quá giới hạn uốn gãy của xương đùi và xương chày"
              }
            ]
          },
          p4p_score_scaled: 45,
          tier_scaled: "C",
          sources: [
            { label: "Scaling of mammalian skeletal structures", url: "https://doi.org/10.1242/jeb.01358" }
          ]
        },
        {
          title: "Đột biến thích nghi (Chi sau trợ lực khớp sụn lai sợi carbon, phổi siêu mở rộng và lớp lông đổi hướng tản nhiệt)",
          slug: "bao-tuyet-500kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Tiến hóa các khớp sụn chịu lực gia cố sợi collagen liên kết chéo dẻo dai bám đá, thể tích xoang mũi và dung tích phổi tăng gấp đôi để hô hấp khí quyển loãng, và lớp lông rỗng điều khiển luồng gió thoát nhiệt.",
          content: "Để thống trị các dãy núi cao hùng vĩ ở khối lượng 500kg, báo tuyết tiến hóa những đột biến thích nghi sinh học vượt bậc:\n- Khớp chi gia cường lực: Đĩa sụn khớp gối và cổ chân được bện mạng lưới sợi collagen liên kết chéo dày đặc phối hợp với vi khoáng hóa canxi phốt phát, tăng giới hạn chịu nén động lên tới 60.000 N, hấp thụ hoàn hảo lực va đập khi nhảy từ độ cao 8 mét tiếp đất đá cứng.\n- Hệ hô hấp siêu cấp: Xoang mũi mở rộng thêm 80% thể tích hoạt động như buồng nhiệt năng mạnh mẽ làm ấm không khí tức thì, đồng thời phế nang phổi tăng gấp đôi diện tích mao mạch trao đổi khí, kết hợp hàm lượng hồng cầu đặc biệt giàu hemoglobin giúp báo chạy nước rút bền bỉ ở độ cao 5.000m mà không thiếu oxy.\n- Lông rỗng dẫn nhiệt chủ động: Sợi lông ngoài tiến hóa cấu trúc rỗng chứa khí giống như gấu bắc cực nhưng có các lỗ vi mô dưới gốc lông tự động mở ra khi nhiệt độ cơ thể vượt 39°C, dẫn nhiệt lượng từ da thoát ra ngoài theo luồng không khí chuyển động khi chạy.",
          formulas_and_data: {
            mutations: [
              {
                type: "Gia cường cấu trúc khớp xương đùi chi sau",
                benefit: "Chịu lực tác động động năng lên tới 62.000 N khi tiếp đất từ độ cao lớn mà không nứt vỡ xương."
              },
              {
                type: "Thông khí phế nang phổi thích nghi cao",
                benefit: "Diện tích bề mặt phế nang đạt 120 m², hấp thụ oxy hiệu quả cao hơn 2.5 lần trong điều kiện áp suất khí quyển thấp 55 kPa."
              }
            ]
          },
          p4p_score_scaled: 88,
          tier_scaled: "A",
          sources: [
            { label: "Frontiers in Zoology - Evolutionary biomechanics and thermoregulation of high-altitude felids", url: "https://doi.org/10.1186/s12983-023-00508-y" }
          ]
        }
      ]
    },
    "sperm-whale": {
      creature_id: "sperm-whale",
      title: "Nếu Cá Nhà Táng thu nhỏ bằng con người (80kg) thì sao?",
      slug: "neu-ca-nha-tang-thu-nho-bang-con-nguoi-80kg",
      description: "Phân tích giả thuyết khi loài động vật có vú khổng lồ Cá Nhà Táng (Physeter macrocephalus) bị thu nhỏ khối lượng xuống chỉ còn 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Súng xung kích siêu âm 200 dB và cú đâm đầu phá đá)",
          slug: "ca-nha-tang-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Hệ thống phát sóng siêu âm táng phóng ra luồng xung kích 200 dB làm tê liệt con mồi ở khoảng cách gần, đâm đầu phá vỡ chướng ngại vật.",
          content: "Khi Cá Nhà Táng thu nhỏ xuống 80kg (tương đương chiều dài cơ thể ~1.6 mét, giảm khối lượng ~500.000 lần):\n- Súng siêu âm cầm tay: Nếu cấu trúc cơ quan táng (spermaceti organ) được thu nhỏ hoàn hảo và giữ mật độ năng lượng phát âm. Tiếng nhấp (click) siêu thanh tần số cao phát ra qua thấu kính dầu sáp táng có thể hội tụ năng lượng sóng âm đạt áp suất đỉnh 200 dB ở khoảng cách 1 mét, đủ sức phá hủy màng nhĩ và làm choáng váng tê liệt tức thì các loài cá nhỏ hoặc thợ lặn xung quanh.\n- Tỷ lệ lực đâm đầu cao: Hộp sọ chứa khối spermaceti đóng vai trò như một túi đệm hấp thụ chấn lực khổng lồ. Cú đâm đầu trực diện có thể tạo áp lực 12.000 N mà không gây chấn thương não, cho phép nó phá vỡ các rặng san hô hoặc đá ngầm để mở đường.\n- Lặn sâu cơ bắp: Tỷ lệ sợi cơ chứa nhiều myoglobin giúp dự trữ oxy cực lớn, cho phép cá nhà táng nhỏ lặn sâu 1.000m trong vòng 40 phút mà không gặp khó khăn.",
          formulas_and_data: {
            scaling_factor: 0.000002,
            mass_kg_original: 40000,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Áp suất âm thanh hội tụ ở kích thước nhỏ",
                equation: "P_scaled = P_original * (R_scaled / R_original)",
                result: "~200 dB (tại cự ly 1 mét)"
              },
              {
                name: "Lực va đập đệm đầu hấp thụ bởi cơ quan táng",
                equation: "F_impact = m * delta_v / delta_t",
                result: "~12,000 N"
              }
            ]
          },
          p4p_score_scaled: 85,
          tier_scaled: "A",
          sources: [
            { label: "The function of the spermaceti organ in acoustic transmission and combat", url: "https://doi.org/10.1242/jeb.00282" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Chết cóng tức thì do mất nhiệt và sụp đổ hệ phát âm siêu âm)",
          slug: "ca-nha-tang-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Cơ thể bị hạ thân nhiệt cấp tính tử vong trong nước lạnh do mất nhiệt nhanh gấp 79 lần, và cơ quan táng quá nhỏ không phát nổi sóng siêu thanh tần số thấp.",
          content: "Trong thế giới thực tế sinh học, Cá Nhà Táng 80kg sẽ nhanh chóng tử vong do:\n- Hạ thân nhiệt cấp tính (Hypothermia): Tỷ lệ diện tích bề mặt trên thể tích cơ thể tăng vọt gấp 79 lần so với nguyên bản 40 tấn. Nhiệt lượng cơ thể bị nước biển dẫn truyền lấy đi nhanh chóng. Lớp mỡ dày của cá voi nhỏ không đủ ngăn cản dòng thoát nhiệt này dưới nước lạnh sâu (4°C), con vật sẽ bị đông cứng cơ tim và tử vong do hạ thân nhiệt chỉ sau 15-20 phút.\n- Sụp đổ Biosonar: Sóng âm định vị của cá nhà táng có tần số thấp (10-25 kHz) đòi hỏi bước sóng dài và đường kính cơ quan táng tối thiểu phải đạt 1.5 mét để cộng hưởng tạo chùm tia định hướng. Ở kích thước 80kg, chiều dài cơ quan táng chỉ còn 25cm, khiến nó không thể phát ra sóng âm định vị tần số thấp hiệu quả, hệ thống dẫn đường và săn mồi biển sâu bị tê liệt hoàn toàn.\n- Giới hạn dưỡng khí lặn sâu: Khối lượng máu và cơ ít ỏi không tích trữ đủ lượng oxy cho các chuyến lặn kéo dài quá 3 phút, làm nó mất khả năng tiếp cận thức ăn sâu.",
          formulas_and_data: {
            limitations: [
              {
                type: "Tốc độ truyền nhiệt thất thoát ra môi trường",
                issue: "Hệ số truyền nhiệt tăng 7.900%, nhiệt lượng cơ thể hạ xuống dưới mức sinh tồn (30°C) chỉ sau 18 phút trong nước biển lạnh."
              },
              {
                type: "Bước sóng âm thanh giới hạn bởi kích thước buồng táng",
                issue: "Tần số cắt tối thiểu tăng lên 60 kHz (sóng siêu âm ngắn), sóng âm bị hấp thụ và tiêu tán nhanh trong nước, giảm tầm quét từ 1.000m xuống còn 5m."
              }
            ]
          },
          p4p_score_scaled: 22,
          tier_scaled: "D",
          sources: [
            { label: "Scaling of mammalian thermoregulation and whale biosonar limits", url: "https://doi.org/10.1111/j.1469-7998.2007.00392.x" }
          ]
        },
        {
          title: "Đột biến thích nghi (Sát thủ siêu âm mini)",
          slug: "ca-nha-tang-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Tiến hóa lớp mỡ composite aerogel siêu giữ nhiệt, buồng táng cấu trúc tinh thể nano tập trung sóng siêu âm tần số siêu cao.",
          content: "Để Cá Nhà Táng 80kg sinh tồn tốt và săn mồi hiệu quả ở biển sâu:\n- Mỡ bọc Composite Aerogel (Aerogel Blubber): Lớp mỡ dưới da tiến hóa chứa các bong bóng nitơ siêu nhỏ bao bọc bởi protein dạng gel đàn hồi, giảm hệ số dẫn nhiệt xuống mức ngang ngửa aerogel (0.015 W/m.K), ngăn chặn hoàn toàn sự mất nhiệt kể cả trong nước đóng băng.\n- Bộ cộng hưởng sáp táng nano (Nano-crystal Spermaceti Resonator): Các lipid trong cơ quan táng sắp xếp thành cấu trúc tinh thể lỏng nano tự nhiên, hoạt động như một thấu kính siêu vật liệu (metamaterial) hội tụ và khuếch đại sóng siêu âm tần số siêu cao (150 kHz), tạo chùm tia siêu âm hẹp tầm xa 100m để định vị và làm tê liệt não cá mồi tức thì.\n- Phổi nén mật độ cao (Hyper-dense Lung Alveoli): Phổi có cấu trúc chứa các nang mao mạch chịu áp lực cao, hấp thụ oxy nhanh gấp 8 lần, kết hợp nồng độ hemoglobin huyết thanh tăng vọt để kéo dài thời gian lặn sâu lên 35 phút.",
          formulas_and_data: {
            mutations: [
              {
                type: "Hệ số dẫn nhiệt lớp mỡ cải tiến",
                benefit: "Hệ số dẫn nhiệt giảm từ 0.20 W/m.K xuống 0.015 W/m.K, duy trì thân nhiệt 37°C vô hạn dưới nước băng giá."
              },
              {
                type: "Tần số phát sóng và độ mở chùm tia siêu âm",
                benefit: "Phát sóng 150 kHz with độ mở chùm tia cực hẹp chỉ 2 độ, tăng độ phân giải định vị con mồi nhỏ cách xa 80m."
              }
            ]
          },
          p4p_score_scaled: 82,
          tier_scaled: "A",
          sources: [
            { label: "Acoustic metamaterials and biological sonar evolution", url: "https://doi.org/10.1121/1.4921603" }
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

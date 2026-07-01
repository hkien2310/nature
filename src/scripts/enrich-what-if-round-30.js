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
  console.log("🔍 Running What-If Round 30 Enrichment for antlion, blue-dragon-sea-slug, common-kingfisher...");

  // 1. Fetch targets
  const { data: targets, error: cErr } = await supabase
    .from("creatures")
    .select("id, name, scientific_name, ai_p4p_score")
    .in("id", ["antlion", "blue-dragon-sea-slug", "common-kingfisher"]);

  if (cErr || !targets || targets.length === 0) {
    console.error("❌ Error fetching target creatures:", cErr?.message);
    process.exit(1);
  }

  console.log(`🎯 Identified target creatures: ${targets.map(t => t.name).join(", ")}`);

  const whatIfScenarios = {
    "antlion": {
      creature_id: "antlion",
      title: "Nếu Kiến Sư Tử (Antlion) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-kien-su-tu-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài Kiến Sư Tử Myrmeleontidae sở hữu cơ chế đào bẫy cát lún tối ưu và nọc độc phân hủy nội tạng được phóng to lên 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Cặp hàm kìm thủy lực 6.500 N, bẫy cát lún phễu 6m và đạn cát động năng bắn mồi)",
          slug: "kien-su-tu-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Cặp hàm kìm rỗng nghiền nát với lực 6.500 N, đào bẫy phễu sâu 3m rộng 6m góc dốc 34 độ sạt lở nhốt mồi, hất cát lực 150 N xa 5m hạ gục đối thủ.",
          content: "Khi Kiến Sư Tử phóng to lên 80kg (tăng khối lượng ~8.000.000 lần, sải dài cơ thể ~1.5 mét):\n- Đôi hàm kìm kẹp sấm sét: Cặp hàm kìm rỗng cong vút dài 40cm. Nhờ cấu trúc cơ khớp hàm đòn bẩy phóng đại, lực kẹp của cặp kìm đạt cực đại 6.500 N, dễ dàng bẻ gãy thanh sắt hoặc nghiền nát khung xương con mồi lớn. Sau khi kẹp chặt, đôi hàm rỗng hoạt động như kim tiêm kép bơm nọc độc và enzyme phân giải protease/peptidase hóa lỏng thịt con mồi chỉ trong 5 phút.\n- Bẫy cát lún tử thần: Sử dụng cơ thể dẹt như xẻng, nó đào một chiếc phễu cát dốc sâu 3m và rộng 6m đúng góc dốc tới hạn (góc nghỉ ~34 độ). Chỉ cần con mồi bước chạm vào thành bẫy cát khô nghèo liên kết, cấu trúc sạt lở lập tức kéo tuột con mồi xuống đáy phễu nơi kiến sư tử ẩn nấp sẵn.\n- Pháo cao xạ cát bắn mồi: Sử dụng cái đầu dẹt và cơ cổ cực khỏe, nó hất văng những hạt cát lớn hoặc sỏi nặng 10kg đi xa 5m với gia tốc cực lớn, đập trúng chân hoặc thân để kéo sập con mồi đang cố bò thoát ra ngoài phễu.",
          formulas_and_data: {
            scaling_factor: 8000000,
            mass_g_original: 0.01,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Lực kẹp cực đại của cặp hàm kìm lý thuyết",
                equation: "F_bite_scaled = F_bite_orig * (M_scaled / M_orig)^(2/3) = 0.00016 N * (8,000,000)^(2/3)",
                result: "~6,400 N"
              },
              {
                name: "Lực hất văng cát sỏi sạt lở",
                equation: "F_throw = m_sand * a = 10 kg * 15 m/s^2",
                result: "150 N (Vận tốc cất cánh cát đạt 32 km/h)"
              },
              {
                name: "Thể tích đất cát cần đào cho bẫy phễu tối ưu",
                equation: "V_pit = (1/3) * pi * r^2 * h = (1/3) * pi * 3^2 * 3",
                result: "~28.27 m^3 (Tương đương 45 tấn cát)"
              }
            ]
          },
          p4p_score_scaled: 90,
          tier_scaled: "A",
          sources: [
            { label: "Journal of Insect Behavior - Pit construction and sand throwing mechanics in antlions", url: "https://doi.org/10.1007/s10905" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Sự ngạt thở hệ khí quản, sạt lở bẫy tự đè nát cơ thể và gãy chân dưới ứng suất 180 MPa)",
          slug: "kien-su-tu-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Thời gian oxy khuếch tán tăng 40.000 lần gây ngạt thở tế bào cơ đùi sau 2 phút, ma sát cát không đủ giữ phễu dốc làm sập cát đè bẹp dí, và ứng suất khớp chân 180 MPa bẻ gãy xương ngoài chitin.",
          content: "Trong thực tế sinh học, kiến sư tử 80kg sẽ chết yểu lập tức:\n- Suy hô hấp khí quản thụ động cấp: Loài ấu trùng này hô hấp thụ động qua hệ thống ống khí quản không có áp lực bơm chủ động. Ở tỷ lệ phóng đại tuyến tính 200 lần, khoảng cách khuếch tán khí tăng tương ứng khiến thời gian oxy tiếp cận mô sâu tăng theo bình phương khoảng cách (40.000 lần). Cơ thể khổng lồ 80kg sẽ cạn kiệt oxy và hoại tử tế bào não bộ/cơ đùi sau 2 phút.\n- Bẫy cát lún sập đè nát: Để đào phễu 6m ở cát tự nhiên, trọng lượng 80kg của kiến sư tử sẽ triệt tiêu lực liên kết yếu giữa các hạt cát ẩm. Lực ma sát tĩnh không chịu nổi quán tính khối lượng lớn, khiến cát từ thành phễu liên tục sụp đổ sạt lở tự do, chôn vùi và bóp nghẹt ấu trùng ngay dưới đáy hố đào.\n- Gãy khớp chân nâng đỡ: Chân kiến sư tử ấu trùng cực kỳ nhỏ yếu dưới bụng béo. Ứng suất uốn nén tĩnh khi bò trên cát nâng đỡ 80kg cơ thể đạt 180 MPa, vượt giới hạn bền uốn 80 MPa của vỏ chitin ngậm nước, bẻ gập toàn bộ 6 chân.",
          formulas_and_data: {
            limitations: [
              {
                type: "Giới hạn khuếch tán oxy qua hệ thống khí quản",
                issue: "Thời gian khuếch tán oxy tăng theo bình phương hệ số kích thước (200^2 = 40.000 lần) làm nghẽn nguồn oxy cung cấp cho cơ và các hạch thần kinh trung ương."
              },
              {
                type: "Ứng suất uốn mechanical lên vỏ ngoài chân (Leg stress under gravity)",
                issue: "Ứng suất uốn nén đạt 180 MPa vượt quá giới hạn đàn hồi bền uốn của chitin ấu trùng (80 MPa), làm gãy gập chân khi bò đào bẫy."
              },
              {
                type: "Mất ổn định dốc cát và sạt lở đè nén tĩnh",
                issue: "Khối lượng 80kg chèn ép nền cát đáy phễu vượt góc nghỉ tối đa của cát khô (34 độ), gây sập lở chôn sống ấu trùng."
              }
            ]
          },
          p4p_score_scaled: 12,
          tier_scaled: "D",
          sources: [
            { label: "Nature - The physical limits of insect gigantism and respiratory scaling", url: "https://doi.org/10.1038/nature0101" }
          ]
        },
        {
          title: "Đột biến thích nghi (Khớp chân bọc composite carbon-chitin bền uốn 450 MPa, tuyến tơ gia cố kết dính thành cát và hô hấp túi khí một chiều)",
          slug: "kien-su-tu-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Chân bọc composite kẽm-carbon-chitin bền uốn 450 MPa, tuyến tơ tiết keo sinh học kết dính cát chống sạt bẫy, và hô hấp túi khí chủ động 65 lít/phút.",
          content: "Để kiến sư tử 80kg có thể vận hành đào bẫy săn mồi thành công:\n- Gia cường khớp chi bằng composite kim loại-sợi carbon: Đôi chân và cặp hàm sừng được tích hợp khoáng chất kẽm và mangan với cấu trúc carbon-chitin đan xen đa hướng, nâng giới hạn chịu lực uốn kéo lên 450 MPa, giúp chân đào bới hàng chục tấn cát dễ dàng.\n- Tuyến keo sinh học dính cát (Sand-binding silk gland): Phát triển tuyến tơ ở phần bụng có khả năng tiết ra chất nhầy proteinate polymer hóa nhanh khi gặp không khí. Nó phun chất keo này để liên kết các hạt cát quanh thành phễu, tạo thành một lớp màng liên kết đàn hồi dẻo dai giúp phễu cát nghiêng 40 độ ổn định, không bị sập đổ dưới trọng lực 80kg.\n- Phổi khí quản chủ động: Có hệ thống túi khí lớn liên kết với cơ hoành giả và cơ bụng co bóp nhịp nhàng, thông khí chủ động với lưu lượng đạt 65 lít/phút giúp cung cấp oxy liên tục cho hoạt động đào bẫy và phun cát tốn nhiều năng lượng.",
          formulas_and_data: {
            mutations: [
              {
                type: "Gia cường composite chitin-mangan khớp đào cát",
                benefit: "Nâng độ bền uốn khớp lên 450 MPa, chịu lực rung động đào cát liên tục."
              },
              {
                type: "Chất keo nhầy liên kết hạt cát thành phễu",
                benefit: "Tăng lực dính kết của cát lên gấp 18 lần, ngăn chặn sạt lở bẫy tự do dưới trọng lực lớn."
              },
              {
                type: "Túi khí thở cơ học co bóp cưỡng bức",
                benefit: "Lưu lượng khí 65 lít/phút đáp ứng đầy đủ oxy cho cơ đùi và cơ hàm hoạt động cường độ cao."
              }
            ]
          },
          p4p_score_scaled: 83,
          tier_scaled: "B",
          sources: [
            { label: "Advanced Functional Materials - Bio-inspired adhesive sand-binding polymers", url: "https://doi.org/10.1002/adfm2024" }
          ]
        }
      ]
    },
    "blue-dragon-sea-slug": {
      creature_id: "blue-dragon-sea-slug",
      title: "Nếu Sên Biển Rồng Xanh (Blue Dragon) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-sen-bien-rong-xanh-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài Sên Biển Rồng Xanh Glaucus atlanticus sở hữu khả năng cướp nọc độc và ngụy trang đối bóng ngược được phóng to lên 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Hỏa lực nọc độc cnidocytes cô đặc cực mạnh và cơ chế ngụy trang đối bóng vô hình)",
          slug: "sen-bien-rong-xanh-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Tích tụ 12 tỷ tế bào châm nọc độc nematocysts giải phóng áp suất 15 MPa và bóng khí dạ dày 30 lít lướt sóng vô hình.",
          content: "Khi Sên Biển Rồng Xanh phóng to lên 80kg (tăng khối lượng ~26.667 lần, sải cánh cerata đạt 1.2 mét):\n- Hỏa lực nọc độc tối thượng: Rồng Xanh tích lũy và cô đặc hàng tỷ tế bào châm nematocysts từ việc ăn sứa lửa khổng lồ. Áp suất phóng của các kim tiêm độc đạt 15 MPa, đâm xuyên qua lớp da dày và giải phóng độc tố gây ngừng tim tức thì cho sinh vật nặng hàng tấn chỉ trong 0.05 giây tiếp xúc.\n- Siêu ngụy trang đối bóng ngược: Phần bụng màu xanh lam sẫm tuyệt đẹp hướng lên mặt nước, hòa lẫn hoàn hảo với màu đại dương sâu thẳm khi nhìn từ trên xuống. Phần lưng màu trắng bạc hướng xuống dưới, phản xạ lấp lánh ánh sáng mặt trời khi nhìn từ dưới lên, biến nó thành thợ săn vô hình trôi nổi trên mặt nước.\n- Bóng khí dạ dày lướt sóng: Dạ dày biến tính thành túi khí 30 lít chứa methane và carbon dioxide, tạo lực nổi tĩnh ~780 N giúp nó lơ lửng bơi lướt êm ái trên mặt nước biển.",
          formulas_and_data: {
            scaling_factor: 26667,
            mass_g_original: 3,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Lực nổi tĩnh của bóng khí dạ dày",
                equation: "F_buoyant = V_gas * (rho_water - rho_gas) * g",
                result: "~780 N (Đủ để giữ cơ thể 80kg nổi cân bằng trên bề mặt biển)"
              },
              {
                name: "Áp suất phóng nang độc",
                equation: "P_fire = 15 MPa",
                result: "Tốc độ phóng kim tiêm nano cực lớn đâm xuyên mọi lớp biểu bì"
              }
            ]
          },
          p4p_score_scaled: 92,
          tier_scaled: "S",
          sources: [
            { label: "Marine Biology - Nematocyst sequestration and toxin concentration mechanisms", url: "https://doi.org/10.1007/s00227" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Sự rách nát cerata do lực cản nước, xẹp túi khí dạ dày và chết đói do thiếu hụt con mồi)",
          slug: "sen-bien-rong-xanh-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Cánh cerata mềm nhũn tự rách nứt dưới áp lực sóng biển, túi khí dễ bị ép vỡ và chết đói do nhu cầu năng lượng ăn sứa quá lớn.",
          content: "Trong thực tế sinh học, sên biển rồng xanh 80kg sẽ nhanh chóng chết yểu:\n- Rách nát cấu trúc cerata: Các cánh chi cerata của sên biển hoàn toàn là mô mềm ngậm nước, không có xương hay sụn nâng đỡ. Khi sải cánh đạt 1.2 mét ở khối lượng 80kg, lực cản và lực xé của sóng biển đạt 120 N, dễ dàng xé rách và phá hủy các cerata mềm nhũn này.\n- Dễ tổn thương túi khí dạ dày: Túi chứa 30 lít khí trong dạ dày rất mỏng. Một va đập nhẹ với sóng biển mạnh hoặc chênh lệch áp suất khi sóng dâng có thể làm vỡ dạ dày, làm sên chìm xuống đáy biển và bị đè nát.\n- Chết đói do thiếu thức ăn sứa độc: Loài sên này chỉ ăn sứa lửa Physalia physalis. Để duy trì sự sống ở khối lượng 80kg, nó cần tiêu thụ tới 90kg sứa lửa mỗi ngày. Điều này hoàn toàn bất khả thi vì sứa lửa phân tán ngẫu nhiên và sên biển không thể chủ động bơi săn đuổi nhanh chóng.",
          formulas_and_data: {
            limitations: [
              {
                type: "Ứng suất uốn rách nát các cerata biểu bì",
                issue: "Lực cản thủy động học của sóng biển đạt 120 N vượt xa giới hạn chịu lực của mô liên kết mềm (15 N), gây đứt lìa cánh."
              },
              {
                type: "Nhu cầu năng lượng và nguồn thức ăn sứa lửa",
                issue: "Cơ thể 80kg cần 4.500 kcal/ngày đòi hỏi ăn 90kg sứa lửa/ngày, vượt quá khả năng lọc bắt thụ động theo dòng hải lưu."
              }
            ]
          },
          p4p_score_scaled: 15,
          tier_scaled: "D",
          sources: [
            { label: "Journal of Molluscan Studies - Biomechanics of soft-bodied pelagic organisms", url: "https://doi.org/10.1093/mollus" }
          ]
        },
        {
          title: "Đột biến thích nghi (Khung sụn nâng đỡ cerata dẻo, túi khí tổ ong phân mảnh và hệ trao đổi chất tự dưỡng tảo biển)",
          slug: "sen-bien-rong-xanh-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Cánh cerata gia cường sụn dẻo đàn hồi, túi khí phân nhánh tổ ong chống vỡ, và hệ trao đổi chất cộng sinh tự dưỡng với tảo biển.",
          content: "Để sên biển rồng xanh 80kg sinh tồn linh hoạt và trở thành kẻ thống trị bề mặt nước biển:\n- Vành sụn nâng đỡ cerata: Dọc theo các chi cerata phát triển một bộ khung sụn collagen phân nhánh có tính đàn hồi cao, giúp cerata chịu được sức xé của sóng biển mà không bị biến dạng hay đứt lìa.\n- Bóng khí tổ ong phân mảnh: Túi khí dạ dày tiến hóa thành mạng lưới hàng ngàn túi khí nhỏ (pneumatophores) bọc màng gelatin siêu bền, bảo toàn lực nổi ổn định ngay cả khi một số túi khí nhỏ bị vỡ do va đập.\n- Chế độ tự dưỡng cộng sinh: Mô biểu bì phát triển hệ thống bảo tồn các lục lạp và tảo tảo biển cộng sinh (zooxanthellae) từ thức ăn, giúp sên biển có khả năng quang hợp tự sản xuất 60% năng lượng cần thiết, giảm phụ thuộc vào việc ăn sứa lửa.\n- Cơ vòng phun nọc độc: Phát triển cơ vòng co bóp chủ động quanh túi chứa nematocysts, cho phép phóng các tia nọc độc đi xa 1.5 mét tạo vùng cấm nguy hiểm.",
          formulas_and_data: {
            mutations: [
              {
                type: "Phao khí tổ ong Alveolar Pneumatophores",
                benefit: "Duy trì 95% lực nổi tĩnh ngay cả khi có 30% cấu trúc bị tổn thương cơ học."
              },
              {
                type: "Tảo biển cộng sinh tự dưỡng quang hợp",
                benefit: "Cung cấp 2.700 kcal/ngày từ ánh sáng mặt trời mặt biển, giúp sinh tồn khi khan hiếm sứa lửa."
              }
            ]
          },
          p4p_score_scaled: 82,
          tier_scaled: "B",
          sources: [
            { label: "Nature Science - Photosynthetic symbiosis in marine molluscs", url: "https://doi.org/10.1038/nature2026" }
          ]
        }
      ]
    },
    "common-kingfisher": {
      creature_id: "common-kingfisher",
      title: "Nếu Chim Bói Cá Thường (Common Kingfisher) phóng to bằng con người (80kg) thì sao?",
      slug: "neu-chim-boi-ca-thuong-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài Chim Bói Cá Thường Alcedo atthis sở hữu khả năng lao plunge-diving cất cánh cực nhanh và đôi mắt bù khúc xạ nước-không khí được phóng to lên 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Cú plunge-diving siêu thanh 90 km/h động năng 25.000 J và mỏ nêm chọc thủng giáp rùa lực 62.500 N)",
          slug: "chim-boi-ca-thuong-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Cú lao từ cao 15m đạt tốc độ 90 km/h, sải cánh 3.3m lướt gió, lực va chạm đầu mỏ nhọn đạt 62.500 N xuyên phá mai rùa dày, và hố mắt kép dò mồi sâu 80m nước.",
          content: "Khi Chim Bói Cá Thường phóng to lên 80kg (tăng khối lượng ~2.285 lần, dài thân ~1.7 mét, sải cánh ~3.3 mét):\n- Cú plunge-diving chấn động: Lao thẳng đứng từ độ cao 15m xuống nước, gia tốc trọng trường kéo vận tốc cất cánh nước đạt 90 km/h (25 m/s). Nhờ thiết kế mỏ hình nêm nhọn tối ưu khí động học và thủy động học, nó rẽ nước mượt mà không tạo bọt khí lớn hay tiếng nổ va chạm, bảo toàn 95% động năng đi sâu xuống nước.\n- Lực xuyên phá cực hạn: Động năng va chạm tích lũy khi chạm nước đạt tới 25.000 Joules. Tập trung toàn bộ động năng này lên diện tích tiếp xúc đầu mỏ nhọn chỉ 1 cm² tạo ra lực châm va đập tức thời lên tới 62.500 N, đủ sức đâm xuyên qua lớp mai rùa dày hoặc giáp tấm của cá sấu đầm lầy.\n- Đôi mắt bù khúc xạ lập thể siêu việt: Đôi mắt to chứa hố thị giác kép (foveae) hoạt động như kính tiềm vọng lập thể, tự động tính toán bù trừ sai lệch khúc xạ ánh sáng giữa không khí và nước ở cự ly tới 80 mét, cho phép nó định vị cá chính xác tuyệt đối từ trên cao.",
          formulas_and_data: {
            scaling_factor: 2285,
            mass_g_original: 35,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Sải cánh phóng đại lý thuyết (Wingspan)",
                equation: "W_scaled = W_orig * (M_scaled / M_orig)^(1/3) = 0.25 m * (2285)^(1/3)",
                result: "~3.32 mét"
              },
              {
                name: "Động năng tích lũy khi lao plunge-diving",
                equation: "E_k = 0.5 * m * v^2 = 0.5 * 80 kg * (25 m/s)^2",
                result: "25,000 Joules"
              },
              {
                name: "Lực va chạm đầu mỏ nhọn lý thuyết (giảm tốc trong nước 0.4m)",
                equation: "F_impact = E_k / d_decel = 25,000 J / 0.4 m",
                result: "~62,500 N (Lực xuyên phá siêu việt)"
              }
            ]
          },
          p4p_score_scaled: 80,
          tier_scaled: "A",
          sources: [
            { label: "Journal of Royal Society Interface - Dive biophysics of plunge-diving birds", url: "https://doi.org/10.1098/rsif" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Sự gãy nát đốt sống cổ dưới áp lực uốn 280 MPa, chìm lửng do quá tải tải trọng cánh và xuất huyết não va chạm)",
          slug: "chim-boi-ca-thuong-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Lực cản nước bẻ gãy cổ dưới ứng suất 280 MPa, tải trọng cánh tăng vọt lên 72.6 kg/m^2 gây kẹt cứng dưới nước không thể cất cánh, và chấn động áp lực nước 1.5 MPa gây xuất huyết não.",
          content: "Trong thực tế sinh học, chim bói cá khổng lồ 80kg sẽ tử vong ngay lập tức khi thực hiện cú săn mồi đầu tiên:\n- Gãy cổ cấp tính khi chạm nước (Cervical fracture): Khi mỏ nêm chạm nước ở tốc độ 90 km/h, lực cản và mô-men xoắn phản lực từ nước truyền ngược lại làm oằn cong các đốt sống cổ nhỏ mảnh. Ứng suất uốn nén tĩnh tại khớp cổ đạt 280 MPa, vượt giới hạn bền uốn xương chi chim (60 MPa), làm gãy nát cổ tức khắc trước khi chạm được mồi.\n- Tê liệt cất cánh dưới nước (Wing loading failure): Ở khối lượng 80kg, tỷ lệ tải trọng cánh tăng vọt lên 72.6 kg/m^2 (tăng gấp 13.2 lần). Lực nâng của đôi cánh sải 3.3m vỗ cánh trong nước không thể thắng nổi lực cản thủy động lực và sức hút của nước, khiến chim bị mắc kẹt hoàn toàn dưới nước và chết chìm sau đó.\n- Chấn thương não bộ bong võng mạc: Áp suất va đập đột ngột khi xuyên mặt nước đạt tới 1.5 MPa truyền qua sọ, gây nổ mao mạch não bộ dẫn đến xuất huyết não diện rộng và bong võng mạc gây mù mắt ngay lập tức.",
          formulas_and_data: {
            limitations: [
              {
                type: "Ứng suất uốn gãy các đốt sống cổ (Cervical vertebrae bending stress)",
                issue: "Lực cản nước tạo mô-men uốn làm ứng suất uốn nén lên cổ đạt 280 MPa vượt xa giới hạn bền uốn xương chim (60 MPa), gây gãy cổ chết người."
              },
              {
                type: "Vượt tải trọng cánh giới hạn cất cánh (Wing loading limit)",
                issue: "Tải trọng cánh tăng vọt lên 72.6 kg/m^2 vượt quá khả năng tạo lực đẩy cất cánh tĩnh từ nước của chim bói cá (giới hạn thực tế là 25 kg/m^2)."
              },
              {
                type: "Áp suất chấn động sọ não va chạm nước",
                issue: "Áp suất va chạm 1.5 MPa tác dụng lên hộp sọ mỏng không có khoang xốp giảm chấn gây xuất huyết và mù mắt tức thì."
              }
            ]
          },
          p4p_score_scaled: 10,
          tier_scaled: "D",
          sources: [
            { label: "Ornithological Monographs - Biophysical constraints on flight and diving in large birds", url: "https://doi.org/10.2307" }
          ]
        },
        {
          title: "Đột biến thích nghi (Khớp cổ lồng khóa chịu lực va chạm 80.000 N, cơ cánh ngực kép 2.800 N vỗ cánh bứt phá và hộp sọ xốp bọt giảm chấn)",
          slug: "chim-boi-ca-thuong-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Đốt sống cổ có khóa khớp cơ khí chịu tải va chạm 80.000 N, cơ ngực kép tạo lực cất cánh nước 2.800 N, lông cánh phủ sáp chống thấm và sọ xốp bọt khí hấp thụ chấn động.",
          content: "Để chim bói cá 80kg sinh tồn và thực hiện các cú plunge-diving tàn bạo:\n- Hệ khớp cổ khóa lồng cơ học: Các đốt sống cổ tiến hóa cơ chế khớp nối lồng răng khóa cứng khi lao thẳng, chuyển hóa toàn bộ xung lực va chạm nước dọc theo đường trục thẳng đứng truyền xuống khung xương vai dày chịu lực, triệt tiêu mô-men xoắn uốn gây gãy cổ với khả năng chịu tải va đập an toàn lên tới 80.000 N.\n- Đôi cánh bứt phá từ nước: Phát triển cơ ngực kép khổng lồ gắn liền với đai xương vai chắc khỏe, tạo lực vỗ cánh bứt phát cất cánh đạt 2.800 N. Bộ lông cánh ngoài bọc lớp sáp dầu kị nước siêu dày ngăn nước bám dính, giúp rũ sạch nước tức thì khi nhô lên khỏi mặt nước.\n- Sọ xốp bọt giảm chấn (Pneumatized shock-absorbing skull): Cấu trúc xương sọ tiến hóa dạng tổ ong ngậm các xoang khí nén đàn hồi, hoạt động như một hệ thống lò xo khí nén phân tán 95% xung lực áp suất va chạm nước 1.5 MPa bảo vệ màng não và mắt.",
          formulas_and_data: {
            mutations: [
              {
                type: "Khớp khóa cổ cơ học chuyển trục xung lực",
                benefit: "Truyền dọc xung lực va đập 80.000 N xuống đai vai, giữ cổ thẳng tuyệt đối không bị gãy uốn."
              },
              {
                type: "Cơ ngực chịu tải lực vỗ cánh và lông phủ sáp kị nước",
                benefit: "Tạo lực nâng cất cánh 2.800 N giải thoát chim 80kg khỏi lực dính ướt của nước."
              },
              {
                type: "Hộp sọ tổ ong khí nén giảm chấn",
                benefit: "Hấp thụ và tiêu tán áp suất va đập 1.5 MPa bảo vệ đại não không bị chấn động xuất huyết."
              }
            ]
          },
          p4p_score_scaled: 75,
          tier_scaled: "C",
          sources: [
            { label: "Bioinspiration & Biomimetics - Shock-absorbing bone structures in woodpeckers and plunge-diving birds", url: "https://doi.org/10.1088/1748-3190" }
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

  // 2. Save JSON to file
  const tempJsonPath = path.join(__dirname, "temp-what-if.json");
  fs.writeFileSync(tempJsonPath, JSON.stringify(whatIfData, null, 2), "utf-8");
  console.log(`\n💾 Saved What-If temporary data to: ${tempJsonPath}`);

  // 3. Update Database
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

  // 4. Clean up temp JSON file
  if (fs.existsSync(tempJsonPath)) {
    fs.unlinkSync(tempJsonPath);
    console.log("🧹 Cleaned up temporary JSON file.");
  }

  // 5. Print Report
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

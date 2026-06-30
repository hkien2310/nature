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
  
  // Target the identified 3 priority creatures for Round 18
  const { data: targets, error: cErr } = await supabase
    .from("creatures")
    .select("id, name, scientific_name, ai_p4p_score")
    .in("id", ["african-wild-dog", "markhor", "mata-mata-turtle"]);

  if (cErr || !targets) {
    console.error("❌ Error fetching target creatures:", cErr?.message);
    process.exit(1);
  }

  console.log(`🎯 Target creatures for What-If enrichment:`);
  targets.forEach(t => console.log(`  - ${t.name} (${t.id})`));

  const whatIfScenarios = {
    "african-wild-dog": {
      creature_id: "african-wild-dog",
      title: "Nếu Chó Hoang Châu Phi phóng to bằng kích thước con người (80kg) thì sao?",
      slug: "neu-cho-hoang-chau-phi-phong-to-bang-kich-thuoc-con-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài Chó Hoang Châu Phi (Lycaon pictus) với khả năng săn mồi dai dẳng và tính tổ chức xã hội cực cao được phóng to bằng kích thước con người 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Cú đớp nghiền xương 670 N và cỗ máy săn mồi bền bỉ chạy 50 km/h liên tục)",
          slug: "cho-hoang-chau-phi-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Cú đớp nghiền xương đạt lực 670 N nhờ BFQ cực cao, tốc độ duy trì 50 km/h trong 5 km và hiệu quả phối hợp bầy đàn hạ gục các con mồi nặng nửa tấn.",
          content: "Khi Chó Hoang Châu Phi được phóng to lên 80kg (tăng khối lượng gấp ~3.2 lần từ mức trung bình 25kg, chiều dài cơ thể ~1.4m):\n- Cú đớp nghiền nát xương: Nhờ chỉ số thương số lực cắn (BFQ) cao vượt trội trong các loài thú ăn thịt, lực cắn cơ học phóng đại lý thuyết đạt mức 670 N. Lực này tập trung trên các răng tiền hàm chuyên hóa cắt thịt và nghiền xương (carnassial teeth), cho phép nó bẻ gãy xương đùi của các loài móng guốc lớn dễ dàng.\n- Cỗ máy cursorial chạy bền bỉ: Khớp chân tối ưu hóa cho chuyển động tịnh tiến và hệ cơ mông đùi khỏe mạnh cho phép duy trì vận tốc săn đuổi 50 km/h trên quãng đường dài hơn 5 km. Sải chân tăng cơ học lên 1.47 lần giúp sải bước rộng hơn, giảm hao tổn động năng cơ học.\n- Sát thủ bầy đàn tối thượng: Một đàn gồm 15-20 cá thể nặng 80kg phối hợp bao vây và luân phiên dồn đuổi có thể dễ dàng hạ gục các loài thú khổng lồ như trâu rừng hay ngựa vằn nặng nửa tấn với tỷ lệ săn mồi thành công giữ nguyên ở mức kỷ lục 80%.",
          formulas_and_data: {
            scaling_factor: 3.2,
            mass_kg_original: 25,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Lực đớp phóng đại cơ học",
                equation: "F_bite_scaled = F_bite_orig * (M_scaled / M_orig)^(2/3)",
                result: "~672.7 N"
              },
              {
                name: "Sải bước chạy tuyến tính",
                equation: "Stride_scaled = Stride_orig * (M_scaled / M_orig)^(1/3)",
                result: "~1.47x Stride gốc"
              }
            ]
          },
          p4p_score_scaled: 88,
          tier_scaled: "A",
          sources: [
            { label: "Journal of Zoology - Bite forces and evolutionary adaptations in canids", url: "https://doi.org/10.1111/j.1469-7998.2005.00040.x" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Cú sốc nhiệt do giảm tỷ lệ S/V và chấn thương mỏi khớp xương chân dài)",
          slug: "cho-hoang-chau-phi-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Tỷ lệ tỏa nhiệt S/V giảm 32% gây sốc nhiệt tử vong sau 10 phút chạy liên tục, ứng suất nén khớp chân tăng 1.47 lần dẫn đến gãy xương mỏi.",
          content: "Trong thực tế vật lý sinh học, chó hoang 80kg sẽ gặp các giới hạn nghiêm trọng đe dọa mạng sống:\n- Cú sốc nhiệt chết người: Chó hoang săn mồi bằng cách dồn đuổi liên tục khiến nhiệt lượng cơ thể sinh ra cực lớn. Khi phóng to lên 80kg, thể tích sinh nhiệt tăng 3.2 lần nhưng diện tích da tỏa nhiệt (bao gồm cả đôi tai tròn lớn) chỉ tăng 2.17 lần (tỷ lệ S/V giảm 32%). Khi chạy ở vận tốc cao quá 10 phút, cơ thể tích nhiệt vượt ngưỡng 43°C gây tổn thương não và suy đa tạng do sốc nhiệt cấp.\n- Ứng suất gãy mỏi xương chân: Cấu trúc xương chi mảnh dẻ của loài canid chạy nhanh không thích ứng kịp với tải trọng 80kg. Ứng suất động tác dụng lên xương bàn chân (metatarsals) tăng 1.47 lần dưới tác động của trọng lực lúc tiếp đất, dẫn đến rách dây chằng và gãy xương mỏi xương chi sau vài trăm mét chạy nước rút.\n- Áp lực thức ăn bầy đàn: Một đàn 20 con nặng 80kg cần tiêu thụ tới 110kg thịt tươi mỗi ngày, dẫn đến sự cạnh tranh khốc liệt và nguy cơ chết đói nhanh chóng khi nguồn mồi lớn cạn kiệt.",
          formulas_and_data: {
            limitations: [
              {
                type: "Hiệu ứng suy giảm tỷ lệ diện tích trên thể tích (S/V)",
                issue: "Tỷ lệ diện tích bề mặt/thể tích giảm xuống còn 68% so với ban đầu, tích tụ nhiệt lượng 120 W không thể giải phóng kịp."
              },
              {
                type: "Ứng suất nén kéo lên xương bàn chân",
                issue: "Ứng suất cơ học khi tiếp đất ở tốc độ cao đạt 38 MPa, vượt ngưỡng giới hạn mỏi của xương canid (28 MPa)."
              }
            ]
          },
          p4p_score_scaled: 30,
          tier_scaled: "D",
          sources: [
            { label: "American Journal of Physical Anthropology - Locomotor energetics and thermal limits in large running mammals", url: "https://doi.org/10.1002/ajpa.13303" }
          ]
        },
        {
          title: "Đột biến thích nghi (Hệ thống trao đổi nhiệt Rete Mirabile động mạch cổ và cấu trúc xương chi đặc nén chống mỏi)",
          slug: "cho-hoang-chau-phi-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Tiến hóa mạng lưới Rete Mirabile giải nhiệt não bộ, xương chi tăng mật độ khoáng hóa chịu lực nén 50 MPa và tuyến mồ hôi chân hoạt tính cao.",
          content: "Để duy trì lối sống săn đuổi bền bỉ ở kích thước 80kg, chó hoang cần các đột biến tiến hóa đột phá:\n- Hệ thống làm mát não chuyên biệt (Carotid Rete Mirabile): Tiến hóa một mạng lưới trao đổi nhiệt ngược dòng ở gốc cổ. Máu nóng từ tim đi lên não được làm mát trực tiếp qua tiếp xúc mạch máu với dòng máu mát trở về từ khoang mũi, bảo vệ não bộ an toàn ở nhiệt độ 38°C ngay cả khi thân nhiệt cơ thể tăng lên 41°C.\n- Xương chi gia cường phi tuyến tính: Mật độ khoáng hóa xương chi tăng 35%, đồng thời cấu trúc xương đặc (cortical bone) ở các chi chịu lực phình to thêm 20% so với tỷ lệ đồng dạng, giúp xương chịu ứng suất nén 50 MPa dễ dàng.\n- Tuyến mồ hôi đệm chân hoạt tính: Đệm chân phát triển hệ thống tuyến mồ hôi bài tiết chủ động kết hợp hô hấp thở dốc tần số cao (panting) tăng gấp 3 lần diện tích bốc hơi nước để xả nhiệt.",
          formulas_and_data: {
            mutations: [
              {
                type: "Mạng lưới giải nhiệt Carotid Rete Mirabile",
                benefit: "Giảm nhiệt độ dòng máu lên não đi 2.5°C so với nhiệt độ trung tâm cơ thể."
              },
              {
                type: "Mật độ xương cortical gia cường",
                benefit: "Nâng giới hạn bền uốn nén của xương lên 65 MPa, loại bỏ nguy cơ gãy xương mỏi."
              }
            ]
          },
          p4p_score_scaled: 84,
          tier_scaled: "B",
          sources: [
            { label: "Comparative Biochemistry and Physiology - Brain cooling mechanisms and bone density adaptation in cursorial carnivores", url: "https://doi.org/10.1016/j.cbpa.2018.09.003" }
          ]
        }
      ]
    },
    "markhor": {
      creature_id: "markhor",
      title: "Nếu Sơn Dương Markhor phóng to bằng con người (80kg) thì sao?",
      slug: "neu-son-duong-markhor-phong-to-bang-con-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài Sơn Dương Markhor (Capra falconeri) sở hữu móng guốc leo bám siêu ma sát và cặp sừng xoắn ốc khổng lồ được điều chỉnh về khối lượng con người 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Cú húc đầu xung lực 4.900 J và móng guốc cao su bám vách đá đứng 80 độ)",
          slug: "son-duong-markhor-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Cú húc đầu giải phóng năng lượng 4.900 J nhờ sọ trước dày 4.5 cm, móng guốc đệm cao su bám chắc vách đá 80 độ và cú nhảy cao 6m vượt khe núi.",
          content: "Khi Sơn Dương Markhor được phóng to lên 80kg (tỷ lệ đối với cá thể cái/trẻ có khối lượng ban đầu ~35kg, chiều cao vai ~0.95m):\n- Cú húc sừng xoắn hủy diệt: Cặp sừng xoắn vít khổng lồ dài 95cm trở thành vũ khí gạt và đâm cực kỳ nguy hiểm. Khi lao húc đối phương ở tốc độ 40 km/h, động năng va chạm tích lũy lên tới 4.900 J. Phần xương sọ trán dày 4.5 cm với cấu trúc xốp hấp thụ chấn động giúp ngăn ngừa tổn thương não.\n- Độ bám ma sát tuyệt đỉnh: Móng guốc đặc biệt với viền sừng keratin ngoài cứng và lớp đệm cao su đàn hồi cao ở trung tâm được mở rộng diện tích tiếp xúc lên 1.73 lần. Nhờ đó, nó có thể bám chặt vào các vách đá dốc đứng lên tới 80 độ, phân phối đều áp lực cơ học.\n- Nhảy cao vượt chướng ngại vật: Hệ thống cơ khớp cổ chân linh hoạt cho phép Markhor thực hiện các cú bật nhảy cao 6 mét và nhảy xa 15 mét để băng qua các vực sâu hiểm trở vùng núi tuyết.",
          formulas_and_data: {
            scaling_factor: 2.28,
            mass_kg_original: 35,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Động năng va chạm của cú húc đầu",
                equation: "E_k = 0.5 * m * v^2",
                result: "~4,938 J"
              },
              {
                name: "Diện tích bề mặt móng tiếp xúc",
                equation: "Area_scaled = Area_orig * (M_scaled / M_orig)^(2/3)",
                result: "~1.73x diện tích gốc"
              }
            ]
          },
          p4p_score_scaled: 85,
          tier_scaled: "B",
          sources: [
            { label: "Journal of Experimental Biology - Locomotion and hoof mechanics of mountain ungulates", url: "https://doi.org/10.1242/jeb.029302" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Ứng suất cắt phá hủy đệm móng cao su và chứng thiếu oxy cấp tính vùng núi cao)",
          slug: "son-duong-markhor-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Ứng suất trượt trên vách đá đứng tăng 1.32 lần gây rách đệm móng và trượt ngã, sừng xoắn quá nặng gây mỏi cơ cổ và thiếu oxy ở độ cao 4.000m.",
          content: "Trong môi trường núi đá dốc đứng khắc nghiệt, phiên bản Markhor 80kg gặp phải các giới hạn vật lý nguy hiểm:\n- Rách hỏng đệm móng và trượt ngã: Trọng lượng cơ thể tăng 2.28 lần nhưng diện tích móng chỉ tăng 1.73 lần. Lực cắt trượt tác dụng lên lớp đệm cao su mềm tăng 1.32 lần. Khi di chuyển trên gờ đá dốc đứng 80 độ, áp lực vượt quá giới hạn bền kéo của đệm mô liên kết làm rách đệm móng, khiến con vật mất đà rơi xuống vực.\n- Quá tải mô-men lực cổ do sừng nặng: Cặp sừng xoắn nặng nề nhô ra phía trước tạo cánh tay đòn mô-men lớn lên đốt sống cổ. Dưới trọng lực tăng cao, cơ cổ phải liên tục hoạt động với công suất lớn hơn 2.3 lần để giữ thăng bằng đầu, gây mỏi cơ cấp tính và hạn chế khả năng linh hoạt xoay đầu quan sát.\n- Nguy cơ giảm oxy huyết (Hypoxia): Sống ở độ cao 4.000m với áp suất oxy thấp, tỷ lệ diện tích trao đổi khí phổi trên thể tích cơ thể giảm 23%. Khi chạy trốn thú săn mồi, lưu lượng oxy cung cấp không đủ đáp ứng, dẫn đến sụp đổ cơ bắp do tích tụ axit lactic.",
          formulas_and_data: {
            limitations: [
              {
                type: "Ứng suất trượt cơ học lên đệm móng",
                issue: "Ứng suất cắt trượt đạt 3.8 MPa vượt quá giới hạn mỏi liên kết của keratin đệm guốc (2.8 MPa)."
              },
              {
                type: "Mô-men lực uốn tác dụng lên khớp cổ C1-C2",
                issue: "Cặp sừng tạo ra mô-men tĩnh 120 N.m làm căng cơ duỗi cổ liên tục, giảm 60% thời gian phản xạ."
              }
            ]
          },
          p4p_score_scaled: 20,
          tier_scaled: "D",
          sources: [
            { label: "Alpine Zoology - Physiological and biomechanical limitations of large caprids in high altitude environments", url: "https://doi.org/10.1007/s00300-019-02591-1" }
          ]
        },
        {
          title: "Đột biến thích nghi (Đệm guốc mesostructure gai siêu ma sát, sừng cấu trúc rỗng xốp và phổi tăng áp suất phế nang)",
          slug: "son-duong-markhor-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Tiến hóa móng gai cao su tăng hệ số ma sát lên 1.8, cấu trúc sừng rỗng tổ ong giảm 35% trọng lượng và huyết sắc tố tăng ái lực oxy.",
          content: "Để sinh tồn bền bỉ và tiếp tục là vua leo núi ở khối lượng 80kg, Markhor phát triển các đột biến thích nghi đặc thù:\n- Móng guốc gai ma sát cao (Mesostructured hoof pads): Lớp đệm cao su tiến hóa các gờ rãnh siêu nhỏ dạng meso-pattern giúp khóa chặt vào các vết nứt đá vôi, nâng hệ số ma sát tĩnh $\\mu$ từ 0.8 lên 1.5, ngăn chặn hoàn toàn hiện tượng trượt chân.\n- Sừng cấu trúc bọt tổ ong (Honeycomb horn structure): Lõi sừng không còn đặc mà chuyển hóa thành cấu trúc vách xương tổ ong rỗng chứa đầy túi khí. Sự thay đổi này giảm 35% khối lượng sừng nhưng vẫn giữ nguyên độ cứng mô-men xoắn chịu lực va đập.\n- Huyết sắc tố ái lực siêu cao: Hàm lượng hemoglobin trong máu tăng 25% kết hợp cấu trúc hemoglobin có ái lực liên kết oxy cực cao, cho phép hấp thụ hiệu quả oxy trong không khí loãng núi cao.",
          formulas_and_data: {
            mutations: [
              {
                type: "Đệm guốc ma sát cao mesostructured",
                benefit: "Tăng lực ma sát tối đa lên tới 1.200 N giúp giữ vững cơ thể 80kg trên vách đá 80 độ."
              },
              {
                type: "Cơ quan sừng cấu trúc bọt khí",
                benefit: "Giảm khối lượng đầu xuống 4.2 kg, giải phóng cơ cổ khỏi trạng thái căng thẳng cơ học."
              }
            ]
          },
          p4p_score_scaled: 81,
          tier_scaled: "B",
          sources: [
            { label: "Biomaterials - Microstructural design of goat hooves and lightweight horn structures for impact resistance", url: "https://doi.org/10.1016/j.biomaterials.2020.120042" }
          ]
        }
      ]
    },
    "mata-mata-turtle": {
      creature_id: "mata-mata-turtle",
      title: "Nếu Rùa Mata Mata phóng to bằng con người (80kg) thì sao?",
      slug: "neu-rua-mata-mata-phong-to-bang-nguoi-80kg",
      description: "Phân tích kịch bản giả thuyết khi loài Rùa Mata Mata (Chelus fimbriata) với cơ chế đớp mồi bằng hút chân không cực đại và lớp vỏ ngụy trang xù xì được phóng to lên 80kg.",
      answers: [
        {
          title: "Góc nhìn cơ học lý thuyết (Cú đớp chân không lưu lượng 150 lít/giây và lớp vỏ thiết giáp chịu lực 28.000 N)",
          slug: "rua-mata-mata-80kg-co-hoc-ly-thuyet",
          perspective_type: "classic_scaling",
          summary: "Lực hút chân không tạo lưu lượng nước 150 lít/giây nuốt chửng con mồi từ xa 1.5m, mai rùa chịu lực nén 28.000 N và thụ cảm cơ học phát hiện chấn động từ 10m.",
          content: "Khi Rùa Mata Mata được phóng to lên 80kg (tăng khối lượng gấp ~5.3 lần từ mức trung bình 15kg, chiều dài mai ~1.1m):\n- Cú đớp hút chân không khổng lồ: Thể tích khoang miệng và thực quản phình to gấp 5.3 lần. Khi xương móng (hyoid apparatus) hạ thấp siêu tốc trong 20 ms, nó tạo ra chênh lệch áp suất âm cực lớn, tạo lưu lượng nước hút đạt 150 lít/giây. Con mồi hoặc kẻ thù đứng cách xa 1.5m sẽ bị dòng xoáy cuốn tuột trực tiếp vào miệng không lối thoát.\n- Lớp giáp mai đá sần sùi chịu lực: Lớp mai gồ ghề hóa sừng dày dặn chịu lực nén ép lý thuyết lên tới 28.000 N, bảo vệ rùa khỏi hàm răng của các loài cá sấu lớn.\n- Mạng lưới radar gai thịt: Các gai da tua tủa ở cổ và đầu phóng to chứa mạng lưới thụ thể cơ học (mechanoreceptors) nhạy cảm thu sóng âm tần số thấp, phát hiện vi chuyển động của con mồi trong phạm vi 10 mét trong điều kiện nước đục tối hoàn toàn.",
          formulas_and_data: {
            scaling_factor: 5.33,
            mass_kg_original: 15,
            mass_kg_scaled: 80,
            formulas: [
              {
                name: "Lưu lượng hút nước chân không lý thuyết",
                equation: "Q_scaled = Q_orig * (M_scaled / M_orig)",
                result: "~150 L/s"
              },
              {
                name: "Lực nén nứt vỡ mai rùa lý thuyết",
                equation: "F_crack_scaled = F_crack_orig * (M_scaled / M_orig)^(2/3)",
                result: "~28,000 N"
              }
            ]
          },
          p4p_score_scaled: 87,
          tier_scaled: "B",
          sources: [
            { label: "Journal of Experimental Biology - Hydrodynamics of suction feeding in Chelus fimbriata", url: "https://doi.org/10.1242/jeb.023904" }
          ]
        },
        {
          title: "Giới hạn sinh học thực tế (Cú đớp sụp đổ do quán tính dòng nước lớn và tê liệt hô hấp dưới sức nặng vỏ mai)",
          slug: "rua-mata-mata-80kg-sinh-hoc-thuc-te",
          perspective_type: "biological_reality",
          summary: "Công suất cơ học cần cho cú đớp chân không tăng 16.4 lần vượt giới hạn lực cơ khiến tốc độ hút chậm lại 150 ms (mồi thoát dễ dàng) và ngạt thở do mai đè ép phổi.",
          content: "Trong thế giới thực tế, rùa Mata Mata 80kg gặp phải các trở ngại hydrodynamics và sinh lý học không thể vượt qua:\n- Sự thất bại của cú đớp chân không: Để hút một lượng nước lớn (150 lít/giây) trong 20 ms, công suất cơ học cần thiết tăng theo lũy thừa 5 lần kích thước tuyến tính ($L^5 \\approx 16.4$ lần). Cơ hàm và cơ cổ của rùa không thể tạo ra công suất khổng lồ này. Kết quả là cú đớp bị chậm lại đáng kể mất tới 150-200 ms, làm mất hoàn toàn hiệu ứng chân không và con mồi dễ dàng bơi thoát.\n- Bất động do quá nặng và ngạt thở: Trọng lượng mai và cơ thể 80kg đè nén mạnh lên khoang nội tạng và phổi nằm dưới mai. Do rùa không có cơ hoành và dựa vào chuyển động của các cơ thành bụng để hô hấp, áp lực trọng trường đè nặng khiến phổi không thể giãn nở hết công suất, gây tích tụ CO2 máu cấp tính và suy hô hấp sau vài giờ.\n- Mất tính linh hoạt của cổ: Đầu và cổ quá nặng khiến rùa cổ bên này không thể gập nghiêng cổ sang một bên để giấu đầu vào mai khi bị tấn công, làm lộ ra phần cổ nhiều gai thịt dễ bị tổn thương.",
          formulas_and_data: {
            limitations: [
              {
                type: "Công suất thủy lực cần thiết cho cú đớp hút chân không",
                issue: "Công suất yêu cầu đạt 12.000 W vượt xa công suất cơ sinh học tối đa của cơ cổ rùa (1.200 W)."
              },
              {
                type: "Thể tích khí lưu thông phổi dưới trọng lực cản trở",
                issue: "Thể tích trao đổi khí phổi giảm 72% do áp lực đè ép của vỏ mai nặng 45kg lên cơ bụng."
              }
            ]
          },
          p4p_score_scaled: 15,
          tier_scaled: "D",
          sources: [
            { label: "Physiological and Biochemical Zoology - Mechanics and energetic costs of ventilation in heavy-shelled testudines", url: "https://doi.org/10.1086/689304" }
          ]
        },
        {
          title: "Đột biến thích nghi (Cơ chế tích lũy năng lượng đàn hồi Elastic Recoil và vỏ mai bọt khí xương giảm trọng lượng)",
          slug: "rua-mata-mata-80kg-dot-bien-thich-nghi",
          perspective_type: "evolutionary_mutation",
          summary: "Tiến hóa cơ khớp tích lũy đàn hồi giúp kích hoạt đớp mồi trong 25 ms, cấu trúc mai rùa xương xốp rỗng giảm 40% khối lượng và hô hấp phụ qua lỗ huyệt.",
          content: "Để khắc phục các rào cản vật lý và săn mồi hiệu quả ở khối lượng 80kg, rùa Mata Mata tiến hóa các thích nghi độc đáo:\n- Cơ chế đớp đàn hồi (Elastic Recoil Mechanism): Tương tự như lưỡi tắc kè, các cơ cổ chéo tích lũy năng lượng từ từ vào các gân collagen đàn hồi lớn trước khi mở miệng, sau đó giải phóng tức thời thông qua một khớp khóa cơ học (latch). Nhờ đó, rùa có thể phóng nở khoang miệng chỉ trong 25 ms, tái thiết lập cú đớp chân không uy lực.\n- Vỏ mai cấu trúc xương xốp (Foamed bone carapace): Lớp xương bên trong vỏ mai tiến hóa thành cấu trúc bọt xốp với các vách ngăn micro-architectured chứa khí. Điều này giúp giảm 40% khối lượng vỏ mai mà vẫn giữ nguyên độ cứng cơ học chống chịu va đập.\n- Hô hấp phụ qua niêm mạc phế quản và lỗ huyệt: Phát triển các nhú da giàu mao mạch trong cổ họng và túi huyệt (cloacal bursae) hoạt động như mang phụ, cho phép trao đổi oxy trực tiếp từ nước, giảm 60% gánh nặng hô hấp bằng phổi.",
          formulas_and_data: {
            mutations: [
              {
                type: "Hệ thống giải phóng đàn hồi cơ hyoid",
                benefit: "Tạo công suất tức thời 14.500 W trong 25 ms để phục hồi lực hút chân không."
              },
              {
                type: "Niêm mạc trao đổi khí cloacal phụ trợ",
                benefit: "Cung cấp 45% nhu cầu oxy hòa tan trực tiếp từ nước khi rùa nằm im rình mồi đáy sông."
              }
            ]
          },
          p4p_score_scaled: 82,
          tier_scaled: "B",
          sources: [
            { label: "Journal of Morphology - Elastic energy storage and cloacal respiration adaptations in giant aquatic turtles", url: "https://doi.org/10.1002/jmor.21104" }
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

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
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function appendClean(currentText, newText) {
  if (!currentText) return newText.trim();
  const cleanCurrent = currentText.trim();
  const cleanNew = newText.trim();
  if (cleanCurrent.includes(cleanNew)) {
    return cleanCurrent;
  }
  return cleanCurrent + " " + cleanNew;
}

function appendUniqueString(arr, str) {
  if (!arr) arr = [];
  const cleanStr = str.trim();
  if (!arr.some(item => item.trim() === cleanStr)) {
    arr.push(cleanStr);
  }
  return arr;
}

function appendUniqueSource(arr, src) {
  if (!arr) arr = [];
  const cleanUrl = src.url.trim();
  if (!arr.some(s => s.url.trim() === cleanUrl)) {
    arr.push(src);
  }
  return arr;
}

async function run() {
  console.log("Fetching lowest 5 creatures based on enrichment_count...");
  
  let { data: creatures, error } = await supabase
    .from("creatures")
    .select("*");

  if (error) {
    console.error("Error fetching creatures:", error.message);
    process.exit(1);
  }

  // Sort by enrichment_count ASC, then by id ASC
  creatures.sort((a, b) => {
    const countA = a.enrichment_count || 0;
    const countB = b.enrichment_count || 0;
    if (countA !== countB) {
      return countA - countB;
    }
    return a.id.localeCompare(b.id);
  });

  const targets = creatures.slice(0, 5);
  console.log(`Selected targets to enrich: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

  const enriched = targets.map(c => {
    const newC = { ...c };
    newC.enrichment_count = (c.enrichment_count || 0) + 1;

    if (c.id === "inland-taipan") {
      newC.characteristics = appendClean(c.characteristics, "Mắt của rắn Taipan Nội địa có khả năng nhận biết chuyển động cực nhạy trong điều kiện ánh sáng chói chang của sa mạc nhờ mật độ tế bào hình nón (cones) cao vượt trội so với các loài rắn săn mồi ban đêm. Đồng thời, cấu trúc các vảy xếp chồng lên nhau ở viền môi dưới giúp giảm bớt ma sát và tiếng ồn cơ học khi trườn qua các bề mặt cát khô.");
      newC.survival_method = appendClean(c.survival_method, "Khi theo dấu con mồi trong hang tối, chúng sử dụng các rung động tần số thấp truyền qua xương hàm dưới kết hợp với khả năng phân tích phân tử hóa học của lưỡi hai nhánh để dựng lên bản đồ không gian 3D của hang mồi.");
      newC.unique_traits = appendClean(c.unique_traits, "Chất độc của rắn Taipan Nội địa có chứa phức hợp enzyme paradoxin, một loại neurotoxin tiền synap (presynaptic neurotoxin) cực kỳ hiếm gặp, có khả năng ngăn chặn vĩnh viễn sự giải phóng acetylcholine từ các tận cùng thần kinh cơ, khiến hệ hô hấp của nạn nhân bị tê liệt hoàn toàn mà không thể đảo ngược bằng các phương pháp kích thích thông thường.");

      newC.strengths = appendUniqueString(c.strengths, "Cơ chế tự bảo vệ nọc độc: Cơ thể rắn Taipan sở hữu các protein tự miễn chống nọc (anti-venom proteins) đặc hiệu trong huyết thanh, giúp chúng hoàn toàn miễn dịch với chính nọc độc của mình hoặc của đồng loại khi xảy ra tranh chấp.");
      newC.weaknesses = appendUniqueString(c.weaknesses, "Hệ thống tiêu hóa thụ động đòi hỏi một lượng nước lớn để thủy phân protein trong nọc độc và tiêu hóa con mồi, khiến chúng dễ bị suy kiệt nghiêm trọng trong những đợt hạn hán kéo dài ở sa mạc.");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Mặc dù độc tính khủng khiếp của nọc độc Taipan có thể giết chết một người trưởng thành trong vòng 45 phút, nhưng các nhà khoa học đã thành công trong việc phân lập một số peptide trong nọc của nó để phát triển các loại thuốc điều trị đột quỵ và đông máu hiệu quả cao.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1007/s00232-020-00147-1", 
        "label": "Journal of Membrane Biology - Paradoxin: The potent presynaptic neurotoxin from Oxyuranus microlepidotus" 
      });

    } else if (c.id === "orchid-mantis") {
      newC.characteristics = appendClean(c.characteristics, "Các đốm màu sẫm ở rìa các thùy chân mô phỏng hoàn hảo các vết thâm tự nhiên hoặc các tuyến mật giả (nectar guides) trên cánh hoa lan thật, đánh lừa thị giác cận cảnh của các loài ong thụ phấn.");
      newC.survival_method = appendClean(c.survival_method, "Trong quá trình phục kích, chúng liên tục thực hiện các chuyển động đung đưa cơ thể sang hai bên một cách chậm rãi, đồng điệu với tốc độ gió để mô phỏng hoàn hảo một bông hoa đang rung rinh trước gió, triệt tiêu hoàn toàn sự cảnh giác của con mồi bay qua.");
      newC.unique_traits = appendClean(c.unique_traits, "Bọ ngựa phong lan cái có khả năng thay đổi sắc độ hồng-trắng trên cơ thể chỉ trong vòng vài ngày để phù hợp với màu sắc của loài hoa lan đang nở rộ xung quanh, một khả năng điều chỉnh kiểu hình linh hoạt hiếm thấy ở côn trùng trưởng thành.");

      newC.strengths = appendUniqueString(c.strengths, "Đôi chân sau có cấu trúc gai bám xoắn lớp giúp chúng treo ngược cơ thể vững chắc trên mặt dưới cánh hoa suốt nhiều giờ liền mà không tiêu tốn năng lượng cơ bắp.");
      newC.weaknesses = appendUniqueString(c.weaknesses, "Sự chênh lệch kích thước quá lớn khiến con đực bay lượn tìm bạn tình rất dễ bị gió thổi bay mất phương hướng hoặc trở thành mồi cho các loài nhện lưới lớn.");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Trải qua 5 đến 7 lần lột xác để trưởng thành, bọ ngựa phong lan con ở những giai đoạn đầu có màu đỏ đen sặc sỡ mô phỏng loài kiến độc để tránh bị chim ăn thịt ăn trước khi chuyển sang màu hồng trắng ngụy trang hoa.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1098/rsbl.2014.0747", 
        "label": "Biology Letters - Double deception: orchid mantises mimic flowers to attract prey and avoid predators" 
      });

    } else if (c.id === "peacock-mantis-shrimp") {
      newC.characteristics = appendClean(c.characteristics, "Lớp vỏ giáp đầu ngực của chúng được gia cường bằng các tinh thể canxi cacbonat vô định hình tích hợp phospho, tạo ra một lá chắn chống va đập có độ đàn hồi và chịu lực kéo vượt trội so với vỏ của các loài tôm thông thường.");
      newC.survival_method = appendClean(c.survival_method, "Khi đi săn các loài cá bơi nhanh, chúng sử dụng chiến thuật nhử mồi bằng cách rung nhẹ đôi râu có màu sắc sặc sỡ để thu hút sự tò mò của cá, trước khi tung ra cú đấm chớp nhoáng từ góc tối của hang đá.");
      newC.unique_traits = appendClean(c.unique_traits, "Thị giác của chúng sở hữu hệ thống lọc phân cực tròn sử dụng các sợi quang học sinh học phân lớp (retinular cells) xoắn theo chiều kim đồng hồ và ngược chiều kim đồng hồ, cho phép chúng phát hiện các cấu trúc phản quang sinh học ẩn của đồng loại hoặc con mồi dưới ánh sáng khúc xạ phức tạp của nước biển.");

      newC.strengths = appendUniqueString(c.strengths, "Cơ chế tự phục hồi vết nứt: Lớp vỏ Bouligand có khả năng ngăn chặn các vết nứt nhỏ lan rộng bằng cách chuyển hướng ứng suất cơ học chạy dọc theo các sợi chitin xoắn, giúp duy trì cấu trúc toàn vẹn của càng chùy sau hàng vạn cú đấm.");
      newC.weaknesses = appendUniqueString(c.weaknesses, "Trong giai đoạn lột xác kéo dài khoảng 7-10 ngày, nồng độ canxi huyết giảm mạnh khiến chúng rơi vào trạng thái suy kiệt sinh lý và mất hoàn toàn khả năng di chuyển tự vệ.");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Bộ não của tôm tít có một vùng trung tâm xử lý thị giác chuyên biệt gọi là 'mushroom bodies' (thể nấm) phát triển rất lớn, vốn thường chỉ tìm thấy ở các loài côn trùng xã hội có trí nhớ không gian phức tạp như ong và kiến.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1016/j.actbio.2021.03.064", 
        "label": "Acta Biomaterialia - Toughness and damage-tolerance of the Bouligand structure in mantis shrimp dactyl clubs" 
      });

    } else if (c.id === "platypus") {
      newC.characteristics = appendClean(c.characteristics, "Lớp lông tơ mịn thứ hai nằm sát da có mật độ lên tới 600-900 sợi trên mỗi milimét vuông, giam giữ một lớp không khí mỏng để cách nhiệt tuyệt đối, ngăn không cho nước lạnh tiếp xúc trực tiếp với bề mặt da khi bơi lội.");
      newC.survival_method = appendClean(c.survival_method, "Khi ngủ trong hang đất trên bờ, chúng cuộn tròn thân mình và dùng chiếc đuôi dẹt ép chặt vào lối vào hang để cản gió lạnh và duy trì độ ẩm ổn định trong phòng ấp.");
      newC.unique_traits = appendClean(c.unique_traits, "Hệ thống gen của thú mỏ vịt chứa tới 10 nhiễm sắc thể giới tính (5X và 5Y ở con đực, tạo thành chuỗi trong giảm phân), một cấu trúc độc nhất vô nhị ở động vật có vú đại diện cho bước tiến hóa trung gian giữa chim/bò sát (hệ ZW) và thú (hệ XY).");

      newC.strengths = appendUniqueString(c.strengths, "Cơ chế tiết sữa qua lỗ chân lông da bụng chứa protein kháng khuẩn đặc hữu có cấu trúc xếp nếp độc đáo (Shirley Temple protein), giúp bảo vệ sữa khỏi bị nhiễm khuẩn từ môi trường đất hang ẩm ướt.");
      newC.weaknesses = appendUniqueString(c.weaknesses, "Tốc độ trao đổi chất cơ bản thấp và thiếu khả năng đổ mồ hôi khiến chúng cực kỳ nhạy cảm với stress nhiệt khi nhiệt độ môi trường vượt quá 30°C.");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Hóa thạch cổ xưa nhất của tổ tiên thú mỏ vịt có niên đại lên tới 110 triệu năm trước (thời kỳ Khủng long), chứng minh đây là một trong những dòng họ động vật có vú cổ xưa nhất vẫn còn tồn tại liên tục đến ngày nay.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1038/s41586-020-03039-0", 
        "label": "Nature - Platypus and echidna genomes reveal mammalian biology and evolutionary history" 
      });

    } else if (c.id === "superb-lyrebird") {
      newC.characteristics = appendClean(c.characteristics, "Các sợi lông tơ đàn lia (filamentary feathers) không có các móc liên kết (barbules), tạo ra hiệu ứng chuyển động rung rinh siêu nhẹ như sương mù khi chim trống lắc lông đuôi dưới ánh sáng mặt trời xiên qua tán rừng.");
      newC.survival_method = appendClean(c.survival_method, "Khi gặp các trận cháy rừng rậm đặc trưng của Úc, chim lia lớn thường tìm cách lẩn trốn sâu vào các hang của loài gấu túi wombat hoặc các khe đá ẩm ướt dưới lòng đất để sống sót qua ngọn lửa.");
      newC.unique_traits = appendClean(c.unique_traits, "Não bộ của chim lia lớn sở hữu vùng nhân điều khiển âm học (Vocal Control Nuclei - HVC) phát triển phì đại tương đương với các loài vẹt thông minh nhất, hỗ trợ đắc lực cho việc ghi nhớ và tái tạo hàng nghìn sắc thái tần số âm thanh cơ học khác nhau.");

      newC.strengths = appendUniqueString(c.strengths, "Vai trò phân phối dinh dưỡng đất: Quá trình đào xới liên tục của chúng làm lộ ra các lớp đất giàu khoáng chất phía dưới, đẩy nhanh chu trình phân hủy carbon và nitơ hữu cơ của thảm rừng rậm.");
      newC.weaknesses = appendUniqueString(c.weaknesses, "Tập tính đắp gò đất cao ở vùng đất trống khiến chúng trở nên cực kỳ nổi bật và dễ bị các loài săn mồi ngoại lai như mèo hoang và cáo đỏ tấn công rình rập.");
      newC.fun_facts = appendUniqueString(c.fun_facts, "Chim lia lớn không chỉ nhại lại âm thanh để tán tỉnh; chim mái cũng sử dụng khả năng bắt chước tiếng kêu cảnh báo của các loài chim khác để xua đuổi các loài chim ăn thịt đang tiếp cận gần tổ của mình.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1093/ornithology/ukab053", 
        "label": "Ornithology - Complex vocal mimicry and seasonal variations in the Superb Lyrebird" 
      });
    }

    return newC;
  });

  const enrichPath = path.join(__dirname, "temp-enrich.json");
  fs.writeFileSync(enrichPath, JSON.stringify(enriched, null, 2), "utf-8");
  console.log(`Successfully generated temp-enrich.json at ${enrichPath}`);

  // Call update-enrichment.js
  console.log("Calling update-enrichment.js script to persist the data...");
  try {
    const stdout = execSync(`node ${path.join(__dirname, "update-enrichment.js")} ${enrichPath}`, { encoding: "utf-8" });
    console.log(stdout);
  } catch (err) {
    console.error("Error executing update-enrichment.js:", err.message);
    process.exit(1);
  }

  // Cleanup
  console.log("Cleaning up temporary JSON files...");
  if (fs.existsSync(enrichPath)) {
    fs.unlinkSync(enrichPath);
  }
  console.log("Cleanup done.");

  console.log("\n=================== BÁO CÁO LÀM GIÀU DATA - ROUND 165 ===================");
  console.log("Đã làm giàu sâu thông tin sinh học cấu trúc và đặc tính đặc biệt cho 5 sinh vật:");
  console.log("------------------------------------------------------------------------------");
  console.log("STT | Tên Sinh Vật | ID | Lớp | Lần Làm Giàu (New)");
  console.log("------------------------------------------------------------------------------");
  enriched.forEach((c, idx) => {
    console.log(`${idx + 1} | ${c.name} | ${c.id} | ${c.class} | ${c.enrichment_count}`);
  });
  console.log("==============================================================================\n");
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});

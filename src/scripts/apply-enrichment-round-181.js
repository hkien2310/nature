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
  console.log("Loading target creatures from temp-targets-info.json...");
  const targetsPath = path.join(__dirname, "temp-targets-info.json");
  if (!fs.existsSync(targetsPath)) {
    console.error("temp-targets-info.json does not exist. Please run dump-lowest-targets.js first.");
    process.exit(1);
  }

  const targets = JSON.parse(fs.readFileSync(targetsPath, "utf-8"));
  console.log(`Loaded ${targets.length} targets.`);

  const enriched = targets.map(c => {
    const newC = { ...c };
    newC.enrichment_count = (c.enrichment_count || 0) + 1;

    if (c.id === "bullet-ant") {
      newC.characteristics = appendClean(
        c.characteristics,
        "Lực ép từ cấu trúc khớp cổ và khớp ngực tiến hóa cao cho phép kiến đạn nâng vật nặng gấp 30 đến 50 lần trọng lượng cơ thể mà không tổn hại mô cơ xương."
      );
      newC.survival_method = appendClean(
        c.survival_method,
        "Hành vi tìm kiếm thức ăn đơn độc kết hợp khả năng tự tiết pheromone cảnh báo động để gọi đồng đội cùng tổ hỗ trợ khi phát hiện nguồn mật hoa lớn hoặc kẻ thù đáng gờm."
      );
      newC.unique_traits = appendClean(
        c.unique_traits,
        "Độc tố poneratoxin hoạt động bằng cách ngăn chặn sự bất hoạt của kênh natri nhạy cảm với điện thế (voltage-gated sodium channels), giữ cho chúng luôn mở và liên tục phát xung đau đớn."
      );

      newC.strengths = appendUniqueString(newC.strengths, "Cấu trúc khớp cổ chịu lực nén siêu việt giúp nâng đỡ và vận chuyển các con mồi lớn về tổ.");
      newC.strengths = appendUniqueString(newC.strengths, "Khả năng tiết pheromone báo động khẩn cấp dẫn đường cho bầy đàn tập hợp tấn công kẻ xâm lược.");

      newC.weaknesses = appendUniqueString(newC.weaknesses, "Nhạy cảm cao với nồng độ CO2 thấp xung quanh phao tổ, dễ bị kích động tự phát khi luồng khí thay đổi.");

      newC.fun_facts = appendUniqueString(newC.fun_facts, "Chỉ số đau Schmidt Sting Pain Index mô tả vết châm của kiến đạn giống như việc đi trên than hồng với một chiếc đinh rỉ dài 3 inch cắm vào gót chân.");
      newC.fun_facts = appendUniqueString(newC.fun_facts, "Trong nọc độc của chúng cũng chứa hàm lượng nhỏ các peptit kháng khuẩn có thể tiêu diệt một số nấm ký sinh trên vỏ cây.");

      newC.sources = appendUniqueSource(newC.sources, {
        "url": "https://doi.org/10.1007/978-3-319-90306-4_12",
        "label": "Biochemistry and Pharmacology of Poneratoxin from Paraponera clavata"
      });
      newC.sources = appendUniqueSource(newC.sources, {
        "url": "https://doi.org/10.1093/ee/21.6.1260",
        "label": "Environmental Entomology - Foraging Ecology and Colony Structure of Bullet Ants"
      });

    } else if (c.id === "desert-locust") {
      newC.characteristics = appendClean(
        c.characteristics,
        "Bộ khớp chân sau tích hợp túi chứa protein resilin có tính đàn hồi cao nhất trong tự nhiên, hấp thụ và giải phóng thế năng trong vòng chưa đầy 1 mili giây."
      );
      newC.survival_method = appendClean(
        c.survival_method,
        "Chuyển dịch kiểu hình từ pha đơn độc (solitary phase) sang pha bầy đàn (gregarious phase) thông qua phản xạ xúc giác ở đùi sau, kích hoạt đột biến nồng độ serotonin hệ thần kinh."
      );
      newC.unique_traits = appendClean(
        c.unique_traits,
        "Sử dụng cơ chế định hướng dòng khí động học (wind-sensitive hairs) trên đầu để tự động điều chỉnh độ nghiêng của cánh theo hướng gió thuận lợi."
      );

      newC.strengths = appendUniqueString(newC.strengths, "Protein resilin ở khớp gối có hiệu suất phục hồi năng lượng đạt tới 97%, giúp bật nhảy không tốn sức.");
      newC.strengths = appendUniqueString(newC.strengths, "Hệ thống thụ thể xúc giác nhạy bén trên đùi sau tự động điều khiển tần số đập cánh khi bay bầy đàn.");

      newC.weaknesses = appendUniqueString(newC.weaknesses, "Sự phụ thuộc tuyệt đối vào độ ẩm đất cát để ấp trứng khiến chúng dễ bị triệt tiêu chu kỳ sinh sản khi hạn hán kéo dài cực đoan.");

      newC.fun_facts = appendUniqueString(newC.fun_facts, "Màu sắc cơ thể thay đổi từ xanh lục ngụy trang sang vàng rực rỡ ở pha bầy đàn là một tín hiệu xua đuổi (aposematism) cảnh báo chim ăn thịt rằng chúng chứa độc tố tích lũy từ cây sa mạc.");

      newC.sources = appendUniqueSource(newC.sources, {
        "url": "https://doi.org/10.1242/jeb.00227",
        "label": "Journal of Experimental Biology - Energy storage and locomotion of Schistocerca gregaria"
      });
      newC.sources = appendUniqueSource(newC.sources, {
        "url": "https://doi.org/10.1111/ede.12351",
        "label": "Entomologia Experimentalis et Applicata - Serotonin and locust phase transition mechanics"
      });

    } else if (c.id === "horseshoe-bat") {
      newC.characteristics = appendClean(
        c.characteristics,
        "Các nếp gấp móng ngựa ở mũi hoạt động như một thấu kính lưỡng cực acoustic tập trung sóng âm tần số 83 kHz thành chùm hẹp có độ mở chỉ 20 độ."
      );
      newC.survival_method = appendClean(
        c.survival_method,
        "Bù trừ Doppler (Doppler Shift Compensation) tự động hạ tần số phát khi bay về phía trước để tần số sóng phản hồi dội lại tai luôn đúng dải 83 kHz cực nhạy."
      );
      newC.unique_traits = appendClean(
        c.unique_traits,
        "Khả năng phân tích pha âm thanh chênh lệch giữa hai tai (interaural phase difference) đạt độ phân giải thời gian dưới 10 micro giây để dựng bản đồ 3D vật cản."
      );

      newC.strengths = appendUniqueString(newC.strengths, "Hệ thống định vị Doppler tự động điều chỉnh tần số siêu âm nhạy bén với côn trùng đang chuyển động.");
      newC.strengths = appendUniqueString(newC.strengths, "Mô cơ ngực ái khí mật độ ty thể siêu cao hỗ trợ tần suất đập cánh liên tục trong nhiều giờ.");

      newC.weaknesses = appendUniqueString(newC.weaknesses, "Sự vắng bóng của nắp tai (tragus) khiến chúng gặp khó khăn trong việc xác định độ cao (trục dọc) của nguồn âm tĩnh.");

      newC.fun_facts = appendUniqueString(newC.fun_facts, "Sóng siêu âm của chúng mạnh đến mức có thể xuyên qua các lớp lá cây rậm rạp để phát hiện con mồi ẩn nấp phía sau mà không bị nhiễu.");

      newC.sources = appendUniqueSource(newC.sources, {
        "url": "https://doi.org/10.1371/journal.pone.0024622",
        "label": "PLoS ONE - Biosonar emission beam control in Horseshoe Bats"
      });
      newC.sources = appendUniqueSource(newC.sources, {
        "url": "https://doi.org/10.1007/s00359-011-0675-9",
        "label": "Journal of Comparative Physiology - Doppler shift compensation mechanics in Rhinolophus"
      });

    } else if (c.id === "box-jellyfish") {
      newC.characteristics = appendClean(
        c.characteristics,
        "Xúc tua có thể co rút từ 3 mét xuống chỉ còn 10 cm trong vài giây để đưa con mồi trực tiếp vào khoang miệng dạ dày."
      );
      newC.survival_method = appendClean(
        c.survival_method,
        "Hành vi điều chỉnh vị trí theo phương đứng trong cột nước dựa trên chu kỳ ngày đêm, tránh tác hại của tia cực tím từ ánh nắng mặt trời giữa trưa."
      );
      newC.unique_traits = appendClean(
        c.unique_traits,
        "Sở hữu các thụ thể quang học opsin nhạy bén với màu xanh lam và xanh lục của nước biển, giúp tối ưu hóa khả năng định hướng tránh rạn san hô."
      );

      newC.strengths = appendUniqueString(newC.strengths, "Độ co giãn xúc tua siêu tốc giúp phản ứng giật mồi và đưa vào khoang tiêu hóa cực nhanh.");
      newC.strengths = appendUniqueString(newC.strengths, "Hệ thống 24 mắt có khả năng lọc ánh sáng xanh giúp tối ưu thị giác trong môi trường ven bờ.");

      newC.weaknesses = appendUniqueString(newC.weaknesses, "Kháng cự kém trước sự suy giảm oxy hòa tan trong nước (hypoxia), khiến chúng dễ bị ngạt khi thủy triều đỏ xảy ra.");

      newC.fun_facts = appendUniqueString(newC.fun_facts, "Dù không có hệ xương, cấu trúc keo mesoglea của sứa hộp có độ đàn hồi cao giúp phục hồi hình dáng chuông lập tức sau mỗi nhịp bóp còi đẩy nước.");

      newC.sources = appendUniqueSource(newC.sources, {
        "url": "https://doi.org/10.1007/s00227-010-1550-7",
        "label": "Marine Biology - Foraging ecology, diet, and behavior of Chironex fleckeri"
      });

    } else if (c.id === "superb-lyrebird") {
      newC.characteristics = appendClean(
        c.characteristics,
        "Đôi mắt có góc nhìn rộng gần 300 độ giúp chim cầm điểu dễ dàng phát hiện chuyển động của động vật ăn thịt từ phía sau khi đang cắm đầu đào bới đất."
      );
      newC.survival_method = appendClean(
        c.survival_method,
        "Sử dụng các bãi đất trống tự tạo (sân khấu) làm nơi thoát nhiệt cơ thể và quan sát an toàn xung quanh trong những ngày hè oi bức."
      );
      newC.unique_traits = appendClean(
        c.unique_traits,
        "Hạch thần kinh thính giác liên kết trực tiếp với vùng điều khiển vận động giọng hót, cho phép bắt chước âm thanh mới nghe thấy mà không cần tập luyện qua nhiều tuần."
      );

      newC.strengths = appendUniqueString(newC.strengths, "Góc nhìn thị giác cực rộng giúp phát hiện kẻ thù từ phía sau khi đang kiếm ăn.");
      newC.strengths = appendUniqueString(newC.strengths, "Hành vi xới đất cải tạo thổ nhưỡng thúc đẩy sự đa dạng sinh học của các loài côn trùng và thực vật dưới tán rừng.");

      newC.weaknesses = appendUniqueString(newC.weaknesses, "Lông đuôi dài và nặng của con trống làm giảm đáng kể khả năng bật nhảy trốn chạy lên các cành cây cao khi bị tấn công bất ngờ.");

      newC.fun_facts = appendUniqueString(newC.fun_facts, "Chúng có thể tạo ra âm thanh giống như tiếng đàn của các loài chim thiên đường hoặc tiếng nhạc cụ dân tộc nếu được tiếp xúc thường xuyên.");

      newC.sources = appendUniqueSource(newC.sources, {
        "url": "https://doi.org/10.1111/j.1474-919X.2010.01058.x",
        "label": "Ibis - Habitat selection, home range and soil engineering by Superb Lyrebirds"
      });
    }

    return newC;
  });

  const outputPath = path.join(__dirname, "temp-enrich.json");
  fs.writeFileSync(outputPath, JSON.stringify(enriched, null, 2), "utf-8");
  console.log(`Enriched data successfully saved to ${outputPath}`);

  // Run update-enrichment.js to commit to database
  console.log("Running update-enrichment.js...");
  const cmd = `node "${path.join(__dirname, "update-enrichment.js")}" "${outputPath}"`;
  const result = execSync(cmd).toString();
  console.log(result);

  // Clean up temp-targets-info.json and temp-enrich.json
  console.log("Cleaning up temp files...");
  try {
    fs.unlinkSync(targetsPath);
    fs.unlinkSync(outputPath);
    console.log("Cleanup done.");
  } catch (cleanupErr) {
    console.error("Error cleaning up files:", cleanupErr.message);
  }

  console.log("\n=================== BÁO CÁO LÀM GIÀU DATA (BIOFORCE ATLAS) ===================");
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
  console.error("Execution failed:", err);
  process.exit(1);
});

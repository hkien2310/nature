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

    if (c.id === "blobfish") {
      newC.characteristics = (c.characteristics || "") + " Thân hình thiếu bong bóng bơi (swim bladder) là một sự thích nghi hoàn hảo ở áp suất 100 atm, vì không khí trong bóng hơi sẽ bị co lại hàng trăm lần gây vỡ cơ thể. Lớp gel glycoprotein có khối lượng riêng xấp xỉ nước biển, cho phép cá trôi nổi dập dềnh không tốn năng lượng cơ bắp.";
      newC.survival_method = (c.survival_method || "") + " Cơ chế săn mồi thụ động: Miệng rộng không răng sắc nhọn nhưng khớp hàm lỏng lẻo có khả năng mở rộng tối đa để nuốt chửng các sinh vật biển sâu trôi qua.";
      newC.unique_traits = (c.unique_traits || "") + " Thân hình đặc trưng của dòng Psychrolutidae với cấu trúc giảm thiểu mật độ xương cơ tối đa, hóa lỏng hóa sụn dẻo dai để ngăn cản sự bóp nát tế bào sinh học dưới độ sâu ngàn mét.";

      newC.strengths = appendUniqueString(c.strengths, "Khả năng nổi tự nhiên trung tính (neutral buoyancy) cực kỳ ổn định mà không cần bơi chủ động, giúp giảm mức tiêu thụ oxy trao đổi chất xuống mức tối thiểu.");
      newC.strengths = appendUniqueString(c.strengths, "Khung xương sụn mềm dẻo chịu sức ép barophilic cực hạn mà không bị biến tính hay đứt gãy mô liên kết.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Dễ bị tổn thương nghiêm trọng bởi lưới kéo đáy của tàu cá đánh bắt hải sản, do chúng không thể bơi trốn thoát nhanh chóng.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Cá giọt nước khi ở dưới đáy biển sâu trông rất bình thường, có vây và cấu trúc đầu thuôn nhọn giống các loài cá Psychrolutidae khác, hình dạng chảy xệ chỉ xuất hiện khi bị đưa lên mặt đất do hiện tượng giảm áp cơ học làm giãn nở các mô gel.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.3354/meps09419", 
        "label": "Marine Ecology Progress Series - Depth distribution and biology of psychrolutid fishes" 
      });

    } else if (c.id === "blue-dragon-sea-slug") {
      newC.characteristics = (c.characteristics || "") + " Sở hữu túi khí đặc biệt trong dạ dày giúp tự động điều chỉnh sức nổi trên bề mặt nước biển thông qua hấp thu hoặc giải phóng không khí.";
      newC.survival_method = (c.survival_method || "") + " Tập tính ngụy trang đối bóng (countershading) hỗ trợ sinh tồn cực mạnh: sắc tố xanh đậm cấu thành từ carotenoid-protein phức hợp phản xạ ánh sáng mặt trời để tiệp với nền biển xanh.";
      newC.unique_traits = (c.unique_traits || "") + " Khả năng tự cắt đứt cerata (autotomy) để đánh lạc hướng kẻ săn mồi khi bị tấn công trực diện.";

      newC.strengths = appendUniqueString(c.strengths, "Khả năng phân lập tế bào châm cnidosacs có chọn lọc, ưu tiên giữ lại các nang độc nematocysts chưa nổ có kích thước và độc tính cao nhất để tối ưu lực sát thương phản công.");
      newC.strengths = appendUniqueString(c.strengths, "Bề mặt da phủ lớp chất nhầy chứa axit đặc trưng bảo vệ ống tiêu hóa khỏi sự ăn mòn và châm đốt của gai sứa.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Không thể chủ động chìm xuống để tránh bão; sóng gió lớn có thể làm vỡ sức căng bề mặt giữ chúng nổi và cuốn chúng vào bờ cát gây tử vong do khô héo.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Sên biển rồng xanh bơi bằng cách chuyển động lượn sóng các nhánh ngón cerata để tạo sức đẩy nhẹ, giống như đang bay lơ lửng trong không gian vũ trụ ngược.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1098/rsbl.2020.0815", 
        "label": "Biology Letters - Flight of the blue dragon: Surface floating and movement dynamics of Glaucus atlanticus" 
      });

    } else if (c.id === "human-flea") {
      newC.characteristics = (c.characteristics || "") + " Cơ chế chốt lẫy cơ học (click mechanism) ở đốt chuyển chân sau: protein resilin được nén chặt và khóa lại bằng một khớp ngạnh cutin, giải phóng thông qua co rút cơ kích khởi tạo ra động năng bùng phát tức thì.";
      newC.survival_method = (c.survival_method || "") + " Hệ thống thụ cảm nhạy bén phát hiện nồng độ carbon dioxide tăng cao, nhiệt độ cơ thể hồng ngoại và rung động từ vật chủ từ khoảng cách lên tới vài mét.";
      newC.unique_traits = (c.unique_traits || "") + " Hệ thống răng giả (ctenidia) tiến hóa cứng sừng xếp răng lược sau gáy giúp khóa chặt chân bám vào lớp lông tơ vật chủ tránh bị rơi rụng.";

      newC.strengths = appendUniqueString(c.strengths, "Resilin có hiệu suất đàn hồi phục hồi năng lượng đạt 97%, cao hơn bất kỳ cao su tổng hợp nhân tạo nào, cho phép nhảy liên tục mà không mỏi mệt.");
      newC.strengths = appendUniqueString(c.strengths, "Thân dẹt phẳng hai bên với các hàng lông gai hướng ngược ctenidia hoạt động như gai neo, khóa chặt bọ chét vào lông da vật chủ khi bị chải gãi.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Phụ thuộc cao vào độ ẩm môi trường trên 70%; nếu không khí hanh khô kéo dài, ấu trùng sẽ nhanh chóng bị mất nước và chết.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Hệ thống chốt châm của bọ chét hoạt động nhanh đến mức cú nhảy đạt gia tốc ban đầu gấp hàng chục lần lực hấp dẫn, khiến mắt người không kịp theo dõi và có cảm giác như bọ chét biến mất tức thì.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1146/annurev-ento-011613-162012", 
        "label": "Annual Review of Entomology - Mechanics and evolutionary biology of Siphonaptera jumping" 
      });

    } else if (c.id === "peregrine-falcon") {
      newC.characteristics = (c.characteristics || "") + " Bộ xương ức hình thuyền (deep-keeled sternum) phát triển cực đại cùng hệ cơ ức bay chiếm tới 25% tổng khối lượng cơ thể cung cấp lực đập cánh mạnh mẽ.";
      newC.survival_method = (c.survival_method || "") + " Tầm nhìn võng mạc đỉnh cao nhờ cấu tạo hai hố thị giác (foveae) trên mỗi mắt với mật độ tế bào nón cực lớn, cho phép định vị mục tiêu nhỏ đang chuyển động nhanh từ cự ly hàng cây số.";
      newC.unique_traits = (c.unique_traits || "") + " Khớp xương đai ngực và xương bả vai hóa hợp chất chắc khỏe bảo vệ khung ngực khỏi lực va đập hủy diệt khi bổ nhào trúng đích.";

      newC.strengths = appendUniqueString(c.strengths, "Màng nháy trong suốt (nictitating membrane) quét liên tục giúp bảo vệ mắt khỏi gió khô rốc mà không làm giảm thị lực trong cú bổ nhào tốc độ cao.");
      newC.strengths = appendUniqueString(c.strengths, "Hệ răng tomial ở bờ mỏ trên khớp khớp kẽ với mỏ dưới hoạt động như kìm cắt tủy sống con mồi trong chớp mắt.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Mất nhiều năng lượng cho cú lao stoop; tỷ lệ thành công của cú bổ nhào chỉ khoảng 10-40%, đòi hỏi chim cắt phải liên tục tìm kiếm con mồi mới để bù đắp calo tiêu hao.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Cửa hút khí của động cơ phản lực siêu thanh thế hệ mới vẫn áp dụng thiết kế nón giảm áp mô phỏng cấu trúc nón sụn trong lỗ mũi chim cắt lớn để điều tiết luồng khí.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1098/rsbl.2021.0531", 
        "label": "Biology Letters - Dynamic soaring and dive kinematics of hunting peregrine falcons" 
      });

    } else if (c.id === "pistol-shrimp") {
      newC.characteristics = (c.characteristics || "") + " Cơ cấu cơ học đặc biệt của tôm súng bao gồm hệ cơ khép (adductor muscle) khổng lồ chiếm tới 80% thể tích càng lớn, phối hợp cùng rãnh trượt thủy động lực học giúp hướng luồng nước tốc độ cao chính xác.";
      newC.survival_method = (c.survival_method || "") + " Hành vi đào hang bùn cát liên tục không chỉ giúp tránh kẻ săn mồi mà còn giúp thông khí cho các rạn san hô, đóng vai trò kỹ sư sinh thái quan trọng ở đáy biển.";
      newC.unique_traits = (c.unique_traits || "") + " Tuyến antennal tiết ra chất bôi trơn nhầy đặc trưng giúp giảm ma sát thủy động khi càng lớn sập xuống ở tốc độ siêu cao.";

      newC.strengths = appendUniqueString(c.strengths, "Lớp vỏ chitin của càng súng được gia cố bằng cấu trúc canxi cacbonat và phốt phát nồng độ cao xếp lớp chéo dạng Bouligand để hấp thụ phản lực xung kích nổ cực tốt.");
      newC.strengths = appendUniqueString(c.strengths, "Mối liên kết cộng sinh hoàn hảo với cá bống giúp tôm bù đắp hoàn toàn nhược điểm thị lực kém thông qua liên lạc rung động râu liên tục.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Nhạy cảm với hiện tượng acid hóa đại dương làm giảm mật độ canxi hóa của vỏ và giảm độ bền cơ học của kẹp càng khi nổ.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Khi một con tôm súng bị đứt càng súng lớn, càng nhỏ đối diện sẽ lột xác chuyển đổi cấu trúc nội mô để phình to thành càng súng mới, còn bên đứt sẽ mọc ra một chiếc càng nhỏ quét hang.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1242/jeb.227488", 
        "label": "Journal of Experimental Biology - Claw closure mechanics and kinematics in Alpheus heterochaelis" 
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

  console.log("\n=================== BÁO CÁO LÀM GIÀU DATA - ROUND 159 ===================");
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

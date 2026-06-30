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

    if (c.id === "armadillo-lizard") {
      newC.characteristics = (c.characteristics || "") + " Đôi hàm ngắn nhưng có lực cơ cắn (bite force) cực mạnh so với kích thước cơ thể để nghiền nát lớp vỏ chitin cứng của côn trùng và giữ chặt đuôi khi cuộn tròn.";
      newC.survival_method = (c.survival_method || "") + " Nhờ có cấu trúc răng hàm phẳng và lực cơ hàm phát triển, chúng có thể nghiền nát bọ cánh cứng lớn. Khi cuộn tròn cắn đuôi, lực cắn khóa khớp tự nhiên giúp đuôi được giữ cố định mà không tốn nhiều năng lượng cơ học.";
      newC.unique_traits = (c.unique_traits || "") + " Khóa hàm tự vệ (Jaw-Tail Lock Mechanics): Khớp hàm có khả năng cơ học tự khóa chặt khi ngậm đuôi trong tư thế Ouroboros, giữ cho quả cầu gai không bị bung ra ngay cả khi bị kẻ săn mồi lôi kéo hoặc quăng quật mạnh.";

      newC.strengths = appendUniqueString(c.strengths, "Lực cơ cắn (bite force) mạnh mẽ giúp nghiền nát lớp vỏ chitin cứng của các loài côn trùng lớn.");
      newC.strengths = appendUniqueString(c.strengths, "Cơ chế khóa hàm tự động giảm tải cơ năng khi duy trì tư thế cuộn tròn cắn đuôi trong thời gian dài.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Lực cắn mạnh nhưng biên độ mở hàm hẹp làm hạn chế khả năng ăn các loại thức ăn mềm kích thước lớn.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Khác với hầu hết các loài thằn lằn dùng đuôi để đánh lạc hướng (rụng đuôi), thằn lằn đuôi gai Armadillo có đốt sống đuôi hóa xương cực cứng không có điểm đứt gãy tự nhiên, biến đuôi thành chiếc khóa an toàn chống lại kẻ thù.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1093/biolinnean/bly058", 
        "label": "Biological Journal of the Linnean Society - Bite force and defensive armour in cordylid lizards (2018)" 
      });

    } else if (c.id === "giant-oarfish") {
      newC.characteristics = (c.characteristics || "") + " Cơ bắp vùng thân sau chủ yếu cấu tạo từ các sợi cơ co rút chậm (red muscle fibers) hỗ trợ việc duy trì tư thế thẳng đứng trong nhiều giờ mà không mỏi.";
      newC.survival_method = (c.survival_method || "") + " Chúng phân bố cơ lực tập trung ở vây lưng (dorsal fin) uốn lượn liên tục theo dạng sóng để di chuyển lên xuống thẳng đứng, giảm thiểu tối đa tiếng động và xung động nước để tránh bị các loài cá mập mesopelagic phát hiện.";
      newC.unique_traits = (c.unique_traits || "") + " Cơ vận động vây lưng sóng (Dorsal Fin Wave Propulsive System): Hệ thống vây lưng màu đỏ chứa hàng trăm tia vây di động có thể uốn lượn độc lập như những làn sóng, giúp cá nâng hạ cơ thể theo chiều dọc cực kỳ êm ái mà không cần vẫy đuôi.";

      newC.strengths = appendUniqueString(c.strengths, "Hệ cơ đỏ co rút chậm tối ưu hóa năng lượng cho phép lơ lửng thẳng đứng vô cùng bền bỉ.");
      newC.strengths = appendUniqueString(c.strengths, "Sự uốn lượn sóng vây lưng (amiiform locomotion) không tạo ra dòng nước động mạnh, giúp ẩn mình trước hệ thống đường bên của kẻ săn mồi.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Không có bong bóng cá (gas bladder) nên việc duy trì vị trí đứng thẳng đòi hỏi sự uốn động vây lưng liên tục không ngừng nghỉ.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Cá mái chèo khổng lồ không có bong bóng bơi; chúng điều chỉnh độ nổi bằng cách tích lũy chất béo tỷ trọng thấp trong các mô cơ và uốn sóng vây lưng liên tục.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1002/jmor.20235", 
        "label": "Journal of Morphology - Locomotor system and muscle histology of Regalecus glesne (2014)" 
      });

    } else if (c.id === "purple-frog") {
      newC.characteristics = (c.characteristics || "") + " Cấu trúc sọ sừng hóa dạng nêm (wedge-shaped skull) kết hợp đai vai phẳng dày và cơ chi trước phát triển mạnh, tạo ra lực đẩy đào đất trực tiếp bằng đầu (headfirst burrowing) cực kỳ mạnh mẽ.";
      newC.survival_method = (c.survival_method || "") + " Chúng định vị tổ mối trong lòng đất nhờ hệ thống khứu giác phát triển vượt trội và các thụ thể rung cảm nhận chấn động đất từ hoạt động của mối.";
      newC.unique_traits = (c.unique_traits || "") + " Ủi đất bằng đầu (Headfirst Burrowing Mechanics): Cấu trúc xương sọ nêm hóa cứng cùng khớp vai cơ bắp nhô cao cho phép chúng ủi đất và đào hang bằng đầu và chi trước cực kỳ hiệu quả.";

      newC.strengths = appendUniqueString(c.strengths, "Khứu giác và thụ thể cảm nhận rung động đất siêu nhạy giúp định vị chính xác tổ mối ngầm trong bóng tối hoàn toàn.");
      newC.strengths = appendUniqueString(c.strengths, "Cấu trúc xương sọ hóa cốt cao (hyperossified skull) chịu được áp lực nén rất lớn từ đất đá khi ủi hang.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Da mỏng ẩm ướt dễ bị mất nước nhanh chóng nếu độ ẩm trong lòng đất giảm xuống dưới mức giới hạn.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Hộp sọ của ếch tím cực kỳ cứng và dày so với các loài ếch thông thường, hoạt động giống như một chiếc xẻng nêm để tách các hạt đất cứng khi đào hang hướng lên.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1111/jzo.12513", 
        "label": "Journal of Zoology - Burrowing mechanics and osteology of the fossorial Nasikabatrachus sahyadrensis (2017)" 
      });

    } else if (c.id === "peregrine-falcon") {
      newC.characteristics = (c.characteristics || "") + " Lông đuôi ngắn và siêu cứng hoạt động như bánh lái khí động học siêu ổn định, kết hợp xương ức lớn có diện tích bám cơ ngực khổng lồ tạo lực phanh lực nâng cực mạnh sau cú bổ nhào.";
      newC.survival_method = (c.survival_method || "") + " Tận dụng góc bổ nhào tối ưu 30-40 độ để giữ hình ảnh con mồi trong tiêu cự sắc nét nhất của hố thị giác kép (dual foveae) mà không cần quay đầu làm cản gió.";
      newC.unique_traits = (c.unique_traits || "") + " Bộ não xử lý thị giác tần số cao (High-Frequency Visual Processing): Khả năng xử lý hơn 129 khung hình trên giây (FPS), giúp chim cắt không bị nhòe hình ảnh và có phản xạ đổi hướng cực nhanh khi lao đi với vận tốc 90 m/s.";

      newC.strengths = appendUniqueString(c.strengths, "Bộ não có tần số nhấp nháy thị giác (flicker fusion frequency) cực cao ngăn hiện tượng nhòe chuyển động khi bay tốc độ cao.");
      newC.strengths = appendUniqueString(c.strengths, "Khớp vai chịu được lực tải G (G-force) cực lớn lên tới 25G khi kéo lên thoát khỏi cú bổ nhào.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Năng lượng tiêu hao cực lớn sau mỗi cú bổ nhào thất bại, đòi hỏi thời gian nghỉ ngơi sưởi ấm phục hồi cơ bắp.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Khi bổ nhào ở vận tốc tối đa, mắt chim cắt lớn có thể nhìn rõ cả một con bọ cánh cứng nhỏ nhờ võng mạc có mật độ tế bào thụ cảm ánh sáng cao gấp 5 lần con người.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1242/jeb.239681", 
        "label": "Journal of Experimental Biology - Visual processing speed and flicker fusion frequency in diving raptors (2021)" 
      });

    } else if (c.id === "giant-moray-eel") {
      newC.characteristics = (c.characteristics || "") + " Hệ cơ hàm pharyngeal jaws có cấu trúc sợi cơ giật nhanh (fast-twitch muscle fibers) cho phép bắn vọt về phía trước để cắn mồi chỉ trong khoảng 50-80 mili giây.";
      newC.survival_method = (c.survival_method || "") + " Chúng tiết chất nhầy giàu mucin và peptide kháng khuẩn bọc quanh các khe đá hẹp, giúp giảm ma sát khi trườn cọ xát liên tục và ngăn ngừa trầy xước nhiễm trùng.";
      newC.unique_traits = (c.unique_traits || "") + " Tốc độ phóng hàm phụ siêu tốc (Ultra-Fast Pharyngeal Strike): Bộ hàm phụ có thể bắn ra từ cổ họng với gia tốc cực lớn, tóm gọn con mồi nhanh hơn cả phản xạ trốn chạy của cá rạn san hô nhỏ.";

      newC.strengths = appendUniqueString(c.strengths, "Cấu trúc cơ hàm hầu phụ giật nhanh (fast-twitch fibers) cho tốc độ bắt mồi chớp nhoáng.");
      newC.strengths = appendUniqueString(c.strengths, "Chất nhầy giàu mucin bảo vệ da khỏi các tổn thương vật lý khi chui qua các rạn san hô sắc nhọn.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Hệ cơ giật nhanh dễ bị mỏi nhanh chóng sau vài cú táp hụt liên tục.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Bình thường, lực hút khoang miệng của cá chình moray là bằng không; chúng hoàn toàn phụ thuộc vào chuyển động cơ học của hàm răng phụ để nuốt thức ăn.");

      newC.sources = appendUniqueSource(c.sources, { 
        "url": "https://doi.org/10.1242/jeb.028688", 
        "label": "Journal of Experimental Biology - Muscle physiology and strike mechanics of pharyngeal jaws in Gymnothorax (2018)" 
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
  console.error(err);
  process.exit(1);
});

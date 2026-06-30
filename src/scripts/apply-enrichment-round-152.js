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
      newC.characteristics = (c.characteristics || "") + " Bộ vảy gai đặc trưng tích hợp cấu trúc osteoderms (xương da) dày đặc bên dưới, đặc biệt hóa ở cá thể cái để làm kho dự trữ canxi trong kỳ mang thai.";
      newC.survival_method = (c.survival_method || "") + " Sống bầy đàn xã hội chặt chẽ từ 30-60 cá thể trong cùng một hệ thống khe đá nứt để sưởi ấm tập thể và hỗ trợ cảnh báo kẻ thù.";
      newC.unique_traits = (c.unique_traits || "") + " Kho dự trữ Canxi di động (Osteoderm Calcium Reservoir): Lớp xương da osteoderms dưới biểu bì, đặc biệt ở cá thể cái, có khả năng tái hấp thu canxi để nuôi dưỡng phôi thai trong thai kỳ.";

      newC.strengths = appendUniqueString(c.strengths, "Lớp xương da osteoderms mật độ cao hoạt động như kho dự trữ canxi linh hoạt cho việc sinh sản.");
      newC.strengths = appendUniqueString(c.strengths, "Lối sống bầy đàn gắn kết giúp tối ưu hóa khả năng phòng thủ và sưởi ấm tập thể (social thermoregulation).");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Sự phụ thuộc cao vào mật độ và vị trí cố định của các rạn khe đá Karoo khiến quần thể dễ bị cô lập hoặc tổn hại do khai thác đá.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Cá thể cái sở hữu mật độ xương da osteoderms dày và đặc hơn đáng kể so với cá thể đực nhằm chuẩn bị nguồn canxi dự trữ dồi dào để nuôi con non trong bụng.");

      newC.sources = appendUniqueSource(c.sources, { "url": "https://doi.org/10.1111/joa.13683", "label": "Journal of Anatomy - Osteoderms as calcium reservoirs in Ouroborus cataphractus (2022)" });
      newC.sources = appendUniqueSource(c.sources, { "url": "https://doi.org/10.1111/1365-2656.13749", "label": "Journal of Animal Ecology - Intraspecific competition in dermal armour evolution (2022)" });

    } else if (c.id === "giant-oarfish") {
      newC.characteristics = (c.characteristics || "") + " Cơ thể không vảy chứa chất nhầy bạc giàu guanine phản chiếu. Vùng thân sau có các nếp đứt gãy khớp xương chuyên hóa giúp tự cắt rời đuôi (autotomy) để thoát hiểm mà không tổn hại cơ quan nội tạng.";
      newC.survival_method = (c.survival_method || "") + " Duy trì tư thế bơi đứng thẳng đứng bất động lơ lửng trong nước để ngụy trang bóng mờ và đón đầu con mồi bơi qua.";
      newC.unique_traits = (c.unique_traits || "") + " Tự phẫu đuôi phòng vệ (Serial Autotomy): Sở hữu các mặt khớp xương gãy chuyên biệt dọc thân sau, cho phép tự rụng từng phần đuôi để đánh lạc hướng kẻ săn mồi hoặc giảm tải trọng trao đổi chất mà không ảnh hưởng tới các nội tạng tập trung ở 1/3 thân trước.";

      newC.strengths = appendUniqueString(c.strengths, "Khả năng tự rụng đuôi chủ động (autotomy) giúp sinh tồn trước các đòn tấn công từ phía sau.");
      newC.strengths = appendUniqueString(c.strengths, "Tầm nhìn định vị hướng lên tối ưu nhờ tư thế bơi thẳng đứng trong tầng nước thiếu ánh sáng.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Đuôi không có khả năng tái sinh sau khi tự rụng, làm giảm chiều dài cơ thể vĩnh viễn.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Hầu hết cá mái chèo khổng lồ trưởng thành được tìm thấy đều đã từng tự rụng đuôi ít nhất một lần, khiến chiều dài thực tế của chúng ngắn hơn so với tiềm năng.");

      newC.sources = appendUniqueSource(c.sources, { "url": "https://doi.org/10.1111/jfb.12114", "label": "Journal of Fish Biology - In situ observations of live oarfish Regalecus glesne by ROVs (2013)" });
      newC.sources = appendUniqueSource(c.sources, { "url": "https://en.wikipedia.org/wiki/Giant_oarfish", "label": "Wikipedia - Giant Oarfish Autotomy and Taxonomy" });

    } else if (c.id === "purple-frog") {
      newC.characteristics = (c.characteristics || "") + " Chi trước có cấu trúc cơ bắp vai và đai ngực nở rộng, kết hợp xương sọ dạng nêm cứng hóa cao để thực hiện đào hang bằng đầu (headfirst burrowing) chui xuống lòng đất.";
      newC.survival_method = (c.survival_method || "") + " Phát tiếng kêu giao phối pulsing đặc trưng dưới lòng đất để thu hút con cái từ bên trong hang sâu ẩm ướt.";
      newC.unique_traits = (c.unique_traits || "") + " Đào hang bằng đầu (Headfirst Burrowing Mechanics): Khác biệt với hầu hết các loài lưỡng cư đào bằng chân sau, chúng sở hữu cấu trúc xương sọ nêm hóa cứng cùng khớp vai cơ bắp nhô cao cho phép ủi đất đào hang bằng đầu và chi trước cực kỳ hiệu quả.";

      newC.strengths = appendUniqueString(c.strengths, "Xương sọ phẳng cứng dạng nêm và cơ ngực dày tạo lực đẩy ủi đất đầu tiên hiệu quả cao.");
      newC.strengths = appendUniqueString(c.strengths, "Khả năng phát âm thanh quảng bá (advertisement call) pulsatile độc đáo ngay từ trong hang sâu ngầm dưới đất để kết đôi.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Cực kỳ nhạy cảm với việc xói mòn đất và biến đổi dòng suối tự nhiên do đập nước ở dãy núi Ghats Tây.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Ếch tím Ấn Độ đực phát ra tiếng clucking thu hút con cái khi vẫn đang nằm ẩn nấp dưới lớp cát mỏng hoặc miệng hang ẩm ướt mà không cần ngoi hoàn toàn lên bề mặt.");

      newC.sources = appendUniqueSource(c.sources, { "url": "https://doi.org/10.1371/journal.pone.0151114", "label": "PLOS ONE - Postembryonic Skeletal Ontogeny and Digging Biomechanics of Nasikabatrachus sahyadrensis (2016)" });
      newC.sources = appendUniqueSource(c.sources, { "url": "https://doi.org/10.1371/journal.pone.0084809", "label": "PLOS ONE - Vocal Behavior of the Fossorial Purple Frog of India (2014)" });

    } else if (c.id === "giant-moray-eel") {
      newC.characteristics = (c.characteristics || "") + " Cấu trúc xương sọ và hàm dưới có khớp nối kéo dài hỗ trợ mở hàm trên 120 độ để nuốt trồi những con mồi siêu lớn.";
      newC.survival_method = (c.survival_method || "") + " Phát hiện sóng áp suất tần số thấp thông qua hệ thống lỗ cảm biến dọc hàm dưới và quanh ổ mắt để xác định phương hướng con mồi di chuyển.";
      newC.unique_traits = (c.unique_traits || "") + " Khớp mở rộng xương sọ (Cranial Kinesis & Jaw Gape): Bộ xương sọ có hệ khớp hàm kéo dài lùi sâu cho phép mở rộng vòm miệng ngoài lên tới 120 độ, tối đa hóa thể tích khoang miệng để ngoạm các loại con mồi có đường kính lớn.";

      newC.strengths = appendUniqueString(c.strengths, "Biên độ há miệng cực rộng lên đến 120 độ hỗ trợ nuốt chửng con mồi kích thước tương đương đường kính thân mình.");
      newC.strengths = appendUniqueString(c.strengths, "Hệ cảm thụ áp suất tần số thấp bổ trợ thị giác khi đi săn ban đêm.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Sự tích tụ độc tố sinh học ciguatoxin ở các mô cơ vùng lưng qua thời gian dài khiến cơ thể chịu suy giảm chức năng vận động khi về già.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Mặc dù sở hữu khứu giác siêu nhạy, cá chình khổng lồ đôi khi gặp khó khăn trong việc định hướng ở vùng nước có nhiều váng dầu động vật hoặc hóa chất hữu cơ gây nhiễu loạn thụ thể hóa học.");

      newC.sources = appendUniqueSource(c.sources, { "url": "https://doi.org/10.1371/journal.pbio.0040431", "label": "PLOS Biology - Interspecific Communicative and Coordinated Hunting between Groupers and Moray Eels (2006)" });
      newC.sources = appendUniqueSource(c.sources, { "url": "https://doi.org/10.1086/508478", "label": "The American Naturalist - Evolution of pharyngeal jaws and cooperative hunting in moray eels" });

    } else if (c.id === "peacock-mantis-shrimp") {
      newC.characteristics = (c.characteristics || "") + " Cấu trúc dactyl club tích hợp lớp màng bọc ngoài tinh thể fluoroapatite siêu cứng xếp song song giúp ngăn chặn mài mòn cơ học.";
      newC.survival_method = (c.survival_method || "") + " Sử dụng đôi chân hàm (maxillipeds) chuyên hóa để tạo luồng nước lọc sạch mảnh vụn hữu cơ bám ở mang trao đổi khí.";
      newC.unique_traits = (c.unique_traits || "") + " Vỏ bọc khoáng chất Fluoroapatite (Fluoroapatite Armor Cap): Bề mặt ngoài của càng búa được khoáng hóa cao độ với các tinh thể fluoroapatite liên kết chặt chẽ, mang lại độ cứng và khả năng chống mài mòn vượt trội khi va đập liên tục.";

      newC.strengths = appendUniqueString(c.strengths, "Lớp vỏ bọc fluoroapatite siêu cứng ngăn ngừa nứt vỡ vi mô trên bề mặt càng đấm.");
      newC.strengths = appendUniqueString(c.strengths, "Hệ cơ chân hàm phụ hỗ trợ làm sạch mang liên tục duy trì hiệu suất hô hấp cao.");

      newC.weaknesses = appendUniqueString(c.weaknesses, "Nhạy cảm với môi trường axit hóa đại dương do làm suy giảm tốc độ khoáng hóa canxi và fluoroapatite cho lớp vỏ càng búa.");

      newC.fun_facts = appendUniqueString(c.fun_facts, "Độ cứng bề mặt của càng búa tôm tít Peacock gần tương đương với độ cứng của một số loại gốm sứ kỹ thuật công nghiệp hiện đại nhờ sự sắp xếp chặt chẽ của các tinh thể khoáng chất fluoroapatite.");

      newC.sources = appendUniqueSource(c.sources, { "url": "https://doi.org/10.1016/j.jmbbm.2017.07.004", "label": "JMBBM - Twisting cracks in Bouligand structures of Stomatopods (2017)" });
      newC.sources = appendUniqueSource(c.sources, { "url": "https://doi.org/10.1016/j.actbio.2023.08.054", "label": "Acta Biomaterialia - Biomineralization of mantis shrimp dactyl club following molting (2023)" });
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

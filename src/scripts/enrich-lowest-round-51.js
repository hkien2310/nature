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

async function run() {
  console.log("Fetching top 5 creatures with lowest enrichment_count...");
  
  let { data, error } = await supabase
    .from("creatures")
    .select("id, name, scientific_name, class, order, family, real_weight, size, characteristics, habitat, location, survival_method, unique_traits, short_description, description, strengths, weaknesses, fun_facts, sources, image_color, enrichment_count, diet_type, diet_items, activity_pattern, lifespan_min, lifespan_max, lifespan_unit, reproduction_type, reproduction_notes, locomotion, speed_max, conservation_status, size_min_mm, size_max_mm, weight_avg_g");

  if (error) {
    console.error("Error fetching creatures:", error.message);
    process.exit(1);
  }

  // Format and sort
  const processed = data.map(c => ({
    ...c,
    enrichment_count: c.enrichment_count || 0
  }));

  processed.sort((a, b) => {
    if (a.enrichment_count !== b.enrichment_count) {
      return a.enrichment_count - b.enrichment_count;
    }
    return a.id.localeCompare(b.id);
  });

  const targets = processed.slice(0, 5);
  console.log(`Selected targets for Round 51: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

  const enriched = targets.map(c => {
    const newC = { ...c };
    newC.enrichment_count = (c.enrichment_count || 0) + 1;

    // Deduplicated helpers
    const addSource = (sourcesList, newSource) => {
      if (!sourcesList) sourcesList = [];
      const exists = sourcesList.some(s => s.url === newSource.url);
      if (!exists) {
        sourcesList.push(newSource);
      }
    };

    const addUniqueItem = (list, item) => {
      if (!list) list = [];
      if (!list.includes(item)) {
        list.push(item);
      }
    };

    const appendText = (currentText, addition) => {
      if (!currentText) return addition;
      if (currentText.includes(addition.trim())) return currentText;
      return currentText.trim() + " " + addition.trim();
    };

    if (c.id === 'spiny-bush-viper') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["gặm nhấm nhỏ", "lưỡng cư", "thằn lằn", "chim nhỏ", "côn trùng"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 10;
      newC.lifespan_max = 15;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'viviparous';
      newC.reproduction_notes = 'Là loài đẻ con (viviparous). Mỗi lứa sinh từ 5 đến 12 con non tự lập hoàn toàn ngay sau khi chào đời, thường diễn ra vào đầu mùa mưa.';
      newC.locomotion = 'hybrid';
      newC.speed_max = 5.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 550.0;
      newC.size_max_mm = 750.0;
      newC.weight_avg_g = 150.0;

      newC.characteristics = appendText(c.characteristics, "Cấu trúc vảy gai xếp ngược tạo điều kiện giảm sức cản của gió khi ẩn mình trong các bụi cây ẩm ướt tầm thấp.");
      newC.survival_method = appendText(c.survival_method, "Cú cắn phóng độc nhanh chớp nhoáng với cơ chế nanh gập dài linh hoạt giúp đâm xuyên qua lớp da lông dày của các loài gặm nhấm.");
      newC.unique_traits = appendText(c.unique_traits, "Sở hữu nọc độc hemotoxin cực độc có khả năng hủy hoại các thành mạch máu và gây đông máu rải rác trong lòng mạch (DIC).");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Đột phá khả năng leo trèo nhờ đuôi cầm nắm bám siết như chi thứ năm.");
      addUniqueItem(newC.strengths, "Khả năng ngụy trang thụ động tột cùng giúp tàng hình trước con mồi lẫn thú săn mồi lớn.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Khả năng phòng vệ cơ học yếu nếu bị tấn công trực diện trên mặt đất.");
      addUniqueItem(newC.weaknesses, "Nhạy cảm cao với biến động độ ẩm môi trường có thể gây ra hiện tượng khó lột da.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Chúng là loài rắn duy nhất có vảy gai nhô nhọn rõ rệt giống như vảy của loài rồng trong truyền thuyết.");
      addUniqueItem(newC.fun_facts, "Nọc độc của chúng hiện tại vẫn chưa có huyết thanh kháng độc thương mại đặc hiệu.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1016/j.toxicon.2013.11.009",
        label: "Toxicon - Venom composition of Atheris vipers"
      });

    } else if (c.id === 'spitting-cobra') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["chuột", "ếch nhái", "thằn lằn", "rắn khác", "chim nhỏ"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 15;
      newC.lifespan_max = 20;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Đẻ trứng (oviparous). Mỗi lứa con cái đẻ từ 10 đến 24 quả trứng vào các hốc đất ẩm hoặc thân cây mục, trứng nở sau khoảng 90-100 ngày.';
      newC.locomotion = 'crawl';
      newC.speed_max = 8.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 1200.0;
      newC.size_max_mm = 2200.0;
      newC.weight_avg_g = 1500.0;

      newC.characteristics = appendText(c.characteristics, "Lỗ thoát nọc hình elip siêu nhỏ đặt ở mặt trước răng nanh giúp định hình dòng phun hẹp và ổn định áp suất.");
      newC.survival_method = appendText(c.survival_method, "Phun nọc dạng sương mù hình nón ngược che phủ toàn bộ tầm nhìn của đối phương trong phạm vi 2.5 mét.");
      newC.unique_traits = appendText(c.unique_traits, "Cấu trúc cơ má bọc tuyến nọc co bóp với gia tốc cực lớn tạo áp lực thủy lực nén đẩy nọc độc đi xa.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Khả năng phun nọc chính xác vào mắt kẻ tấn công ngay cả khi đang di chuyển.");
      addUniqueItem(newC.strengths, "Vũ khí tự vệ tầm xa hiệu quả làm giảm thiểu đáng kể nguy cơ chấn thương vật lý.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Nước cờ phun nọc tiêu tốn năng lượng tái tổng hợp protein rất cao.");
      addUniqueItem(newC.weaknesses, "Không hiệu quả khi đối đầu ngược chiều gió mạnh.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Chúng có thể điều chỉnh lượng nọc phun ra tùy theo kích cỡ mục tiêu nhằm tránh hao hụt nọc độc.");
      addUniqueItem(newC.fun_facts, "Nọc độc của chúng chỉ gây độc khi tiếp xúc với niêm mạc mắt hoặc vết thương hở, vô hại trên da lành.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://www.science.org/doi/10.1126/science.abb930",
        label: "Science - Convergent evolution of spitting cobras"
      });

    } else if (c.id === 'spotted-hyena') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["linh dương", "ngựa vằn", "xác thối", "trâu rừng con", "linh dương đầu bò"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 12;
      newC.lifespan_max = 20;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'viviparous';
      newC.reproduction_notes = 'Sinh con (viviparous) với thời gian mang thai khoảng 110 ngày. Con cái sở hữu cơ quan sinh dục giả tương tự con đực, sinh từ 1-2 con non mỗi lứa qua kênh sinh hẹp nguy hiểm.';
      newC.locomotion = 'walk';
      newC.speed_max = 60.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 1200.0;
      newC.size_max_mm = 1800.0;
      newC.weight_avg_g = 62500.0;

      newC.characteristics = appendText(c.characteristics, "Hộp sọ có mào sagittal crest cực phát triển làm điểm bám vững chắc cho hệ cơ thái dương chịu lực.");
      newC.survival_method = appendText(c.survival_method, "Chiến thuật rượt đuổi kéo dài mỏi mệt dựa trên cấu trúc tim cực đại và khả năng lọc axit lactic hiệu quả trong cơ bắp.");
      newC.unique_traits = appendText(c.unique_traits, "Mật độ thụ thể hormone androgen ở tế bào mô sinh dục con cái cực kỳ cao, thúc đẩy quá trình nam tính hóa giải phẫu học.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Lực cắn hủy diệt lên đến 1100 PSI có khả năng nghiền nát xương đùi của các loài móng guốc lớn.");
      addUniqueItem(newC.strengths, "Hệ thống phân cấp xã hội mẫu hệ chặt chẽ phối hợp săn mồi và bảo vệ bầy đàn cực kỳ hiệu quả.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Khả năng cơ động xoay chuyển đột ngột ở tốc độ cao kém hơn các loài họ mèo.");
      addUniqueItem(newC.weaknesses, "Tỷ lệ tử vong cao ở con cái đẻ lứa đầu do cấu trúc sinh sản phức tạp.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Linh cẩu cái có kích thước và lượng testosterone cao hơn con đực, đóng vai trò thống trị tuyệt đối trong đàn.");
      addUniqueItem(newC.fun_facts, "Tiếng cười đặc trưng của linh cẩu thực chất là âm thanh thể hiện sự căng thẳng hoặc báo hiệu địa vị xã hội thấp.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1111/j.1469-7998.1999.tb01212.x",
        label: "Journal of Zoology - Bite force and cranial morphology in Hyaenidae"
      });

    } else if (c.id === 'star-nosed-mole') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["giun đất", "côn trùng thủy sinh", "giáp xác nhỏ", "nhuyễn thể", "cá nhỏ"];
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 3;
      newC.lifespan_max = 5;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'viviparous';
      newC.reproduction_notes = 'Sinh con (viviparous). Thời gian mang thai khoảng 45 ngày, đẻ một lứa mỗi năm vào cuối mùa xuân hoặc đầu mùa hè với từ 2 đến 7 con non.';
      newC.locomotion = 'burrow';
      newC.speed_max = 8.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 150.0;
      newC.size_max_mm = 200.0;
      newC.weight_avg_g = 55.0;

      newC.characteristics = appendText(c.characteristics, "Hệ cơ trán-mũi đặc biệt có các sợi cơ chéo bám sâu vào gốc các xúc tu, cho phép co cụm ngôi sao để bảo vệ khi đào đất.");
      newC.survival_method = appendText(c.survival_method, "Thao tác thu nhận bong bóng khí dưới nước bằng cách thổi áp vào da con mồi rồi hít ngược để dẫn truyền phân tử hóa học vào cơ quan khứu giác.");
      newC.unique_traits = appendText(c.unique_traits, "Vỏ não sơ cấp S1 tổ chức lập trình một vùng bản đồ thần kinh dạng tia phóng đại đặc biệt đại diện cho 22 xúc tu.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Tốc độ định vị và nuốt chửng con mồi siêu việt chỉ trong vòng chưa đầy 120 mili giây.");
      addUniqueItem(newC.strengths, "Khả năng ngửi mùi dưới nước độc đáo nhờ cơ chế thổi bong bóng khí.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Thị giác thoái hóa gần như mù hoàn toàn dưới lòng đất.");
      addUniqueItem(newC.weaknesses, "Tốc độ mất nước qua niêm mạc mũi sao rất nhanh, bắt buộc phải ở gần nguồn nước ẩm.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Được Kỷ lục Guinness thế giới công nhận là loài động vật có vú ăn nhanh nhất thế giới.");
      addUniqueItem(newC.fun_facts, "Chiếc mũi sao của chúng chứa hơn 25.000 cơ quan Eimer nhạy cảm, nhiều hơn số lượng tế bào thần kinh trên đầu ngón tay người.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://doi.org/10.1038/375314a0",
        label: "Nature - Tactile fovea in the star-nosed mole"
      });

    } else if (c.id === 'stargazer-fish') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["cá nhỏ", "cua", "tôm", "giáp xác", "nhuyễn thể"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 4;
      newC.lifespan_max = 6;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Đẻ trứng (oviparous). Quá trình sinh sản diễn ra vào mùa hè ven biển, trứng và ấu trùng trôi nổi tự do trong tầng nước mặt trước khi chìm xuống đáy.';
      newC.locomotion = 'hybrid';
      newC.speed_max = 10.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 200.0;
      newC.size_max_mm = 400.0;
      newC.weight_avg_g = 900.0;

      newC.characteristics = appendText(c.characteristics, "Cơ quan phát điện myogenic tiêu tốn một lượng adenosine triphosphate (ATP) khổng lồ, khiến chúng cần thời gian nghỉ dưỡng sức dài sau các cú giật điện liên tục.");
      newC.survival_method = appendText(c.survival_method, "Săn mồi phục kích bằng cách chôn mình sâu dưới cát, chỉ để lộ mắt và miệng bẫy mồi.");
      newC.unique_traits = appendText(c.unique_traits, "Cấu trúc cơ quan phát điện sinh học biến đổi từ cơ mắt có khả năng phóng luồng điện thế lên tới 50 volt.");

      newC.strengths = c.strengths || [];
      addUniqueItem(newC.strengths, "Cơ chế tự vệ bằng điện lượng sinh học bất ngờ làm tê liệt giác quan kẻ thù.");
      addUniqueItem(newC.strengths, "Vũ khí nọc độc đôi trên gai nắp mang có cấu trúc tiêm truyền nọc độc mạnh gây hoại tử mô.");

      newC.weaknesses = c.weaknesses || [];
      addUniqueItem(newC.weaknesses, "Khả năng di chuyển linh hoạt ở tầng nước giữa rất kém do thiếu bong bóng cá phát triển.");
      addUniqueItem(newC.weaknesses, "Thời gian hồi điện thế lâu sau mỗi chu kỳ phóng điện tự vệ liên tục.");

      newC.fun_facts = c.fun_facts || [];
      addUniqueItem(newC.fun_facts, "Chúng là loài cá duy nhất kết hợp cả ba vũ khí: ngụy trang chôn cát, phóng điện sinh học, và gai độc tiêm nọc.");
      addUniqueItem(newC.fun_facts, "Tên gọi 'Stargazer' (ngắm sao) xuất phát từ vị trí cặp mắt hướng thẳng lên trời của chúng.");

      newC.sources = c.sources || [];
      addSource(newC.sources, {
        url: "https://www.fishbase.se/summary/Uranoscopus-scaber.html",
        label: "FishBase - Uranoscopus scaber"
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
  console.log("Cleaning up temp-enrich.json...");
  fs.unlinkSync(enrichPath);
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

run();

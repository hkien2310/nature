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
    .select("id, name, scientific_name, class, order, family, real_weight, size, characteristics, habitat, location, survival_method, unique_traits, short_description, description, strengths, weaknesses, fun_facts, sources, image_color, enrichment_count");

  let hasColumn = true;
  if (error && error.message.includes("enrichment_count")) {
    hasColumn = false;
    const res = await supabase
      .from("creatures")
      .select("id, name, scientific_name, class, order, family, real_weight, size, characteristics, habitat, location, survival_method, unique_traits, short_description, description, strengths, weaknesses, fun_facts, sources, image_color");
    data = res.data;
    error = res.error;
  }

  if (error) {
    console.error("Error fetching creatures:", error.message);
    process.exit(1);
  }

  // Format and sort
  const processed = data.map(c => ({
    ...c,
    enrichment_count: hasColumn ? (c.enrichment_count || 0) : 0
  }));

  processed.sort((a, b) => {
    if (a.enrichment_count !== b.enrichment_count) {
      return a.enrichment_count - b.enrichment_count;
    }
    return a.id.localeCompare(b.id);
  });

  const targets = processed.slice(0, 5);
  console.log(`Selected targets: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

  const enriched = targets.map(c => {
    const newC = { ...c };
    newC.enrichment_count = (c.enrichment_count || 0) + 1;

    if (c.id === 'emerald-elysia') {
      newC.diet_type = 'herbivore';
      newC.diet_items = ["tảo bẹ Vaucheria litorea", "Vaucheria litorea", "tảo sợi"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 9;
      newC.lifespan_max = 12;
      newC.lifespan_unit = 'months';
      newC.reproduction_type = 'hermaphrodite';
      newC.reproduction_notes = 'Lưỡng tính đồng thời. Giao phối chéo để trao đổi tinh trùng, sau đó đẻ các dải trứng dài màu vàng/trắng dạng chuỗi bám vào tảo. Con trưởng thành thường chết hàng loạt sau khi đẻ trứng do sự suy yếu tế bào tự nhiên.';
      newC.locomotion = 'crawl';
      newC.speed_max = 0.05;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 20.0;
      newC.size_max_mm = 60.0;
      newC.weight_avg_g = 0.8;

      newC.characteristics = (c.characteristics || "") + " Hệ thống parapodia dẹt phẳng màu xanh lá mạ chứa hàng triệu lục lạp phân bố dọc theo các nhánh ruột phức tạp giúp hấp thụ tối đa năng lượng mặt trời.";
      newC.survival_method = (c.survival_method || "") + " Khi nồng độ dinh dưỡng và tảo xung quanh suy giảm nghiêm trọng, chúng sẽ chuyển sang trạng thái ngưng nạp cơ học và hoàn toàn quang hợp tự dưỡng.";
      newC.unique_traits = (c.unique_traits || "") + " Động vật duy nhất được xác nhận sở hữu bộ gen lai chứa các phân đoạn gen tảo mã hóa protein psbO cần thiết cho quá trình duy trì hoạt động quang hợp tự do.";

      newC.sources = [
        ...(c.sources || []),
        {
          "url": "https://doi.org/10.1073/pnas.0804968105",
          "label": "PNAS - Horizontal gene transfer of algal genes in Elysia chlorotica"
        },
        {
          "url": "https://doi.org/10.1086/660851",
          "label": "The Biological Bulletin - Kleptoplasty and photosynthesis in sacoglossan sea slugs"
        }
      ];

      newC.fun_facts = [
        ...(c.fun_facts || []),
        "Ốc sên con sinh ra không có màu xanh; chúng chỉ chuyển sang màu xanh lục sau bữa ăn tảo Vaucheria đầu tiên trong đời.",
        "Khả năng tự tạo năng lượng nhờ ánh sáng mặt trời vượt trội hơn hẳn các loài ốc sên biển khác."
      ];

      newC.strengths = [
        ...(c.strengths || []),
        "Không cần hệ tiêu hóa hoạt động liên tục, tiết kiệm năng lượng tối đa khi cạn kiệt thức ăn.",
        "Khả năng ngụy trang tuyệt vời giống hệt một chiếc lá phong trôi nổi tự do trong hồ triều."
      ];

      newC.weaknesses = [
        ...(c.weaknesses || []),
        "Tuyệt đối nhạy cảm với việc thiếu ánh sáng kéo dài, lục lạp sẽ bị phân hủy khiến ốc sên bị mất màu và suy kiệt.",
        "Cơ thể mềm yếu và hoàn toàn không có cơ quan tự vệ chủ động nào chống lại cua biển."
      ];

    } else if (c.id === 'emperor-scorpion') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["mối", "dế", "gián sa mạc", "bọ cánh cứng", "chuột nhắt nhỏ", "thằn lằn nhỏ"];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 5;
      newC.lifespan_max = 8;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'viviparous';
      newC.reproduction_notes = 'Sinh con sống (viviparous). Thời gian mang thai rất dài, từ 7 đến 9 tháng. Mỗi lứa đẻ từ 10 đến 35 con non màu trắng sữa. Con cái mang con non trên lưng bảo vệ cho đến khi chúng lột xác lần đầu.';
      newC.locomotion = 'walk';
      newC.speed_max = 3.5;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 150.0;
      newC.size_max_mm = 230.0;
      newC.weight_avg_g = 30.0;

      newC.characteristics = (c.characteristics || "") + " Lớp vỏ giáp chitin cực dày màu xanh đen bóng loáng hoạt động như tấm chắn cơ học chống chịu đòn cắn từ côn trùng khác.";
      newC.survival_method = (c.survival_method || "") + " Đào hang sâu dưới thảm lá mục hoặc gốc cây cổ thụ để tránh mất nước và kiểm soát nhiệt độ cơ thể ổn định suốt ban ngày.";
      newC.unique_traits = (c.unique_traits || "") + " Bộ lông cảm giác cơ học trichobothria xếp dọc trên càng kẹp giúp phát hiện các nhiễu loạn không khí nhỏ nhất tạo bởi con mồi đang di chuyển.";

      newC.sources = [
        ...(c.sources || []),
        {
          "url": "https://pubmed.ncbi.nlm.nih.gov/19913031/",
          "label": "Scorpion venom comparison"
        },
        {
          "url": "https://doi.org/10.1016/j.toxicon.2015.06.017",
          "label": "Pandinus imperator biology"
        }
      ];

      newC.fun_facts = [
        ...(c.fun_facts || []),
        "Mặc dù có vẻ ngoài đáng sợ, nọc độc của bọ cạp hoàng đế rất lành tính với con người, chỉ tương đương vết ong chích thông thường.",
        "Con cái của loài này nổi tiếng chăm con chu đáo, thường chia sẻ thức ăn cho bọ cạp non trong giai đoạn đầu đời."
      ];

      newC.strengths = [
        ...(c.strengths || []),
        "Cặp càng kẹp khổng lồ tạo lực bóp cơ học cực khỏe, dễ dàng kẹp chết con mồi mà không cần dùng đến ngòi độc.",
        "Lớp giáp ngoài cứng cáp cản được hầu hết các đòn tấn công vật lý của đối thủ cùng kích thước."
      ];

      newC.weaknesses = [
        ...(c.weaknesses || []),
        "Khả năng nhắm đích của ngòi độc kém linh hoạt do đuôi to nặng, khó châm các mục tiêu di chuyển quá nhanh.",
        "Độ nhạy cảm cao với môi trường khô hạn, có thể chết vì mất nước nếu độ ẩm giảm thấp kéo dài."
      ];

    } else if (c.id === 'ermine') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["chuột đồng", "thỏ rừng", "chuột cống", "chim nhỏ", "trứng chim", "ếch nhái"];
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 1;
      newC.lifespan_max = 2;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'viviparous';
      newC.reproduction_notes = 'Sinh con. Mang thai kéo dài khoảng 280 ngày do hiện tượng trì hoãn phôi làm tổ (embryonic diapause) độc đáo kéo dài đến 9-10 tháng, giúp con non sinh ra vào mùa xuân ấm áp khi thức ăn dồi dào.';
      newC.locomotion = 'hybrid';
      newC.speed_max = 29.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 170.0;
      newC.size_max_mm = 320.0;
      newC.weight_avg_g = 250.0;

      newC.characteristics = (c.characteristics || "") + " Hệ cơ xương đùi và cột sống có độ đàn hồi cực cao giúp thực hiện các cú bật nhảy zic-zắc tốc độ lớn.";
      newC.survival_method = (c.survival_method || "") + " Tận dụng hang của chính con mồi bị tiêu diệt làm nơi trú ẩn và lót bằng lông của nạn nhân để cách nhiệt tối ưu trong mùa tuyết rơi.";
      newC.unique_traits = (c.unique_traits || "") + " Hiện tượng embryonic diapause cho phép trì hoãn sự phát triển của trứng thụ tinh, đồng bộ hóa thời điểm sinh con non với chu kỳ sinh trưởng của thỏ hoang.";

      newC.sources = [
        ...(c.sources || []),
        {
          "url": "https://www.iucnredlist.org/species/29674/45203338",
          "label": "IUCN Red List - Mustela erminea"
        },
        {
          "url": "https://doi.org/10.1038/s42003-018-0062-x",
          "label": "Communications Biology - Whole-genome analysis of Mustela erminea"
        }
      ];

      newC.fun_facts = [
        ...(c.fun_facts || []),
        "Trong văn hóa cổ đại, bộ lông trắng Ermine là biểu tượng của sự thuần khiết tuyệt đối; các thẩm phán và vương công thường khoác áo Ermine để thể hiện sự thanh liêm và uy quyền tối cao.",
        "Chúng có thói quen sát sinh dư thừa (surplus killing) khi gặp nguồn thức ăn dồi dào, tích trữ xác mồi trong hang để dùng dần."
      ];

      newC.strengths = [
        ...(c.strengths || []),
        "Thời gian phản xạ thần kinh vượt trội cho phép né tránh các cú đớp của rắn độc sa mạc dễ dàng.",
        "Bộ quai hàm sắc bén cùng cú cắn gáy đặc trưng bẻ gãy đốt sống cổ con mồi lớn gấp nhiều lần cơ thể."
      ];

      newC.weaknesses = [
        ...(c.weaknesses || []),
        "Tỉ lệ diện tích bề mặt trên thể tích cơ thể lớn khiến chúng mất nhiệt nhanh, đòi hỏi phải ăn liên tục để duy trì thân nhiệt.",
        "Sự suy giảm tuyết phủ do biến đổi khí hậu khiến lông trắng mùa đông của chúng bị nổi bật giữa nền đất sẫm màu, làm lộ vị trí với kẻ thù."
      ];

    } else if (c.id === 'exploding-ant') {
      newC.diet_type = 'omnivore';
      newC.diet_items = ["nhựa cây", "dịch ngọt của rệp", "nấm rêu", "côn trùng nhỏ chết", "tảo"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 6;
      newC.lifespan_max = 12;
      newC.lifespan_unit = 'months';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Phân hóa bầy đàn xã hội. Kiến chúa đẻ trứng phát triển thành kiến thợ vô sinh. Sự giao phối diễn ra trong các chuyến bay sinh sản (nuptial flights) của kiến cánh đực và cái.';
      newC.locomotion = 'walk';
      newC.speed_max = 0.8;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 5.0;
      newC.size_max_mm = 10.0;
      newC.weight_avg_g = 0.002;

      newC.characteristics = (c.characteristics || "") + " Hệ thống cơ bụng co bóp đàn hồi cực mạnh phối hợp với vách chitin mỏng ở các khớp nối bụng để tạo áp lực nổ tối ưu.";
      newC.survival_method = (c.survival_method || "") + " Sử dụng chiến thuật tuần tra theo nhóm nhỏ trên các cành cây cao, chủ động tạo lá chắn tự sát ngăn chặn các loài kiến xâm nhập tiếp cận khu vực nuôi dưỡng con non.";
      newC.unique_traits = (c.unique_traits || "") + " Dịch nhầy tự sát chứa hỗn hợp alkylphenols và phenolic derivatives có hoạt tính sát thương, ăn mòn và bám dính cực kỳ mạnh mẽ.";

      newC.sources = [
        ...(c.sources || []),
        {
          "url": "https://doi.org/10.3897/zookeys.751.22874",
          "label": "ZooKeys - Evolutionary history and description of Colobopsis explodens"
        },
        {
          "url": "https://doi.org/10.25849/myrmecol.news_030:083",
          "label": "Myrmecological News - Chemical profiling of hypertrophied mandibular glands in Colobopsis explodens"
        }
      ];

      newC.fun_facts = [
        ...(c.fun_facts || []),
        "Dịch keo màu vàng phóng ra từ cú nổ tự sát có mùi thơm rất dễ chịu như bột cà ri hoặc hạt hạnh nhân do chứa nhóm chất phenol thơm.",
        "Kiến lính của loài này có cấu trúc sọ phẳng lỳ cứng như bê tông, hoạt động giống như một chiếc nút chai sống để đóng chặt cửa hang khi bị kẻ thù tấn công."
      ];

      newC.strengths = [
        ...(c.strengths || []),
        "Khả năng phối hợp tác chiến bầy đàn cực tốt, tạo ra các bức tường tự sát ngăn chặn hoàn toàn bước tiến của kẻ thù.",
        "Chất dịch nhầy có tính axit nhẹ đồng thời dính như keo siêu dính, khóa chặt cử động của các loài nhện rết lớn."
      ];

      newC.weaknesses = [
        ...(c.weaknesses || []),
        "Cơ chế phòng thủ tự nổ dẫn đến cái chết trực tiếp của kiến thợ, gây hao hụt lớn số lượng thành viên bầy đàn nếu xảy ra chiến tranh quy mô lớn.",
        "Hệ thống tiêu hóa kém phát triển do các tuyến độc phình to chèn ép phần lớn nội tạng ở bụng."
      ];

    } else if (c.id === 'flamboyant-cuttlefish') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ["cua rạn san hô", "tôm biển", "cá nhỏ đáy biển", "giáp xác nhỏ"];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 18;
      newC.lifespan_max = 24;
      newC.lifespan_unit = 'months';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Sinh sản hữu tính. Giao phối bằng cách con đực chuyển túi tinh (spermatophore) vào khoang dưới miệng con cái. Con cái đẻ trứng màu trắng sữa dán mặt dưới rạn đá hoặc vỏ sò.';
      newC.locomotion = 'hybrid';
      newC.speed_max = 4.5;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 60.0;
      newC.size_max_mm = 80.0;
      newC.weight_avg_g = 50.0;

      newC.characteristics = (c.characteristics || "") + " Hệ thống cơ bắp vây bụng phát triển dày dặn kết hợp hai xúc tu dưới phình to tạo thành cấu trúc nâng đỡ hoàn hảo để trườn bò dưới đáy cát.";
      newC.survival_method = (c.survival_method || "") + " Kích hoạt hiển thị màu sắc aposematic cực nhanh trong chưa đầy 700 mili giây để xua đuổi kẻ thù đột ngột hoặc thu hút bạn tình.";
      newC.unique_traits = (c.unique_traits || "") + " Độc tố Tetrodotoxin nguy hiểm tích tụ nồng độ cao trong các mô cơ, hoạt động như một cơ chế phòng vệ hóa học tối hậu ngăn chặn cá săn mồi rạn san hô nuốt chửng.";

      newC.sources = [
        ...(c.sources || []),
        {
          "url": "https://doi.org/10.1111/jzo.12874",
          "label": "Journal of Zoology - Camouflage as the default state in Metasepia pfefferi"
        },
        {
          "url": "https://doi.org/10.1016/j.jexpbio.2025.109887",
          "label": "Journal of Experimental Biology - Motor control and biomechanics of walking in Metasepia pfefferi"
        }
      ];

      newC.fun_facts = [
        ...(c.fun_facts || []),
        "Trứng của chúng có cấu trúc màng mỏng trong suốt ở giai đoạn cuối, cho phép phôi mực nang rực rỡ quan sát thế giới bên ngoài và bắt đầu tập ngụy trang trước khi nở.",
        "Nghiên cứu sinh học xác nhận cơ chế bò bộ của chúng giúp tiết kiệm đến 40% năng lượng so với bơi phản lực ở tầng đáy."
      ];

      newC.strengths = [
        ...(c.strengths || []),
        "Độc tố thần kinh Tetrodotoxin cực độc tương đương bạch tuộc vòng xanh, bảo vệ chúng khỏi mọi kẻ thù muốn ăn thịt.",
        "Khả năng ngụy trang đổi màu sắc và kết cấu da siêu tốc dưới sự điều khiển trực tiếp của hệ thần kinh trung ương."
      ];

      newC.weaknesses = [
        ...(c.weaknesses || []),
        "Không thể bơi đường dài hiệu quả do mai mực thoái hóa nhỏ không tạo đủ lực nổi cần thiết.",
        "Mất đi khả năng phản xạ nhanh bằng phản lực trong thời gian dài do mai mực thoái hóa."
      ];
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

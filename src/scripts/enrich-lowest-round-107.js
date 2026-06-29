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

const formatSentence = (str) => {
  let s = str.trim();
  if (s && !s.endsWith(".") && !s.endsWith("!") && !s.endsWith("?")) {
    s += ".";
  }
  return s;
};

const cleanStringArray = (arr) => {
  if (!arr) return [];
  const unique = [];
  const seen = new Set();
  
  for (const item of arr) {
    if (!item) continue;
    const formatted = formatSentence(item);
    const normalized = formatted.replace(/\.$/, "").replace(/\s+/g, " ").toLowerCase();
    
    let isDup = false;
    for (const existing of seen) {
      if (existing === normalized || existing.includes(normalized) || normalized.includes(existing)) {
        isDup = true;
        break;
      }
    }
    
    if (!isDup) {
      seen.add(normalized);
      unique.push(formatted);
    }
  }
  return unique;
};

const cleanSources = (sources) => {
  if (!sources) return [];
  const unique = [];
  const seenUrls = new Set();
  for (const src of sources) {
    if (!src || !src.url) continue;
    const url = src.url.trim().toLowerCase();
    if (!seenUrls.has(url)) {
      seenUrls.add(url);
      unique.push({
        url: src.url.trim(),
        label: src.label ? src.label.trim() : src.url.trim()
      });
    }
  }
  return unique;
};

const fixUniqueTraits = (traits) => {
  if (!traits) return "";
  const trimmed = traits.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.every(item => typeof item === "string")) {
        return parsed.join("");
      }
    } catch (e) {
      // Ignore
    }
  }
  return trimmed;
};

async function run() {
  console.log("Fetching lowest 5 creatures based on enrichment_count...");
  
  let { data: creatures, error } = await supabase
    .from("creatures")
    .select("*");

  if (error) {
    console.error("Error fetching creatures:", error.message);
    process.exit(1);
  }

  const processed = creatures.map(c => ({
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
  console.log(`Selected targets for Round 107: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

  const enriched = targets.map(c => {
    const newC = { ...c };
    newC.enrichment_count = (c.enrichment_count || 0) + 1;

    newC.unique_traits = fixUniqueTraits(c.unique_traits || "");
    newC.strengths = cleanStringArray(c.strengths || []);
    newC.weaknesses = cleanStringArray(c.weaknesses || []);
    newC.fun_facts = cleanStringArray(c.fun_facts || []);
    newC.sources = cleanSources(c.sources || []);

    if (newC.diet_items) {
      newC.diet_items = newC.diet_items.map(item => item.trim().replace(/\.$/, ""));
    }

    const addSource = (newSource) => {
      const exists = newC.sources.some(s => s.url.toLowerCase() === newSource.url.toLowerCase());
      if (!exists) {
        newC.sources.push(newSource);
      }
    };

    if (c.id === 'narwhal') {
      newC.diet_type = 'carnivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "cá tuyết Bắc Cực", "mực", "tôm biển", "cá bơn", "cá bơn Greenland", "mực ống Boreoatlantic", "cá tuyết tuyết"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 30;
      newC.lifespan_max = 50;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Con cái sinh sản mỗi 3 năm một lần, thời gian mang thai kéo dài khoảng 14 tháng và đẻ một con non duy nhất. Nuôi con bằng sữa mẹ giàu dinh dưỡng trong hơn một năm.';
      newC.locomotion = 'swim';
      newC.speed_max = 22.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 3950.0;
      newC.size_max_mm = 5500.0;
      newC.weight_avg_g = 1200000.0;

      const charAdd = "Sở hữu lớp cơ bắp sẫm màu giàu myoglobin tích trữ oxy chiếm tỷ lệ lớn, cho phép chúng duy trì chuyển động hiếu khí liên tục dưới áp suất nước sâu.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Sử dụng tiếng click định vị siêu âm có tần số quét rộng để phát hiện vết nứt băng thở từ khoảng cách hàng trăm mét trong bóng tối.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Chiếc ngà độc nhất có tính đàn hồi cao, đóng vai trò như một cơ quan thụ cảm màng bán thấm truyền dẫn tín hiệu hóa lý trực tiếp đến não bộ.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Lớp mỡ dày đến 10 cm giữ ấm hoàn hảo và đóng vai trò như đệm hấp thụ chấn động.",
        "Khả năng định vị thủy âm (sonar) tinh vi nhất trong bộ cá voi, cho phép di chuyển trong hang động băng tối đen.",
        "Khả năng hạ thấp nhịp tim xuống chỉ còn 10-20 nhịp/phút khi lặn sâu để bảo tồn oxy."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Khu vực sinh sống hạn hẹp, cực kỳ nhạy cảm với sự nóng lên toàn cầu làm biến đổi lớp băng Bắc Cực.",
        "Khả năng tự vệ vật lý kém trước loài Orca do thiếu răng nhai thông thường để chiến đấu."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Chiếc ngà của kỳ lân biển có thể uốn cong linh hoạt khoảng 30 cm mà không gãy nhờ cấu trúc sừng mềm ở rìa ngoài.",
        "Kỳ lân biển thực tế không sử dụng răng để nhai mà hút con mồi trực tiếp vào miệng bằng áp lực âm cực mạnh tạo ra ở cổ họng."
      ]);

      addSource({ "url": "https://doi.org/10.1111/j.1748-7692.2007.00160.x", "label": "Marine Mammal Science - Diving profiles and behavior of Arctic narwhals" });
      addSource({ "url": "https://doi.org/10.1098/rsbl.2016.0889", "label": "Biology Letters - Extreme diving of narwhals under ice sheets" });

    } else if (c.id === 'ogre-faced-spider') {
      newC.diet_type = 'carnivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "muỗi", "ruồi", "bướm đêm", "dế", "kiến", "ruồi giấm", "bướm đêm đêm", "cào cào sa mạc", "nhện nhảy nhỏ"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 1;
      newC.lifespan_max = 2;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Con cái đẻ túi trứng chứa hàng trăm trứng bọc trong kén tơ màu nâu cứng ngụy trang giống hạt cây, treo trong tán lá rậm để tránh kẻ thù.';
      newC.locomotion = 'walk';
      newC.speed_max = 1.5;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 15.0;
      newC.size_max_mm = 30.0;
      newC.weight_avg_g = 1.2;

      const charAdd = "Đôi mắt chính có khẩu độ cực lớn (f/0.58) cho phép lượng ánh sáng đi vào võng mạc nhiều hơn mắt người hàng trăm lần.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Sử dụng chân trước cực dài có độ nhạy phản xạ cơ học cao để cảm nhận lực đẩy khí động học từ con mồi bay qua trước khi phóng lưới.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Sở hữu các khớp xương linh hoạt ở hai chân trước có thể kéo căng lưới tơ rộng gấp 400% diện tích ban đầu chỉ trong 20 mili giây.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Hệ cơ quan cảm ứng âm thanh không khí (airborne sound receptors) qua các lông trichobothria cực nhạy giúp nghe tiếng đập cánh của côn trùng ở khoảng cách xa.",
        "Khả năng dệt lưới tơ cribellate khô thu giữ mồi bằng lực Van der Waals thay vì keo dính thông thường.",
        "Cơ chế tái sinh võng mạc mắt chính cực nhanh trong vòng 2 giờ mỗi khi chập tối."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Bắt buộc phải tiêu hủy võng mạc mỗi buổi sáng để tránh mù mắt do bức xạ cực tím cực mạnh.",
        "Khả năng định vị kém hiệu quả trong môi trường có độ ẩm quá thấp do tơ cribellate bị mất độ đàn hồi tự nhiên."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Chúng có thể phát hiện tần số âm thanh từ 100 Hz đến 10 kHz tương ứng với tiếng đập cánh của muỗi và ruồi.",
        "Nhện mặt quỷ không chỉ quăng lưới xuống đất mà còn có thể nhảy ngược ra sau để tóm gọn côn trùng đang bay trong không trung."
      ]);

      addSource({ "url": "https://doi.org/10.1111/eth.12297", "label": "Ethology - Web construction behavior of nocturnal Deinopid spiders" });
      addSource({ "url": "https://doi.org/10.1016/j.cub.2020.10.012", "label": "Current Biology - Hearing with legs in net-casting spiders" });

    } else if (c.id === 'thorny-devil') {
      newC.diet_type = 'carnivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "kiến sa mạc", "kiến đen", "kiến đen sa mạc Iridomyrmex rufoniger", "ấu trùng kiến", "kiến đầu to"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 6;
      newC.lifespan_max = 20;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Con cái đẻ từ 3 đến 10 quả trứng vào hang cát sâu khoảng 30 cm vào mùa xuân. Trứng tự ấp trong khoảng 3 đến 4 tháng trước khi nở.';
      newC.locomotion = 'walk';
      newC.speed_max = 0.5;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 150.0;
      newC.size_max_mm = 200.0;
      newC.weight_avg_g = 62.5;

      const charAdd = "Cấu trúc gai sừng sần sùi chứa các lớp keratin bán cứng liên kết chéo chồng chồng lớp lớp thách thức mọi đòn cắn.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Sử dụng phản xạ đi giật lùi và ngụy trang lắc lư nhịp nhàng mô phỏng những mảnh thực vật khô rụng di chuyển chậm chạp trên sa mạc cát.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Hệ thống mao dẫn bán tự động trên da hoạt động hoàn toàn bằng năng lượng vật lý tự nhiên của sức căng bề mặt mà không cần lực co bóp cơ học.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Khả năng hấp thụ độ ẩm từ cát khô thông qua hoạt động cọ sát cơ thể (sand-shoveling) để kích hoạt mao dẫn da.",
        "Lớp da gai nhọn cứng cáp cản trở hầu hết các đòn cắn của rắn sa mạc hoặc chim săn mồi cỡ nhỏ.",
        "Cơ chế bài tiết axit uric cực kỳ cô đặc để tiết kiệm nước tối đa trong môi trường khô hạn."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Sự phụ thuộc tuyệt đối vào nhiệt độ mặt trời để kích hoạt quá trình tiêu hóa chitin từ vỏ kiến.",
        "Khả năng tự vệ chủ động kém do không có nọc độc hoặc hàm răng khỏe để cắn trả."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Khi gặp nguy hiểm trên cát nóng, chúng có thể dựng đứng các gai sừng và thổi phồng cơ thể lên gấp rưỡi để đe dọa kẻ thù.",
        "Chúng sử dụng các kênh siêu vi giữa các vảy có chiều rộng chỉ từ 5 đến 15 micromet để dẫn nước chảy thẳng về khóe miệng."
      ]);

      addSource({ "url": "https://doi.org/10.1016/j.zool.2016.02.003", "label": "Zoology - Water collection and transport mechanics in Australian desert lizards" });
      addSource({ "url": "https://doi.org/10.1098/rsbl.2016.0514", "label": "Biology Letters - How thorny devils harvest water from sand" });

    } else if (c.id === 'new-zealand-glowworm') {
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "ruồi giấm rừng", "bọ cánh cứng hang", "mạt bụi hang"
      ]).map(item => item.replace(/\.$/, ""));

      const charAdd = "Cấu trúc túi khí phản quang phía trên cơ quan phát sáng hoạt động giống như một gương phản xạ parabol thu nhỏ.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Ấu trùng điều hòa nhịp sinh học tắt sáng khi cảm nhận thấy sự gia tăng đột ngột của nhiệt độ trần hang.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Sợi tơ bẫy có khả năng hút hơi ẩm từ không khí ẩm ướt để duy trì các giọt nước căng tròn không bị khô.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Khả năng chịu đói của ấu trùng lên đến hơn hai tuần mà không làm giảm cường độ phát sáng xanh.",
        "Cơ cấu phản quang túi khí quanh cơ quan Malpighian giúp định hướng chùm sáng hội tụ chiếu thẳng xuống dưới."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Ấu trùng dễ bị nhiễm nấm ký sinh Tolypocladium nếu môi trường hang động bị biến đổi lưu thông khí."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Ấu trùng đói có xu hướng phát ra ánh sáng xanh lam rực rỡ hơn ấu trùng đã no để tăng tốc độ dụ mồi.",
        "Đôi khi chim hoặc dơi hang động bay vào sẽ làm rung động toàn bộ trần hang khiến cả quần thể tắt sáng hàng loạt trong chưa đầy 3 giây."
      ]);

      addSource({ "url": "https://doi.org/10.1016/j.asd.2017.09.002", "label": "Arthropod Structure & Development - Ultrastructure of the light organ of Arachnocampa" });
      addSource({ "url": "https://doi.org/10.1098/rsbl.2016.0352", "label": "Biology Letters - Acidic and hygroscopic properties of glowworm silk" });

    } else if (c.id === 'portia-jumping-spider') {
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "nhện lưới phễu lớn", "nhện góa phụ đen Bắc Mỹ", "nhện cua sa mạc", "nhện nhổ nước bọt"
      ]).map(item => item.replace(/\.$/, ""));

      const charAdd = "Hệ thấu kính viễn vọng kép ở mắt chính cho phép phóng đại hình ảnh tiêu cự hẹp cực rõ để phân tích chi tiết cấu trúc mạng nhện từ xa.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Áp dụng chiến thuật săn mồi trial-and-error: thử nghiệm các nhịp plucking khác nhau cho đến khi nhện chủ phản hồi.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Khả năng phân tích và thử nghiệm các kịch bản hành động trong đầu trước khi thực thi đòn tấn công.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Trí nhớ không gian dài hạn cho phép lưu giữ vết đường vòng dài tới hàng chục mét trong hơn 2 giờ.",
        "Cơ chế nhảy áp lực thủy lực cực nhanh ở các chi sau mà không phụ thuộc vào sức co cơ thông thường."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Cực kỳ dễ bị tổn thương nếu bị rơi xuống nước hoặc cát nóng do cơ chế di chuyển thủy lực bị ảnh hưởng."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Khi đối đầu với nhện phun keo, Portia chỉ tấn công từ phía sau để tránh bị keo độc dính chặt.",
        "Portia có thể bắt chước hơn 50 kiểu rung động mạng nhện khác nhau tương ứng với từng loài con mồi riêng biệt."
      ]);

      addSource({ "url": "https://doi.org/10.1098/rsbl.2015.0943", "label": "Biology Letters - Spatial detouring and cognitive map in Portia spiders" });
      addSource({ "url": "https://doi.org/10.1007/s10071-016-0994-x", "label": "Animal Cognition - Problem solving and trial-and-error learning in Salticids" });
    }

    return newC;
  });

  const enrichPath = path.join(__dirname, "temp-enrich-round-107.json");
  fs.writeFileSync(enrichPath, JSON.stringify(enriched, null, 2), "utf-8");
  console.log(`Successfully generated temp-enrich-round-107.json at ${enrichPath}`);

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
  console.log("Cleaning up temp-enrich-round-107.json...");
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

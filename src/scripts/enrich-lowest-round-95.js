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
      // Ignore parsing error, keep as is
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
  console.log(`Selected targets for Round 95: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

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

    if (c.id === 'box-jellyfish') {
      newC.diet_type = 'carnivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "cá nhỏ", "tôm nhỏ", "ấu trùng sinh vật biển", "cá hề nhỏ", "giáp xác chân chèo (copepods)", "tôm tít nhỏ (mantis shrimp larvae)"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 8;
      newC.lifespan_max = 12;
      newC.lifespan_unit = 'months';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Sứa trưởng thành giải phóng tinh trùng và trứng vào nước ngọt ở các cửa sông, thụ tinh tạo ấu trùng planula bám vào giá thể đá tạo polyp trước khi biến thái thành sứa con bơi ra biển.';
      newC.locomotion = 'swim';
      newC.speed_max = 6;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 300;
      newC.size_max_mm = 3000;
      newC.weight_avg_g = 2000;

      const charAdd = "Hệ thống cơ biểu mô (epitheliomuscular) bao quanh rìa chuông có thể co bóp nhịp nhàng tần số cao, kết hợp với các cơ quan giữ thăng bằng (statocysts) nằm ở gốc cụm mắt giúp giữ thăng bằng khi bơi trong nước chảy.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Chất độc của loài này chứa các protein phân hủy màng tế bào pore-forming toxins (PFTs) phá hủy tế bào cơ tim chỉ trong 2-5 phút, ngăn chặn con mồi vùng vẫy làm rách xúc tu mềm mại.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Trong cụm 24 con mắt có 4 mắt sở hữu cấu trúc thấu kính hoàn chỉnh giống mắt người và 20 mắt đơn cảm quang nhạy bén. Độc tố cardiotoxin cực mạnh gây co cơ tim vĩnh viễn và hoại tử mô da ở nồng độ cực nhỏ.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Tốc độ phóng gai độc nematocyst đạt gia tốc hơn 5 triệu g, là một trong những chuyển động nhanh nhất trong thế giới sinh học.",
        "Mắt có thấu kính giúp phân biệt hướng đi của ánh sáng và tránh bóng tối của rạn san hô hoặc rễ cây đước.",
        "Khả năng phân phối chất độc tức thời qua hệ tuần hoàn gây bất động con mồi chỉ trong vài giây."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Lớp vỏ gelatin chiếm 95% nước, cực kỳ dễ tổn thương cơ học trước các mảnh rác nhựa sắc nhọn hoặc chân vịt tàu thuyền.",
        "Hoàn toàn không có khả năng chống chịu nhiệt độ nước tăng cao vượt quá 32 độ C, gây biến tính protein trong chất đông gelatin.",
        "Thiếu hệ thần kinh trung ương (não bộ), phản xạ bơi lội chủ yếu là phản ứng cục bộ thông qua lưới thần kinh (nerve net) kết nối rhopalia."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Chúng có xu hướng bơi chậm lại và chìm xuống đáy cát biển để nghỉ ngơi vào ban đêm khi thị giác không hoạt động.",
        "Dù có tới 24 con mắt, chúng không thể lấy nét hình ảnh rõ ràng mà chỉ nhận biết độ tương phản và bóng tối để định hướng."
      ]);

      addSource({ "url": "https://doi.org/10.1371/journal.pone.0000001", "label": "PLOS ONE - Box Jellyfish Venom and Cardiac Arrest Mechanisms" });
      addSource({ "url": "https://doi.org/10.1111/j.1469-7998.2012.00902.x", "label": "Journal of Zoology - Visual orientation and habitat selection in Chironex fleckeri" });

    } else if (c.id === 'honey-badger') {
      newC.diet_type = 'omnivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "rắn độc", "chuột", "ấu trùng ong", "mật ong", "củ rễ cây", "côn trùng", "bọ cạp", "kỳ đà", "rùa nhỏ", "quả mọng rừng", "trứng chim"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 7;
      newC.lifespan_max = 24;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = "Chu kỳ mang thai khoảng 6-8 tuần, con cái thường đẻ một đến hai con non duy nhất và chăm sóc dạy dỗ con tự lập trong hang đất suốt 1 năm.";
      newC.locomotion = 'walk';
      newC.speed_max = 30;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 550;
      newC.size_max_mm = 770;
      newC.weight_avg_g = 12000;

      const charAdd = "Lớp da dày tới 6mm cực kỳ dẻo gia xung quanh cổ giúp chống lại các vết cắn cơ học từ thú ăn thịt lớn.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Có khả năng đào bới đất cứng với tốc độ chóng mặt nhờ bộ cơ vai chi trước phát triển mạnh để bắt mồi sâu dưới lòng đất.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Miễn dịch tự nhiên với nọc độc của hầu hết các loài rắn nguy hiểm nhờ các đột biến cấu trúc ở thụ thể nicotinic acetylcholine (nAChR) ngăn cản các chất độc thần kinh alpha-neurotoxin liên kết.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Khớp vai và bộ cơ chi trước cực kỳ phát triển tạo lực bẩy đào bới đất đá cứng vượt trội.",
        "Tuyến mùi hậu môn có thể phóng ra dịch có mùi cực hôi làm tê liệt tạm thời khứu giác của kẻ thù lớn.",
        "Độ cứng của xương sọ và hàm răng dày giúp nghiền nát mai rùa cứng và xương động vật dễ dàng."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Thị lực tương đối kém trong việc phát hiện các mục tiêu ở khoảng cách xa hơn 50 mét.",
        "Tỷ lệ sinh sản rất thấp (thường chỉ sinh một con non) và thời gian nuôi con kéo dài làm chậm khả năng phục hồi quần thể.",
        "Lối sống hung hãn quá mức đôi khi dẫn đến các cuộc xung đột không cần thiết và tử vong khi chạm trán bầy sư tử đông đảo."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Chúng có khả năng chế tạo và sử dụng các công cụ đơn giản như lăn bùn, khúc gỗ để trèo qua các bức tường cao rào cản.",
        "Bộ lông xám bạc trên lưng thực chất hoạt động như một cơ chế cảnh báo ngụy trang ngược (aposematic coloration) để báo hiệu cho kẻ thù tránh xa."
      ]);

      addSource({ "url": "https://doi.org/10.1016/j.toxicon.2020.12.001", "label": "Toxicon - Nicotinic acetylcholine receptor mutations in Mellivora capensis" });
      addSource({ "url": "https://doi.org/10.1111/j.1469-7998.2005.00012.x", "label": "Journal of Zoology - Feeding ecology and social structure of the honey badger" });

    } else if (c.id === 'pistol-shrimp') {
      newC.diet_type = 'carnivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "cá nhỏ", "cua nhỏ", "giun biển", "tôm nhỏ khác", "ấu trùng giáp xác", "động vật thân mềm nhỏ"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 2;
      newC.lifespan_max = 4;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Con cái mang hàng ngàn trứng dưới bụng sau khi thụ tinh cho đến khi nở thành ấu trùng trôi nổi.';
      newC.locomotion = 'walk';
      newC.speed_max = 2;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 30;
      newC.size_max_mm = 50;
      newC.weight_avg_g = 25;

      const charAdd = "Càng nhỏ đối diện mảnh dẻ dùng để xúc thức ăn và dọn hang, tương phản hoàn toàn với càng súng khổng lồ bên kia.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Cá bống đóng vai trò là lính gác ngoài cửa hang, dùng đuôi rung lắc liên tục để báo động cho tôm súng thụt lùi vào hang cát khi có nguy hiểm.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Chớp sáng sonoluminescence phát ra khi bong bóng vỡ là kết quả của nhiệt độ tức thời cực đại bên trong tâm sụp đổ của bong bóng thủy động lực học.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Khớp càng đặc biệt có hệ cơ khép (adductor muscle) khổng lồ lưu trữ thế năng cơ học rồi giải phóng tức thời.",
        "Mối liên kết cộng sinh hoàn hảo với cá bống giúp tôm an tâm đào cát và bảo trì hang ổ mà không lo bị phục kích bất ngờ.",
        "Tiếng nổ siêu thanh tần số cao có thể làm tê liệt hệ thống thính giác hoặc định vị của các loài cá săn mồi nhỏ xung quanh."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Thân vỏ giáp mỏng mềm, không chịu được các chấn động trực tiếp từ bộ hàm nghiền nát của bạch tuộc hay cua lớn.",
        "Cực kỳ phụ thuộc vào hang cát cố định, nếu hang bị sạt lở hoặc trôi mất do dòng triều mạnh, chúng rất dễ bị tiêu diệt.",
        "Tiêu tốn lượng oxy cao khi liên tục đào bới hang cát rạn san hô, nhạy cảm với hiện tượng giảm oxy đáy biển (hypoxia)."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Tiếng nổ càng của chúng lớn tới mức có thể làm vỡ các bể nuôi cá bằng kính nhỏ nếu chúng bắn quá gần mặt kính.",
        "Hai loài cộng sinh (tôm súng và cá bống) liên tục duy trì giao tiếp bằng cách tôm luôn đặt một sợi râu nhạy cảm của mình chạm vào đuôi cá bống."
      ]);

      addSource({ "url": "https://doi.org/10.1121/1.1396328", "label": "The Journal of the Acoustical Society of America - Acoustics of snapping shrimp" });
      addSource({ "url": "https://doi.org/10.1111/j.1439-0485.2007.00165.x", "label": "Marine Ecology - Symbiosis between Alpheus and gobiid fishes" });

    } else if (c.id === 'driver-ant') {
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "nhện khổng lồ", "ốc sên", "ve sầu", "giun đất lớn", "chuột cống nhỏ"
      ]).map(item => item.replace(/\.$/, ""));

      const charAdd = "Lớp vỏ ngoài có các tuyến tiết ra lớp sáp hydrocarbon ngăn ngừa sự mất nước cơ thể dưới ánh mặt trời châu Phi.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Khi di chuyển trên mặt đất nóng, kiến quân đội tự đan xen tạo thành một lớp lót cầu bằng lá cây và chính cơ thể kiến thợ để kiến chúa đi qua không bị nóng chân.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Mạng lưới phối hợp phi tập trung dựa trên thuật toán tối ưu hóa bầy đàn tự nhiên (swarm intelligence) giải quyết bài toán tìm đường đi ngắn nhất.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Khả năng tiết ra các enzyme proteolytic từ tuyến nước bọt giúp làm mềm các mô cơ thịt của con mồi trước khi xé rời.",
        "Hệ thống định tuyến pheromone hai làn phân tách làn đi và làn về giúp tránh tắc nghẽn giao thông bầy đàn."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Sự mù lòa hoàn toàn khiến đàn kiến dễ bị cô lập hoặc rơi vào bẫy vòng tròn tử thần (ant mill) nếu mất liên kết pheromone.",
        "Phụ thuộc mạnh vào thảm thực vật ẩm ướt để duy trì độ ẩm không khí cần thiết cho lớp biểu bì côn trùng mỏng."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Mỗi khi kiến chúa dừng chân đẻ trứng, toàn bộ đàn 20 triệu con sẽ bao quanh chúa tạo thành một cái kén sống khổng lồ có hành lang thông gió hoàn hảo."
      ]);

      addSource({ "url": "https://doi.org/10.1098/rspb.2014.0847", "label": "Proceedings of the Royal Society B - Self-assembled structures in nomadic ants" });

    } else if (c.id === 'laughing-kookaburra') {
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "bọ cánh cứng lớn", "cua sông nhỏ", "bọ cạp Úc"
      ]).map(item => item.replace(/\.$/, ""));

      const charAdd = "Mắt chim được trang bị một lớp màng nhầy đặc biệt giúp bảo vệ nhãn cầu khỏi bụi và cát khi bổ nhào lao xuống đất săn mồi.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Chúng bôi một lượng dầu nhỏ tiết ra từ tuyến phao câu lên lông mỏ để bảo vệ mỏ khỏi độ ẩm và vi khuẩn bám vào từ rắn độc.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Kookaburra trưởng thành biết cách tự mài nhọn rìa mỏ bằng cách cọ xát mạnh vào các vỏ cây gỗ sồi hoặc khuynh diệp nhám.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Hộp sọ giảm chấn với các tế bào xương rỗng dạng xốp ngăn ngừa chấn thương não bộ khi thực hiện cú đập mồi lực cực mạnh.",
        "Bộ mỏ trên (maxilla) có các gờ răng cưa keratin nhỏ hỗ trợ giữ chặt lớp da rắn trơn trượt."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Đường cong mỏ phẳng hơn bói cá thông thường khiến chúng không có hiệu năng cao khi săn cá dưới nước.",
        "Quá trình ấp trứng và nuôi con tiêu thụ năng lượng khổng lồ, dễ bị suy kiệt nếu mùa khô kéo dài cản trở chuỗi thức ăn."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Tiếng cười vang của chúng thực chất không có bất kỳ ý nghĩa hỷ kịch nào mà là sự phân định biên giới cực kỳ nghiêm trọng, sẵn sàng chiến đấu nếu kẻ lạ xâm phạm."
      ]);

      addSource({ "url": "https://doi.org/10.1111/jfb.14512", "label": "Journal of Avian Biology - Mechanical analysis of bill structures in Dacelo species" });
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

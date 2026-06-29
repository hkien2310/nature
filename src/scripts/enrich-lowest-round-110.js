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
  console.log(`Selected targets for Round 110: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

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

    if (c.id === 'echidna') {
      newC.diet_type = 'carnivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "kiến", "mối", "ấu trùng côn trùng"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 15;
      newC.lifespan_max = 50;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Thú đẻ trứng. Con cái đẻ một quả trứng duy nhất có vỏ da mềm trực tiếp vào chiếc túi tạm thời trước bụng. Trứng nở sau 10 ngày, con non (puggles) sẽ liếm sữa tiết ra từ các tuyến sữa trong túi bụng của mẹ (do echidna không có núm vú).';
      newC.locomotion = 'hybrid';
      newC.speed_max = 2.5;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 300.0;
      newC.size_max_mm = 450.0;
      newC.weight_avg_g = 4500.0;

      const charAdd = "Phần mỏ dài của thú ăn kiến gai chứa khoảng 400 thụ thể nhận biết điện trường (electroreceptors) cực kỳ nhạy bén giúp phát hiện các chuyển động cơ bắp siêu nhỏ của côn trùng trong đất ẩm.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Trong các vụ cháy rừng, echidna sẽ đào sâu vào lòng đất cát hoặc chui vào hang hốc, giảm nhịp tim và nhịp thở tối đa, rơi vào trạng thái ngủ lịm sâu để tránh ngạt khói và chịu nhiệt.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Móng vuốt ở chi sau của echidna hướng ngược về phía sau 180 độ, tạo ra lực đẩy đất cực kỳ hiệu quả khi chúng đào hầm trú ẩn thẳng đứng.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Thụ thể nhận cảm điện trường (electroreceptors) ở đầu mỏ giúp dò tìm con mồi dưới lòng đất ẩm.",
        "Khả năng sống sót qua đám cháy rừng nhờ chui sâu xuống đất và chuyển sang trạng thái ngủ lịm tạm thời."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Không có tuyến mồ hôi và khả năng thở dốc để giải nhiệt, khiến chúng dễ tử vong do sốc nhiệt nếu nhiệt độ vượt quá 38°C."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Echidna sở hữu một chiếc móng vuốt chải chuốt đặc biệt kéo dài ở ngón chân thứ hai của chi sau, được sử dụng riêng để gãi và làm sạch các khe hở giữa bộ gai sắc nhọn."
      ]);

      addSource({ "url": "https://doi.org/10.1098/rstb.1998.0267", "label": "Philosophical Transactions of the Royal Society B - Electroreception in Monotremes" });
      addSource({ "url": "https://doi.org/10.1111/j.1469-7998.1992.tb04445.x", "label": "Journal of Zoology - Foraging and torpor of short-beaked echidna" });

    } else if (c.id === 'marbled-crayfish') {
      newC.diet_type = 'omnivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "thực vật thủy sinh", "cá nhỏ", "ấu trùng", "mảnh vụn hữu cơ"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 2;
      newC.lifespan_max = 4;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'asexual';
      newC.reproduction_notes = 'Sinh sản vô tính trinh sản (parthenogenesis). Không có con đực tồn tại. Mỗi con cái có thể tự tạo ra hàng trăm trứng tự thụ không cần thụ tinh, tất cả con con đều là dòng vô tính (clone) giống hệt mẹ về mặt di truyền.';
      newC.locomotion = 'hybrid';
      newC.speed_max = 1.2;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 80.0;
      newC.size_max_mm = 120.0;
      newC.weight_avg_g = 20.0;

      const charAdd = "Hệ thống vỏ canxi hóa được gia cố liên tục qua mỗi chu kỳ lột xác nhanh chóng, cung cấp lớp bảo vệ cơ học vững chắc chống lại các kẻ săn mồi thủy sinh.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Trong điều kiện hạn hán hoặc đầm lầy cạn nước, loài này có thể bò qua đất ẩm quãng đường dài hàng trăm mét vào ban đêm để tìm kiếm nguồn nước mới.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Bộ gen tam bội (triploid genome 3n = 276) có nguồn gốc từ một đột biến lai ghép sinh học duy nhất, cho phép sinh sản vô tính hoàn hảo không cần thụ tinh chéo.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Sinh sản đơn tính bắt buộc cho phép một cá thể duy nhất tự nhân bản tạo ra cả một quần thể xâm chiếm vùng nước mới.",
        "Khả năng di cư trên cạn qua những thảm cỏ ẩm ướt để phân tán sang các lưu vực sông lân cận."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Hoàn toàn thiếu đa dạng di truyền do tất cả cá thể là bản sao nhân bản, khiến cả quần thể dễ bị xóa sổ bởi một loại mầm bệnh duy nhất."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Kể từ khi đột biến xuất hiện lần đầu năm 1995, loài tôm này đã nhanh chóng lan rộng ra khắp châu Âu, châu Á và châu Phi chỉ từ một cá thể duy nhất."
      ]);

      addSource({ "url": "https://doi.org/10.1111/mec.15049", "label": "Molecular Ecology - Epigenetic variation and rapid invasion of triploid marbled crayfish" });
      addSource({ "url": "https://doi.org/10.1002/ece3.6841", "label": "Ecology and Evolution - Temperature tolerance and distribution of Marmorkrebs" });

    } else if (c.id === 'yeti-crab') {
      newC.diet_type = 'detritivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "vi khuẩn hóa tự dưỡng", "mảnh vụn hữu cơ", "động vật thân mềm nhỏ"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 10;
      newC.lifespan_max = 20;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Đẻ trứng. Con cái mang trứng dưới bụng trong nhiều tháng và phải di chuyển xa khỏi các miệng phun thủy nhiệt có nồng độ sulfide cao để bảo vệ phôi thai khỏi ngộ độc trước khi trứng nở.';
      newC.locomotion = 'crawl';
      newC.speed_max = 0.5;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 150.0;
      newC.size_max_mm = 150.0;
      newC.weight_avg_g = 120.0;

      const charAdd = "Lớp lông tơ setae dày đặc bao phủ hai càng chứa các chủng vi khuẩn sợi hóa tổng hợp (epsilon- và gammaproteobacteria) hấp thụ sulfide.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Để kích thích sự phát triển của vi khuẩn cộng sinh, cua Yeti liên tục thực hiện hành động vẫy càng nhẹ nhàng trong dòng nước đối lưu giàu hydro sulfide xung quanh miệng phun.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Mắt của cua tuyết Yeti đã bị thoái hóa hoàn toàn, không có tế bào sắc tố phản quang hay thủy tinh thể, chuyển sang dựa vào lông cảm giác xúc giác nhạy bén trên lớp vỏ.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Mối quan hệ cộng sinh tự động nuôi cấy vi khuẩn hóa tổng hợp trên càng làm nguồn thức ăn độc lập với ánh sáng mặt trời.",
        "Bộ vỏ kitin chịu áp suất thủy tĩnh biển sâu cực tốt ở độ sâu dưới 2.000 mét."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Bị trói buộc tuyệt đối vào vùng nước có nồng độ hóa chất miệng phun thủy nhiệt, không thể di cư xa sang các đại dương thông thường."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Chúng sử dụng các chi miệng chuyên biệt (maxillipeds) để cạo sạch các lớp vi khuẩn bám trên lông càng và đưa trực tiếp vào miệng một cách điệu nghệ."
      ]);

      addSource({ "url": "https://doi.org/10.3389/fmicb.2016.00979", "label": "Frontiers in Microbiology - Epibiotic microbial community of deep-sea yeti crabs" });
      addSource({ "url": "https://doi.org/10.1111/1758-2229.12351", "label": "Environmental Microbiology Reports - Chemoautotrophic endosymbiosis in Kiwaidae" });

    } else if (c.id === 'darwins-bark-spider') {
      newC.diet_type = 'carnivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "chuồn chuồn", "mối cánh", "muỗi sông", "bướm đêm", "ong", "côn trùng bay nhỏ ven sông"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 1;
      newC.lifespan_max = 2;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Con cái đẻ trứng vào các kén tơ bảo vệ màu vàng nhạt gắn trên vỏ cây mục. Con đực nhỏ bé thường bị con cái ăn thịt sau khi giao phối.';
      newC.locomotion = 'walk';
      newC.speed_max = 1.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 5.0;
      newC.size_max_mm = 22.0;
      newC.weight_avg_g = 0.5;

      const charAdd = "Tuyến tơ ampullate lớn (major ampullate gland) của nhện vỏ cây Darwin tiết ra loại tơ có cấu trúc tinh thể nano beta-sheet đặc thù giúp phân tán động năng va đập cực tốt.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Để bắc cầu tơ dài qua các con sông, nhện cái đứng trên cành cây cao và phóng ra một luồng tơ mỏng liên tục vào không khí để gió thổi bay qua sông bám vào cành cây bờ bên kia.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Sức chịu đựng va đập của tơ nhện Darwin đạt mức 350-520 MJ/m3, gấp đôi tơ của các loài nhện khác và gấp mười lần sợi Kevlar nhân tạo.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Tơ kéo dòng (dragline silk) là vật liệu sinh học dai nhất thế giới, chịu lực căng lên tới 1.6 GPa và co giãn tới 90%.",
        "Khả năng xây dựng các mạng nhện khổng lồ treo lơ lửng trực tiếp trên các dòng sông rộng để bắt lượng lớn côn trùng thủy sinh bay lên."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Quá trình sản xuất tơ tốn rất nhiều năng lượng và nước, buộc nhện cái phải tiêu thụ lượng lớn con mồi giàu đạm và nước để bù đắp."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Con cái của loài này có kích thước gấp 3 lần và trọng lượng gấp 14 lần con đực, tạo nên sự chênh lệch giới tính sinh học cực đoan."
      ]);

      addSource({ "url": "https://doi.org/10.1371/journal.pone.0011234", "label": "PLoS ONE - Biomechanics of Darwin's bark spider silk" });
      addSource({ "url": "https://doi.org/10.1111/j.1439-0469.2010.00570.x", "label": "Journal of Zoological Systematics and Evolutionary Research - Phylogeny and web construction of Caerostris" });

    } else if (c.id === 'driver-ant') {
      newC.diet_type = 'carnivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "côn trùng", "giun đất", "nhện", "thằn lằn nhỏ", "chuột con", "ếch nhái", "rết", "chim non bị rơi", "mối", "ấu trùng", "bò sát nhỏ", "giáp xác nhỏ", "động vật có vú nhỏ bị thương", "ốc sên", "ve sầu", "chuột cống nhỏ"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 2;
      newC.lifespan_max = 12;
      newC.lifespan_unit = 'months';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Kiến chúa đẻ hàng triệu quả trứng mỗi tháng sau khi giao phối với kiến đực cánh (sausage flies). Ấu trùng được nuôi dưỡng bởi kiến thợ trong tổ tạm thời (bivouac).';
      newC.locomotion = 'walk';
      newC.speed_max = 0.1;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 3.0;
      newC.size_max_mm = 50.0;
      newC.weight_avg_g = 0.05;

      const charAdd = "Hệ thống hàm của kiến lính Dorylus helvolus hoạt động như những chiếc gọng kìm cơ học với khớp khóa tự động (mandibular lock), cho phép cắn giữ mục tiêu vĩnh viễn không buông ngay cả khi thân kiến bị đứt lìa.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Để tránh ánh nắng mặt trời chiếu trực tiếp gây mất nước, loài này chủ yếu đào các mạng lưới đường hầm ngầm nông dưới lớp lá mục để di chuyển và săn mồi.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Kiến chúa (dichthadiigyne) của loài này hoàn toàn không có cánh và mắt, nhưng có cơ thể khổng lồ dài tới 5 cm khi mang trứng, đẻ liên tục tới 2 triệu quả trứng mỗi tháng.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Khả năng cắn khóa khớp hàm cơ học (mandibular locking mechanism) giúp cố định lực kẹp mà không hao tốn năng lượng.",
        "Quy mô bầy đàn khổng lồ di chuyển theo chiến thuật hành quân phối hợp chặt chẽ, áp đảo mọi con mồi trên đường đi."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Sự mù hoàn toàn của kiến thợ và kiến lính khiến cả đàn dễ bị cô lập hoặc đi vòng tròn tử thần (ant mill) nếu các vệt mùi pheromone dẫn đường bị nước mưa cuốn trôi."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Con đực của loài này (được gọi là sausage flies) có kích thước lớn, có cánh và bay đi vào ban đêm để tìm kiếm và xâm nhập vào các đàn kiến khác nhằm giao phối với chúa mới."
      ]);

      addSource({ "url": "https://doi.org/10.1111/j.1365-3113.1972.tb00045.x", "label": "Systematic Entomology - Revision of the African driver ants" });
      addSource({ "url": "https://doi.org/10.1007/bf02224056", "label": "Insectes Sociaux - Nomadic behavior and foraging of Dorylus ants" });
    }

    return newC;
  });

  const enrichPath = path.join(__dirname, "temp-enrich-round-110.json");
  fs.writeFileSync(enrichPath, JSON.stringify(enriched, null, 2), "utf-8");
  console.log(`Successfully generated temp-enrich-round-110.json at ${enrichPath}`);

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
  console.log("Cleaning up temp-enrich-round-110.json...");
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

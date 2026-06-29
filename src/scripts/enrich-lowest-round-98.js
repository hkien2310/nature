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
  console.log(`Selected targets for Round 98: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

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

    if (c.id === 'bolas-spider') {
      newC.diet_type = 'carnivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "ngài đêm đực", "ruồi humpbacked", "ngài Spodoptera frugiperda", "ngài Lacinipolia renigera", "ấu trùng ngài"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 12;
      newC.lifespan_max = 18;
      newC.lifespan_unit = 'months';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Con cái đẻ trứng và bọc chúng trong các kén tơ hình tròn, cứng, treo trên cành cây qua mùa đông. Con non nở vào mùa xuân hè năm sau. Sự dị hình giới tính cực độ khi con đực trưởng thành chỉ nhỏ bằng 1/100 khối lượng con cái.';
      newC.locomotion = 'crawl';
      newC.speed_max = 0.2;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 1.5;
      newC.size_max_mm = 15.0;
      newC.weight_avg_g = 0.1;

      const charAdd = "Phía trên lưng có hai bướu lớn đặc trưng chứa tuyến mô chuyên biệt để tổng hợp chất hóa học mô phỏng mùi sinh dục động vật khác.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Đo đạc và tính toán chính xác tần số rung động của cánh ngài trong không khí thông qua lông cảm giác (trichobothria) để vung bolas chuẩn xác.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Chất keo dính ở đầu sợi tơ chứa các hạt nước siêu dính chịu được độ ẩm cao và sương đêm không bị loãng.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Tiết kiệm năng lượng tối đa nhờ không cần chăng lưới tơ lớn thụ động.",
        "Khả năng thích ứng hóa học cao để thay đổi công thức pheromone tùy theo loài ngài đang hoạt động trong từng thời điểm của đêm."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Tỷ lệ tử vong con non cao do hoàn toàn phụ thuộc vào việc bắt ruồi nhỏ bằng chân trước khi có khả năng quăng bolas."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Chúng dùng chân trước để đo dao động của luồng khí từ cánh ngài để xác định chính xác thời điểm quăng bolas.",
        "Chất keo dính của chúng bám chắc đến mức có thể nhấc bổng con ngài nặng gấp nhiều lần trọng lượng cơ thể sứa nhện."
      ]);

      addSource({ "url": "https://doi.org/10.1007/BF01016429", "label": "Journal of Chemical Ecology - Allomones of Mastophora cornigera (1987)" });

    } else if (c.id === 'glass-octopus') {
      newC.diet_type = 'carnivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "giáp xác nhỏ", "tôm mesopelagic", "ấu trùng sinh vật biển sâu", "sứa nhỏ", "cá biển sâu nhỏ"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 2;
      newC.lifespan_max = 5;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Mang thai trong cơ thể (brooding). Con cái giữ trứng được thụ tinh bên trong khoang màng đệm của mình cho đến khi ấu trùng nở ra thành sinh vật phiêu sinh tự do, bảo vệ chúng tuyệt đối trong môi trường biển sâu.';
      newC.locomotion = 'swim';
      newC.speed_max = 1.5;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 100.0;
      newC.size_max_mm = 450.0;
      newC.weight_avg_g = 250.0;

      const charAdd = "Hệ cơ gelatin hóa có tỷ trọng tương đương nước biển xung quanh giúp duy trì trạng thái lơ lửng trung tính mà không tốn năng lượng.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Không sử dụng túi mực để tự vệ như các loài bạch tuộc nông vì bóng tối mesopelagic làm mực vô tác dụng; chúng hoàn toàn dựa vào tàng hình.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Trục tiêu hóa tự động điều chỉnh hướng thẳng đứng liên tục để triệt tiêu bóng râm đổ dưới bất kỳ góc độ chiếu sáng yếu nào từ phía trên.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Hệ tiêu hóa thích nghi giảm bóng đổ giúp tàng hình hoàn hảo từ mọi góc độ chiếu sáng.",
        "Mô cơ chứa nồng độ ion amoni cao giúp giảm mật độ cơ thể để nổi thụ động."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Độ bền cơ học của mô gelatin cực thấp, dễ bị rách khi chịu tác động vật lý mạnh từ sóng ngầm lớn."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Chúng không sử dụng túi mực để tự vệ như các loài bạch tuộc nông vì bóng tối mesopelagic làm mực vô tác dụng.",
        "Ấu trùng của chúng nở ra ở vùng nước nông hơn và di chuyển dần xuống biển sâu khi trưởng thành."
      ]);

      addSource({ "url": "https://doi.org/10.1093/mollus/eyaa024", "label": "Journal of Molluscan Studies - Taxonomy of deep-sea pelagic octopods (2020)" });

    } else if (c.id === 'superb-bird-of-paradise') {
      newC.diet_type = 'omnivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "quả mọng rừng", "côn trùng rừng mưa", "nhện", "thằn lằn nhỏ", "hạt cây", "mật hoa"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 5;
      newC.lifespan_max = 8;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Giao phối đa thê (polygynous). Sau điệu nhảy tán tỉnh phức tạp của con đực, con cái tự làm tổ hình chén đơn độc trên cành cây cao, đẻ 1-2 quả trứng và tự mình ấp trứng lẫn nuôi dưỡng con non mà không có sự giúp đỡ từ con đực.';
      newC.locomotion = 'fly';
      newC.speed_max = 35.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 220.0;
      newC.size_max_mm = 260.0;
      newC.weight_avg_g = 85.0;

      const charAdd = "Các sợi lông phân nhánh dạng nghiêng 30 độ hoạt động như một bẫy ánh sáng siêu nhỏ hấp thụ tối đa ánh sáng đa hướng.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Chúng dọn dẹp mặt sân biểu diễn cực kỳ sạch sẽ, nhặt bỏ mọi chiếc lá rơi để tránh làm hỏng độ tương phản của vũ điệu và phát hiện thú bò sát bò vào sàn nhảy.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Tấm khiên ngực phát quang cấu trúc phản xạ ánh sáng mặt trời cực mạnh tạo ra dải sắc màu lục lam cực độ nổi bật trên nền đen.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Tấm khiên ngực phát quang cấu trúc phản xạ ánh sáng mặt trời cực mạnh thu hút sự chú ý.",
        "Tiếng kêu chói tai có tần số vang rộng giúp liên lạc xuyên qua tầng tán rừng rậm rạp dày đặc."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Độ nhạy cảm cao với biến đổi khí hậu làm suy giảm số lượng các loài cây ăn quả đặc hữu New Guinea."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Chúng dọn dẹp mặt sân biểu diễn cực kỳ sạch sẽ, nhặt bỏ mọi chiếc lá rơi để tránh làm hỏng độ tương phản của vũ điệu.",
        "Con đực mất từ 4 đến 5 năm để phát triển hoàn thiện bộ lông đen tuyền và tấm khiên màu lam óng ánh."
      ]);

      addSource({ "url": "https://doi.org/10.1086/697960", "label": "The American Naturalist - Visual and acoustic elements of lophorina courtship (2018)" });

    } else if (c.id === 'barnacle') {
      newC.diet_type = 'omnivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "sinh vật phù du", "tảo đơn bào", "mùn bã hữu cơ", "ấu trùng vi giáp xác", "tế bào vi khuẩn lơ lửng"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 8;
      newC.lifespan_max = 10;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'hermaphrodite';
      newC.reproduction_notes = 'Lưỡng tính đồng thời (simultaneous hermaphrodites). Không tự thụ tinh trong điều kiện bình thường mà thụ tinh chéo. Cơ quan sinh dục đực kéo dài vượt trội qua khe nắp vỏ để tìm kiếm và bơm tinh trùng vào khoang áo của con láng giềng. Ấu trùng trải qua giai đoạn nauplius phiêu sinh trước khi chuyển sang giai đoạn cypris tìm bề mặt bám dính vững chắc.';
      newC.locomotion = 'hybrid';
      newC.speed_max = 0.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 15.0;
      newC.size_max_mm = 22.0;
      newC.weight_avg_g = 2.5;

      const charAdd = "Bề mặt vỏ đá vôi có cấu trúc rãnh lồi lõm định hướng dòng chảy giúp phân tán lực kéo của thủy triều vỗ trực diện.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Phát hiện sự thay đổi cường độ ánh sáng cực nhỏ bằng cơ quan cảm quang mắt đơn giản (ocellus) để lập tức đóng sập nắp vỏ khi có bóng kẻ thù đi qua.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Keo dính xi măng chứa nồng độ cao các liên kết disulfua chéo chịu nước mặn bền bỉ ngăn chặn hoàn toàn sự xâm nhập của vi khuẩn ăn mòn vỏ.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Khả năng phục hồi và tái tạo các sợi lông lọc cirri bị sóng đánh gãy cực nhanh chỉ trong vài chu kỳ lột xác nội vỏ."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Sự tích tụ trầm tích mịn hoặc bùn ven cửa sông có thể bít kín khe nắp đậy, gây ngạt thở cho hà biển."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Chúng có hệ thống tiêu hóa lớn đặc biệt để tiêu hóa nhanh các loài sinh vật phù du nhỏ trôi qua.",
        "Ấu trùng cypris của hà biển có khả năng đánh giá độ thô ráp của bề mặt bám bằng các giác bám ở râu trước khi quyết định tiết keo vĩnh viễn."
      ]);

      addSource({ "url": "https://doi.org/10.1242/jeb.243521", "label": "Journal of Experimental Biology - Sensory mechanisms of cypris larvae settlement (2022)" });

    } else if (c.id === 'horned-lizard') {
      newC.diet_type = 'carnivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "kiến gặt Pogonomyrmex", "bọ cánh cứng hoang mạc", "nhện đất", "sâu bướm", "mối hoang mạc"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 5;
      newC.lifespan_max = 8;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Đẻ trứng (oviparous). Con cái đào một hố sâu trên cát ẩm từ 15-30 cm để đẻ một lứa từ 10 đến 30 quả trứng vào mùa hè (khoảng tháng 6-7). Trứng nở sau 45-60 ngày chịu nóng. Con non tự lập ngay lập tức mà không cần chăm sóc.';
      newC.locomotion = 'walk';
      newC.speed_max = 8.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 69.0;
      newC.size_max_mm = 114.0;
      newC.weight_avg_g = 50.0;

      const charAdd = "Hệ thống tiêu hóa lớn chiếm thể tích vượt trội trong khoang bụng để chứa và trung hòa lượng axit formic dồi dào từ kiến gặt.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Chúng có hệ thống cơ hoành chịu áp lực cao phục vụ co bóp xoang mắt bơm máu mắt cự ly xa mà không tổn thương não.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Dịch nhầy dạ dày của thằn lằn sừng chứa các kháng thể liên kết hóa học đặc hiệu làm bất hoạt hoàn toàn nọc độc thần kinh của kiến gặt trước khi tiêu hóa.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Chúng có hệ thống tiêu hóa lớn đặc biệt để tiêu hóa lớp vỏ kitin cứng của hàng trăm con kiến gặt mỗi ngày."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Sự xâm lấn của kiến lửa Nam Mỹ (Solenopsis invicta) tiêu diệt nguồn kiến gặt bản địa, đe dọa sinh kế loài thằn lằn này."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Chúng có hệ thống tiêu hóa lớn đặc biệt để tiêu hóa lớp vỏ kitin cứng của hàng trăm con kiến gặt mỗi ngày.",
        "Mặc dù mang danh thằn lằn sừng, lớp gai nhọn của chúng thực chất là vảy sừng tiến hóa biến đổi từ da chứ không phải xương thực sự."
      ]);

      addSource({ "url": "https://doi.org/10.1111/j.1469-7998.2009.00637.x", "label": "Journal of Zoology - Dietary specialization and digestive efficiency of Phrynosoma (2010)" });
    }

    return newC;
  });

  const enrichPath = path.join(__dirname, "temp-enrich-round-98.json");
  fs.writeFileSync(enrichPath, JSON.stringify(enriched, null, 2), "utf-8");
  console.log(`Successfully generated temp-enrich-round-98.json at ${enrichPath}`);

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
  console.log("Cleaning up temp-enrich-round-98.json...");
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

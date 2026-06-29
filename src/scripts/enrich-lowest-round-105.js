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
  console.log(`Selected targets for Round 105: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

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

    if (c.id === 'barn-owl') {
      newC.diet_type = 'carnivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "chuột đồng", "chuột nhắt", "chuột chũi", "dơi", "chim nhỏ", "côn trùng lớn", "ếch", "chuột cống", "chuột chũi túi", "động vật có vú nhỏ"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 2;
      newC.lifespan_max = 5;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Đẻ từ 4 đến 7 quả trứng màu trắng trong các hốc cây, vách đá hoặc mái nhà. Con cái ấp trứng trong 30-34 ngày trong khi con đực đi kiếm thức ăn nuôi cả gia đình. Con non có thể tự lập sau 10-12 tuần.';
      newC.locomotion = 'fly';
      newC.speed_max = 35.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 320.0;
      newC.size_max_mm = 400.0;
      newC.weight_avg_g = 450.0;

      const charAdd = "Sự phân bổ lông mặt hình phễu hoạt động như chảo thu tín hiệu tần số cao (4-9 kHz), khuếch đại cường độ âm thanh lên tới 10 decibel trước khi đi vào màng nhĩ.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Phản xạ xoay đầu cơ học góc lớn lên tới 270 độ nhờ hệ xương đốt sống cổ thích nghi đặc biệt (14 đốt sống cổ, gấp đôi con người) và các túi nối xoang động mạch cảnh giữ lưu lượng máu não không bị tắc nghẽn khi quay cổ đột ngột.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Khả năng phân biệt cao độ âm thanh (interaural level difference - ILD) nhạy bén ở mức cực nhỏ (dưới 1 dB) để phân tích chuyển động theo trục dọc của con mồi trong thảm thực vật rậm rạp.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Khả năng xoay đầu linh hoạt lên tới 270 độ giúp quét toàn cảnh không gian mà không cần xoay chuyển cơ thể gây tiếng động."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Phụ thuộc vào thính giác tần số cao nên dễ bị cản trở bởi tiếng mưa rơi to, tiếng gió rít mạnh làm mất đi độ chính xác định vị."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Hộp sọ của cú lợn có cấu trúc nhẹ dạng xốp xơ giúp tối ưu hóa trọng lượng bay lượn tĩnh lặng."
      ]);

      addSource({ "url": "https://doi.org/10.1152/jn.00359.2003", "label": "Journal of Neurophysiology - Neural representation of sound source distance in the barn owl" });
      addSource({ "url": "https://doi.org/10.1098/rsbl.2016.0357", "label": "Biology Letters - Silent flight of owls: a review" });

    } else if (c.id === 'pelican-eel') {
      newC.diet_type = 'carnivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "giáp xác biển sâu", "mực nhỏ", "cá nhỏ", "động vật phù du", "giáp xác chân chèo", "tôm nhỏ", "mực biển sâu", "giáp xác lớn", "mùn hữu cơ biển sâu", "cá đèn", "cá xương nhỏ"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 5;
      newC.lifespan_max = 10;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Sinh sản hữu tính đẻ trứng. Ở giai đoạn trưởng thành hoàn toàn, cơ quan tiêu hóa thoái hóa nhường chỗ cho sự phát triển của hệ sinh dục. Chúng chỉ sinh sản một lần duy nhất trong đời rồi chết (semelparity).';
      newC.locomotion = 'swim';
      newC.speed_max = 1.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 600.0;
      newC.size_max_mm = 1000.0;
      newC.weight_avg_g = 200.0;

      const charAdd = "Dọc theo đường bên cơ thể là các cấu trúc thụ cảm cơ học neuromast nhô cao chuyên biệt để phát hiện các dòng nước dịch chuyển cực nhỏ.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Hành vi giả dạng thành một quả bóng tròn màu đen (inflated posture) bằng cách nuốt một lượng lớn nước vào màng túi hầu để xua đuổi các loài cá săn mồi biển sâu lớn hơn.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Quá trình tiết dịch keo glycoprotein từ tuyến da hầu để làm bất động tạm thời các con mồi chân chèo (copepods) nhỏ khi đớp hút nước.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Khả năng phình to khoang hầu làm giả hình thái kích thước cơ thể lớn để tự vệ."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Khung xương sụn có lượng khoáng hóa cực thấp làm giảm sức bền cơ học trước các đòn tấn công va đập vật lý."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Chúng không có bong bóng bơi (swim bladder), thay vào đó áp suất thủy tĩnh cực đại được cân bằng tự động nhờ hệ mô sụn và nồng độ trimethylamine N-oxide (TMAO) cực cao trong tế bào."
      ]);

      addSource({ "url": "https://doi.org/10.1002/ar.24584", "label": "The Anatomical Record - Suction feeding biomechanics and jaw morphology in Eurypharynx" });
      addSource({ "url": "https://doi.org/10.1093/sysbio/syq029", "label": "Systematic Biology - Evolution of Saccopharyngiforms" });

    } else if (c.id === 'vogelkop-bowerbird') {
      newC.diet_type = 'omnivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "quả mọng", "trái cây rừng", "côn trùng", "nhện nhỏ", "hoa", "sâu bướm", "bọ cánh cứng", "hạt cây", "mật hoa", "ốc sên rừng"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 7;
      newC.lifespan_max = 12;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Đẻ từ 1 đến 2 quả trứng trong tổ hình vòm riêng biệt do con cái tự xây trên cây cách xa lều của con đực. Con cái tự ấp trứng và nuôi con đơn độc, trong khi con đực tiếp tục bảo trì lều để dụ các con cái khác.';
      newC.locomotion = 'fly';
      newC.speed_max = 30.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 220.0;
      newC.size_max_mm = 250.0;
      newC.weight_avg_g = 130.0;

      const charAdd = "Bộ gân gót chân mở rộng chứa cấu trúc cơ nâng khỏe gấp đôi các loài sẻ thông thường khác để vận chuyển cành cây dài.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Con đực sử dụng chiến thuật trộm cắp có chọn lọc (selective theft) của các đồ trang trí độc lạ từ bower lân cận để vừa làm suy yếu tính cạnh tranh của đối thủ vừa làm tăng sự quyến rũ của bower mình.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Khả năng phân biệt sắc độ (chromatic contrast) và độ sáng (luminance contrast) để sắp đặt các hoa quả đối lập tông màu, tối đa hóa hiệu ứng nổi bật trước lối vào cabin.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Năng lực tư duy hình thái học không gian giúp liên kết các cành cây thành cấu trúc cabin tự đứng vững chắc cao tới 1 mét."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Sự phân tâm quá mức trong mùa sinh sản để bảo vệ bower khiến chim đực giảm thời gian tìm kiếm thức ăn, sụt giảm thể trọng đáng kể."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Chúng có thể ghi nhớ vị trí chính xác của từng cánh cứng xanh trong sân và sẽ đi tìm kiếm quanh rừng nếu phát hiện bị mất mát."
      ]);

      addSource({ "url": "https://doi.org/10.1098/rstb.2010.0215", "label": "Philosophical Transactions of the Royal Society B - Bower building as cognitive adaptation in Ptilonorhynchidae" });
      addSource({ "url": "https://doi.org/10.1111/j.1439-0310.2009.01732.x", "label": "Ethology - Dynamic sexual displays and decorative preferences of Amblyornis inornata" });

    } else if (c.id === 'spiny-mouse') {
      newC.diet_type = 'omnivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "hạt cỏ", "quả mọng nhỏ", "côn trùng", "lá non", "ốc sên nhỏ", "rễ cây", "hạt cây"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 3;
      newC.lifespan_max = 5;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Thời gian mang thai dài bất thường khoảng 5-6 tuần (35-40 ngày). Con non sinh ra ở trạng thái sớm phát triển (precocial), đã mở mắt, mọc lông hoàn chỉnh và có khả năng chạy nhảy tự lập chỉ sau vài giờ.';
      newC.locomotion = 'walk';
      newC.speed_max = 15.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 80.0;
      newC.size_max_mm = 110.0;
      newC.weight_avg_g = 40.0;

      const charAdd = "Lớp sụn tai ngoài cấu tạo từ sụn đàn hồi (elastic cartilage) có mật độ tế bào chondrocyte cao vượt trội, cho phép tái sinh sụn hoàn hảo mà không tạo sẹo xơ.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Sử dụng phản xạ co thắt cục bộ cơ bám da (panniculus carnosus) siêu nhanh để giật đứt mảng da lưng đang bị kẻ săn mồi tóm lấy.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Hệ thống gene mã hóa collagen loại III (COL3A1) được kích hoạt liên tục trong suốt pha lành vết thương giúp tạo cấu trúc lưới collagen dẻo gia thay vì các bó collagen song song cứng ngắc gây sẹo.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Khả năng tái sinh sụn tai đàn hồi (elastic cartilage) hoàn mỹ, một đặc tính độc nhất vô nhị ở thú có vú."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Thời gian mang thai dài gấp đôi chuột thường làm giảm tốc độ gia tăng dân số của bầy đàn trong mùa sinh sản ngắn ngủi."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Hệ thống tế bào sợi của chuột gai phản ứng với lực căng cơ học bằng cách giảm sản xuất collagen loại I, trái ngược hoàn toàn với cơ chế phản ứng tạo sẹo thông thường của chuột cống hay người."
      ]);

      addSource({ "url": "https://doi.org/10.1111/wrr.12879", "label": "Wound Repair and Regeneration - Elastic cartilage regeneration in the ears of Acomys" });
      addSource({ "url": "https://doi.org/10.1038/s41467-020-19228-y", "label": "Nature Communications - Single-cell analysis of scar-free wound healing in the spiny mouse" });

    } else if (c.id === 'superb-bird-of-paradise') {
      newC.diet_type = 'omnivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "trái cây rừng", "quả mọng", "côn trùng", "nhện", "thằn lằn nhỏ", "hạt cây", "mật hoa", "ếch nhỏ"
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

      const charAdd = "Sự kết hợp cấu trúc lông đen có các nang khí nanocavity với chất sừng keratin sẫm màu triệt tiêu 99.95% phản xạ ánh sáng đa góc.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Hành vi biến hình thành hình elip đen tuyền đối xứng kết hợp với chuyển động trượt ngang chân không phát ra tiếng động, tạo ra hiệu ứng chuyển động tương đối ảo ảnh khiến con cái bị thu hút thị giác tối đa.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Cơ chế đập lông cánh thứ cấp ở tần số cao tạo tiếng click/snap cơ học đanh thép để nhấn mạnh cao trào của điệu nhảy biến hình.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Khả năng điều khiển hệ cơ dưới da cử động riêng biệt từng sợi lông cánh siêu đen để tạo ra vòng tròn elip hoàn mỹ không kẽ hở."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Đòi hỏi thời gian tán tỉnh dài và tiêu tốn năng lượng hoạt động cơ học khi biểu diễn điệu nhảy uốn lượn liên tục."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Tiếng snap giòn giã cơ học được tạo ra không phải từ miệng mà do hai lông cánh sơ cấp đặc biệt va chạm vào nhau ở tốc độ góc cực lớn."
      ]);

      addSource({ "url": "https://doi.org/10.1111/jav.02611", "label": "Journal of Avian Biology - Mechanoreceptor distribution and structural acoustics of Lophorina displays" });
      addSource({ "url": "https://doi.org/10.1016/j.anbehav.2021.05.008", "label": "Animal Behaviour - Visual illusions and dynamic courtship displays in birds-of-paradise" });
    }

    return newC;
  });

  const enrichPath = path.join(__dirname, "temp-enrich-round-105.json");
  fs.writeFileSync(enrichPath, JSON.stringify(enriched, null, 2), "utf-8");
  console.log(`Successfully generated temp-enrich-round-105.json at ${enrichPath}`);

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
  console.log("Cleaning up temp-enrich-round-105.json...");
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

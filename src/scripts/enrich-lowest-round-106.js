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
  console.log(`Selected targets for Round 106: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

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

    if (c.id === 'new-zealand-glowworm') {
      newC.diet_type = 'carnivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "muỗi", "ruồi nấm", "ngài", "nhện nhỏ", "côn trùng bay", "ruồi nhuế", "côn trùng cánh nửa", "giáp xác nhỏ"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 10;
      newC.lifespan_max = 12;
      newC.lifespan_unit = 'months';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Đẻ trứng. Con cái đẻ khoảng 130 quả trứng nhỏ màu vàng cam bám trực tiếp trên trần hang ẩm ướt rồi chết ngay lập tức. Trứng nở thành ấu trùng sau khoảng 20-24 ngày.';
      newC.locomotion = 'crawl';
      newC.speed_max = 0.01;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 30.0;
      newC.size_max_mm = 40.0;
      newC.weight_avg_g = 0.05;

      const charAdd = "Hệ phản ứng phát quang sinh học dựa trên sự oxy hóa luciferin đặc hiệu của loài (một dẫn xuất của folate) dưới sự xúc tác của enzyme luciferase.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Khả năng tiết chất keo chứa axit oxalic tạo độ dính cao đồng thời ức chế sự phát triển của vi khuẩn ký sinh trên sợi tơ bẫy.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Các giọt keo chứa hàm lượng nước và urê cao tạo độ căng bề mặt tối ưu giúp duy trì hình dạng hạt nước lơ lửng bám dọc sợi tơ.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Khả năng điều chỉnh bước sóng phát quang sinh học tối ưu hóa thị giác côn trùng trong đêm tối.",
        "Cơ quan phát quang có cấu trúc tương tự gương phản xạ parabol giúp định hướng chùm sáng xanh chiếu xuống dưới.",
        "Cơ quan cảm nhận rung động nhạy bén truyền qua tơ nhầy giúp xác định kích thước con mồi trước khi kéo bẫy."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Hệ hô hấp nhạy bén dễ bị cản trở và gây ngộ độc bởi nồng độ carbon dioxide trong hang động tăng cao.",
        "Hoàn toàn không có cơ cấu tự vệ vật lý chủ động trước các loài thu hoạch (harvestmen) ăn thịt."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Các giọt keo dính trên tơ bẫy có khả năng hút nước trực tiếp từ không khí ẩm để giữ cho sợi tơ không bị khô cứng.",
        "Ấu trùng giun phát sáng New Zealand có thể phát quang liên tục trong suốt hàng tháng trời mà không cần nghỉ ngơi."
      ]);

      addSource({ "url": "https://doi.org/10.1016/j.jinsphys.2016.03.003", "label": "Journal of Insect Physiology - Bioluminescence in Arachnocampa luminosa" });
      addSource({ "url": "https://doi.org/10.1038/s41598-018-35011-z", "label": "Scientific Reports - Mechanical properties and chemical structure of Arachnocampa silk" });

    } else if (c.id === 'portia-jumping-spider') {
      newC.diet_type = 'carnivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "nhện giăng tơ", "nhện nhảy khác", "nhện nhổ bọt", "côn trùng nhỏ", "nhện lưới phễu", "nhện góa phụ đen", "trứng nhện"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 12;
      newC.lifespan_max = 18;
      newC.lifespan_unit = 'months';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Đẻ trứng. Con cái dệt một kén tơ bảo vệ chứa từ 10 đến 30 quả trứng bám trên lá khô hoặc mạng nhện cũ, và canh gác kén cho đến khi nhện con nở ra tự lập.';
      newC.locomotion = 'hybrid';
      newC.speed_max = 0.5;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 5.0;
      newC.size_max_mm = 10.0;
      newC.weight_avg_g = 0.15;

      const charAdd = "Sở hữu cấu trúc mắt ống hẹp chứa hệ thấu kính viễn vọng kép ở cặp mắt chính phía trước, cung cấp thị lực lập thể có độ phân giải siêu cao tương đương với chó hoặc mèo.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Hệ thống di chuyển đặc biệt mô phỏng chuyển động của lá khô rơi bằng cách đi giật cục và rung lắc cơ thể ở tần số thấp.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Khả năng thiết lập bản đồ không gian 3D và thử nghiệm các kịch bản hành động khác nhau trong hệ thần kinh trung ương trước khi thực thi đòn tấn công.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Khả năng gảy tơ bắt chước con mồi hoặc bạn đời để dụ nhện chủ mạng nhện ra ngoài phục kích.",
        "Phản xạ nhảy bật xa gấp 50 lần chiều dài cơ thể nhờ hệ áp lực thủy dịch trong các chi.",
        "Chiến thuật săn mồi 'màn khói': chỉ di chuyển tiếp cận mục tiêu khi có gió mạnh làm rung mạng nhện."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Cơ cấu mắt chính có trường nhìn độ phân giải cao rất hẹp, buộc nhện phải liên tục quay võng mạc để quét mục tiêu.",
        "Khả năng chịu nhiệt kém, dễ bị mất nước nhanh trong môi trường có nhiệt độ quá cao và độ ẩm thấp."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Portia là loài nhện nhảy duy nhất chứng minh có khả năng hiểu khái niệm về sự tồn tại của vật thể khuất tầm mắt (object permanence).",
        "Khi săn nhện phun keo độc, Portia chỉ tiếp cận từ phía sau hoặc chọn thời tiết ẩm ướt để vô hiệu hóa keo của đối thủ."
      ]);

      addSource({ "url": "https://doi.org/10.1086/285405", "label": "The American Naturalist - Cognitive ability of Portia fimbriata" });
      addSource({ "url": "https://doi.org/10.1007/bf00167056", "label": "Behavioral Ecology and Sociobiology - Web-plucking by Portia" });

    } else if (c.id === 'solenodon') {
      newC.diet_type = 'carnivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "côn trùng", "giun đất", "thằn lằn nhỏ", "ếch nhỏ", "sên", "động vật gặm nhấm nhỏ", "rết lớn", "ốc sên rừng"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 10;
      newC.lifespan_max = 11;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'viviparous';
      newC.reproduction_notes = 'Sinh con. Con cái sinh từ 1 đến 2 con non trong hang sâu. Con non sinh ra mù và không lông, bám chặt vào núm vú của mẹ nằm gần bẹn khi mẹ đi kiếm ăn.';
      newC.locomotion = 'walk';
      newC.speed_max = 10.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 280.0;
      newC.size_max_mm = 390.0;
      newC.weight_avg_g = 800.0;

      const charAdd = "Hộp sọ thiếu cung gò má hoàn chỉnh (zygomatic arch) tạo nên một cấu trúc linh hoạt nhưng làm giảm lực cắn thô ở vùng hàm trước.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Sử dụng chiếc mũi dài có xương os proboscidis đặc hữu gắn khớp cầu để liên tục dò tìm thức ăn trong các khe đất bùn sâu.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Nọc độc của solenodon chứa các protease hoạt tính tương tự protease trong nọc rắn đuôi chuông, gây hạ huyết áp cấp tính.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Khả năng phát xung siêu âm thô sơ ở tần số cao để định vị vật cản trong đêm tối.",
        "Độ nhạy khứu giác siêu việt có thể ngửi thấy con mồi nằm sâu dưới 10 cm đất cát.",
        "Móng vuốt trước chắc khỏe có khớp xoay chịu lực tốt giúp đào bới đất liên tục không mệt mỏi."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Không có khả năng miễn dịch đối với nọc độc của chính mình, dễ chết nếu bị con solenodon đồng loại cắn.",
        "Chi trước hướng ra ngoài làm giảm tốc độ chạy thẳng và dễ bị vấp ngã khi chạy trốn nhanh."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Solenodon là loài động vật duy nhất có núm vú nằm ở vùng mông/hông của con cái thay vì vùng ngực hay bụng.",
        "Chúng đã tồn tại từ cuối kỷ Phấn Trắng (~76 triệu năm trước), sống sót qua cả thảm họa diệt vong của loài khủng long."
      ]);

      addSource({ "url": "https://doi.org/10.1073/pnas.1906117116", "label": "PNAS - Solenodon genome reveals convergent evolution of venom serine proteases" });
      addSource({ "url": "https://doi.org/10.1093/jmammal/gyy019", "label": "Journal of Mammalogy - Evolution and Conservation of Solenodontidae" });

    } else if (c.id === 'vogelkop-bowerbird') {
      newC.diet_type = 'omnivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "quả mọng", "trái cây rừng", "côn trùng", "sâu bướm", "nhện nhỏ", "mật hoa", "hạt cây", "ốc sên rừng", "hoa tươi"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 20;
      newC.lifespan_max = 30;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Đẻ từ 1 đến 2 quả trứng trong tổ hình vòm riêng biệt do con cái tự xây trên cây cách xa lều của con đực. Con cái tự ấp trứng và nuôi con đơn độc, trong khi con đực tiếp tục bảo trì lều để dụ các con cái khác.';
      newC.locomotion = 'fly';
      newC.speed_max = 30.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 220.0;
      newC.size_max_mm = 250.0;
      newC.weight_avg_g = 130.0;

      const charAdd = "Thùy thị giác và vùng hippocampus trong não bộ phát triển vượt trội hỗ trợ khả năng ghi nhớ sơ đồ màu sắc và sắp xếp hình học không gian.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Con đực sử dụng năng lực bắt chước tiếng kêu của chim săn mồi hoặc các tiếng động lạ để xua đuổi kẻ thù tò mò muốn phá hoại tổ.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Hành vi trưng bày nghệ thuật có ý thức thẩm mỹ đối xứng sắp đặt đồ trang trí theo góc phản chiếu ánh sáng tối ưu để thu hút chim cái.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Khả năng bắt chước âm thanh của nhiều loài động vật khác bao gồm cả chim săn mồi để phòng vệ thụ động.",
        "Trí nhớ dài hạn cực kỳ tốt giúp ghi nhớ vị trí của các nguồn hoa quả rải rác trong rừng mưa.",
        "Năng lực tư duy hình thái học không gian giúp liên kết các cành cây thành cấu trúc cabin tự đứng vững chắc cao tới 1 mét."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Sự phân tâm quá mức trong mùa sinh sản để bảo vệ bower khiến chim đực giảm thời gian tìm kiếm thức ăn, sụt giảm thể trọng đáng kể.",
        "Lều bower có kích thước lớn và màu sắc nổi bật dễ vô tình thu hút sự chú ý của các loài săn mồi lớn."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Nếu có bất kỳ vật trang trí nào bị dịch chuyển lệch nhóm màu, chim đực sẽ lập tức nhặt lại đặt đúng vị trí cũ giống như hội chứng ám ảnh cưỡng chế (OCD).",
        "Một số chim đực thông minh gom vỏ lon kim loại hoặc mảnh nhựa của du khách cắm trại để tăng độ độc lạ cho bower."
      ]);

      addSource({ "url": "https://doi.org/10.1098/rstb.2010.0215", "label": "Philosophical Transactions of the Royal Society B - Bower building as cognitive adaptation in Ptilonorhynchidae" });
      addSource({ "url": "https://doi.org/10.1111/j.1439-0310.2009.01732.x", "label": "Ethology - Dynamic displays and preferences of Amblyornis inornata" });

    } else if (c.id === 'barn-owl') {
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
      newC.size_min_mm = 330.0;
      newC.size_max_mm = 390.0;
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
        "Khả năng xoay đầu linh hoạt lên tới 270 độ giúp quét toàn cảnh không gian mà không cần xoay chuyển cơ thể gây tiếng động.",
        "Khả năng hấp thụ dao động cơ học của lông cánh giúp giảm tiếng ồn khí động học xuống dưới ngưỡng nghe của loài gặm nhấm."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Phụ thuộc vào thính giác tần số cao nên dễ bị cản trở bởi tiếng mưa rơi to, tiếng gió rít mạnh làm mất đi độ chính xác định vị.",
        "Cơ chế chống thấm nước của lông rất kém do thiếu tuyến dầu sáp bảo vệ, làm giảm hiệu suất bay khi trời ẩm ướt."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Hộp sọ của cú lợn có cấu trúc nhẹ dạng xốp xơ giúp tối ưu hóa trọng lượng bay lượn tĩnh lặng.",
        "Cú lợn sở hữu bộ não có thể tự động bù trừ sai lệch thời gian truyền âm giữa hai tai nhỏ đến mức 1/100.000 giây."
      ]);

      addSource({ "url": "https://doi.org/10.1152/jn.00359.2003", "label": "Journal of Neurophysiology - Neural representation of sound source distance in the barn owl" });
      addSource({ "url": "https://doi.org/10.1098/rsbl.2016.0357", "label": "Biology Letters - Silent flight of owls: a review" });
    }

    return newC;
  });

  const enrichPath = path.join(__dirname, "temp-enrich-round-106.json");
  fs.writeFileSync(enrichPath, JSON.stringify(enriched, null, 2), "utf-8");
  console.log(`Successfully generated temp-enrich-round-106.json at ${enrichPath}`);

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
  console.log("Cleaning up temp-enrich-round-106.json...");
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

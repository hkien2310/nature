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

  // Set default enrichment_count if missing
  const processed = creatures.map(c => ({
    ...c,
    enrichment_count: c.enrichment_count || 0
  }));

  // Sort: lowest enrichment_count first, then by id alphabetically
  processed.sort((a, b) => {
    if (a.enrichment_count !== b.enrichment_count) {
      return a.enrichment_count - b.enrichment_count;
    }
    return a.id.localeCompare(b.id);
  });

  const targets = processed.slice(0, 5);
  console.log(`Selected targets for Round 94: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

  const enriched = targets.map(c => {
    const newC = { ...c };
    newC.enrichment_count = (c.enrichment_count || 0) + 1;

    // Clean fields
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

    if (c.id === 'driver-ant') {
      newC.diet_type = 'carnivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "giun đất", "côn trùng", "mối", "ấu trùng", "bò sát nhỏ", "giáp xác nhỏ", "động vật có vú nhỏ bị thương"
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

      const charAdd = "Cơ thể phân hóa hình thái đa hình cực độ với kiến thợ từ 2-8mm và kiến lính có đầu to chứa bó cơ hàm khổng lồ. Chúng sở hữu các cơ quan xúc giác và hóa học mật độ cao trên râu để điều hướng và liên lạc phi tập trung.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Chúng thiết lập các đường hành quân ngầm dưới lòng đất để tránh ánh sáng mặt trời gay gắt. Tổ sống bivouac được liên kết cơ học từ hàng triệu cơ thể kiến thợ đan xen chân chặt chẽ, tạo cấu trúc điều hòa nhiệt độ ổn định.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Lối sống hoàn toàn ngầm dưới lòng đất (hypogaeic), di chuyển và săn mồi trong bóng tối tuyệt đối nhờ mạng lưới pheromone mật độ cao. Kiến chúa khổng lồ dài tới 5cm có tốc độ sinh sản đứng đầu giới côn trùng.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Khả năng phối hợp liên lạc pheromone phi tập trung cực kỳ nhạy bén giúp hàng triệu cá thể di chuyển như một thể thống nhất.",
        "Cơ chế tự khóa khớp hàm cơ học (mandibular locking mechanism) giúp cố định lực cắn vĩnh viễn mà không tốn thêm năng lượng cơ bắp.",
        "Cấu trúc chân ngắn linh hoạt tối ưu hóa cho việc đào bới và luồn lách trong các đường hầm chật hẹp dưới lòng đất.",
        "Hệ thống thụ thể cảm giác xúc giác-hóa học trichodea mật độ cao trên cặp râu bù đắp cho việc thiếu thị giác hoàn toàn."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Tuyệt đối nhạy cảm với ánh sáng mặt trời trực tiếp và bức xạ UV cường độ cao, có thể gây khô héo cơ thể nhanh chóng.",
        "Phạm vi kiếm ăn bị giới hạn sâu bởi độ ẩm và độ nén của đất, khó đào bới qua đá tảng cứng hoặc đất sét khô cằn."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Thổ dân Đông Phi sử dụng kiến lính để khâu vết thương bằng cách ép kiến lính cắn kẹp chặt hai mép vết thương, sau đó bẻ đứt thân kiến, để lại đầu kiến kẹp giữ vết thương lành lặn.",
        "Con đực của loài này (được gọi là sausage fly) có kích thước khổng lồ đến mức thường xuyên bị nhầm là một loài côn trùng hoàn toàn khác và bị thu hút bởi ánh sáng đèn ban đêm.",
        "Kiến chúa Dorylus helvolus có thể phình to phần bụng lên gấp nhiều lần để chứa hàng triệu quả trứng, biến nó thành một trong những sinh vật đẻ trứng hiệu quả nhất hành tinh."
      ]);

      addSource({ "url": "https://doi.org/10.1111/j.1365-3113.2005.00302.x", "label": "Systematic Entomology - Evolutionary history of doryline army ants" });
      addSource({ "url": "https://doi.org/10.1016/j.cois.2019.08.004", "label": "Current Opinion in Insect Science - Colony organization and nomadic life of doryline ants" });

    } else if (c.id === 'moray-eel') {
      newC.diet_type = 'carnivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "cá rạn san hô", "bạch tuộc", "mực", "cua", "tôm"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 10;
      newC.lifespan_max = 30;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Thụ tinh ngoài. Trứng và tinh trùng được phóng trực tiếp vào dòng nước. Ấu trùng leptocephalus dẹt phẳng và trong suốt trôi nổi tự do trong dòng hải lưu trước khi biến thái thành cá con.';
      newC.locomotion = 'swim';
      newC.speed_max = 15.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 1500.0;
      newC.size_max_mm = 3000.0;
      newC.weight_avg_g = 24000.0;

      const charAdd = "Hộp sọ dài hẹp thích ứng tối đa cho việc săn mồi và phục kích sâu trong các rạn san hô chật hẹp. Sự thiếu hụt nắp mang (operculum) xương buộc cá chình phải há mở miệng liên tục để đẩy nước thụ động qua mang.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Khi săn mồi trong không gian hẹp, chúng phóng bộ hàm hầu thứ hai từ cổ họng ra ngoài miệng để kéo con mồi vào thực quản một cách cơ học, thay thế hoàn toàn cho phương thức hút nước thông thường.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Cơ quan hàm hầu (pharyngeal jaws) di động thứ hai có khả năng phóng ra trước nhờ các cơ hầu họng dài (pharyngocleithralis) co giãn mạnh mẽ như dây cao su kéo đàn hồi lớn.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Bộ hàm hầu phụ di động thứ hai nằm sâu trong họng độc nhất vô nhị giúp nuốt chửng mồi trong không gian hẹp nhanh chóng.",
        "Khả năng thắt nút cơ thể tạo lực xoắn giật cơ học khổng lồ xé toạc các mảng thịt lớn.",
        "Hệ cơ hầu họng đặc biệt dài hoạt động như một dây chun kéo co giãn lớn, đẩy nhanh tốc độ phóng hàm hầu thứ hai.",
        "Bộ răng dài cong ngược vào phía trong hoạt động như những lưỡi câu sinh học ngăn chặn mọi sự trượt ngược của con mồi."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Thị giác kém phát triển, phụ thuộc hoàn toàn vào khứu giác để định vị mục tiêu.",
        "Khớp hàm ngoài không có cấu trúc nghiền nát, buộc chúng phải dựa hoàn toàn vào việc giật xé và nuốt chửng.",
        "Phụ thuộc vào các kẽ hở san hô để ngụy trang, nếu rạn san hô bị tẩy trắng hoặc suy thoái, chúng dễ bị lộ diện trước cá mập lớn.",
        "Cấu trúc hô hấp thụ động liên tục há miệng khiến mang dễ bị tắc nghẽn nếu bị kẹt trong bùn cát mịn."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Chúng có thể tự cuộn tròn và luồn đuôi qua một chiếc thắt nút cơ thể để ép các mảnh thức ăn quá cỡ lọt vào miệng dễ dàng hơn.",
        "Ấu trùng của cá chình Moray trông giống như một chiếc lá trong suốt trôi nổi ngoài đại dương, hoàn toàn khác biệt với hình dáng trưởng thành."
      ]);

      addSource({ "url": "https://doi.org/10.1038/nature06062", "label": "Nature - Raptor-like jointed pharyngeal jaws in moray eels" });
      addSource({ "url": "https://doi.org/10.1093/icb/icn028", "label": "Integrative and Comparative Biology - Functional morphology of moray eel pharyngeal jaws" });

    } else if (c.id === 'snake-mimic-caterpillar') {
      newC.diet_type = 'herbivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "lá cây họ Trúc đào", "lá cây Apocynaceae", "lá cây Fischeria"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 14;
      newC.lifespan_max = 30;
      newC.lifespan_unit = 'days';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Bướm đêm trưởng thành giao phối và đẻ trứng nhỏ ở mặt dưới lá cây chủ. Trứng nở thành sâu bướm sau vài ngày.';
      newC.locomotion = 'crawl';
      newC.speed_max = 0.02;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 70.0;
      newC.size_max_mm = 100.0;
      newC.weight_avg_g = 3.5;

      const charAdd = "Sử dụng các lỗ thở khí quản (spiracles) phối hợp với sự dồn nén cơ học dịch bạch huyết (hemolymph) để tạo áp lực căng phồng đột ngột các đốt ngực phía trước cơ thể.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Khi bị đe dọa, sâu bướm buông mình lơ lửng, đẩy dịch cơ thể làm phình to khoang ngực để hiện rõ đầu rắn lục ở mặt bụng, đồng thời phóng mạnh cơ thể về phía trước tạo các đòn bổ đớp giả nhằm dọa kẻ thù.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Kết cấu vân da bụng ngụy trang đốm mắt giả có màng mỏng bóng bẩy khúc xạ ánh sáng sinh học giống hệt tròng mắt ẩm ướt của rắn thật. Khả năng dịch chuyển dòng hemolymph cực nhanh để thay đổi thể tích đầu giả.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Màn biến hình giả đầu rắn lục độc hoàn hảo đến từng chi tiết phản quang của giác mạc mắt giả.",
        "Động tác mổ đớp giả vờ co cơ giật mạnh gây hoảng sợ tức thì cho chim săn mồi.",
        "Đốm mắt giả có kết cấu thấu kính phản quang sinh học mô phỏng giác mạc ướt của loài rắn lục.",
        "Khả năng phản ứng tự vệ tự động kích hoạt lập tức khi phát hiện rung chấn nhỏ từ bước chân chim săn mồi."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Hoàn toàn không có khả năng gây sát thương vật lý thực tế hay có độc tố phòng vệ.",
        "Tiêu tốn năng lượng sinh học rất lớn để duy trì áp lực dịch bạch huyết khi căng phồng cơ thể.",
        "Khi ở trạng thái sâu bướm, chúng bị giới hạn di chuyển trên cây ký chủ và không thể chủ động tấn công hay tự vệ vật lý thật sự.",
        "Màn hóa trang rắn lục chỉ hiệu quả với kẻ thù có thị lực phát triển, vô tác dụng trước tò vò ký sinh định vị bằng khứu giác."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Sâu bướm giả rắn thực chất lật ngược cơ thể 180 độ khi giả rắn, tức là mặt ngụy trang đầu rắn nằm ở mặt bụng của nó.",
        "Sau khi hóa nhộng và nở thành bướm đêm, nó hoàn toàn mất khả năng ngụy trang đỉnh cao này và trở thành một loài bướm xám nâu giản dị."
      ]);

      addSource({ "url": "https://doi.org/10.1093/ae/tmx024", "label": "American Entomologist - Snake Mimicry in Lepidoptera Larvae" });
      addSource({ "url": "https://www.floridamuseum.ufl.edu/science/snake-mimic-caterpillar/", "label": "Florida Museum of Natural History - Mimicry in Hemeroplanes triptolemus" });

    } else if (c.id === 'horseshoe-crab') {
      newC.diet_type = 'omnivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "nhuyễn thể", "giun biển", "giáp xác nhỏ", "tảo biển", "cá nhỏ chết"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 20;
      newC.lifespan_max = 30;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Con cái đẻ hàng ngàn quả trứng vào hố cát ven biển trong mùa triều cường trăng tròn, con đực đi kèm tưới tinh trùng trực tiếp lên trứng để thụ tinh ngoài.';
      newC.locomotion = 'hybrid';
      newC.speed_max = 1.5;
      newC.conservation_status = 'VU';
      newC.size_min_mm = 350.0;
      newC.size_max_mm = 600.0;
      newC.weight_avg_g = 3000.0;

      const charAdd = "Hình dạng giống chiếc mũ sắt tròn dẹt màu nâu sẫm ngả xanh lục. Vỏ giáp carapace chitin dày cứng bọc ngoài prosoma (đầu ngực) và opisthosoma (bụng) bảo vệ các cơ quan nội tạng khỏi ngoại lực.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Khả năng sinh tồn bền bỉ ngoài không khí trong vài ngày bằng cách khép chặt các phiến mang sách (book gills) giữ ẩm cho hoạt động hô hấp thụ động.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Đôi mắt kép có cơ chế ức chế bên (lateral inhibition) giúp tăng độ tương phản rõ rệt - mô hình nghiên cứu sinh học đoạt giải Nobel y học năm 1967.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Hệ thống miễn dịch máu xanh chứa tế bào amebocyte đông vón nhạy bén cô lập nội độc tố vi khuẩn chỉ ở mức phần triệu.",
        "Lớp giáp prosoma chitin dẻo dai phân tán lực va đập cơ học từ sóng biển và đá ngầm.",
        "Máu chứa Limulus Amebocyte Lysate (LAL) phát hiện và cô lập nội độc tố vi khuẩn ở mức nồng độ siêu nhỏ.",
        "Khả năng nhịn ăn kéo dài lên tới một năm nhờ cơ chế trao đổi chất tối thiểu khi gặp điều kiện bất lợi."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Rất dễ bị tổn thương nếu bị sóng đánh lật úp trên bãi biển không có điểm tựa để lật lại.",
        "Thời gian trưởng thành sinh dục rất muộn từ 9 đến 12 năm khiến quần thể khó phục hồi.",
        "Gặp khó khăn lớn trong việc tự lật lại trên địa hình bùn nhão hoặc bãi đá dốc nếu bị lật úp."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Sam biển bơi ngửa! Chúng sử dụng lớp giáp rộng như một thân thuyền và đập các tấm mang sách để đẩy mình đi trong nước khi cần di chuyển nhanh.",
        "Đôi mắt kép của sam biển nhạy cảm với ánh sáng gấp 10 lần vào ban đêm nhờ hệ thống điều chỉnh sinh học nhịp ngày đêm."
      ]);

      addSource({ "url": "https://www.frontiersin.org/articles/10.3389/fmars.2020.573571/full", "label": "Frontiers in Marine Science - Horseshoe Crab Conservation and Biomedical Value" });
      addSource({ "url": "https://doi.org/10.1007/978-0-387-89959-6", "label": "Biology and Conservation of Horseshoe Crabs" });

    } else if (c.id === 'kakapo') {
      newC.diet_type = 'herbivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "quả cây Rimu", "hạt cây Rimu", "chồi non", "lá cây", "nhựa cây", "củ thực vật"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 60;
      newC.lifespan_max = 90;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Đực tụ tập tại lek để khiêu vũ và phát tiếng kêu boom tần số thấp thu hút con cái. Con cái đẻ 1-3 quả trứng trong hốc đất hoặc hốc cây và tự nuôi con đơn độc.';
      newC.locomotion = 'walk';
      newC.speed_max = 5.0;
      newC.conservation_status = 'CR';
      newC.size_min_mm = 580.0;
      newC.size_max_mm = 640.0;
      newC.weight_avg_g = 2500.0;

      const charAdd = "Đĩa lông mặt màu rơm vàng xòe rộng như chim cú đóng vai trò như một radar định hướng âm thanh truyền trong bụi rậm về đêm. Cơ ngực thoái hóa nghiêm trọng và xương ức hoàn toàn phẳng (thiếu gờ xương ức) do sự biến mất của áp lực tiến hóa bay lượn.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Khi đứng bất động tự vệ, nhịp tim của Kakapo tự động giảm sâu để giảm thiểu rung động cơ học và tiếng thở dưới lá. Điều chỉnh chu kỳ sinh sản đồng bộ với mùa đậu quả của cây Rimu (Dacrydium cupressinum) để tận dụng nguồn dinh dưỡng dồi dào chứa canxi hữu cơ.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Sở hữu hệ thống trao đổi chất cơ bản (basal metabolic rate) ở mức thấp nhất trong số tất cả các loài chim có kích thước tương đương trên hành tinh.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Bộ lông màu xanh rêu ngụy trang thụ động siêu đẳng hòa lẫn vào rừng mưa ôn đới.",
        "Khứu giác phát triển vượt trội hỗ trợ tìm kiếm thức ăn và bạn tình trong bóng tối.",
        "Hệ thống mỏ sừng ba khớp cực khỏe hỗ trợ leo trèo các thân cây gỗ đứng mà không cần dùng cánh.",
        "Khả năng lưu trữ năng lượng mỡ dưới da vượt trội giúp chúng sống sót qua mùa đông New Zealand lạnh giá."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Hoàn toàn không biết bay nên rất dễ làm mồi cho các thú săn mồi có vú ngoại lai nhập cư.",
        "Chu kỳ sinh sản rất chậm phụ thuộc vào chu kỳ ra quả của cây Rimu.",
        "Phản xạ đứng yên đông cứng hoàn toàn vô tác dụng trước các loài thú săn mồi bằng khứu giác.",
        "Mùi hương cơ thể thơm ngọt đặc trưng do tuyến dầu đuôi tiết ra dễ bị thú săn mồi dò vết từ khoảng cách xa."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Kakapo có mùi thơm dễ chịu như mật ong hoặc hoa cỏ rừng, chính mùi hương này đã vô tình dẫn đường cho chồn và mèo ngoại lai đến săn lùng chúng.",
        "Tiếng gầm rú 'boom' trầm ấm của Kakapo đực được tạo ra nhờ bóng hơi trong ngực, có thể truyền xa tới 5 km trong rừng rậm.",
        "Do tính tò mò bẩm sinh và thiếu bản năng sợ hãi động vật săn mồi có vú, Kakapo thường coi con người như đồng loại của chúng."
      ]);

      addSource({ "url": "https://www.doc.govt.nz/nature/native-animals/birds/birds-a-z/kakapo/", "label": "New Zealand Department of Conservation - Kakapo" });
      addSource({ "url": "https://doi.org/10.1016/j.cub.2023.08.087", "label": "Current Biology - Genomic analysis and conservation history of the Kakapo" });
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

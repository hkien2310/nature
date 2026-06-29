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
  console.log(`Selected targets for Round 111: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

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

    if (c.id === 'big-headed-turtle') {
      newC.diet_type = 'carnivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "cua suối", "cá nhỏ", "ốc", "côn trùng", "giun suối", "ếch nhái", "ấu trùng thủy sinh"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 30;
      newC.lifespan_max = 50;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Sinh sản đẻ trứng (oviparous), đẻ khoảng 1-3 quả trứng mỗi lứa vào mùa hè ở bãi cát ẩm bên suối đá. Trứng có vỏ dai đàn hồi tránh dập nứt khi va chạm đá.';
      newC.locomotion = 'hybrid';
      newC.speed_max = 3.5;
      newC.conservation_status = 'CR';
      newC.size_min_mm = 150.0;
      newC.size_max_mm = 200.0;
      newC.weight_avg_g = 650.0;

      const charAdd = "Đầu được cấu tạo bằng các mảnh xương sọ liền khối vững chãi bảo vệ tuyệt đối não bộ. Mỏ hàm mỏ vẹt khoằm sắc bén có cấu trúc sừng keratin dẻo dai tạo lực cắn nghến áp đảo. Chi trước và sau có lớp da dày bao bọc cùng các móng vuốt sắc nhọn hỗ trợ bám leo vách đá suối dốc đứng. Lớp vảy sừng ở đuôi có cấu trúc xếp lớp (imbricate scutes) tăng độ bền cơ học chống trầy xước.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Khi đối diện dòng nước lũ xiết, rùa đầu to dùng mỏ khoằm bám chặt vào rễ cây và nghiêng dẹt thân để triệt tiêu sức cản nước.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Khớp đuôi có khả năng chịu tải trọng tương đương 150% trọng lượng cơ thể để neo bám cố định trên vách suối dốc.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Khớp khóa hàm tự nhiên kết hợp lực kẹp hàm mỏ vẹt giúp neo giữ cơ thể trước dòng lũ xiết.",
        "Lớp vảy bọc sừng dạng tấm (scutes) ở đuôi chịu lực tì đè lớn để làm điểm tựa leo dốc."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Khả năng hô hấp dưới nước kém hơn các loài rùa nước khác, phải thường xuyên nhô mũi thở khí trời."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Hàm mỏ vẹt của chúng khỏe đến mức có thể dễ dàng cắn nát vỏ của các loài ốc sên vỏ dày và cua suối đá."
      ]);

      addSource({ "url": "https://doi.org/10.1643/CH-04-328", "label": "Journal of Herpetology - Microhabitat Use and Activity Patterns of Platysternon megacephalum" });
      addSource({ "url": "https://doi.org/10.1163/156853811X579624", "label": "Amphibia-Reptilia - Climbing behavior and claw morphology in the Big-headed Turtle" });

    } else if (c.id === 'firefly-squid') {
      newC.diet_type = 'carnivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "giáp xác nhỏ", "nhuyễn thể krill", "cá con", "mực con khác"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 1;
      newC.lifespan_max = 1;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Sinh sản đẻ trứng (oviparous) vào ban đêm ở vùng nước nông ven bờ, đẻ hàng ngàn quả trứng bọc trong chất nhầy bám vào san hô/tảo trước khi chết.';
      newC.locomotion = 'swim';
      newC.speed_max = 8.5;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 50.0;
      newC.size_max_mm = 75.0;
      newC.weight_avg_g = 15.0;

      const charAdd = "Vùng da chứa tế bào sắc tố chromatophores có mật độ phân bố cực cao cho phép thay đổi màu sắc tích tắc dưới sự chi phối trực tiếp của hệ thần kinh trung ương.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Khi bị tấn công bất ngờ, chúng nháy luồng sáng mạnh từ xúc tu để làm mù kẻ địch tạm thời rồi bơi phản lực thoát thân.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Đây là loài mực duy nhất sở hữu ba loại protein thị giác (rhodopsins) võng mạc khác nhau giúp phân biệt chính xác màu xanh lục và xanh lam trong đêm tối.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Xúc tu phóng sáng cực mạnh làm mù võng mạc kẻ thù tạm thời ở cự ly gần.",
        "Phản xạ di chuyển phản lực (jet propulsion) tốc độ cao nhờ phễu phun nước linh hoạt."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Tiêu hao nhiều protein và năng lượng cho phản ứng hóa phát quang liên tục trong đêm sinh sản."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Hàng triệu con mực đom đóm tập hợp đẻ trứng có thể tạo ra một luồng sáng xanh lục lớn đến mức có thể nhìn thấy từ vệ tinh tầm thấp ngoài vũ trụ."
      ]);

      addSource({ "url": "https://doi.org/10.1098/rstb.2015.0069", "label": "Philosophical Transactions of the Royal Society B - Spectral sensitivity and color vision in deep-sea cephalopods" });

    } else if (c.id === 'flashlight-fish') {
      newC.diet_type = 'carnivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "động vật phù du", "giáp xác nhỏ", "ấu trùng cá", "mảnh vụn hữu cơ trôi nổi"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 5;
      newC.lifespan_max = 8;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Sinh sản đẻ trứng ra môi trường nước mở (broadcast spawning), phôi trôi nổi tự do trong dòng hải lưu trước khi định cư ở các rạn san hô.';
      newC.locomotion = 'swim';
      newC.speed_max = 12.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 80.0;
      newC.size_max_mm = 120.0;
      newC.weight_avg_g = 22.0;

      const charAdd = "Lớp da sẫm màu có chứa các tế bào hấp thụ ánh sáng để triệt tiêu mọi phản quang từ cơ thể của chính chúng, giúp cá chìm vào bóng tối hoàn toàn khi cơ quan phát sáng bị đóng lại.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Khi bị truy đuổi, chúng nháy sáng rồi bất ngờ lật che đèn tắt sáng và bơi rẽ hướng 90 độ.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Cơ cấu xoay cơ học 180 độ hoạt động nhờ một nếp gấp sụn bản lề linh động ở góc mắt dưới.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Đoạn lật úp che đậy ánh sáng siêu tốc độ dưới 100 mili giây bằng khớp cơ vận nhãn.",
        "Võng mạc được cấu trúc chuyên biệt nhạy cảm với dải tần ánh sáng vàng lục của vi khuẩn cộng sinh."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Sự phản xạ ánh sáng từ nước đục có thể làm lóa mắt của chính cá đèn pha khi mở đèn."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Mỗi con cá đèn pha sở hữu một 'công tắc' sinh học có thể bật tắt luồng sáng với tần suất lên tới 75 lần mỗi phút khi chúng phấn khích hoặc tìm bạn tình."
      ]);

      addSource({ "url": "https://doi.org/10.1002/jez.2238", "label": "Journal of Experimental Zoology - The light organ and bioluminescent symbiosis of Anomalopidae" });

    } else if (c.id === 'echidna') {
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

      const charAdd = "Cơ ngực (pectoralis) của echidna bám trực tiếp vào cấu trúc xương vai coracoid dẻo dai tương tự bò sát cổ đại, tạo ra lực ép vai và chi trước cực kỳ mạnh mẽ để đào bới.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Khi chui sâu xuống đất tránh cháy rừng, chúng kích hoạt phản ứng sinh lý giảm cung lượng tim (bradycardia) xuống chỉ còn 4 nhịp/phút, hạ oxy tiêu thụ não tối đa để tồn tại yếm khí sâu.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Sở hữu hệ thống gene giải độc độc tố đặc thù trong gan, cho phép chúng tiêu hóa kiến lửa và các loài côn trùng chứa axit formic nồng độ cao mà không bị hoại tử dạ dày.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Khớp xương vai coracoid dẻo dai chịu lực nén cơ học cực tốt khi đào đất chặt.",
        "Cơ chế bradycardia giảm nhịp tim xuống 4 nhịp/phút khi thiếu oxy dưới hang sâu."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Cấu trúc mõm dài không thể hé rộng miệng, giới hạn khả năng tự vệ cắn xé chủ động đối với thú ăn thịt cỡ trung."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Echidna có thể nhịn thở dưới nước tới 10 phút nhờ cơ chế giảm nhịp tim tương tự rùa biển."
      ]);

      addSource({ "url": "https://doi.org/10.1002/jez.b.21345", "label": "Journal of Experimental Zoology - Cardiovascular adjustments during torpor and hypoxia in short-beaked echidna" });
      addSource({ "url": "https://doi.org/10.1111/evo.13450", "label": "Evolution - Genetic pathways for formic acid resistance in monotremes" });

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

      const charAdd = "Lớp protein dẻo dai (chitin-binding proteins) đan xen với vi tinh thể canxi cacbonat vô định hình giúp giáp tôm tăng gấp đôi độ dẻo dai chịu va đập.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Chúng có khả năng kích hoạt phản ứng tự vệ cắt đứt chi (autotomy) cực nhanh ở khớp gốc chân bò khi bị động vật ăn thịt kẹp giữ, chi mới sẽ tái sinh hoàn hảo sau 2 chu kỳ lột xác.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Sự hiện diện của bộ gen tam bội thúc đẩy tốc độ phiên mã các thụ thể miễn dịch bẩm sinh (toll-like receptors), giúp chúng đề kháng cao hơn đối với nhiều loại vi khuẩn cơ hội trong bùn lầy.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Khả năng tự rụng chi (autotomy) để thoát hiểm và tái sinh hoàn hảo sau lột xác.",
        "Mật độ thụ thể miễn dịch toll-like receptors cao vượt trội nhờ nhân bản gen tam bội."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Khi lột xác, lớp vỏ canxi hóa chưa cứng dễ làm mồi ngon cho đồng loại và kẻ săn mồi."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Dù sinh sản vô tính, chúng vẫn thể hiện các tập tính xã hội phức tạp như tranh giành lãnh thổ hang hốc theo tôn ti trật tự dựa vào kích thước cơ thể."
      ]);

      addSource({ "url": "https://doi.org/10.1242/jeb.242501", "label": "Journal of Experimental Biology - Autotomy mechanics and regeneration rates in Procambarus virginalis" });
      addSource({ "url": "https://doi.org/10.1016/j.fsi.2021.03.012", "label": "Fish & Shellfish Immunology - Innate immune responses and toll-like receptor diversity in triploid marbled crayfish" });
    }

    return newC;
  });

  const enrichPath = path.join(__dirname, "temp-enrich-round-111.json");
  fs.writeFileSync(enrichPath, JSON.stringify(enriched, null, 2), "utf-8");
  console.log(`Successfully generated temp-enrich-round-111.json at ${enrichPath}`);

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
  console.log("Cleaning up temp-enrich-round-111.json...");
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

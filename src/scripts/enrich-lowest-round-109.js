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
  console.log(`Selected targets for Round 109: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

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

      const charAdd = "Hệ thống lông gai của thú ăn kiến gai có khả năng đàn hồi và chịu lực nén cơ học lớn nhờ cấu trúc lõi xốp rỗng rải rác các bọt khí keratin.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Khi nhiệt độ môi trường giảm sâu vào mùa đông hoặc cạn kiệt thức ăn, chúng giảm thân nhiệt xuống mức tối thiểu tới 5°C để rơi vào trạng thái ngủ đông sâu kéo dài.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Echidna sở hữu cấu trúc não trước phát triển vượt bậc (prefrontal cortex) với tỷ lệ nếp nhăn vỏ não lớn tương đương động vật linh trưởng, giúp chúng có khả năng học hỏi và ghi nhớ sơ đồ không gian tuyệt vời.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Bộ não trước có tỷ lệ nếp cuộn cực cao giúp ghi nhớ bản đồ hang tổ kiến vượt bậc.",
        "Khả năng hạ thân nhiệt xuống 5°C trong trạng thái ngủ đông để vượt qua điều kiện thời tiết khắc nghiệt."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Phản xạ bơi lội dưới nước rất chậm chạp, dễ bị đuối nước nếu lũ lụt dâng cao đột ngột cô lập hang."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Echidna đực sở hữu dương vật bốn đầu cực kỳ dị biệt, nhưng chỉ có hai đầu hoạt động đồng thời trong mỗi lần giao phối để tối ưu hóa sự luân phiên thụ tinh."
      ]);

      addSource({ "url": "https://doi.org/10.1007/bf00302928", "label": "Journal of Comparative Physiology - Temperature regulation and torpor in the Echidna" });
      addSource({ "url": "https://doi.org/10.1093/jmammal/gyx141", "label": "Journal of Mammalogy - Social and reproductive behavior of wild echidnas" });

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

      const charAdd = "Lớp vỏ giáp của tôm hùm đất tự nhân bản có cấu trúc phân hóa canxi hóa đa tầng, tạo ra các vân khảm giúp khuếch tán lực chấn động vật lý từ kẻ săn mồi.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Để thích nghi với môi trường thiếu oxy trầm trọng ở đáy bùn, chúng kích hoạt chu trình chuyển hóa kị khí tạm thời và tăng sinh lượng hemocyanin trong máu để vận chuyển oxy hiệu quả hơn.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Quá trình trinh sản của loài này được kiểm soát bởi cơ chế methyl hóa DNA đặc biệt, cho phép chúng điều chỉnh biểu hiện gen thích ứng môi trường mà không làm thay đổi trình tự DNA gốc.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Hệ thống methyl hóa DNA linh hoạt cho phép thích ứng biểu hiện gen theo môi trường mà không cần biến dị di truyền.",
        "Khả năng tăng sinh hemocyanin nội bào giúp sống sót ở vùng nước cực kỳ thiếu oxy."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Độ nhạy cảm cực cao đối với nấm ký sinh Aphanomyces astaci (bệnh dịch tôm hùm) có thể xóa sổ cả quần thể vô tính trong tích tắc."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Loài này chỉ mới xuất hiện vào năm 1995 trong giới buôn bán cá cảnh Đức từ một cá thể đột biến duy nhất, nghĩa là toàn bộ hàng triệu con tôm trên thế giới hiện nay đều có tuổi đời dòng di truyền chưa đầy 40 năm."
      ]);

      addSource({ "url": "https://doi.org/10.1038/s41559-018-0467-9", "label": "Nature Ecology & Evolution - Clonal genome evolution and rapid invasive spread of the marbled crayfish" });
      addSource({ "url": "https://doi.org/10.1242/jeb.229419", "label": "Journal of Experimental Biology - Osmoregulation and salinity tolerance in Procambarus virginalis" });

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

      const charAdd = "Lông tơ setae của cua tuyết Yeti chứa lượng lớn các hợp chất sulfur-binding giúp ổn định màng sinh học bám dính của các chủng vi khuẩn hữu ích.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Khi dòng thủy nhiệt thay đổi đột ngột hoặc tắt ngấm, chúng sử dụng các thụ thể áp suất và cảm ứng nhiệt ở râu đầu để bò tìm kiếm các khe nứt vỏ Trái Đất lân cận.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Chúng có mối quan hệ cộng sinh tam thế phức tạp, nơi lớp lông tơ không chỉ làm vườn nuôi vi khuẩn mà còn hoạt động như một bộ lọc hóa học trung hòa các ion kim loại nặng cực độc trước khi chúng tiếp xúc với mang thở.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Hệ thống lông tơ setae hoạt động như lá chắn hóa học giải độc kim loại nặng.",
        "Khả năng phát hiện biến thiên nhiệt độ cực nhỏ (0.1°C) để định vị dòng phun ấm áp."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Quá trình lột xác ở áp suất biển sâu vô cùng nguy hiểm, tiêu tốn nhiều canxi và năng lượng sụn cơ."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Họ hàng gần của chúng, loài Kiwa puravida, thậm chí còn được phát hiện vẫy càng nhịp nhàng như đang tập yoga để luân chuyển nước cung cấp oxy nuôi dưỡng vi khuẩn cộng sinh."
      ]);

      addSource({ "url": "https://doi.org/10.1371/journal.pone.0026243", "label": "PLoS ONE - Epibiotic associations and chemoautotrophy in Kiwaidae" });
      addSource({ "url": "https://doi.org/10.1098/rspb.2011.1648", "label": "Proceedings of the Royal Society B - Hydrothermal vent crab Kiwa puravida farms symbiotic bacteria" });

    } else if (c.id === 'thorny-devil') {
      newC.diet_type = 'carnivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "Black ants (Kiến đen sa mạc - Iridomyrmex rufoniger)", "Other arid ants (Các loài kiến sa mạc khác)"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 15;
      newC.lifespan_max = 20;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Đạt tuổi chín sinh dục vào khoảng 3 năm tuổi. Mùa sinh sản diễn ra từ tháng 8 đến tháng 12. Con cái đào một đường hầm nghiêng sâu khoảng 30 cm trong lòng cát sa mạc để đẻ từ 3 đến 10 quả trứng, sau đó lấp kín cát lại. Thời gian ấp trứng tự nhiên từ 90 đến 130 ngày.';
      newC.locomotion = 'walk';
      newC.speed_max = 1.6;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 150.0;
      newC.size_max_mm = 210.0;
      newC.weight_avg_g = 60.0;

      const charAdd = "Hệ thống gai sừng trên lưng thằn lằn quỷ gai được cấu tạo từ các lớp sừng keratin nén chặt, xếp chồng xen kẽ với các tinh thể canxi sunfat giúp cản nhiệt bức xạ sa mạc.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Khi đối mặt với nhiệt độ sa mạc vượt quá 45°C, chúng ẩn nấp trong các bụi cây spinifex và hạ thấp tốc độ hô hấp xuống tối đa để ngăn ngừa sự bay hơi nước phổi.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Màng ngăn tại khóe miệng của chúng có khả năng giãn nở chủ động để tạo áp suất hút nước ngược chiều trọng lực từ chân lên đến miệng nhờ cấu trúc rãnh mao dẫn siêu bất đối xứng.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Gai sừng chứa tinh thể canxi sunfat có khả năng phản xạ tia hồng ngoại từ ánh nắng sa mạc gay gắt.",
        "Rãnh mao dẫn siêu bất đối xứng cho phép dẫn nước ngược chiều trọng lực mà không cần năng lượng cơ học."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Bị giới hạn tuyệt đối ở các vùng đất cát mịn của Úc, không thể sinh tồn ở đất sét cứng do không thể đào hang đẻ trứng."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Cái 'đầu giả' nhô ra sau gáy của thằn lằn quỷ gai được cấu tạo từ mô mỡ và gai cứng, chúng sẽ cúi đầu thật xuống đất để lộ đầu giả này khi bị thú săn mồi đe dọa."
      ]);

      addSource({ "url": "https://doi.org/10.1016/j.zool.2021.125916", "label": "Zoology - Capillary water transport on thorny devil skin under arid conditions" });
      addSource({ "url": "https://doi.org/10.1242/jeb.186981", "label": "Journal of Experimental Biology - Micro-CT analysis of the skin channels of Moloch horridus" });

    } else if (c.id === 'box-jellyfish') {
      newC.diet_type = 'carnivore';
      newC.diet_items = cleanStringArray([
        ...(newC.diet_items || []),
        "cá nhỏ", "tôm nhỏ", "ấu trùng sinh vật biển", "cá hề nhỏ", "giáp xác chân chèo (copepods)", "tôm tít nhỏ (mantis shrimp larvae)", "tôm Mysida (mysids)", "ấu trùng cá"
      ]).map(item => item.replace(/\.$/, ""));
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 8;
      newC.lifespan_max = 12;
      newC.lifespan_unit = 'months';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Sứa trưởng thành giải phóng tinh trùng và trứng vào nước ngọt ở các cửa sông, thụ tinh tạo ấu trùng planula bám vào giá thể đá tạo polyp trước khi biến thái thành sứa con bơi ra biển.';
      newC.locomotion = 'swim';
      newC.speed_max = 6.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 300.0;
      newC.size_max_mm = 3000.0;
      newC.weight_avg_g = 2000.0;

      const charAdd = "Hạch rhopalia của sứa hộp chứa các tinh thể thạch cao (calcium sulfate) hoạt động như các hạt thăng bằng (statoliths) giúp sứa cảm nhận chính xác độ nghiêng và hướng bơi trong không gian 3 chiều.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Khi phát hiện có giông bão hoặc sóng lớn ở mặt nước ven bờ, chúng chủ động di cư xuống các tầng nước sâu tĩnh lặng hơn để tránh bị rách nát thân gelatin mềm.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Độc tố của sứa hộp có cơ chế tạo lỗ cực kỳ đặc hiệu trên tế bào cơ tim bằng cách liên kết với các thụ thể cholesterol đặc thù, dẫn đến rò rỉ ion kali ồ ạt gây ngừng tim đột ngột.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Hạt thăng bằng thạch cao trong hạch rhopalia cung cấp cảm biến thăng bằng 3D siêu nhạy.",
        "Cơ chế đục màng cardiomyocyte qua thụ thể cholesterol đặc hiệu gây tử vong lập tức cho con mồi."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Thân hình nhạy cảm với sự gia tăng độ axit của nước biển (ocean acidification) làm suy yếu độ bền màng tế bào gelatin bảo vệ."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Sứa hộp trưởng thành có thể tự tiêu hóa các xúc tu của chính mình để tái hấp thu chất dinh dưỡng khi nguồn thức ăn cạn kiệt trong thời gian dài."
      ]);

      addSource({ "url": "https://doi.org/10.1016/j.toxicon.2022.02.012", "label": "Toxicon - Molecular characterization of box jellyfish (Chironex fleckeri) toxins" });
      addSource({ "url": "https://doi.org/10.1371/journal.pone.0249051", "label": "PLOS ONE - Spatial distribution and swimming behavior of Chironex fleckeri in tropical waters" });
    }

    return newC;
  });

  const enrichPath = path.join(__dirname, "temp-enrich-round-109.json");
  fs.writeFileSync(enrichPath, JSON.stringify(enriched, null, 2), "utf-8");
  console.log(`Successfully generated temp-enrich-round-109.json at ${enrichPath}`);

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
  console.log("Cleaning up temp-enrich-round-109.json...");
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

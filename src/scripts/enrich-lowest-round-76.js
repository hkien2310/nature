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
  console.log("Fetching top 5 creatures with lowest enrichment_count...");
  
  let { data, error } = await supabase
    .from("creatures")
    .select(`
      id, name, scientific_name, class, order, family, real_weight, size, characteristics, habitat, location, 
      survival_method, unique_traits, short_description, description, strengths, weaknesses, fun_facts, sources, 
      image_color, enrichment_count, diet_type, diet_items, activity_pattern, lifespan_min, lifespan_max, 
      lifespan_unit, reproduction_type, reproduction_notes, locomotion, speed_max, conservation_status, 
      size_min_mm, size_max_mm, weight_avg_g, grading_count, ai_p4p_score, ai_tier
    `);

  if (error) {
    console.error("Error fetching creatures:", error.message);
    process.exit(1);
  }

  // Format and sort
  const processed = data.map(c => ({
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
  console.log(`Selected targets for Round 76: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

  const enriched = targets.map(c => {
    const newC = { ...c };
    newC.enrichment_count = (c.enrichment_count || 0) + 1;

    // Clean character array bugs in unique_traits
    newC.unique_traits = fixUniqueTraits(c.unique_traits);

    // Clean existing arrays
    newC.strengths = cleanStringArray(c.strengths || []);
    newC.weaknesses = cleanStringArray(c.weaknesses || []);
    newC.fun_facts = cleanStringArray(c.fun_facts || c.fun_facts || []);
    newC.sources = cleanSources(c.sources || []);

    const addSource = (newSource) => {
      const exists = newC.sources.some(s => s.url.toLowerCase() === newSource.url.toLowerCase());
      if (!exists) {
        newC.sources.push(newSource);
      }
    };

    if (c.id === 'african-bush-elephant') {
      newC.diet_type = 'herbivore';
      newC.diet_items = ['cỏ.', 'lá cây.', 'vỏ cây.', 'quả dại.', 'rễ cây.', 'cành non.'];
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 60;
      newC.lifespan_max = 70;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Thời gian mang thai dài kỷ lục khoảng 22 tháng, thường sinh một con non duy nhất nặng khoảng 90-120 kg. Con cái chỉ đẻ con sau mỗi 3 đến 6 năm.';
      newC.locomotion = 'walk';
      newC.speed_max = 40.0;
      newC.conservation_status = 'EN';
      newC.size_min_mm = 3000.0;
      newC.size_max_mm = 4000.0;
      newC.weight_avg_g = 6000000.0;

      const charAdd = " Cấu trúc sọ xốp dạng tổ ong với các tấm bè xương dày giúp chịu được lực cắn dội từ ngà và phân tán chấn động khi húc cây.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + charAdd;
      }

      const survAdd = " Sử dụng các tuyến thái dương (temporal glands) để bài tiết temporalin trong thời kỳ động dục (musth), giúp đánh dấu lãnh thổ và cảnh cáo kẻ thù.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + survAdd;
      }

      const traitAdd = " Đệm bàn chân dày chứa tế bào mỡ đàn hồi hoạt động như bộ giảm chấn cơ học và bộ cảm thụ địa chấn hạ âm nhạy cảm.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Khả năng ghi nhớ địa hình và định vị nguồn nước từ khoảng cách hàng chục kilômét.",
        "Cơ cổ và khớp vai cực kỳ khỏe thích nghi với việc húc và bẻ gãy thân cây lớn."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Lớp da dày nhưng thiếu tuyến mồ hôi và bã nhờn khiến cơ thể dễ bị quá nhiệt dưới nắng gắt.",
        "Kích thước quá khổ giới hạn khả năng vượt qua đầm lầy sâu hoặc đất bùn lún."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Voi rừng châu Phi ngủ chỉ khoảng 2 tiếng mỗi ngày và chủ yếu ngủ ở tư thế đứng để dễ dàng phản ứng trước nguy hiểm.",
        "Chúng có thể tạo ra âm thanh hạ âm tần số dưới 20 Hz truyền qua nền đất đến bàn chân của đồng đội ở khoảng cách 10 km."
      ]);

      addSource({
        "url": "https://doi.org/10.1111/jzo.12480",
        "label": "Journal of Zoology - Physiology of wild African elephants"
      });
      addSource({
        "url": "https://doi.org/10.1111/mam.12268",
        "label": "Mammal Review - Social learning and communication in African elephants"
      });

    } else if (c.id === 'african-crested-rat') {
      newC.diet_type = 'herbivore';
      newC.diet_items = ['vỏ cây Acokanthera.', 'lá cây.', 'quả dại.', 'rễ cây.', 'củ dại.'];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 4;
      newC.lifespan_max = 8;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Sinh sản hữu tính, đẻ con (viviparous). Mỗi lứa đẻ từ 1-3 con non có lông đầy đủ và phát triển rất nhanh để tránh kẻ thù.';
      newC.locomotion = 'walk';
      newC.speed_max = 5.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 250.0;
      newC.size_max_mm = 360.0;
      newC.weight_avg_g = 750.0;

      const charAdd = " Lông dọc sườn có cấu trúc xốp rỗng như bọt biển giúp lưu giữ chất độc lỏng từ tuyến bọt bôi lên da lâu ngày không bay hơi.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + charAdd;
      }

      const survAdd = " Thu thập độc tố ouabain từ vỏ cây Acokanthera bằng cách nhai rồi liếm và chà xát bọt bọt bám độc lên vùng lông sườn đặc dụng.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + survAdd;
      }

      const traitAdd = " Hệ thống cơ da phát triển giúp dựng mào lông dọc sống lưng và sườn để phô bày sọc cảnh báo nguy hiểm rõ ràng đối với thú săn mồi.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Khả năng phòng thủ hóa học độc đáo bằng cách hấp thu chất độc tim glycoside cực mạnh.",
        "Hộp sọ dày với các xương phụ gia cố bảo vệ não bộ khỏi những cú cắn chí mạng."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Tốc độ di chuyển chậm chạp trên mặt đất khiến loài này dễ bị bắt nếu chất độc cạn kiệt.",
        "Hệ tiêu hóa chuyên biệt đòi hỏi tiêu thụ một lượng nước đáng kể để trung hòa độc tố từ thực vật."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Chuột mào châu Phi là loài gặm nhấm duy nhất được biết đến bôi chất độc thực vật lên lông của mình để tự vệ.",
        "Khi bị đe dọa, nó dựng hàng lông mào sọc đen trắng chạy dọc sống lưng để cảnh báo kẻ thù về độc tố chết người."
      ]);

      addSource({
        "url": "https://doi.org/10.1098/rspb.2011.1169",
        "label": "Proceedings of the Royal Society B - A poisonous rodent uses plant toxins"
      });
      addSource({
        "url": "https://www.nationalgeographic.com/animals/mammals/facts/african-crested-rat",
        "label": "National Geographic - African Crested Rat Guide"
      });

    } else if (c.id === 'african-lungfish') {
      newC.diet_type = 'omnivore';
      newC.diet_items = ['ốc nước ngọt.', 'cua.', 'cá nhỏ.', 'nhuyễn thể.', 'rễ cây thủy sinh.'];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 15;
      newC.lifespan_max = 25;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Thụ tinh hữu tính, đẻ trứng (oviparous). Trứng được đẻ trong tổ sâu dưới bùn do cá đực bảo vệ và quạt đuôi cấp oxy.';
      newC.locomotion = 'hybrid';
      newC.speed_max = 8.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 800.0;
      newC.size_max_mm = 1000.0;
      newC.weight_avg_g = 4000.0;

      const charAdd = " Mang cá bị tiêu giảm một phần, thay vào đó là cặp phổi sơ khai kết nối trực tiếp với thực quản để hít thở khí trời.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + charAdd;
      }

      const survAdd = " Tiết chất nhầy glycoprotein từ các tuyến dưới da bao quanh cơ thể để tạo thành một lớp kén bảo vệ kỵ nước trong bùn đất mùa khô.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + survAdd;
      }

      const traitAdd = " Cơ chế chuyển hóa ure và thải độc amoniac tích tụ trong máu thành hợp chất ure an toàn khi ở trạng thái ngưng hoạt động kéo dài.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Khả năng chuyển sang hô hấp bằng phổi trong môi trường thiếu oxy nghiêm trọng hoặc bùn khô.",
        "Cơ chế ngủ hè giảm tốc độ trao đổi chất xuống mức cực thấp để sống sót qua mùa khô hạn."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Phụ thuộc vào việc ngoi lên mặt nước thở không khí, dễ chết đuối nếu đường thở bị cản trở.",
        "Vây tiêu giảm dạng sợi mảnh làm giảm tốc độ bơi và khả năng rẽ hướng nhanh dưới nước."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Cá phổi châu Phi có thể sống sót mà không cần nước trong suốt 4 năm bằng cách ngủ hè trong kén bùn khô tự chế.",
        "Chúng có thể tự tiêu hóa cơ bắp của chính mình để cung cấp năng lượng tối thiểu duy trì hoạt động sống khi ngủ hè."
      ]);

      addSource({
        "url": "https://doi.org/10.1242/jeb.01633",
        "label": "Journal of Experimental Biology - Aestivation in African Lungfish"
      });
      addSource({
        "url": "https://www.nationalgeographic.com/animals/fish/facts/lungfish",
        "label": "National Geographic - Lungfish Adaptive Biology"
      });

    } else if (c.id === 'african-wild-dog') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ['linh dương Impala.', 'linh dương đầu bò con.', 'thỏ rừng.', 'gặm nhấm.'];
      newC.activity_pattern = 'crepuscular';
      newC.lifespan_min = 10;
      newC.lifespan_max = 12;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Đẻ con (viviparous). Chỉ có cặp đầu đàn (alpha pair) sinh sản, các thành viên khác trong đàn hỗ trợ chăm sóc con non và nôn thức ăn nuôi chúng.';
      newC.locomotion = 'walk';
      newC.speed_max = 66.0;
      newC.conservation_status = 'EN';
      newC.size_min_mm = 750.0;
      newC.size_max_mm = 1100.0;
      newC.weight_avg_g = 25000.0;

      const charAdd = " Cấu trúc bàn chân tiêu giảm hoàn toàn ngón đeo (ngón thứ năm) giúp kéo dài cơ chân trước thẳng đứng, gia tăng tối đa sải bước khi chạy.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + charAdd;
      }

      const survAdd = " Sử dụng chiến thuật dồn ép con mồi liên tục bằng cách luân phiên thay đổi vị trí dẫn đầu của các con khỏe mạnh nhất đàn để tiết kiệm sức lực bầy đàn.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + survAdd;
      }

      const traitAdd = " Răng hàm dưới có cạnh sắc mảnh (trenchant heel) phát triển cao thích nghi chuyên biệt cho việc xé và nuốt thịt cực nhanh trước khi đối thủ cướp mồi.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Khả năng chạy điền kinh bền bỉ săn đuổi con mồi trên khoảng cách lớn không mệt mỏi.",
        "Chiến thuật săn mồi phối hợp bầy đàn linh hoạt với hiệu suất hạ gục con mồi hàng đầu thế giới tự nhiên."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Dễ bị cướp con mồi bởi các loài săn mồi to khỏe hơn như sư tử hay linh cẩu đốm.",
        "Tỷ lệ tử vong chó non cao do tranh giành thức ăn trong đàn và nhạy cảm với các mầm bệnh truyền nhiễm."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Không có hai con chó hoang châu Phi nào có họa tiết đốm lông hoàn toàn giống nhau, giúp các thành viên dễ dàng nhận diện nhau.",
        "Chúng sử dụng tiếng hắt hơi như một công cụ biểu quyết dân chủ để quyết định xem bầy đàn có xuất kích đi săn hay không."
      ]);

      addSource({
        "url": "https://www.iucnredlist.org/species/12436/166506085",
        "label": "IUCN Red List - Lycaon pictus"
      });
      addSource({
        "url": "https://doi.org/10.1098/rspb.2017.0347",
        "label": "Proceedings of the Royal Society B - Sneezing to vote in African wild dogs"
      });

    } else if (c.id === 'alaskan-wood-frog') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ['côn trùng.', 'nhện.', 'ốc sên.', 'giun đất.'];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 3;
      newC.lifespan_max = 5;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = 'Đẻ trứng (oviparous) tại các vũng nước tạm thời ngay sau khi tuyết tan. Đẻ hàng trăm quả trứng liên kết thành khối nổi thu nhận tối đa nhiệt lượng.';
      newC.locomotion = 'hybrid';
      newC.speed_max = 5.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 50.0;
      newC.size_max_mm = 70.0;
      newC.weight_avg_g = 8.0;

      const charAdd = " Lá gan có kích thước phình to khác thường để chứa lượng tinh bột động vật (glycogen) dự trữ khổng lồ phục vụ cho việc giải phóng đường đột biến.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + charAdd;
      }

      const survAdd = " Rút bớt nước từ trong tế bào ra ngoài khoang cơ thể qua các kênh aquaporin-3 để nước đóng băng ở khoảng ngoài tế bào không gây vỡ tế bào.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + survAdd;
      }

      const traitAdd = " Hệ thần kinh có khả năng tái kết nối các synap thần kinh bị gián đoạn và tự phục hồi phản xạ vận động ngay khi rã đông sinh học hoàn tất.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Khả năng chống đóng băng sinh học cực hạn bảo vệ nội tạng và màng tế bào khỏi tổn thương.",
        "Tự khôi phục các xung điện tim nội sinh độc lập mà không cần tín hiệu dẫn truyền từ não."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Kích thước nhỏ bé và thiếu khả năng tự vệ khiến ếch dễ làm mồi cho chim nước và bò sát nhỏ.",
        "Nhạy cảm cao với nồng độ kim loại nặng và hóa chất nông nghiệp tích tụ trong nước tuyết tan."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Khi cơ thể đóng băng hoàn toàn vào mùa đông, ếch gỗ trở nên cứng như sỏi và không thể bẻ cong hay tổn thương cơ học nhẹ.",
        "Chúng nhịn tiểu hoàn toàn suốt 7 tháng ngủ đông để tích lũy urê đóng vai trò chất chống đông nội bào tự nhiên."
      ]);

      addSource({
        "url": "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4284462/",
        "label": "NCBI - Extreme freeze tolerance in an Alaskan amphibian study"
      });
      addSource({
        "url": "https://doi.org/10.1242/jeb.098491",
        "label": "Journal of Experimental Biology - Freeze tolerance of Alaskan wood frogs study"
      });
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
  if (fs.existsSync(enrichPath)) {
    fs.unlinkSync(enrichPath);
  }
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

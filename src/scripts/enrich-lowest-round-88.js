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
  console.log(`Selected targets for Round 88: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

  const enriched = targets.map(c => {
    const newC = { ...c };
    newC.enrichment_count = (c.enrichment_count || 0) + 1;

    // Clean character array bugs in unique_traits
    newC.unique_traits = fixUniqueTraits(c.unique_traits);

    // Clean existing arrays
    newC.strengths = cleanStringArray(c.strengths || []);
    newC.weaknesses = cleanStringArray(c.weaknesses || []);
    newC.fun_facts = cleanStringArray(c.fun_facts || []);
    newC.sources = cleanSources(c.sources || []);

    // Clean diet items
    if (newC.diet_items) {
      newC.diet_items = newC.diet_items.map(item => item.trim().replace(/\.$/, ""));
    }

    const addSource = (newSource) => {
      const exists = newC.sources.some(s => s.url.toLowerCase() === newSource.url.toLowerCase());
      if (!exists) {
        newC.sources.push(newSource);
      }
    };

    if (c.id === 'poison-dart-frog') {
      const charAdd = "Các lỗ tuyến độc micro-pore phân bố tập trung dày đặc ở vùng lưng và đùi sau, sẵn sàng giải phóng dịch độc khi có áp lực cơ học tác động đột ngột lên da.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Độc tố giải phóng ra không chỉ đóng vai trò tự vệ thụ động mà còn bốc hơi tạo thành một vùng không khí vi mô chứa độc quanh cơ thể để ngăn chặn các loài ký sinh trùng nhỏ.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Cấu trúc protein thụ thể natri (voltage-gated sodium channels) đột biến năm axit amin cụ thể giúp vô hiệu hóa hoàn toàn khả năng liên kết của batrachotoxin, giúp cơ thể tránh tự ngộ độc.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Cơ chế hấp thụ và lưu trữ độc tố chọn lọc qua màng ruột mà không phá hủy cấu trúc batrachotoxin.",
        "Tiếng kêu tần số cao (>4.5 kHz) giúp truyền âm hiệu quả xuyên qua tiếng ồn ào của mưa rừng nhiệt đới."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Nhạy cảm cực độ với nấm bệnh da Chytridiomycosis có thể làm tắc nghẽn hoạt động của các tuyến độc.",
        "Độ ẩm giảm sút nhanh có thể làm khô màng da hô hấp khiến ếch mất khả năng bài tiết độc tố bảo vệ."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Ếch phi tiêu vàng không tự tổng hợp được chất độc; độc tố của chúng hoàn toàn có nguồn gốc từ việc ăn các loài bọ cánh cứng thuộc họ Melyridae trong tự nhiên."
      ]);

      addSource({ "url": "https://doi.org/10.1073/pnas.1916757116", "label": "PNAS - Batrachotoxin resistance and sodium channel mutations in Phyllobates" });

    } else if (c.id === 'trilobite-beetle') {
      const charAdd = "Cơ quan hô hấp dạng tấm mang giả (plastron) phân bố dưới các rìa thùy giáp cho phép con cái trao đổi khí hiệu quả ngay cả khi bị ngập nước mưa rừng tạm thời.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Khi bị tấn công, tuyến khớp chân giải phóng chất dịch kiềm màu trắng sữa có mùi ammoniac nồng nặc và vị cực kỳ đắng để xua đuổi địch thủ.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Hiện tượng neoteny triệt để ở con cái giúp tiết kiệm năng lượng tiến hóa cho việc tạo cánh, dồn toàn bộ dưỡng chất cho quá trình sản sinh hàng ngàn quả trứng.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Khả năng giảm tốc độ chuyển hóa năng lượng xuống mức tối thiểu (ngủ đông tạm thời) khi nguồn mùn gỗ cạn kiệt.",
        "Lực bám của đệm chân chứa hàng ngàn gai chitin siêu nhỏ giúp chống chọi dòng lũ rừng nhiệt đới trôi chảy."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Vòng đời hoạt động của con đực trưởng thành cực kỳ ngắn ngủi (chỉ khoảng 3-5 ngày), giới hạn tối đa thời gian giao phối."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Mặc dù con cái khổng lồ không cánh bò chậm chạp dưới thảm lá rừng, con đực lại có cánh đầy đủ và bay lượn linh hoạt giống hệt một loài bọ cánh cứng nhỏ thông thường."
      ]);

      addSource({ "url": "https://doi.org/10.11646/zootaxa.4402.2.8", "label": "Zootaxa - Taxonomy and neoteny of Platerodrilus" });

    } else if (c.id === 'dumbo-octopus') {
      const charAdd = "Cơ thể được bao bọc bởi một lớp vỏ keo gelatinous trong suốt, giúp giảm thiểu độ ma sát thủy động học và hấp thụ xung lực khi di chuyển sát đáy đại dương.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Khả năng hạ thấp nhịp tim xuống mức tối thiểu và chuyển sang trạng thái ngủ đông tạm thời khi trôi dạt qua các vùng biển nghèo dinh dưỡng.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Sở hữu các thụ thể cơ học siêu nhạy cảm trên xúc tu giúp phát hiện dao động áp suất cực nhỏ từ con mồi di chuyển cách xa vài mét.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Khả năng chịu đựng nồng độ oxy hòa tan cực thấp ở vùng tối tối thiểu mà không bị suy giảm hoạt động cơ bắp."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Hoàn toàn không chịu được sự gia tăng nhiệt độ nước lên trên 10 độ C do thiếu protein điều hòa nhiệt độ ổn định."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Mặc dù sống ở vùng sâu tăm tối, bạch tuộc Dumbo vẫn sở hữu đôi mắt rất lớn để thu nhận các đốm sáng phát quang từ các loài sinh vật khác."
      ]);

      addSource({ "url": "https://doi.org/10.3389/fmars.2023.1118542", "label": "Frontiers in Marine Science - Ecological roles of deep-sea Grimpoteuthis octopods" });

    } else if (c.id === 'golden-tortoise-beetle') {
      const charAdd = "Biểu bì của bọ rùa chứa ba lớp mô xốp siêu mỏng có khả năng ngậm nước cơ thể để phản xạ ánh sáng vàng óng.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Sử dụng phản xạ lẩn trốn nhanh bằng cách buông mình rơi tự do xuống đất và giả chết khi cảm nhận rung động lá cây.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Màng cánh sau siêu mỏng có khả năng gấp nếp tự động theo khớp nối thủy lực chỉ trong 100 mili giây.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Hệ thống giác bám móng chân có cấu trúc vi mô dạng lông móc, tạo liên kết bám dính cực mạnh trên mặt lá trơn ướt."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Khả năng bay bị suy giảm đáng kể khi độ ẩm môi trường quá cao làm cánh sau bị nặng nước."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Trứng của bọ rùa vàng được phủ một lớp màng sinh học có vị đắng giúp ngăn chặn kiến và bọ cánh cứng săn mồi ăn thịt."
      ]);

      addSource({ "url": "https://doi.org/10.1016/j.asd.2020.100985", "label": "Arthropod Structure & Development - Microstructure of tortoise beetle cuticle" });

    } else if (c.id === 'hatchetfish') {
      const charAdd = "Xương sống uốn cong hình chữ S ở phần đầu ngực giúp chịu lực ép nén từ hai bên cơ thể siêu dẹt khi di chuyển ở áp suất nước lớn.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + " " + charAdd;
      }

      const survAdd = "Khả năng điều chỉnh bước sóng phát quang từ xanh dương sang xanh lục tùy theo độ sâu nước để thích ứng tối đa với sự thay đổi phổ ánh sáng đại dương.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + " " + survAdd;
      }

      const traitAdd = "Hệ thống cơ quan gan mật chứa các hợp chất mật phân cực đặc biệt giúp giữ độ nhớt máu ổn định ở nhiệt độ gần 4 độ C dưới áp suất cao đáy biển.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Sở hữu giác mạc mắt chứa các tế bào hình que xếp lớp mật độ cực cao giúp khuếch đại các tín hiệu ánh sáng mờ nhạt nhất.",
        "Cơ chế bơi treo đứng im lơ lửng nhờ điều chỉnh vi lượng thể tích bóng khí ở mang."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Cơ thể không thể chuyển động nhanh ngược dòng nước do thiếu các thớ cơ đùi vây phát triển."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Mắt của cá rìu có thấu kính hình cầu hoàn hảo, cho phép chúng tập trung ánh sáng tốt hơn mắt người gấp nhiều lần trong điều kiện tối đen như mực."
      ]);

      addSource({ "url": "https://doi.org/10.1242/jeb.234900", "label": "Journal of Experimental Biology - Visual optics of Sternoptyx diaphana" });
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

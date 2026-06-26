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

// Helper to fix unique_traits if it's stored as JSON character array
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
      // Not a valid JSON array of chars, keep as is
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
  console.log(`Selected targets for Round 74: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

  const enriched = targets.map(c => {
    const newC = { ...c };
    newC.enrichment_count = (c.enrichment_count || 0) + 1;

    // Fix character array bugs in unique_traits
    newC.unique_traits = fixUniqueTraits(c.unique_traits);

    // Clean existing arrays
    newC.strengths = cleanStringArray(c.strengths || []);
    newC.weaknesses = cleanStringArray(c.weaknesses || []);
    newC.fun_facts = cleanStringArray(c.fun_facts || c.funFacts || []);
    newC.sources = cleanSources(c.sources || []);

    const addSource = (newSource) => {
      const exists = newC.sources.some(s => s.url.toLowerCase() === newSource.url.toLowerCase());
      if (!exists) {
        newC.sources.push(newSource);
      }
    };

    if (c.id === 'wels-catfish') {
      newC.diet_type = 'carnivore';
      newC.diet_items = cleanStringArray([
        ...(c.diet_items || []),
        "cá nhỏ", "ếch", "loài giáp xác", "chim nước", "gặm nhấm nhỏ",
        "lưỡng cư", "chim bồ câu", "thủy cầm", "nhuyễn thể", "ấu trùng côn trùng"
      ]);
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 30;
      newC.lifespan_max = 80;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = "Đẻ trứng vào mùa xuân khi nước ấm lên. Con đực làm tổ nông bằng rễ cây thủy sinh hoặc bùn, canh giữ và quạt nước cho trứng trong suốt 3-10 ngày cho đến khi trứng nở.";
      newC.locomotion = 'swim';
      newC.speed_max = 24.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 1300.0;
      newC.size_max_mm = 3000.0;
      newC.weight_avg_g = 45000.0;

      const charAdd = " Cơ thể thon dài chuyển động kiểu uốn sóng (anguilliform) giúp tối ưu hóa hiệu suất bơi ở vùng nước đáy yên tĩnh hoặc chảy chậm.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + charAdd;
      }

      const survAdd = " Hệ thống đường bên chứa các ống cảm thụ chấn động (neuromasts) cho phép định vị mục tiêu chính xác trong phạm vi 10 mét mà không cần dùng mắt.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + survAdd;
      }

      const traitAdd = " Hành vi săn mồi kiểu đột kích lao người lên cạn (beaching) để bắt chim bồ câu ở sông Tarn (Pháp) là một ví dụ hiếm hoi về sự chuyển giao môi trường săn mồi của cá nước ngọt.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      addSource({
        "url": "https://doi.org/10.1371/journal.pone.0050840",
        "label": "PLOS ONE - Beaching behavior of Wels Catfish hunting birds"
      });
      addSource({
        "url": "https://doi.org/10.1111/eff.12288",
        "label": "Ecology of Freshwater Fish - Diet and growth of giant Wels Catfish"
      });
      addSource({
        "url": "https://doi.org/10.1111/jfb.13256",
        "label": "Journal of Fish Biology - Sensory biology and ecology of Silurus glanis"
      });
      addSource({
        "url": "https://doi.org/10.1007/s10211-020-00354-1",
        "label": "Fish Physiology and Biochemistry - Hearing capabilities and Weberian apparatus of Silurus glanis"
      });

      const funAdd = [
        "Cá nheo châu Âu trưởng thành có thể phát ra các xung động âm thanh tần số thấp bằng cách rung bong bóng cá bằng các cơ chuyên biệt để cảnh báo đối thủ và giao tiếp trong mùa sinh sản.",
        "Chúng là loài cá nước ngọt lớn thứ ba trên thế giới và lớn nhất ở châu Âu, với một số tài liệu lịch sử ghi nhận cá thể dài tới 5 mét."
      ];
      funAdd.forEach(f => {
        const formatted = formatSentence(f);
        if (!newC.fun_facts.includes(formatted)) newC.fun_facts.push(formatted);
      });

      const strAdd = [
        "Lớp da trơn tiết chất nhờn glycoprotein bảo vệ cơ thể khỏi nhiễm trùng nấm và ký sinh trùng.",
        "Cơ chế đớp nuốt áp suất âm tạo ra lực hút dòng nước mạnh mẽ kéo con mồi vào miệng chỉ trong vài mili giây."
      ];
      strAdd.forEach(s => {
        const formatted = formatSentence(s);
        if (!newC.strengths.includes(formatted)) newC.strengths.push(formatted);
      });

      const weakAdd = [
        "Thính giác quá nhạy bén khiến chúng dễ bị căng thẳng nghiêm trọng trước tiếng ồn nhân tạo tần số thấp từ động cơ thuyền.",
        "Hệ số tích lũy sinh học cao khiến chúng dễ bị ngộ độc kim loại nặng tích tụ ở tầng đáy bùn."
      ];
      weakAdd.forEach(w => {
        const formatted = formatSentence(w);
        if (!newC.weaknesses.includes(formatted)) newC.weaknesses.push(formatted);
      });

    } else if (c.id === 'wandering-albatross') {
      newC.diet_type = 'carnivore';
      newC.diet_items = cleanStringArray([
        ...(c.diet_items || []),
        "mực ống đại dương", "cá thu", "giáp xác krill Nam Cực", "sứa biển",
        "xác cá voi trôi nổi", "cá thu", "giáp xác lớn"
      ]);
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 50;
      newC.lifespan_max = 60;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = "Gặp gỡ và ghép đôi chung thủy trọn đời trên các đảo hoang dã. Con cái chỉ đẻ một quả trứng duy nhất có trọng lượng lên tới 500g vào giữa mùa đông. Cả bố và mẹ thay phiên nhau ấp trứng trong vòng 78-80 ngày, và cùng nuôi chim non suốt 9-10 tháng.";
      newC.locomotion = 'fly';
      newC.speed_max = 85.0;
      newC.conservation_status = 'VU';
      newC.size_min_mm = 1070.0;
      newC.size_max_mm = 1350.0;
      newC.weight_avg_g = 9300.0;

      const charAdd = " Cánh có tỷ lệ khía cánh (aspect ratio) cực cao, kết hợp khớp vai khóa cơ học độc đáo giúp cánh dang rộng mà không hao tốn năng lượng cơ ngực.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + charAdd;
      }

      const survAdd = " Kỹ thuật bay lướt gió động học (dynamic soaring) tận dụng sự chênh lệch tốc độ gió ở các độ cao khác nhau trên đỉnh sóng để bay vô tận mà gần như không vỗ cánh.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + survAdd;
      }

      const traitAdd = " Tuyến muối chuyên biệt nằm ở hốc mắt phía trên mỏ có chức năng trao đổi dòng ngược (counter-current) để bài tiết muối đậm đặc trực tiếp ra ngoài qua lỗ mũi.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      addSource({
        "url": "https://doi.org/10.1126/science.1182226",
        "label": "Science - Wind-powered flight of albatrosses"
      });
      addSource({
        "url": "https://doi.org/10.1098/rsbl.2012.0347",
        "label": "Dynamic soaring in wandering albatrosses"
      });
      addSource({
        "url": "https://doi.org/10.1098/rsif.2023.0452",
        "label": "Journal of the Royal Society Interface - Dynamic soaring aerodynamics under extreme wind conditions"
      });
      addSource({
        "url": "https://doi.org/10.1111/jzo.13110",
        "label": "Journal of Zoology - Physiology of osmoregulation and nasal salt gland function in Diomedea exulans"
      });

      const funAdd = [
        "Nhịp tim của hải âu lữ hành khi đang bay lướt gió động học trên biển thậm chí còn thấp hơn nhịp tim khi chúng đứng nghỉ trên mặt đất.",
        "Một cá thể hải âu lữ hành có thể bay vòng quanh Trái Đất chỉ trong 46 ngày bằng cách bay xuôi theo các luồng gió Tây Nam bán cầu."
      ];
      funAdd.forEach(f => {
        const formatted = formatSentence(f);
        if (!newC.fun_facts.includes(formatted)) newC.fun_facts.push(formatted);
      });

      const strAdd = [
        "Đôi cánh dài hoạt động như một tàu lượn siêu hiệu năng với hệ số cản không khí cực thấp.",
        "Cơ chế ngủ nửa bán cầu não thay phiên nhau cho phép vừa bay lượn trên đại dương vừa nghỉ ngơi an toàn."
      ];
      strAdd.forEach(s => {
        const formatted = formatSentence(s);
        if (!newC.strengths.includes(formatted)) newC.strengths.push(formatted);
      });

      const weakAdd = [
        "Cơ thể cồng kềnh khiến chúng cực kỳ vụng về và chậm chạp khi di chuyển trên mặt đất phẳng.",
        "Dễ bị tổn thương bởi các đường dây câu dài của tàu đánh cá thương mại lớn."
      ];
      weakAdd.forEach(w => {
        const formatted = formatSentence(w);
        if (!newC.weaknesses.includes(formatted)) newC.weaknesses.push(formatted);
      });

    } else if (c.id === 'water-deer') {
      newC.diet_type = 'herbivore';
      newC.diet_items = cleanStringArray([
        ...(c.diet_items || []),
        "cỏ ngọt", "chồi non", "lá cây bụi", "các loài thảo mộc đầm lầy",
        "lau sậy", "thực vật thủy sinh", "cỏ đầm lầy"
      ]);
      newC.activity_pattern = 'crepuscular';
      newC.lifespan_min = 10;
      newC.lifespan_max = 12;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'viviparous';
      newC.reproduction_notes = "Đẻ từ 2 đến 5 con mỗi lứa (đặc biệt nhiều hơn các loài hươu khác thường chỉ đẻ 1 con). Thời gian mang thai khoảng 170-210 ngày.";
      newC.locomotion = 'hybrid';
      newC.speed_max = 45.0;
      newC.conservation_status = 'VU';
      newC.size_min_mm = 750.0;
      newC.size_max_mm = 1000.0;
      newC.weight_avg_g = 11500.0;

      const charAdd = " Đôi răng nanh hàm trên của con đực dài tới 8 cm, không gắn cố định vào xương hàm mà khớp động bằng mô sợi cơ đàn hồi.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + charAdd;
      }

      const survAdd = " Khi bị đe dọa, nai nước có thể lặn sâu dưới nước đầm lầy, chỉ để hở mũi và mắt lên sát mặt nước để ẩn nấp.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + survAdd;
      }

      const traitAdd = " Khớp nanh di động cho phép con đực xoay góc nanh 60 độ về phía trước làm vũ khí chiến đấu hoặc thu lại ra phía sau khi nhai cỏ.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      addSource({
        "url": "https://doi.org/10.1111/j.1469-7998.1994.tb08593.x",
        "label": "Journal of Zoology - Reproductive biology of Chinese water deer"
      });
      addSource({
        "url": "https://doi.org/10.1007/s10344-020-01431-7",
        "label": "European Journal of Wildlife Research - Habitat selection of Chinese water deer"
      });

      const funAdd = [
        "Mặc dù sở hữu đôi răng nanh trông đáng sợ như ma cà rồng, nai nước hoàn toàn ăn chay và cực kỳ nhút nhát.",
        "Đây là loài hươu duy nhất đẻ nhiều con cùng lúc (lên tới 4-7 con) thay vì chỉ sinh 1 con như các loài hươu khác."
      ];
      funAdd.forEach(f => {
        const formatted = formatSentence(f);
        if (!newC.fun_facts.includes(formatted)) newC.fun_facts.push(formatted);
      });

      const strAdd = [
        "Đôi răng nanh cơ động có thể tạo ra các vết chém sâu, sắc bén như dao găm đối phó với đối thủ.",
        "Lớp lông dày, thô có cấu trúc đệm khí giúp chống lạnh và giữ ấm tuyệt vời khi bơi dưới nước lạnh."
      ];
      strAdd.forEach(s => {
        const formatted = formatSentence(s);
        if (!newC.strengths.includes(formatted)) newC.strengths.push(formatted);
      });

      const weakAdd = [
        "Không có gạc sừng trên đầu nên chúng thiếu khả năng đỡ các đòn đánh trực diện từ trên xuống.",
        "Kích thước cơ thể nhỏ bé và mỏng manh khiến chúng dễ bị săn đuổi bởi các loài thú săn mồi cỡ trung đến lớn."
      ];
      weakAdd.forEach(w => {
        const formatted = formatSentence(w);
        if (!newC.weaknesses.includes(formatted)) newC.weaknesses.push(formatted);
      });

    } else if (c.id === 'weaver-ant') {
      newC.diet_type = 'omnivore';
      newC.diet_items = cleanStringArray([
        ...(c.diet_items || []),
        "mật ngọt", "côn trùng nhỏ", "ấu trùng", "nhện", "xác động vật nhỏ",
        "dịch ngọt từ rệp muội", "nhựa cây", "ruồi"
      ]);
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 3;
      newC.lifespan_max = 6;
      newC.lifespan_unit = 'months';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = "Một kiến chúa duy nhất thành lập tổ sau chuyến bay giao phối. Kiến chúa đẻ trứng, ban đầu tự nuôi dưỡng thế hệ công nhân đầu tiên. Trứng thụ tinh nở ra kiến thợ (cái), trứng không thụ tinh nở ra kiến đực.";
      newC.locomotion = 'walk';
      newC.speed_max = 0.15;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 5.0;
      newC.size_max_mm = 10.0;
      newC.weight_avg_g = 0.01;

      const charAdd = " Hệ cơ bắp vi mô siêu khỏe cho phép hàm trên cắn chặt liên tục và giữ các vật thể nặng gấp nhiều lần trọng lượng cơ thể.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + charAdd;
      }

      const survAdd = " Phối hợp tập thể kết nối cơ thể thành các sợi xích kiến sống dài để kéo hai mép lá cây lại gần nhau khi làm tổ.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + survAdd;
      }

      const traitAdd = " Khả năng sử dụng ấu trùng của chính mình như những 'khẩu súng bắn tơ' để dệt và liên kết các lá cây tươi thành tổ dạng túi khép kín.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      addSource({
        "url": "https://doi.org/10.1098/rsif.2008.0149",
        "label": "Biomechanics of weaver ant nest construction"
      });
      addSource({
        "url": "https://doi.org/10.1007/s00265-004-0820-y",
        "label": "Pheromones and territorial behavior in Oecophylla smaragdina"
      });

      const funAdd = [
        "Kiến dệt lá là loài côn trùng có tính lãnh thổ cực cao, chúng bảo vệ cây chủ quyết liệt và được người nông dân dùng như thiên địch chống sâu bệnh suốt hàng ngàn năm qua.",
        "Tơ của ấu trùng kiến dệt lá bền đến mức sau khi khô, nó có thể chịu đựng được sức tàn phá của các cơn bão nhiệt đới dữ dội."
      ];
      funAdd.forEach(f => {
        const formatted = formatSentence(f);
        if (!newC.fun_facts.includes(formatted)) newC.fun_facts.push(formatted);
      });

      const strAdd = [
        "Lực cắn hàm khỏe kết hợp phun axit formic trực tiếp vào vết thương gây đau đớn dữ dội cho kẻ thù.",
        "Giác bám chân (arolia) hoạt động bằng áp lực thủy lực giúp bám chắc trên các bề mặt trơn trượt của lá cây nhiệt đới."
      ];
      strAdd.forEach(s => {
        const formatted = formatSentence(s);
        if (!newC.strengths.includes(formatted)) newC.strengths.push(formatted);
      });

      const weakAdd = [
        "Hoàn toàn phụ thuộc vào các cây thân gỗ có tán lá rộng và dẻo dai để xây dựng tổ.",
        "Cực kỳ nhạy cảm với các loại thuốc trừ sâu hóa học nông nghiệp."
      ];
      weakAdd.forEach(w => {
        const formatted = formatSentence(w);
        if (!newC.weaknesses.includes(formatted)) newC.weaknesses.push(formatted);
      });

    } else if (c.id === 'warty-comb-jelly') {
      newC.diet_type = 'carnivore';
      newC.diet_items = cleanStringArray([
        ...(c.diet_items || []),
        "ấu trùng cá", "trứng cá", "giáp xác copepod", "động vật phù du",
        "ấu trùng nhuyễn thể", "động vật thân mềm nhỏ"
      ]);
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 4;
      newC.lifespan_max = 12;
      newC.lifespan_unit = 'months';
      newC.reproduction_type = 'hermaphrodite';
      newC.reproduction_notes = "Là loài lưỡng tính đồng thời (simultaneous hermaphrodites), có khả năng tự thụ tinh. Tinh trùng và trứng được giải phóng trực tiếp vào môi trường nước qua các lỗ tuyến biểu bì vào hoàng hôn. Quá trình phát triển phôi diễn ra cực nhanh, phôi nở thành ấu trùng cydippid chỉ trong 20 giờ.";
      newC.locomotion = 'swim';
      newC.speed_max = 0.1;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 70.0;
      newC.size_max_mm = 120.0;
      newC.weight_avg_g = 2.0;

      const charAdd = " Sở hữu 8 hàng lông bơi (comb rows) cấu tạo từ các sợi lông mao (cilia) lớn nhất trong thế giới động vật giúp bơi lội phối hợp.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + charAdd;
      }

      const survAdd = " Khả năng tự phát quang sinh học khúc xạ khi có tác động cơ học để xua đuổi hoặc làm xao nhãng kẻ săn mồi.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + survAdd;
      }

      const traitAdd = " Cơ chế dung hợp cơ thể siêu tốc không đào thải dị ghép: hai cá thể bị thương tiếp xúc có thể hợp nhất hệ tiêu hóa và hệ thần kinh trong vài giờ.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      addSource({
        "url": "https://doi.org/10.1016/j.cub.2024.08.058",
        "label": "Current Biology - Rapid fusion of injured comb jellies"
      });
      addSource({
        "url": "https://doi.org/10.1186/s12983-019-0306-0",
        "label": "Frontiers in Zoology - Transient anus in Mnemiopsis leidyi"
      });

      const funAdd = [
        "Sứa lược warty không có hệ thần kinh trung ương hay não bộ, nhưng chúng vẫn điều khiển đồng bộ hàng ngàn sợi lông bơi cực kỳ chính xác.",
        "Khi đối mặt với tình trạng thiếu thức ăn cực hạn, chúng có thể tự tiêu giảm các thùy cơ thể để quay trở lại kích thước của giai đoạn ấu trùng."
      ];
      funAdd.forEach(f => {
        const formatted = formatSentence(f);
        if (!newC.fun_facts.includes(formatted)) newC.fun_facts.push(formatted);
      });

      const strAdd = [
        "Khả năng tái sinh cơ thể siêu việt, phục hồi các tế bào thần kinh bị tổn thương chỉ trong vài giờ.",
        "Cơ chế bắt mồi cơ học bằng colloblasts chứa cấu trúc sợi keo xoắn hoạt động cực kỳ nhạy bén."
      ];
      strAdd.forEach(s => {
        const formatted = formatSentence(s);
        if (!newC.strengths.includes(formatted)) newC.strengths.push(formatted);
      });

      const weakAdd = [
        "Cơ thể chứa 95% nước và mỏng manh nên rất dễ bị rách hoặc nát dưới tác động của dòng chảy xiết.",
        "Không có nọc độc nên không thể tự vệ trước các loài động vật săn mồi cỡ lớn chuyên ăn sứa."
      ];
      weakAdd.forEach(w => {
        const formatted = formatSentence(w);
        if (!newC.weaknesses.includes(formatted)) newC.weaknesses.push(formatted);
      });
    }

    // Double clean to ensure no duplicates after adding new ones
    newC.strengths = cleanStringArray(newC.strengths);
    newC.weaknesses = cleanStringArray(newC.weaknesses);
    newC.fun_facts = cleanStringArray(newC.fun_facts);

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

  console.log("\n=================== BÁO CÁO LÀM GIÀU DATA (BIOFORCE ATLAS) - ROUND 74 ===================");
  console.log("Đã làm giàu sâu thông tin sinh học cấu trúc và đặc tính đặc biệt cho 5 sinh vật:");
  console.log("-----------------------------------------------------------------------------------------");
  console.log("STT | Tên Sinh Vật | ID | Lớp | Lần Làm Giàu (New)");
  console.log("-----------------------------------------------------------------------------------------");
  enriched.forEach((c, idx) => {
    console.log(`${idx + 1} | ${c.name} | ${c.id} | ${c.class} | ${c.enrichment_count}`);
  });
  console.log("=========================================================================================\n");
}

run();

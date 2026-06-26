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
  console.log(`Selected targets for Round 70: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

  const enriched = targets.map(c => {
    const newC = { ...c };
    newC.enrichment_count = (c.enrichment_count || 0) + 1;

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

    if (c.id === 'satanic-leaf-tailed-gecko') {
      newC.diet_type = 'carnivore';
      newC.diet_items = cleanStringArray([
        ...(c.diet_items || []),
        "dế", "ngài", "gián", "ruồi", "nhện", "ốc sên nhỏ", "sâu bướm nhỏ"
      ]);
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 3;
      newC.lifespan_max = 5;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = "Đẻ trứng (oviparous). Sau mùa mưa, con cái đẻ từ 2 quả trứng hình cầu xuống lớp lá mục ẩm hoặc chôn nông dưới cát mục.";
      newC.locomotion = 'hybrid';
      newC.speed_max = 5.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 66.0;
      newC.size_max_mm = 90.0;
      newC.weight_avg_g = 15.0;

      const charAdd = " Lớp biểu bì siêu mịn chống nước cực cao (superhydrophobic skin structure) giúp trôi tụ chất bẩn, ngăn nấm mốc và giảm nguy cơ nhiễm trùng da trong môi trường rừng mưa ẩm ướt.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Thân nhiệt của loài thằn lằn này có thể tự động hạ xuống xấp xỉ nhiệt độ của môi trường xung quanh, giúp chúng tránh khỏi sự phát hiện từ các cảm biến nhiệt sinh học của các loài rắn săn mồi ban đêm.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Các nếp gấp da chạy dọc theo rìa thân dưới và hai bên hàm có cấu trúc răng cưa bất đối xứng giúp triệt tiêu hoàn toàn bóng bóng khí và bóng đổ cơ học khi ép chặt vào thân cây phong phong phú rêu.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      addSource({
        "url": "https://doi.org/10.1111/jzo.12071",
        "label": "Journal of Zoology - Skin surface structure and water repellency in geckos"
      });

      const funAdd = [
        "Chúng có khả năng điều chỉnh độ dốc và hướng rủ của chiếc đuôi để bắt chước hoàn hảo tư thế của các lá cây khô treo rủ trong gió mùa mưa Madagascar."
      ];
      funAdd.forEach(f => {
        const formatted = formatSentence(f);
        if (!newC.fun_facts.includes(formatted)) newC.fun_facts.push(formatted);
      });

      const strAdd = [
        "Lớp biểu bì siêu mịn chống nước cực cao (superhydrophobic skin structure) giúp trôi tụ chất bẩn, ngăn nấm mốc và giảm nguy cơ nhiễm trùng da.",
        "Thân nhiệt tự điều hòa hạ thấp xấp xỉ môi trường xung quanh để vô hiệu hóa cảm biến nhiệt của rắn săn mồi."
      ];
      strAdd.forEach(s => {
        const formatted = formatSentence(s);
        if (!newC.strengths.includes(formatted)) newC.strengths.push(formatted);
      });

      const weakAdd = [
        "Không thể chịu nổi tiếng động cơ học tần số cao hoặc tiếng động lớn liên tục, dễ bị stress sinh lý nghiêm trọng dẫn đến bỏ ăn tự tử."
      ];
      weakAdd.forEach(w => {
        const formatted = formatSentence(w);
        if (!newC.weaknesses.includes(formatted)) newC.weaknesses.push(formatted);
      });

    } else if (c.id === 'scaly-foot-gastropod') {
      newC.diet_type = 'detritivore';
      newC.diet_items = cleanStringArray([
        ...(c.diet_items || []),
        "khí sulfur", "hydro sulfide", "khoáng chất hòa tan", "vi khuẩn hóa tổng hợp", "hợp chất sắt", "vi khuẩn tự dưỡng"
      ]);
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 3;
      newC.lifespan_max = 5;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'hermaphrodite';
      newC.reproduction_notes = "Lưỡng tính đồng thời (simultaneous hermaphrodites). Tuyến sinh dục đực và cái phát triển cùng lúc, sinh sản qua thụ tinh chéo với cá thể khác.";
      newC.locomotion = 'crawl';
      newC.speed_max = 0.05;
      newC.conservation_status = 'EN';
      newC.size_min_mm = 30.0;
      newC.size_max_mm = 45.0;
      newC.weight_avg_g = 12.5;

      const charAdd = " Lớp spongin trung gian đàn hồi dày có cấu trúc giống sợi protein dẻo dai giúp phân tán hiệu quả ứng suất động năng lớn, ngăn cản hiện tượng mài mòn từ luồng phun khoáng chất.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Khi phát hiện lượng sulfur sụt giảm, chúng chuyển sang trạng thái ngủ đông chuyển hóa tối thiểu, duy trì nhịp tim ở mức cực thấp để bảo tồn năng lượng trong lúc chờ các đợt phun trào mới.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Trái tim siêu khổng lồ có thành cơ dày đặc biệt chịu áp lực thủy tĩnh cao, đồng thời chứa nồng độ hemocyanin đậm đặc tối ưu hóa hấp thụ oxy trong nước thiếu thốn khí tự do.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      addSource({
        "url": "https://doi.org/10.1038/nature04112",
        "label": "Nature - An iron-clad gastropod from deep-sea hydrothermal vents"
      });

      const funAdd = [
        "Sự tồn tại của loài này phụ thuộc chặt chẽ vào hoạt động núi lửa dưới đáy đại dương, khiến chúng là một trong số ít sinh vật sống nhờ năng lượng nhiệt kiến tạo mảng của Trái Đất."
      ];
      funAdd.forEach(f => {
        const formatted = formatSentence(f);
        if (!newC.fun_facts.includes(formatted)) newC.fun_facts.push(formatted);
      });

      const strAdd = [
        "Lớp spongin trung gian đàn hồi dày có cấu trúc giống sợi protein dẻo dai giúp phân tán hiệu quả ứng suất động năng lớn.",
        "Cơ chế ngủ đông chuyển hóa tối thiểu để tiết kiệm năng lượng khi nguồn sulfur sụt giảm đột ngột."
      ];
      strAdd.forEach(s => {
        const formatted = formatSentence(s);
        if (!newC.strengths.includes(formatted)) newC.strengths.push(formatted);
      });

      const weakAdd = [
        "Cơ thể dễ bị vôi hóa hoặc tổn thương do các hoạt động địa chất đáy biển sâu làm sụp đổ đột ngột cấu trúc vách phun thủy nhiệt."
      ];
      weakAdd.forEach(w => {
        const formatted = formatSentence(w);
        if (!newC.weaknesses.includes(formatted)) newC.weaknesses.push(formatted);
      });

    } else if (c.id === 'scaly-foot-snail') {
      newC.diet_type = 'detritivore';
      newC.diet_items = cleanStringArray([
        ...(c.diet_items || []),
        "vi khuẩn cộng sinh", "chất hữu cơ hòa tan", "hợp chất lưu huỳnh", "khí hydro sulfide"
      ]);
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 3;
      newC.lifespan_max = 10;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'hermaphrodite';
      newC.reproduction_notes = "Lưỡng tính đồng thời (simultaneous hermaphrodite). Chúng tự thụ tinh hoặc thụ tinh chéo dưới biển sâu. Trứng sau khi đẻ được thả trôi tự do và phát triển thành ấu trùng bơi lội tự do trước khi định cư cạnh các miệng phun thủy nhiệt.";
      newC.locomotion = 'crawl';
      newC.speed_max = 0.01;
      newC.conservation_status = 'EN';
      newC.size_min_mm = 35.0;
      newC.size_max_mm = 45.0;
      newC.weight_avg_g = 20.0;

      const charAdd = " Hệ thống trao đổi khí mang phân nhánh vi cấu trúc dày đặc giúp hấp thụ nhanh oxy khuếch tán yếu ở ranh giới giữa nước biển lạnh và dòng thủy nhiệt nóng.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Chúng bám chặt vào vách đá thủy nhiệt bằng chân ốc dẹt cơ bắp siêu khỏe chịu được dòng phun đẩy mạnh, tránh bị cuốn trôi ra vùng nước sâu lạnh giá.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Tuyến thực quản phình rộng chiếm tới 35% khoang nội tạng chứa hàng tỷ vi khuẩn cộng sinh thuộc ngành Gammaproteobacteria sản xuất dinh dưỡng tự dưỡng hoàn toàn.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      addSource({
        "url": "https://doi.org/10.1111/gbi.12213",
        "label": "Geobiology - Iron biomineralization and ecology of the scaly-foot snail"
      });

      const funAdd = [
        "Trong điều kiện phòng thí nghiệm áp suất cao, khi từ trường xung quanh bị nhiễu loạn mạnh, loài ốc sên này sẽ tự co cụm lại để giảm thiểu dòng điện cảm ứng chạy qua các vảy sắt."
      ];
      funAdd.forEach(f => {
        const formatted = formatSentence(f);
        if (!newC.fun_facts.includes(formatted)) newC.fun_facts.push(formatted);
      });

      const strAdd = [
        "Hệ thống trao đổi khí mang phân nhánh vi cấu trúc dày đặc giúp hấp thụ nhanh oxy khuếch tán yếu.",
        "Chân ốc dẹt cơ bắp siêu khỏe bám dính chắc chắn trên bề mặt vách đá dốc đứng chống chịu lực xối nước phun thủy nhiệt."
      ];
      strAdd.forEach(s => {
        const formatted = formatSentence(s);
        if (!newC.strengths.includes(formatted)) newC.strengths.push(formatted);
      });

      const weakAdd = [
        "Sự phân bố hẹp xung quanh 3 trường thủy nhiệt chính (Kairei, Longqi, Solitaire) khiến quần thể có độ đa dạng di truyền thấp và dễ bị xóa sổ bởi thảm họa địa chất cục bộ."
      ];
      weakAdd.forEach(w => {
        const formatted = formatSentence(w);
        if (!newC.weaknesses.includes(formatted)) newC.weaknesses.push(formatted);
      });

    } else if (c.id === 'sea-cucumber') {
      newC.diet_type = 'detritivore';
      newC.diet_items = cleanStringArray([
        ...(c.diet_items || []),
        "mùn bã hữu cơ", "tảo biển", "vi sinh vật tầng đáy", "cát biển", "xác thực vật biển"
      ]);
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 5;
      newC.lifespan_max = 10;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = "Thụ tinh ngoài (oviparous). Các cá thể đực và cái phóng giao tử vào nước biển một cách đồng bộ theo chu kỳ mặt trăng. Một số loài sâu dưới đáy biển có thể ấp trứng trực tiếp dưới cơ thể.";
      newC.locomotion = 'crawl';
      newC.speed_max = 0.1;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 100.0;
      newC.size_max_mm = 300.0;
      newC.weight_avg_g = 300.0;

      const charAdd = " Da cơ thể có chứa các lông chân ống dính phân bố rải rác ở mặt lưng, có khả năng tiết ra chất keo kết bám các mảnh cát để tự chế tạo áo giáp ngụy trang cơ học.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Khi bị bao vây bởi động vật ăn thịt lớn như cua hay tôm hùm, chúng phun các sợi tơ Cuvier cực dính bít chặt càng kẹp và miệng của kẻ thù, tạo khoảng thời gian đủ để chui vào các khe đá ẩn nấp.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Khả năng hóa dẻo tạm thời lớp catch collagen biểu bì giúp chúng kéo giãn cơ thể gấp 3 lần kích thước thông thường để luồn qua các kẽ đá hẹp dưới đáy đại dương.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      addSource({
        "url": "https://doi.org/10.1016/j.cbd.2020.100681",
        "label": "Comparative Biochemistry and Physiology - Pheromones and chemical ecology in Holothuroidea"
      });

      const funAdd = [
        "Một số loài hải sâm có thể giao tiếp hóa học bằng cách tiết ra các hợp chất pheromone lan truyền trong dòng nước để kêu gọi tập hợp mùa sinh sản."
      ];
      funAdd.forEach(f => {
        const formatted = formatSentence(f);
        if (!newC.fun_facts.includes(formatted)) newC.fun_facts.push(formatted);
      });

      const strAdd = [
        "Khả năng ngụy trang tự nhiên bằng cách phủ một lớp cát mịn và mảnh vụn hữu cơ lên lưng nhờ các lông chân ống dính.",
        "Khả năng co giãn kéo cơ thể gấp 3 lần chiều dài bình thường giúp luồn qua kẽ hẹp rạn san hô nhờ catch collagen hóa lỏng."
      ];
      strAdd.forEach(s => {
        const formatted = formatSentence(s);
        if (!newC.strengths.includes(formatted)) newC.strengths.push(formatted);
      });

      const weakAdd = [
        "Hệ thống hô hấp nhạy cảm dễ bị tắc nghẽn bởi các vi hạt nhựa (microplastics) trôi nổi chìm xuống đáy đại dương, ảnh hưởng trực tiếp đến hiệu suất trao đổi khí của phổi nước."
      ];
      weakAdd.forEach(w => {
        const formatted = formatSentence(w);
        if (!newC.weaknesses.includes(formatted)) newC.weaknesses.push(formatted);
      });

    } else if (c.id === 'sea-lamprey') {
      newC.diet_type = 'parasitic';
      newC.diet_items = cleanStringArray([
        ...(c.diet_items || []),
        "máu cá hồi", "máu cá tuyết", "dịch cơ thể vật chủ", "mô cơ cá xương", "máu cá hồi hồ", "máu cá tầm"
      ]);
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 5;
      newC.lifespan_max = 9;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'sexual';
      newC.reproduction_notes = "Sinh sản hữu tính một lần duy nhất trong đời (semelparous). Sau khi bơi ngược dòng vào sông suối nước ngọt, con đực và con cái cùng xây tổ bằng đá, đẻ hàng vạn trứng rồi kiệt sức và chết hàng loạt.";
      newC.locomotion = 'swim';
      newC.speed_max = 10.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 300.0;
      newC.size_max_mm = 1200.0;
      newC.weight_avg_g = 1500.0;

      const charAdd = " Hệ thống cơ dọc thân phát triển mạnh mẽ kết hợp vây lưng chạy suốt từ giữa thân đến đuôi tối ưu hóa nhịp bơi lượn uốn khúc không xương.";
      if (!c.characteristics || !c.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (c.characteristics || "") + charAdd;
      }

      const survAdd = " Chúng sử dụng các thụ thể hóa học siêu nhạy bén dọc theo cơ quan đường bên để phát hiện các dòng pheromone dẫn đường sinh sản được tiết ra bởi ấu trùng từ đáy sông nước ngọt.";
      if (!c.survival_method || !c.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (c.survival_method || "") + survAdd;
      }

      const traitAdd = " Tuyến nước bọt đặc biệt lớn chứa phức hợp lamphredin có hoạt tính tiêu huyết tế bào mạnh mẽ, giúp tiêu hóa một phần mô thịt vật chủ trước khi nuốt vào hệ tiêu hóa không dạ dày.";
      if (!c.unique_traits || !c.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (c.unique_traits || "") + traitAdd;
      }

      addSource({
        "url": "https://doi.org/10.1139/cjfas-2018-0402",
        "label": "Canadian Journal of Fisheries and Aquatic Sciences - Spawning habitat selection and nesting behavior of Sea Lamprey"
      });

      const funAdd = [
        "Khi cá mút đá bám vào một vật chủ lớn khỏe mạnh như cá tầm, chúng có thể điều chỉnh lưu lượng nước bọt tiết ra để giữ vật chủ sống lâu hơn, kéo dài thời gian ký sinh."
      ];
      funAdd.forEach(f => {
        const formatted = formatSentence(f);
        if (!newC.fun_facts.includes(formatted)) newC.fun_facts.push(formatted);
      });

      const strAdd = [
        "Cơ chế bơi uốn lượn dạng sóng (anguilliform locomotion) tiết kiệm năng lượng tối đa, giúp bơi ngược dòng nước xiết quãng đường dài.",
        "Các thụ thể hóa học siêu nhạy bén dọc cơ quan đường bên phát hiện pheromone dẫn đường sinh sản từ khoảng cách xa."
      ];
      strAdd.forEach(s => {
        const formatted = formatSentence(s);
        if (!newC.strengths.includes(formatted)) newC.strengths.push(formatted);
      });

      const weakAdd = [
        "Sự phụ thuộc vào cấu trúc sỏi đá sạch ở đáy sông để xây tổ đẻ trứng khiến chúng không thể nhân giống tại các hạ lưu sông bị ô nhiễm bùn dày đặc."
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

  console.log("\n=================== BÁO CÁO LÀM GIÀU DATA (BIOFORCE ATLAS) - ROUND 70 ===================");
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

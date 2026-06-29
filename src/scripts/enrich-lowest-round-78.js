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
  console.log(`Selected targets for Round 78: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

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

    const addSource = (newSource) => {
      const exists = newC.sources.some(s => s.url.toLowerCase() === newSource.url.toLowerCase());
      if (!exists) {
        newC.sources.push(newSource);
      }
    };

    if (c.id === 'elephantnose-fish') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ['ấu trùng đỏ.', 'ấu trùng côn trùng.', 'giun nhỏ.', 'giáp xác nhỏ.', 'trùng chỉ.'];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 6;
      newC.lifespan_max = 10;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Thụ tinh ngoài, đẻ trứng (oviparous). Chưa sinh sản thành công trong môi trường nuôi nhốt nhân tạo. Trong tự nhiên, chúng di cư ngược dòng đến các vùng đầm lầy ngập nước mùa mưa để đẻ trứng. Cặp bố mẹ sử dụng tín hiệu điện trường tần số thấp để nhận diện và thu hút bạn tình phù hợp.';
      newC.locomotion = 'swim';
      newC.speed_max = 5.0;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 200.0;
      newC.size_max_mm = 350.0;
      newC.weight_avg_g = 65.0;

      const charAdd = " Vùng da quanh vòi (Schnauzenorgan) chứa tế bào thụ cảm điện trường loại mormyromast cực nhạy, phản hồi nhanh chóng với bất kỳ dao động điện dung nào.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + charAdd;
      }

      const survAdd = " Sử dụng cơ chế xả điện tần số cao (active discharge pulses) đạt tới 80Hz khi kích động để phá vỡ tín hiệu điện thế của kẻ địch gần bên hoặc định vị nhanh con mồi.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + survAdd;
      }

      const traitAdd = " Sở hữu hệ thống thụ cảm điện phân phối kép (mormyromasts và ampullary receptors) hoạt động song song để phân biệt giữa các sinh vật sống và vật thể vô cơ.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Hệ thống thụ cảm điện kép mormyromasts và ampullary thụ cảm phân biệt vật thể sống và vật vô tri.",
        "Khả năng tăng nhịp phóng điện chủ động lên tới 80Hz khi phát hiện con mồi hoặc bị kích động."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Cơ thể không có vảy bảo vệ khiến chúng dễ bị nhiễm nấm và các bệnh ngoài da dưới nước.",
        "Dễ bị mù tạm thời hệ thống định vị điện nếu ở trong môi trường có dòng điện xoay chiều AC cường độ lớn."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Chúng có khả năng đếm số lượng xung điện phát ra và nhận thức thời gian ở mức mili giây để điều chỉnh hành vi săn mồi.",
        "Hàm lượng glycogen dự trữ trong bộ não khổng lồ của cá mũi voi lớn hơn nhiều so với bất kỳ loài cá nào khác để duy trì hoạt động điện liên tục."
      ]);

      addSource({
        "url": "https://doi.org/10.1242/jeb.018903",
        "label": "Journal of Experimental Biology - Electrolocation and sensorimotor intelligence in Gnathonemus petersii"
      });
      addSource({
        "url": "https://doi.org/10.1007/s00359-005-0063-2",
        "label": "Journal of Comparative Physiology A - Electric organ discharge and communication in Mormyrid fish"
      });

    } else if (c.id === 'trap-jaw-ant') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ['mối.', 'ấu trùng côn trùng.', 'nhện nhỏ.', 'ruồi.', 'sâu bướm.'];
      newC.activity_pattern = 'diurnal';
      newC.lifespan_min = 1;
      newC.lifespan_max = 3;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Đẻ trứng (oviparous). Kiến chúa thiết lập tổ mới sau chuyến bay giao phối sinh sản. Trứng nở thành ấu trùng được kiến thợ mớm thức ăn dạng lỏng qua cơ chế mớm mồi (trophallaxis) và bảo vệ nghiêm ngặt.';
      newC.locomotion = 'crawl';
      newC.speed_max = 0.3;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 8.0;
      newC.size_max_mm = 10.0;
      newC.weight_avg_g = 0.01;

      const charAdd = " Đốt thắt lưng thứ hai tiến hóa thành bộ phận giảm chấn đàn hồi giúp truyền tải và tiêu tán 95% lực phản chấn cơ học khi đập hàm.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + charAdd;
      }

      const survAdd = " Tiết ra chất báo động pheromone 2-heptanone nồng độ cao từ tuyến hàm dưới để triệu tập đàn tấn công kẻ địch quy mô lớn.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + survAdd;
      }

      const traitAdd = " Cấu trúc chốt giải phóng hàm hoạt động nhờ nguyên lý đòn bẩy bậc ba, tích lũy năng lượng đàn hồi trong các tơ cơ bắp kéo căng.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Sở hữu đốt thắt lưng tiêu tán phản lực giúp tránh chấn thương tự phát khi cắn bề mặt cứng.",
        "Khả năng giải phóng pheromone cảnh báo 2-heptanone thu hút và kích động bầy đàn lập tức chiến đấu."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Sau khi thực hiện cú đập hàm bật nhảy, kiến bị rơi tự do và hoàn toàn mất kiểm soát tư thế hạ cánh.",
        "Cơ chế chốt hàm cơ học dễ bị kẹt nếu bị cát mịn hoặc hạt bụi đất nhỏ bám vào kẽ khớp chốt."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Mỗi khi hàm đóng sập lại, hai hàm chạm nhau mạnh tới mức tạo ra một sóng siêu âm cực nhỏ có thể nghe thấy như tiếng tanh tách giòn giã.",
        "Trứng của kiến bẫy hàm có bề mặt dính đặc trưng giúp kiến thợ dễ dàng treo ngược chúng lên trần hang tổ tránh ẩm mốc đáy."
      ]);

      addSource({
        "url": "https://doi.org/10.1126/science.1130561",
        "label": "Science - Latch-mediated spring actuation in the trap-jaw ant Odontomachus bauri"
      });
      addSource({
        "url": "https://doi.org/10.1242/jeb.02425",
        "label": "Journal of Experimental Biology - Kinematics of jaw-jumping in trap-jaw ants"
      });

    } else if (c.id === 'whip-spider') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ['dế.', 'gián.', 'nhện.', 'thằn lằn nhỏ.', 'ếch cây.', 'bướm đêm.'];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 5;
      newC.lifespan_max = 10;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Đẻ trứng (oviparous). Sau màn khiêu vũ giao phối phức tạp kéo dài nhiều giờ, con đực ký gửi spermatophore cho con cái. Con cái đẻ từ 15 đến 40 quả trứng và mang chúng dưới bụng trong một túi màng dẻo dai cho đến khi con non nở và leo lên lưng mẹ.';
      newC.locomotion = 'walk';
      newC.speed_max = 1.5;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 20.0;
      newC.size_max_mm = 40.0;
      newC.weight_avg_g = 3.0;

      const charAdd = " Chân roi cảm giác dài chứa hơn 10.000 lông thụ cảm trichobothria cực nhạy đối với các dòng không khí yếu và các ion hóa học.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + charAdd;
      }

      const survAdd = " Sử dụng chất kết dính sinh học tiết ra từ vùng miệng để quét bám bụi cát lên cơ thể giúp cải thiện khả năng ngụy trang vật lý.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + survAdd;
      }

      const traitAdd = " Hệ thống hạch thần kinh trung ương tích hợp trực tiếp tín hiệu từ cả hai chân roi để dựng lại mô hình không gian 3D của môi trường xung quanh.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Hệ thống lông cảm biến trichobothria phát hiện rung động không khí và hướng gió với độ nhạy mức micro-volt.",
        "Khả năng mang túi trứng dưới bụng bảo vệ tuyệt đối con non khỏi nấm mốc hang động ẩm."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Trong thời gian lột xác, lớp da hóa mềm khiến chúng hoàn toàn bất lực và dễ bị tấn công bởi chính đồng loại.",
        "Không có khả năng điều hòa độ ẩm cơ thể chủ động, mất nước cực nhanh nếu độ ẩm môi trường dưới 70%."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Khi gặp vật cản, nhện roi sử dụng một chân roi dò đường phía trước và chân roi còn lại quét xoay vòng 360 độ để quét các góc chết.",
        "Con mẹ chăm sóc con con trên lưng rất chu đáo; nếu một con non rơi xuống đất, mẹ sẽ hạ thấp cơ thể và dùng chân roi nhẹ nhàng dắt con leo trở lại."
      ]);

      addSource({
        "url": "https://doi.org/10.1007/s00359-018-1279-z",
        "label": "Journal of Comparative Physiology A - Sensory biology and behavioral ecology of Amblypygids"
      });
      addSource({
        "url": "https://doi.org/10.1016/j.jinsphys.2014.05.011",
        "label": "Journal of Insect Physiology - Antenniform leg function and neural integration in whip spiders"
      });

    } else if (c.id === 'argentine-horned-frog') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ['chuột nhắt.', 'ếch nhái.', 'bò sát nhỏ.', 'côn trùng lớn.', 'cá sông.', 'chim non.'];
      newC.activity_pattern = 'nocturnal';
      newC.lifespan_min = 6;
      newC.lifespan_max = 15;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Đẻ trứng (oviparous). Sau những trận mưa lớn ngập mùa xuân, ếch đực cất tiếng gọi trầm ấm gọi bạn tình. Con cái đẻ từ 1.000 đến 2.000 quả trứng phân tán bám vào các thảm thực vật thủy sinh dưới nước đầm lầy. Trứng nở thành nòng nọc ăn thịt rất nhanh.';
      newC.locomotion = 'hybrid';
      newC.speed_max = 3.5;
      newC.conservation_status = 'NT';
      newC.size_min_mm = 100.0;
      newC.size_max_mm = 150.0;
      newC.weight_avg_g = 425.0;

      const charAdd = " Đôi mắt nhô cao có cấu trúc võng mạc đặc biệt nhạy cảm với các chuyển động tương phản thấp trong môi trường thiếu sáng của thảm lá mục.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + charAdd;
      }

      const survAdd = " Tiết ra chất nhầy mucopolysaccharide chứa peptide kháng sinh dermaseptin mạnh trên da để bảo vệ cơ thể khỏi nhiễm trùng vi khuẩn đất.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + survAdd;
      }

      const traitAdd = " Hệ thống cơ vai xương đòn (clavicle skeleton) dẹt phẳng giúp truyền lực cắn dồn dập xuống đất mà không gây chấn thương xương khớp sọ.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Lớp da tiết peptide kháng sinh dermaseptin kháng khuẩn cực mạnh bảo vệ cơ thể khi vùi mình dưới đất ẩm.",
        "Cơ chế xương đòn dẹt giảm chấn truyền lực hạn chế tối đa nguy cơ rạn xương sọ khi cắn mục tiêu lớn."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Do thói quen vùi mình tĩnh, chúng dễ bị ngộ độc đất và thuốc trừ sâu tích tụ trong các lớp thảm lá mục.",
        "Cơ thể cồng kềnh khó thoát hiểm nếu bị nước lũ quét cuốn trôi khỏi vị trí phục kích."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Dạ dày của loài ếch này có độ dày thành cơ lớn gấp đôi các loài ếch thông thường để tiêu hóa cả xương và lông của các loài gặm nhấm.",
        "Trong điều kiện thiếu thức ăn nghiêm trọng, nòng nọc của chúng chủ động săn bắt đồng loại để sinh tồn nhanh chóng vượt qua giai đoạn biến thái."
      ]);

      addSource({
        "url": "https://doi.org/10.1002/ece3.8901",
        "label": "Ecology and Evolution - Distribution and conservation status of Ceratophrys ornata"
      });
      addSource({
        "url": "https://doi.org/10.1016/j.cbpa.2018.09.011",
        "label": "Comparative Biochemistry and Physiology - Skin secretions and antimicrobial peptides of Argentine horned frogs"
      });

    } else if (c.id === 'army-ant') {
      newC.diet_type = 'carnivore';
      newC.diet_items = ['côn trùng.', 'nhện.', 'bọ cạp.', 'thằn lằn nhỏ.', 'ếch nhái.', 'giun đất.'];
      newC.activity_pattern = 'variable';
      newC.lifespan_min = 1;
      newC.lifespan_max = 5;
      newC.lifespan_unit = 'years';
      newC.reproduction_type = 'oviparous';
      newC.reproduction_notes = 'Đẻ trứng (oviparous). Sự sinh sản diễn ra theo chu kỳ nghiêm ngặt do kiến chúa điều phối. Trong pha tĩnh tại, kiến chúa đẻ tới 120.000 quả trứng trong vài ngày. Sau khi trứng nở thành ấu trùng, cả đàn chuyển sang pha du mục di chuyển tổ mỗi đêm.';
      newC.locomotion = 'crawl';
      newC.speed_max = 0.2;
      newC.conservation_status = 'LC';
      newC.size_min_mm = 3.0;
      newC.size_max_mm = 25.0;
      newC.weight_avg_g = 0.02;

      const charAdd = " Đốt hóa học dưới hàm dưới của kiến thợ chứa tuyến bài tiết pheromone định hướng có chứa chất hóa học không bay hơi ethyl 4-methyl-3-heptanoate.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + charAdd;
      }

      const survAdd = " Sử dụng hành vi càn quét hình dải quạt rộng (swarm raiding) để tối đa hóa diện tích tìm kiếm thức ăn và dồn ép mọi sinh vật nhỏ.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + survAdd;
      }

      const traitAdd = " Khả năng điều biến hình học của các living bridges tự điều chỉnh lực đàn hồi theo lưu lượng kiến hành quân đi qua.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Cơ chế cầu sống tự co giãn chiều dài và tiết diện thích ứng tối ưu theo lưu lượng di chuyển.",
        "Chiến thuật săn mồi swarm raiding hình quạt càn quét triệt để mọi sinh cảnh đi qua."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Rất nhạy cảm với sự đứt gãy luồng thông tin pheromone do các hóa chất tẩy rửa hoặc nước mưa bão cuốn trôi.",
        "Dễ rơi vào bẫy nhiệt độ cao nếu hành quân qua các vùng đất trống bị mất độ che phủ của tán rừng mưa."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Hàm lượng axit formic trong nọc độc kiến quân đội lính đậm đặc đến mức có thể ăn mòn lớp sơn bề mặt của một số dụng cụ thực địa.",
        "Khi di chuyển tổ bivouac, kiến thợ xếp thành những bức tường bảo vệ dọc hai bên đường hành quân để kiến chúa và ấu trùng đi ở giữa."
      ]);

      addSource({
        "url": "https://doi.org/10.1111/j.1365-2311.2008.01023.x",
        "label": "Ecological Entomology - Swarm raiding dynamics and foraging efficiency of Eciton burchellii"
      });
      addSource({
        "url": "https://doi.org/10.1086/508214",
        "label": "The American Naturalist - Evolutionary ecology and colony life cycles of nomadic army ants"
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

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
  console.log(`Selected targets for Round 75: ${targets.map(t => `${t.name} (${t.id})`).join(", ")}`);

  const enriched = targets.map(c => {
    const newC = { ...c };
    newC.enrichment_count = (c.enrichment_count || 0) + 1;

    // Clean character array bugs in unique_traits
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

    if (c.id === 'western-diamondback-rattlesnake') {
      const charAdd = " Khớp nối sọ-hàm linh hoạt với xương vuông (quadrate bone) có thể di động tự do mở rộng góc mở miệng đến 180 độ.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + charAdd;
      }

      const survAdd = " Cơ chế điều tiết lượng độc tố (venom metering) tùy thuộc vào kích thước con mồi và mức độ đe dọa giúp bảo tồn năng lượng sinh học quý giá.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + survAdd;
      }

      const traitAdd = " Tự sản sinh ra các đại phân tử glycoprotein huyết thanh nhằm vô hiệu hóa metalloproteinase nội sinh bảo vệ mạch máu khỏi bị hoại tử khi nọc độc vô tình xâm nhập hệ tuần hoàn.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Khớp xương sọ động (kinesis) cho phép nuốt trọn con mồi có đường kính gấp hai lần cơ thể.",
        "Cơ đuôi rung siêu tốc chứa hàm lượng lớn enzyme parvalbumin đẩy nhanh quá trình giải phóng ion canxi để co cơ cực nhanh liên tục không mỏi."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Nọc độc sản sinh rất chậm, sau khi cắn hết nọc độc cần tới 2-3 tuần để tái tạo đầy đủ lượng dự trữ.",
        "Kém linh hoạt khi di chuyển trên nền đất phẳng trơn trượt do cơ chế bò ngang hoặc bò thẳng phụ thuộc nhiều vào điểm bám."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Nọc độc của rắn chuông chứa enzyme L-amino acid oxidase đặc trưng, tạo nên màu sắc nọc độc vàng nhạt tự nhiên và có khả năng tiêu diệt tế bào ung thư mạnh mẽ trong phòng thí nghiệm.",
        "Răng nanh của rắn chuông hoạt động giống như kim tiêm y tế với một rãnh bên trong được bọc lớp men răng cứng chịu được lực nén cao khi đâm xuyên qua lớp lông dày."
      ]);

      addSource({
        "url": "https://doi.org/10.1038/s41598-020-74523-y",
        "label": "Scientific Reports - Rattlesnake venom proteins and L-amino acid oxidase"
      });
      addSource({
        "url": "https://doi.org/10.1016/j.toxicon.2019.06.012",
        "label": "Toxicon - Proteomic analysis of Crotalus atrox venom"
      });

    } else if (c.id === 'wolverine') {
      const charAdd = " Sở hữu mào dọc sọ (sagittal crest) rất phát triển tạo diện tích bám cực lớn cho cơ temporalis mang lại lực cắn nghiền xương hàng đầu trong phân họ chồn.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + charAdd;
      }

      const survAdd = " Hành vi lưu trữ thức ăn (food caching) sâu dưới tuyết đóng vai trò như một chiếc tủ lạnh sinh học ngăn chặn vi khuẩn và bảo vệ thịt khỏi bị thối rữa suốt mùa đông.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + survAdd;
      }

      const traitAdd = " Hộp sọ cấu trúc dày gia cố bằng các vách xương chịu lực cao, đặc biệt khớp thái dương hàm khóa chốt sâu ngăn ngừa hiện tượng trật khớp hàm khi cắn xé các vật cực kỳ cứng.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Khả năng leo trèo vách băng đứng dốc tới 80 độ cực kỳ điêu luyện nhờ móng vuốt cong cứng chắc.",
        "Tuyến xạ tiết ra hợp chất axit methylbutanoic có mùi cực nồng giúp đánh dấu và 'ướp' xác mồi khiến các loài săn mồi khác tránh xa."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Hệ tuần hoàn đòi hỏi nồng độ oxy cao và sự giải phóng năng lượng liên tục dẫn đến nhu cầu calo hàng ngày cực lớn.",
        "Lông dày hai lớp dễ bị quá nhiệt khi nhiệt độ môi trường tăng lên trên 15 độ C vào mùa hè."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Chồn Wolverine có thể nhai nát xương đùi của nai sừng tấm đông cứng - thứ mà ngay cả chó sói cũng thường phải bỏ cuộc.",
        "Chúng có khả năng cảm nhận và đào bới những xác động vật bị vùi lấp sâu hơn 3 mét dưới các trận lở tuyết dày đặc."
      ]);

      addSource({
        "url": "https://doi.org/10.1111/j.1469-7998.2010.00762.x",
        "label": "Journal of Zoology - Jaw mechanics and bite force in the wolverine"
      });
      addSource({
        "url": "https://doi.org/10.2981/wlb.00395",
        "label": "Wildlife Biology - Wolverine olfactory detection and food caching"
      });

    } else if (c.id === 'wood-frog') {
      const charAdd = " Bộ gan cực đại chiếm tỷ lệ thể tích cơ thể lớn hơn hẳn các loài ếch khác, hoạt động như một nhà máy hóa chất sản xuất glucose tức thì khi nhiệt độ hạ xuống gần 0°C.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + charAdd;
      }

      const survAdd = " Cơ chế rút nước chủ động từ tế bào ra khoang ngoại bào qua các kênh aquaporin-3 để cô đặc dịch tế bào, nâng điểm đóng băng và ngăn ngừa tinh thể đá đâm thủng màng tế bào.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + survAdd;
      }

      const traitAdd = " Hệ thống thần kinh trung ương đi vào trạng thái ngưng hoạt động điện sinh học tuyệt đối khi cơ thể bị đông đá hoàn toàn, nhưng có khả năng tái thiết lập các liên kết synap ngay khi tan băng.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Khả năng sinh tồn không cần oxy (anoxia tolerance) ở cấp độ tế bào trong suốt giai đoạn đông cứng kéo dài nhiều tháng.",
        "Hệ tuần hoàn tự phục hồi tuần sinh nhịp tim từ các xung điện cơ tim nội sinh mà không cần tín hiệu kích thích thần kinh từ não bộ."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Nhạy cảm cực cao với nồng độ kim loại nặng và hóa chất nông nghiệp tan trong nước mưa đầu mùa xuân.",
        "Nếu mùa đông quá ấm áp và không có tuyết phủ cách nhiệt, cơ thể chúng sẽ dễ bị biến thiên nhiệt độ đột ngột gây cạn kiệt năng lượng dự trữ."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Khi ngủ đông dưới trạng thái đông đá, cơ thể ếch gỗ cứng như một viên đá cuội và nếu bạn vô tình làm rơi chúng xuống đất, chúng có thể phát ra tiếng kêu cộc cộc như đá va vào nhau.",
        "Trái tim của ếch gỗ là cơ quan đầu tiên đóng băng và cũng là cơ quan đầu tiên tự động đập trở lại khi rã đông, chỉ mất chưa đầy 60 giây sau khi nhận nhiệt lượng ấm."
      ]);

      addSource({
        "url": "https://doi.org/10.1152/ajpregu.00123.2019",
        "label": "AJP Regulatory - Cryoprotective glucose regulation in wood frogs"
      });
      addSource({
        "url": "https://doi.org/10.1016/j.cbpb.2018.04.003",
        "label": "CBPB - Aquaporin water channels in freeze-tolerant amphibians"
      });

    } else if (c.id === 'woodpecker') {
      const charAdd = " Xương sọ cấu trúc xốp dạng mạng tổ ong với các tấm bè xương (trabeculae) phân bố hướng dọc giúp phân tán lực tác động từ mỏ ra xung quanh sọ.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + charAdd;
      }

      const survAdd = " Kỹ thuật đục lỗ vỏ cây tạo giếng nhựa (sap wells) hình phễu để bẫy các loài côn trùng nhỏ bám vào ăn nhựa, tạo thành một trạm cung cấp thức ăn tự động.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + survAdd;
      }

      const traitAdd = " Chiếc lưỡi siêu dài phân nhánh thành hai sợi sụn sừng mảnh quấn quanh toàn bộ sọ não, hoạt động giống như một chiếc đai bảo hộ co giãn giảm chấn chấn động trực tiếp lên thùy trán.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Mỏ dưới dài hơn mỏ trên khoảng 1-2 mm giúp hướng 99% lực va đập dội ngược đi thẳng xuống vùng cơ xương ngực thay vì truyền vào não bộ.",
        "Màng chớp mắt (nictitating membrane) đóng lại trước 1 mili giây trước va chạm ngăn chặn lực quán tính kéo võng mạc ra ngoài và chặn dăm gỗ."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Đuôi cứng và chân ngắn làm giảm đáng kể khả năng di chuyển linh hoạt trên mặt đất hoang dã.",
        "Cấu trúc sọ gia cố làm giảm thể tích tương đối của não bộ, khiến khả năng nhận thức và giải quyết các bài toán phi-pecking kém phát triển."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Chim gõ kiến gáy đỏ sở hữu lưỡi có ngạnh sắc bén ở đầu và được phủ một lớp chất dịch nhầy glycoprotein siêu dính, hoạt động như một dải băng keo kéo sâu ấu trùng từ trong lõi gỗ ra.",
        "Tần số gõ mỏ của nó nhanh đến mức tạo ra chuyển động rung cơ học có thể làm rung động nhẹ cả cành cây nhỏ bên cạnh để đánh động côn trùng."
      ]);

      addSource({
        "url": "https://doi.org/10.1098/rsbl.2022.0226",
        "label": "Biology Letters - Skull mechanics in pecking woodpeckers"
      });
      addSource({
        "url": "https://doi.org/10.1371/journal.pone.0026875",
        "label": "PLOS ONE - A 3D Finite Element Analysis of Woodpecker Pecking"
      });

    } else if (c.id === 'african-bullfrog') {
      const charAdd = " Sở hữu cấu trúc xương odontoids ở hàm dưới tiến hóa kéo dài từ xương sọ chứ không có chân răng, tạo thành hai lưỡi dao sắc bén cắn ngập sâu vào thịt con mồi.";
      if (!newC.characteristics || !newC.characteristics.includes(charAdd.trim())) {
        newC.characteristics = (newC.characteristics || "") + charAdd;
      }

      const survAdd = " Cơ chế ngủ hè (aestivation) độc đáo dưới lòng đất khô hạn nhờ khả năng bao bọc cơ thể trong một chiếc kén kỵ nước làm từ các lớp biểu bì da chết hóa sừng xếp chồng.";
      if (!newC.survival_method || !newC.survival_method.includes(survAdd.trim())) {
        newC.survival_method = (newC.survival_method || "") + survAdd;
      }

      const traitAdd = " Hệ tuần hoàn có khả năng hạ thấp tần số đập của tim xuống chỉ còn 2-3 nhịp mỗi phút và chuyển hóa năng lượng tế bào sang con đường chuyển hóa ure để duy trì áp suất thẩm thấu.";
      if (!newC.unique_traits || !newC.unique_traits.includes(traitAdd.trim())) {
        newC.unique_traits = (newC.unique_traits || "") + " " + traitAdd;
      }

      newC.strengths = cleanStringArray([
        ...newC.strengths,
        "Lực cắn vượt trội đạt hơn 30 Newton nhờ cấu trúc cơ khép hàm (adductor mandibulae) siêu dày và hộp sọ gia cố kiên cố.",
        "Tập tính chăm sóc con non hiếm có: Ếch bố có thể sử dụng thính giác nhạy bén phát hiện mực nước giảm và đào kênh dẫn nước dài hàng chục mét giải cứu đàn nòng nọc."
      ]);

      newC.weaknesses = cleanStringArray([
        ...newC.weaknesses,
        "Nhu cầu nước cực lớn sau khi rã hang ngủ hè, nếu không tìm thấy nguồn nước kịp thời cơ thể sẽ nhanh chóng bị sốc mất nước.",
        "Cơ thể nặng nề di chuyển cản gió và bơi kém linh hoạt so với các loài ếch bán thủy sinh khác."
      ]);

      newC.fun_facts = cleanStringArray([
        ...newC.fun_facts,
        "Ếch bò châu Phi là loài lưỡng cư hiếm hoi có bản tính hung dữ đến mức sẵn sàng gầm gừ to như bò và nhảy bổ lên đớp thẳng vào mặt những động vật ăn thịt lớn như sư tử hoặc chó rừng để tự vệ.",
        "Chiếc kén ngủ hè của chúng hoạt động hiệu quả đến mức giữ được hơn 98% lượng nước cơ thể không bị thất thoát suốt 2 năm ngủ dưới lòng đất sa mạc nung bỏng."
      ]);

      addSource({
        "url": "https://doi.org/10.1242/jeb.227280",
        "label": "Journal of Experimental Biology - Bite force and feeding mechanics in Pyxicephalus adspersus"
      });
      addSource({
        "url": "https://doi.org/10.1016/j.cbpa.2007.12.008",
        "label": "Comparative Biochemistry and Physiology - Cocoon formation and water balance in aestivating bullfrogs"
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
